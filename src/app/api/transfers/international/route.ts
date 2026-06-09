import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkDailyLimit, checkKYC, detectSuspiciousActivity, logSecurityEvent } from '@/lib/security';

// Fee rates by transfer type
const FEE_RATES: Record<string, number> = {
  wallet: 0.005,       // 0.5%
  mobile_money: 0.01,  // 1%
  bank: 0.015,         // 1.5%
  card: 0.02,          // 2%
  merchant: 0.01,      // 1%
  api: 0.005,          // 0.5%
  qr_code: 0.005,      // 0.5%
};

const COMMISSION_RATE = 0.015; // 1.5%
const EXCHANGE_RATE_USD_FC = 2850; // 1 USD = 2850 FC

const VALID_TYPES = ['wallet', 'mobile_money', 'bank', 'card', 'merchant', 'api', 'qr_code'];

// Required fields per transfer type
const REQUIRED_FIELDS: Record<string, string[]> = {
  wallet: ['recipientPhone', 'recipientName', 'country', 'currency', 'amount'],
  mobile_money: ['recipientPhone', 'recipientName', 'country', 'currency', 'amount'],
  bank: ['recipientName', 'recipientAccount', 'recipientBank', 'country', 'currency', 'amount'],
  card: ['recipientName', 'country', 'currency', 'amount'],
  merchant: ['recipientName', 'country', 'currency', 'amount'],
  api: ['recipientName', 'country', 'currency', 'amount'],
  qr_code: ['recipientName', 'country', 'currency', 'amount'],
};

