import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { createAdminMessageNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const messages = await db.adminClientMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true } },
        recipient: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Admin client messages list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const adminId = auth.userId

    const { recipientId, title, message, type, allowCopy } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Destinataire, titre et message requis' },
        { status: 400 }
      );
    }

    const adminMessage = await db.adminClientMessage.create({
      data: {
        adminId,
        recipientId,
        title,
        message,
        type: type || 'individual',
        allowCopy: allowCopy || false,
      },
    });

    createAdminMessageNotification(recipientId, title, message, 'admin_message').catch(() => {})

    return NextResponse.json({ success: true, message: adminMessage });
  } catch (error) {
    console.error('Admin send client message error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
