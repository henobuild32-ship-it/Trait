import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { findActiveAgentByIdentifier } from '@/lib/agents';
import { requireUser } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    // Rate limit: 3 withdrawals per hour per user
    const rateLimit = checkRateLimit({
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      key: `withdraw:${auth.userId}`,
    })
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const body = await request.json();
    const { amount, currency, method, agentCode } = body as {
      amount: number;
      currency?: string;
      method?: string;
      agentCode?: string;
    };

    const userId = auth.userId

    if (
      typeof amount !== 'number' ||
      amount <= 0 ||
      !currency ||
      !['USD', 'FC'].includes(currency) ||
      !agentCode?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Montant positif, devise (USD/FC) et code agent requis',
        },
        { status: 400 },
      );
    }

    const [user, agent] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      findActiveAgentByIdentifier(agentCode.trim()),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }

    if (user.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' }, { status: 403 });
    }

    if (user.suspended) {
      return NextResponse.json({ success: false, message: 'Votre compte est suspendu.' }, { status: 403 });
    }

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent non trouvé. Vérifiez le code ou numéro agent.' },
        { status: 404 },
      );
    }

    if (agent.id === userId) {
      return NextResponse.json(
        { success: false, message: 'Vous ne pouvez pas valider votre propre retrait comme agent.' },
        { status: 400 },
      );
    }

    const cur = currency;
    const realBal = cur === 'FC' ? user.realBalanceFC : user.realBalance;
    const fee = round2(amount * 0.007);
    const totalDeduction = round2(amount + fee);

    if (realBal < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde insuffisant. Solde : ${realBal.toFixed(2)} ${cur}, requis : ${totalDeduction.toFixed(2)} ${cur}`,
        },
        { status: 400 },
      );
    }

    // Atomic transaction: create withdrawal, deduct sender (agent credited only after validation)
    const [withdrawal] = await db.$transaction([
      db.withdrawal.create({
        data: {
          userId,
          amount,
          fee,
          currency: cur,
          method: method || 'agent',
          status: 'pending',
          agentId: agent.id,
        },
      }),
      db.user.update({
        where: { id: userId },
        data: cur === 'FC'
          ? { realBalanceFC: { decrement: totalDeduction } }
          : { realBalance: { decrement: totalDeduction } },
      }),
      db.transaction.create({
        data: {
          type: 'withdrawal',
          amount,
          fee,
          currency: cur,
          status: 'pending',
          senderId: userId,
          receiverId: agent.id,
          agentId: agent.id,
          description: `Retrait via agent ${agent.agentNumber || agent.agentCode}`,
        },
      }),
      db.notification.create({
        data: {
          userId,
          title: 'Retrait en cours de validation',
          message: `Votre retrait de ${amount.toFixed(2)} ${cur} (frais : ${fee.toFixed(2)} ${cur}) via l'agent ${agent.agentNumber || agent.agentCode} a été soumis et est en attente de validation par l'agent.`,
          type: 'withdrawal_validated',
        },
      }),
    ]);

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: { realBalance: true, realBalanceFC: true, bonusBalance: true, bonusBalanceFC: true },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        currency: withdrawal.currency,
        method: withdrawal.method,
        status: withdrawal.status,
        agentId: withdrawal.agentId,
        createdAt: withdrawal.createdAt,
      },
      updatedBalances: updatedUser,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
