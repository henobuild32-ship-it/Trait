import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const messages = await db.agentMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true } },
        recipient: { select: { id: true, name: true, phone: true, agentCode: true } },
      },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Admin messages list error:', error);
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

    const { recipientId, title, message, type } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Destinataire, titre et message requis' },
        { status: 400 }
      );
    }

    const agentMessage = await db.agentMessage.create({
      data: {
        adminId,
        recipientId,
        title,
        message,
        type: type || 'individual',
      },
    });

    await db.adminActivityLog.create({
      data: {
        adminId,
        action: 'send_message',
        target: recipientId,
        details: `Message envoyé à l'agent: "${title}"`,
      },
    });

    return NextResponse.json({ success: true, message: agentMessage });
  } catch (error) {
    console.error('Admin send message error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