// POST - Create international transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type: rawType,
      recipientName,
      recipientPhone,
      recipientAccount,
      recipientBank,
      swiftBic,
      iban,
      country,
      currency,
      amount,
      description,
      otp,
    } = body;
    const type = String(rawType || '')
      .replace('mobile-money', 'mobile_money')
      .replace('qrcode', 'qr_code');

    // Validate transfer type
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Type de transfert invalide. Types valides: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate userId for wallet type
    if (type === 'wallet' && !userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis pour les transferts wallet' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis' },
        { status: 400 }
      );
    }

    // Validate required fields based on type
    const required = REQUIRED_FIELDS[type] || [];
    const missingFields: string[] = [];
    for (const field of required) {
      const value = body[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Champs requis manquants pour le type ${type}: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate amount
    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Le montant doit être un nombre positif' },
        { status: 400 }
      );
    }

    // Get user and check balance
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, realBalance: true, realBalanceFC: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // ─── SECURITY: Check suspended account ──────────────────────
    const fullUser = await db.user.findUnique({ where: { id: userId }, select: { suspended: true } });
    if (fullUser?.suspended) {
      await logSecurityEvent({
        userId,
        action: 'transfer_blocked',
        details: JSON.stringify({ reason: 'account_suspended', amount: transferAmount, type }),
        riskLevel: 'high',
      });
      return NextResponse.json(
        { success: false, message: 'Votre compte est suspendu. Contactez le support.' },
        { status: 403 }
      );
    }

    // ─── SECURITY: KYC check ────────────────────────────────────
    const kycResult = await checkKYC(userId);
    if (!kycResult.verified) {
      await logSecurityEvent({
        userId,
        action: 'transfer_blocked',
        details: JSON.stringify({ reason: 'kyc_not_verified', kycStatus: kycResult.status, amount: transferAmount, type }),
        riskLevel: 'medium',
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Vérification KYC requise',
          code: 'KYC_REQUIRED',
          kycStatus: kycResult.status,
          kycRejectReason: kycResult.rejectReason,
        },
        { status: 403 }
      );
    }

    // ─── SECURITY: Daily transaction limit ──────────────────────
    const dailyCheck = await checkDailyLimit(userId);
    if (!dailyCheck.allowed) {
      await logSecurityEvent({
        userId,
        action: 'daily_limit_reached',
        details: JSON.stringify({ count: dailyCheck.count, limit: dailyCheck.limit, amount: transferAmount, type }),
        riskLevel: 'high',
      });
      return NextResponse.json(
        {
          success: false,
          message: `Limite journalière atteinte (${dailyCheck.limit} transactions/jour). Réessayez demain.`,
          code: 'DAILY_LIMIT_REACHED',
          dailyTransactions: dailyCheck.count,
          dailyLimit: dailyCheck.limit,
        },
        { status: 429 }
      );
    }

    // ─── SECURITY: Suspicious activity detection ────────────────
    const suspicious = await detectSuspiciousActivity(userId, transferAmount);
    if (suspicious.suspicious) {
      await logSecurityEvent({
        userId,
        action: 'suspicious_activity',
        details: JSON.stringify({ reasons: suspicious.reasons, amount: transferAmount, type }),
        riskLevel: suspicious.reasons.length >= 2 ? 'critical' : 'medium',
      });

      // If critical (2+ red flags), block the transfer
      if (suspicious.reasons.length >= 2) {
        return NextResponse.json(
          {
            success: false,
            message: 'Activité suspecte détectée. Pour votre sécurité, veuillez contacter le support.',
            code: 'SUSPICIOUS_ACTIVITY',
          },
          { status: 403 }
        );
      }
    }

    // Calculate fee and commission
    const feeRate = FEE_RATES[type] || 0.01;
    const fee = Math.round(transferAmount * feeRate * 100) / 100;
    const commission = Math.round(transferAmount * COMMISSION_RATE * 100) / 100;
    const totalDeduction = transferAmount + fee + commission;

    // Determine which balance to check
    const isFC = currency === 'FC';
    const userBalance = isFC ? user.realBalanceFC : user.realBalance;

    if (userBalance < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde insuffisant. Solde disponible: ${userBalance.toFixed(2)} ${currency}, Montant nécessaire: ${totalDeduction.toFixed(2)} ${currency}`,
        },
        { status: 400 }
      );
    }

    // Calculate exchange rate and amount received
    let exchangeRate: number | null = null;
    let amountReceived = transferAmount - fee - commission;

    if (isFC) {
      // Sending FC - no exchange rate needed (assuming recipient also in FC)
      amountReceived = Math.max(0, amountReceived);
    } else {
      // Sending USD - if recipient currency is FC, apply exchange rate
      exchangeRate = EXCHANGE_RATE_USD_FC;
      // amountReceived stays in the transfer currency
      amountReceived = Math.max(0, amountReceived);
    }

    const transfer = await db.$transaction(async (tx) => {
      const created = await tx.internationalTransfer.create({
        data: {
          userId,
          type,
          recipientName,
          recipientPhone: recipientPhone || null,
          recipientAccount: recipientAccount || null,
          recipientBank: recipientBank || null,
          swiftBic: swiftBic || null,
          iban: iban || null,
          country,
          currency,
          amount: transferAmount,
          fee,
          commission,
          exchangeRate,
          amountReceived,
          status: 'processing',
          otpVerified: !!otp,
          description: description || null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: isFC
          ? { realBalanceFC: { decrement: totalDeduction } }
          : { realBalance: { decrement: totalDeduction } },
      });

      await tx.transaction.create({
        data: {
          type: 'international_transfer',
          amount: transferAmount,
          fee: fee + commission,
          currency,
          status: 'processing',
          senderId: userId,
          receiverId: userId,
          description: `Transfert international ${type} vers ${recipientName}`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Transfert international initié',
          message: `Votre transfert de ${transferAmount.toFixed(2)} ${currency} vers ${recipientName} est en cours de traitement.`,
          type: 'transfer_sent',
        },
      });

      return created;
    });

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        realBalance: true,
        realBalanceFC: true,
        bonusBalance: true,
        bonusBalanceFC: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Transfert international créé avec succès',
      transfer: {
        id: transfer.id,
        type: transfer.type,
        recipientName: transfer.recipientName,
        country: transfer.country,
        currency: transfer.currency,
        amount: transfer.amount,
        fee: transfer.fee,
        commission: transfer.commission,
        exchangeRate: transfer.exchangeRate,
        amountReceived: transfer.amountReceived,
        status: transfer.status,
        createdAt: transfer.createdAt,
      },
      summary: {
        amountSent: transferAmount,
        fee,
        commission,
        totalDeduction,
        exchangeRate: exchangeRate || 'N/A',
        amountReceived,
      },
      updatedBalances: updatedUser,
    });
  } catch (error) {
    console.error('International transfer error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET - List user's international transfers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis' },
        { status: 400 }
      );
    }

    const transfers = await db.internationalTransfer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      transfers,
    });
  } catch (error) {
    console.error('International transfers list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
