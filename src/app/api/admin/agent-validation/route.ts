import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: generate next agent number AGT-2026-XXXXX
async function generateAgentNumber(): Promise<string> {
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

// Helper: generate secure system password (e.g., TRX + 6 alphanumeric chars)
function generateSystemPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (I, O, 0, 1)
  const prefix = 'TRX';
  let result = prefix;
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper: send credentials email
async function sendCredentialsEmail(
  agentName: string,
  agentEmail: string,
  agentNumber: string,
  systemPassword: string,
  agentId: string
): Promise<boolean> {
  try {
    // Create a notification record for the agent
    await db.notification.create({
      data: {
        userId: agentId,
        title: 'Credentials Email Sent',
        message: `Email with credentials sent to ${agentEmail}`,
        type: 'system',
        read: true,
      },
    });

    // In production, integrate with an email service (SendGrid, Mailgun, etc.)
    // For now, we log and store the email record
    console.log('📧 Email credentials:', {
      to: agentEmail,
      subject: 'Votre compte Agent TRAIT a été validé',
      agentNumber,
      systemPassword,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// GET - List agents with optional validation status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: any = { role: 'agent' };

    if (status && ['pending', 'validated', 'rejected', 'suspended'].includes(status)) {
      where.validationStatus = status;
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { city: { contains: search.trim(), mode: 'insensitive' } },
        { agentNumber: { contains: search.trim() } },
      ];
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
        address: true,
        photoId: true,
        validationStatus: true,
        validationRejectReason: true,
        agentCode: true,
        agentNumber: true,
        systemPassword: true,
        systemPasswordSent: true,
        suspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
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
    const { adminId, action, agentId, reason, sendEmail } = await request.json();

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
      const systemPassword = generateSystemPassword();

      const updated = await db.user.update({
        where: { id: agentId },
        data: {
          validationStatus: 'validated',
          agentNumber,
          systemPassword,
          isVerified: true,
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'validate_agent',
          target: agentId,
          details: JSON.stringify({
            agentName: agent.name || agent.phone,
            agentNumber,
            systemPassword,
            hasPhoto: !!agent.photoId,
          }),
        },
      });

      // Create notification for the agent
      await db.notification.create({
        data: {
          userId: agentId,
          title: 'Compte agent validé ✓',
          message: `Félicitations ! Votre compte agent a été validé par l'administrateur TRAIT. Votre numéro d'agent est : ${agentNumber}. Un email contenant vos identifiants système a été envoyé à ${agent.email || 'votre adresse email'}.`,
          type: 'agent_validation',
        },
      });

      // Send credentials email if requested or if email exists
      let emailSent = false;
      if (sendEmail !== false && agent.email) {
        emailSent = await sendCredentialsEmail(
          agent.name || 'Agent',
          agent.email,
          agentNumber,
          systemPassword,
          agentId
        );
        if (emailSent) {
          await db.user.update({
            where: { id: agentId },
            data: { systemPasswordSent: true },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Agent validé avec succès',
        agent: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          agentNumber: updated.agentNumber,
          validationStatus: updated.validationStatus,
          systemPassword,
          emailSent,
        },
      });
    }

    // REJECT action
    if (action === 'reject') {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Une raison du refus est requise' },
          { status: 400 }
        );
      }

      const updated = await db.user.update({
        where: { id: agentId },
        data: {
          validationStatus: 'rejected',
          validationRejectReason: reason.trim(),
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_agent',
          target: agentId,
          details: JSON.stringify({
            agentName: agent.name || agent.phone,
            reason: reason.trim(),
          }),
        },
      });

      // Create notification for the agent
      await db.notification.create({
        data: {
          userId: agentId,
          title: 'Demande agent refusée',
          message: `Votre demande de compte agent a été refusée. Motif: ${reason.trim()}. Vous pouvez soumettre une nouvelle demande si nécessaire.`,
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
          validationStatus: 'suspended',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'suspend_agent',
          target: agentId,
          details: JSON.stringify({
            agentName: agent.name || agent.phone,
            reason: reason || 'Non spécifié',
          }),
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
          validationStatus: updated.validationStatus,
          suspensionReason: updated.suspensionReason,
        },
      });
    }

    // UNSUSPEND action
    if (action === 'unsuspend') {
      const updated = await db.user.update({
        where: { id: agentId },
        data: {
          suspended: false,
          suspensionReason: null,
          validationStatus: 'validated',
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'unsuspend_agent',
          target: agentId,
          details: JSON.stringify({
            agentName: agent.name || agent.phone,
          }),
        },
      });

      await db.notification.create({
        data: {
          userId: agentId,
          title: 'Compte réactivé',
          message: 'Votre compte agent a été réactivé. Vous pouvez maintenant accéder à toutes les fonctionnalités.',
          type: 'system',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Agent réactivé',
        agent: {
          id: updated.id,
          suspended: updated.suspended,
          validationStatus: updated.validationStatus,
        },
      });
    }

    // RESEND CREDENTIALS action
    if (action === 'resend_credentials') {
      if (!agent.email) {
        return NextResponse.json(
          { success: false, message: 'Aucune adresse email pour cet agent' },
          { status: 400 }
        );
      }

      if (!agent.agentNumber || !agent.systemPassword) {
        return NextResponse.json(
          { success: false, message: 'Identifiants système non trouvés' },
          { status: 400 }
        );
      }

      const emailSent = await sendCredentialsEmail(
        agent.name || 'Agent',
        agent.email,
        agent.agentNumber,
        agent.systemPassword,
        agentId
      );

      if (emailSent) {
        await db.user.update({
          where: { id: agentId },
          data: { systemPasswordSent: true },
        });
      }

      return NextResponse.json({
        success: true,
        message: emailSent ? 'Email envoyé avec succès' : 'Erreur lors de l\'envoi',
        emailSent,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue. Actions possibles: accept, reject, suspend, unsuspend, resend_credentials' },
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
