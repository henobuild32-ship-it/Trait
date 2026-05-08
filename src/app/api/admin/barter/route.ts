import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all barter offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;

    const [offers, total] = await Promise.all([
      db.barterOffer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, pseudo: true, phone: true } },
        },
      }),
      db.barterOffer.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      offers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin barter list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: delete/moderate barter offer
export async function POST(request: NextRequest) {
  try {
    const { offerId, adminId, action, reason } = await request.json();

    if (!offerId || !adminId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const offer = await db.barterOffer.findUnique({
      where: { id: offerId },
      include: { user: { select: { name: true, phone: true } } },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, message: 'Publication non trouvée' },
        { status: 404 }
      );
    }

    if (action === 'delete') {
      if (!reason) {
        return NextResponse.json(
          { success: false, message: 'Motif de suppression requis' },
          { status: 400 }
        );
      }

      // Delete related chats and messages
      const chats = await db.barterChat.findMany({ where: { offerId } });
      for (const chat of chats) {
        await db.barterMessage.deleteMany({ where: { chatId: chat.id } });
        await db.barterChatParticipant.deleteMany({ where: { chatId: chat.id } });
      }
      await db.barterChat.deleteMany({ where: { offerId } });
      await db.barterOffer.delete({ where: { id: offerId } });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'delete_barter',
          target: offerId,
          details: `Publication troc "${offer.title}" supprimée. Motif: ${reason}. Par: ${offer.user?.name || 'Anonyme'}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Publication supprimée' });
    }

    if (action === 'moderate') {
      await db.barterOffer.update({
        where: { id: offerId },
        data: { status: 'moderated' },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'moderate_barter',
          target: offerId,
          details: `Publication troc "${offer.title}" modérée. Motif: ${reason || 'Non spécifié'}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Publication modérée' });
    }

    if (action === 'close') {
      await db.barterOffer.update({
        where: { id: offerId },
        data: { status: 'closed' },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'close_barter',
          target: offerId,
          details: `Publication troc "${offer.title}" fermée`,
        },
      });

      return NextResponse.json({ success: true, message: 'Publication fermée' });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin barter action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
