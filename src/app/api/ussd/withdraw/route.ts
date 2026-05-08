import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentCode, amount, currency } = body;

    if (!userId || !agentCode || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Tous les champs sont requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' });
    }

    if (user.suspended) {
      return NextResponse.json({ success: false, message: 'Votre compte est suspendu.' });
    }

    const agent = await db.user.findFirst({
      where: { agentCode: agentCode.trim(), role: 'agent', suspended: false },
    });

    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent non trouvé. Vérifiez le code agent.' });
    }

    const isFC = currency === 'FC';
    const realBal = isFC ? user.realBalanceFC : user.realBalance;
    const fee = Math.round(amount * 0.01 * 100) / 100;
    const totalDeduction = amount + fee;

    if (realBal < totalDeduction) {
      return NextResponse.json({ success: false, message: `Solde insuffisant. Solde: ${realBal.toFixed(2)} ${currency}, Requis: ${totalDeduction.toFixed(2)} ${currency}` });
    }

    // Create withdrawal
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        fee,
        currency: currency || 'USD',
        method: 'ussd_agent',
        status: 'completed',
        agentId: agent.id,
      },
    });

    // Deduct from user
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: totalDeduction } }
        : { realBalance: { decrement: totalDeduction } },
    });

    // Credit agent
    await db.user.update({
      where: { id: agent.id },
      data: isFC
        ? { realBalanceFC: { increment: amount } }
        : { realBalance: { increment: amount } },
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        type: 'withdrawal',
        amount,
        fee,
        currency: currency || 'USD',
        status: 'completed',
        senderId: userId,
        receiverId: agent.id,
        agentId: agent.id,
        description: `Retrait de ${amount.toFixed(2)} ${currency} via agent ${agent.agentCode}`,
      },
    });

    await db.notification.create({
      data: {
        userId,
        title: 'Retrait effectué',
        message: `Votre retrait de ${amount.toFixed(2)} ${currency} (frais: ${fee.toFixed(2)} ${currency}) a été effectué via l'agent ${agent.agentCode}.`,
        type: 'withdrawal_validated',
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        currency: withdrawal.currency,
        status: withdrawal.status,
        agentCode: agent.agentCode,
      },
    });
  } catch (error) {
    console.error('USSD withdraw error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
