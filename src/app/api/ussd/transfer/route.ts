import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkChildBalanceLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverPhone, amount, currency } = body;

    if (!senderId || !receiverPhone || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Tous les champs sont requis et le montant doit être positif' }, { status: 400 });
    }

    const sender = await db.user.findUnique({ where: { id: senderId } });

    if (!sender) {
      return NextResponse.json({ success: false, message: 'Expéditeur non trouvé' }, { status: 404 });
    }

    if (sender.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' });
    }

    if (sender.suspended) {
      return NextResponse.json({ success: false, message: 'Votre compte est suspendu.' });
    }

    // BONUS SECURITY: Bonus cannot be used for transfers — only real balance
    const isFC = currency === 'FC';
    const realBal = isFC ? sender.realBalanceFC : sender.realBalance;

    const fee = Math.round(amount * 0.007 * 100) / 100;
    const totalDeduction = amount + fee;

    if (realBal < totalDeduction) {
      return NextResponse.json({ success: false, message: `Solde insuffisant. Solde réel: ${realBal.toFixed(2)} ${currency}, requis: ${totalDeduction.toFixed(2)} ${currency}. Le bonus ne peut pas être utilisé pour les transferts.` });
    }

    let receiver = await db.user.findUnique({ where: { phone: receiverPhone.trim() } });

    if (receiver) {
      const limitCheck = await checkChildBalanceLimit(receiver.id, amount, currency || 'USD');
      if (!limitCheck.allowed) {
        return NextResponse.json({ success: false, message: limitCheck.message }, { status: 400 });
      }
    }

    if (!receiver) {
      receiver = await db.user.create({
        data: {
          phone: receiverPhone.trim(),
          bonusBalance: isFC ? 0 : 10,
          bonusBalanceFC: isFC ? 0 : 0,
          realBalance: 0,
          realBalanceFC: 0,
          country: 'CD',
        },
      });
    }

    // Deduct from sender — REAL balance only, bonus is protected
    await db.user.update({
      where: { id: senderId },
      data: isFC
        ? { realBalanceFC: { decrement: totalDeduction } }
        : { realBalance: { decrement: totalDeduction } },
    });

    await db.user.update({
      where: { id: receiver.id },
      data: isFC
        ? { realBalanceFC: { increment: amount } }
        : { realBalance: { increment: amount } },
    });

    const transaction = await db.transaction.create({
      data: {
        type: 'send',
        amount,
        fee,
        currency: currency || 'USD',
        status: 'completed',
        senderId,
        receiverId: receiver.id,
        description: `Transfert de ${amount.toFixed(2)} ${currency} via USSD`,
      },
    });

    await db.notification.create({
      data: {
        userId: receiver.id,
        title: 'Transfert reçu',
        message: `Vous avez reçu ${amount.toFixed(2)} ${currency} de ${sender.phone || sender.name || 'Inconnu'}`,
        type: 'transfer_received',
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('USSD transfer error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

// BONUS SECURITY: Bonus cannot be used for transfers. Only real balance is deducted.
