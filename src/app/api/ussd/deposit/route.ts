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

    const agent = await db.user.findFirst({
      where: { agentCode: agentCode.trim(), role: 'agent', suspended: false },
    });

    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent non trouvé. Vérifiez le code agent.' });
    }

    const isFC = currency === 'FC';
    const deposit = await db.deposit.create({
      data: {
        userId,
        amount,
        currency: currency || 'USD',
        method: 'ussd_agent',
        status: 'completed',
        agentId: agent.id,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { increment: amount } }
        : { realBalance: { increment: amount } },
    });

    await db.transaction.create({
      data: {
        type: 'deposit',
        amount,
        fee: 0,
        currency: currency || 'USD',
        status: 'completed',
        senderId: agent.id,
        receiverId: userId,
        agentId: agent.id,
        description: `Dépôt de ${amount.toFixed(2)} ${currency} via agent ${agent.agentCode}`,
      },
    });

    await db.notification.create({
      data: {
        userId,
        title: 'Dépôt reçu',
        message: `Votre dépôt de ${amount.toFixed(2)} ${currency} a été effectué via l'agent ${agent.agentCode}.`,
        type: 'general',
      },
    });

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        currency: deposit.currency,
        status: deposit.status,
        agentCode: agent.agentCode,
      },
    });
  } catch (error) {
    console.error('USSD deposit error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
