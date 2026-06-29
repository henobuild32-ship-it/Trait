import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

// GET - Get client messages from admin
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId est requis' },
        { status: 400 }
      );
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    const messages = await db.adminClientMessage.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Client messages list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Mark a message as read
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;
    const { userId, messageId } = await request.json() as {
      userId: string;
      messageId: string;
    };

    if (!userId || !messageId) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: userId, messageId requis' },
        { status: 400 }
      );
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Verify the message belongs to this user
    const message = await db.adminClientMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message non trouvé' },
        { status: 404 }
      );
    }

    if (message.recipientId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Ce message ne vous appartient pas' },
        { status: 403 }
      );
    }

    if (message.isRead) {
      return NextResponse.json({
        success: true,
        message: 'Message déjà lu',
        isRead: true,
      });
    }

    const updatedMessage = await db.adminClientMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Message marqué comme lu',
      isRead: updatedMessage.isRead,
    });
  } catch (error) {
    console.error('Client message mark read error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
