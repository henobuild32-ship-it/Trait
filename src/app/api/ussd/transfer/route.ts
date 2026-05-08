import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const isFC = currency === 'FC';
    const realBal = isFC ? sender.realBalanceFC : sender.realBalance;
    const bonusBal = isFC ? sender.bonusBalanceFC : sender.bonusBalance;
    const totalBalance = realBal + bonusBal;

    const fee = Math.round(amount * 0.007 * 100) / 100;
    const totalDeduction = amount + fee;

    if (totalBalance < totalDeduction) {
      return NextResponse.json({ success: false, message: `Solde insuffisant. Vous avez ${(totalBalance).toFixed(2)} ${currency} mais ${totalDeduction.toFixed(2)} ${currency} est requis.` });
    }

    let receiver = await db.user.findUnique({ where: { phone: receiverPhone.trim() } });

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

    // Deduct from sender
    let remainingDeduction = totalDeduction;
    const bonusUsed = Math.min(bonusBal, remainingDeduction);
    remainingDeduction -= bonusUsed;
    const realUsed = remainingDeduction;

    await db.user.update({
      where: { id: senderId },
      data: {
        bonusBalance: Math.max(0, sender.bonusBalance - (isFC ? 0 : bonusUsed)),
        realBalance: Math.max(0, sender.realBalance - (isFC ? 0 : realUsed)),
        bonusBalanceFC: Math.max(0, sender.bonusBalanceFC - (isFC ? bonusUsed : 0)),
        realBalanceFC: Math.max(0, sender.realBalanceFC - (isFC ? realUsed : 0)),
      },
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
