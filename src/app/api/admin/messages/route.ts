import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List messages sent by admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: 'adminId requis' },
        { status: 400 }
      );
    }

    const messages = await db.agentMessage.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      include: {
        recipient: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Admin messages list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Send a message (individual or broadcast)
export async function POST(request: NextRequest) {
  try {
    const { adminId, action, recipientId, title, message } = await request.json();

    if (!adminId || !action || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: adminId, action, title, message requis' },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin non trouvé' },
        { status: 404 }
      );
    }

    // INDIVIDUAL message
    if (action === 'individual') {
      if (!recipientId) {
        return NextResponse.json(
          { success: false, message: 'recipientId requis pour un message individuel' },
          { status: 400 }
        );
      }

      // Verify recipient exists
      const recipient = await db.user.findUnique({
        where: { id: recipientId },
        select: { id: true, name: true, role: true },
      });

      if (!recipient) {
        return NextResponse.json(
          { success: false, message: 'Destinataire non trouvé' },
          { status: 404 }
        );
      }

      const msg = await db.agentMessage.create({
        data: {
          adminId,
          recipientId,
          title,
          message,
          type: 'individual',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'send_agent_message',
          target: msg.id,
          details: `Message envoyé à ${recipient.name || recipientId}: "${title}"`,
        },
      });

      // Create notification for the recipient
      await db.notification.create({
        data: {
          userId: recipientId,
          title: `Nouveau message: ${title}`,
          message: message.length > 100 ? message.substring(0, 100) + '...' : message,
          type: 'agent_message',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Message envoyé avec succès',
        agentMessage: msg,
      });
    }

    // BROADCAST message
    if (action === 'broadcast') {
      // Get all validated agents
      const agents = await db.user.findMany({
        where: {
          role: 'agent',
          validationStatus: 'validated',
          suspended: false,
        },
        select: { id: true, name: true },
      });

      if (agents.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Aucun agent validé trouvé pour la diffusion' },
          { status: 400 }
        );
      }

      // Create a message for each agent
      const messagesData = agents.map(agent => ({
        adminId,
        recipientId: agent.id,
        title,
        message,
        type: 'broadcast' as const,
      }));

      const result = await db.agentMessage.createMany({ data: messagesData });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'broadcast_agent_message',
          details: `Message diffusé à ${agents.length} agents: "${title}"`,
        },
      });

      // Create notification for each agent
      const notificationsData = agents.map(agent => ({
        userId: agent.id,
        title: `Annonce: ${title}`,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        type: 'agent_broadcast',
      }));

      await db.notification.createMany({ data: notificationsData });

      return NextResponse.json({
        success: true,
        message: `Message diffusé à ${agents.length} agents`,
        count: result.count,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue. Actions possibles: individual, broadcast' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin send message error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
