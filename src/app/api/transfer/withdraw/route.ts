import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { findActiveAgentByIdentifier } from '@/lib/agents';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, currency, method, agentCode } = body as {
      userId: string;
      amount: number;
      currency?: string;
      method?: string;
      agentCode?: string;
    };

    // ── Validation entrées ────────────────────────────────────────────
    if (
      !userId ||
      typeof amount !== 'number' ||
      amount <= 0 ||
      !currency ||
      !['USD', 'FC'].includes(currency) ||
      !agentCode?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID utilisateur, montant positif, devise (USD/FC) et code agent requis',
        },
        { status: 400 },
      );
    }

    // ── Chargement user + agent ───────────────────────────────────────
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
      return NextResponse.json({
        success: false,
        message: 'Votre compte est temporairement bloqué.',
      });
    }

    if (user.suspended) {
      return NextResponse.json({
        success: false,
        message: 'Votre compte est suspendu.',
      });
    }

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Agent non trouvé. Vérifiez le code ou numéro agent.',
        },
        { status: 404 },
      );
    }

    if (agent.id === userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vous ne pouvez pas valider votre propre retrait comme agent.',
        },
        { status: 400 },
      );
    }

    // ── Soldes + frais ────────────────────────────────────────────────
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

    // ── Transaction atomique ──────────────────────────────────────────
    const result = await db.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          fee,
          currency: cur,
          method: method || 'agent',
          status: 'pending',
          agentId: agent.id,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: cur === 'FC'
          ? { realBalanceFC: { decrement: totalDeduction } }
          : { realBalance: { decrement: totalDeduction } },
      });

      // Crédit agent (commission sur le montant uniquement)
      await tx.user.update({
        where: { id: agent.id },
        data: cur === 'FC'
          ? { realBalanceFC: { increment: amount } }
          : { realBalance: { increment: amount } },
      });

      const txDescription = `Retrait via agent ${agent.agentNumber || agent.agentCode}`;

      await tx.transaction.create({
        data: {
          type: 'withdrawal',
          amount,
          fee,
          currency: cur,
          status: 'pending',
          senderId: userId,
          receiverId: agent.id,
          agentId: agent.id,
          description: txDescription,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Retrait en cours de validation',
          message: `Votre retrait de ${amount.toFixed(2)} ${cur} (frais : ${fee.toFixed(2)} ${cur}) via l'agent ${agent.agentNumber || agent.agentCode} a été soumis et est en cours de validation.`,
          type: 'withdrawal_validated',
        },
      });

      return withdrawal;
    });

    const updatedUser = await db.user.findUnique({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: result.id,
        userId: result.userId,
        amount: result.amount,
        fee: result.fee,
        currency: result.currency,
        method: result.method,
        status: result.status,
        agentId: result.agentId,
        createdAt: result.createdAt,
      },
      updatedBalances: updatedUser
        ? {
            realBalance: updatedUser.realBalance,
            realBalanceFC: updatedUser.realBalanceFC,
            bonusBalance: updatedUser.bonusBalance,
            bonusBalanceFC: updatedUser.bonusBalanceFC,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
