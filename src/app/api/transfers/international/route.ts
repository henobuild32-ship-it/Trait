import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
const MOCK_EXCHANGE_RATE = 2850; // 1 USD = 2850 FC

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
      type,
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
      exchangeRate = MOCK_EXCHANGE_RATE;
      // amountReceived stays in the transfer currency
      amountReceived = Math.max(0, amountReceived);
    }

    // Create international transfer record
    const transfer = await db.internationalTransfer.create({
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

    // Deduct from user balance (realBalance only)
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: totalDeduction } }
        : { realBalance: { decrement: totalDeduction } },
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
