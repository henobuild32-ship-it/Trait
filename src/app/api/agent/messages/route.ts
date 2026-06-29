import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

// GET - Get messages for an agent
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis' },
        { status: 400 }
      );
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    const messages = await db.agentMessage.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Agent messages list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Mark message(s) as read
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;
    const { userId, messageIds } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis' },
        { status: 400 }
      );
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    let updatedCount = 0;

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      // Mark specific messages as read
      const result = await db.agentMessage.updateMany({
        where: {
          id: { in: messageIds },
          recipientId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      updatedCount = result.count;
    } else {
      // Mark ALL unread messages as read
      const result = await db.agentMessage.updateMany({
        where: {
          recipientId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      updatedCount = result.count;
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} message(s) marqué(s) comme lu(s)`,
      updatedCount,
    });
  } catch (error) {
    console.error('Agent mark messages read error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
