import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List messages sent by admin to clients
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

    // Verify admin exists
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin non trouvé' },
        { status: 404 }
      );
    }

    const messages = await db.adminClientMessage.findMany({
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
    console.error('Admin client messages list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Send message to client(s) (individual or broadcast)
export async function POST(request: NextRequest) {
  try {
    const { adminId, action, recipientId, title, message, allowCopy } = await request.json() as {
      adminId: string;
      action: 'individual' | 'broadcast';
      recipientId?: string;
      title: string;
      message: string;
      allowCopy?: boolean;
    };

    if (!adminId || !action || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: adminId, action, title, message requis' },
        { status: 400 }
      );
    }

    if (!['individual', 'broadcast'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action non reconnue. Actions possibles: individual, broadcast' },
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
        select: { id: true, name: true, phone: true, suspended: true },
      });

      if (!recipient) {
        return NextResponse.json(
          { success: false, message: 'Destinataire non trouvé' },
          { status: 404 }
        );
      }

      const msg = await db.adminClientMessage.create({
        data: {
          adminId,
          recipientId,
          title,
          message,
          type: 'individual',
          allowCopy: !!allowCopy,
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'send_client_message',
          target: msg.id,
          details: JSON.stringify({
            recipientId,
            recipientName: recipient.name || recipient.phone,
            title,
          }),
        },
      });

      // Create notification for the recipient
      await db.notification.create({
        data: {
          userId: recipientId,
          title: `Message de TRAIT: ${title}`,
          message: message.length > 100 ? message.substring(0, 100) + '...' : message,
          type: 'admin_message',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Message envoyé avec succès',
        clientMessage: msg,
      });
    }

    // BROADCAST message
    if (action === 'broadcast') {
      // Get all non-suspended clients
      const clients = await db.user.findMany({
        where: {
          role: 'client',
          suspended: false,
        },
        select: { id: true, name: true },
      });

      if (clients.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Aucun client actif trouvé pour la diffusion' },
          { status: 400 }
        );
      }

      // Create a message for each client
      const messagesData = clients.map(client => ({
        adminId,
        recipientId: client.id,
        title,
        message,
        type: 'broadcast' as const,
        allowCopy: !!allowCopy,
      }));

      const result = await db.adminClientMessage.createMany({ data: messagesData });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'broadcast_client_message',
          details: JSON.stringify({
            recipientCount: clients.length,
            title,
          }),
        },
      });

      // Create notification for each client
      const notificationsData = clients.map(client => ({
        userId: client.id,
        title: `Annonce TRAIT: ${title}`,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        type: 'admin_message' as const,
      }));

      await db.notification.createMany({ data: notificationsData });

      return NextResponse.json({
        success: true,
        message: `Message diffusé à ${clients.length} clients`,
        count: result.count,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin send client message error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
