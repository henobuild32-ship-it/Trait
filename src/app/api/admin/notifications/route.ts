import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all global notifications
export async function GET() {
  try {
    const notifications = await db.globalNotification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true, username: true } },
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Admin notifications list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: send global notification
export async function POST(request: NextRequest) {
  try {
    const { adminId, title, message, type } = await request.json();

    if (!adminId || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Titre et message requis' },
        { status: 400 }
      );
    }

    // Create global notification
    const notification = await db.globalNotification.create({
      data: {
        adminId,
        title,
        message,
        type: type || 'general',
        sentToAll: true,
      },
    });

    // Also create individual notifications for all active (non-suspended) users
    const users = await db.user.findMany({
      where: { suspended: false },
      select: { id: true },
    });

    const notificationsData = users.map(user => ({
      userId: user.id,
      title,
      message,
      type: type || 'announcement',
      read: false,
    }));

    if (notificationsData.length > 0) {
      await db.notification.createMany({ data: notificationsData });
    }

    await db.adminActivityLog.create({
      data: {
        adminId,
        action: 'send_notification',
        target: notification.id,
        details: `Notification envoyée à ${users.length} utilisateurs: "${title}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Notification envoyée à ${users.length} utilisateurs`,
      notification,
    });
  } catch (error) {
    console.error('Admin send notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
