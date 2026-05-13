import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: generate next agent number AGT-2026-XXXXX
async function generateAgentNumber(): Promise<string> {
  // Find all existing agent numbers matching AGT-2026-XXXXX
  const agents = await db.user.findMany({
    where: {
      agentNumber: { startsWith: 'AGT-2026-' },
    },
    select: { agentNumber: true },
  });

  let maxNum = 0;
  for (const agent of agents) {
    if (agent.agentNumber) {
      const numStr = agent.agentNumber.replace('AGT-2026-', '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `AGT-2026-${nextNum.toString().padStart(5, '0')}`;
}

// GET - List agents with optional validation status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const where: any = { role: 'agent' };

    if (status && ['pending', 'validated', 'rejected'].includes(status)) {
      where.validationStatus = status;
    }

    const agents = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        city: true,
        country: true,
        validationStatus: true,
        agentNumber: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error('Agent validation list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Validate/reject/suspend agent
export async function POST(request: NextRequest) {
  try {
    const { adminId, action, agentId, reason } = await request.json();

    if (!adminId || !action || !agentId) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: adminId, action, agentId requis' },
        { status: 400 }
      );
    }

    const agent = await db.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent non trouvé' },
        { status: 404 }
      );
    }

    // ACCEPT action
    if (action === 'accept') {
      const agentNumber = await generateAgentNumber();

      const updated = await db.user.update({
        where: { id: agentId },
        data: {
          validationStatus: 'validated',
          agentNumber,
          isVerified: true,
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'validate_agent',
          target: agentId,
          details: `Agent validé: ${agent.name || agent.phone} - Numéro: ${agentNumber}`,
        },
      });

      // Create notification for the agent
      await db.notification.create({
        data: {
          userId: agentId,
          title: 'Compte agent validé',
          message: `Félicitations ! Votre compte agent a été validé. Votre numéro d'agent est : ${agentNumber}. Vous pouvez maintenant accéder à toutes les fonctionnalités agent.`,
          type: 'agent_validation',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Agent validé avec succès',
        agent: {
          id: updated.id,
          name: updated.name,
          agentNumber: updated.agentNumber,
          validationStatus: updated.validationStatus,
        },
      });
    }

    // REJECT action
    if (action === 'reject') {
      const updated = await db.user.update({
        where: { id: agentId },
        data: {
          validationStatus: 'rejected',
          validationRejectReason: reason || 'Demande rejetée par l\'administration',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_agent',
          target: agentId,
          details: `Agent rejeté: ${agent.name || agent.phone} - Motif: ${reason || 'Non spécifié'}`,
        },
      });

      // Create notification for the agent
      await db.notification.create({
        data: {
          userId: agentId,
          title: 'Demande agent rejetée',
          message: `Votre demande de compte agent a été rejetée. Motif: ${reason || 'Non spécifié'}. Vous pouvez soumettre une nouvelle demande si nécessaire.`,
          type: 'agent_validation',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Agent rejeté',
        agent: {
          id: updated.id,
          validationStatus: updated.validationStatus,
          validationRejectReason: updated.validationRejectReason,
        },
      });
    }

    // SUSPEND action
    if (action === 'suspend') {
      const updated = await db.user.update({
        where: { id: agentId },
        data: {
          suspended: true,
          suspensionReason: reason || 'Suspendu par l\'administration',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'suspend_agent',
          target: agentId,
          details: `Agent suspendu: ${agent.name || agent.phone} - Motif: ${reason || 'Non spécifié'}`,
        },
      });

      // Create notification for the agent
      await db.notification.create({
        data: {
          userId: agentId,
          title: 'Compte suspendu',
          message: `Votre compte agent a été suspendu. Motif: ${reason || 'Non spécifié'}. Contactez le support pour plus d'informations.`,
          type: 'suspension',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Agent suspendu',
        agent: {
          id: updated.id,
          suspended: updated.suspended,
          suspensionReason: updated.suspensionReason,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue. Actions possibles: accept, reject, suspend' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Agent validation action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
