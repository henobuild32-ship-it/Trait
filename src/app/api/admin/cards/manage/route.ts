import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const adminId = auth.userId

    const { cardId, action, userId, cardType } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action requise' },
        { status: 400 }
      );
    }

    if (action === 'create') {
      if (!userId || !cardType) {
        return NextResponse.json(
          { success: false, message: 'userId et cardType requis' },
          { status: 400 }
        );
      }

      const existingCard = await db.traitCard.findFirst({
        where: { userId, cardType },
      });

      if (existingCard) {
        return NextResponse.json(
          { success: false, message: `Cet utilisateur a déjà une carte ${cardType}` },
          { status: 400 }
        );
      }

      // Generate card details
      const cardNumber = Array.from({ length: 4 }, () =>
        crypto.randomInt(0, 10000).toString().padStart(4, '0')
      ).join(' ');

      const cvv = crypto.randomInt(100, 1000).toString();
      const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const expiryYear = String(new Date().getFullYear() + 4);
      const expiryDate = `${expiryMonth}/${expiryYear}`;

      // Find or create card request
      let cardRequest = await db.cardRequest.findFirst({
        where: { userId, cardType, status: 'pending' },
      });

      if (!cardRequest) {
        cardRequest = await db.cardRequest.create({
          data: { userId, cardType, status: 'pending' },
        });
      }

      const card = await db.traitCard.create({
        data: {
          userId,
          cardRequestId: cardRequest.id,
          cardType,
          cardNumber,
          cvv,
          qrCode: crypto.randomUUID(),
          expiryDate,
          status: 'active',
        },
      });

      await db.cardRequest.update({
        where: { id: cardRequest.id },
        data: { status: 'approved', adminId },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'create_card',
          target: userId,
          details: `Carte ${cardType} créée pour l'utilisateur ${userId}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Carte créée avec succès',
        card: {
          id: card.id,
          cardType: card.cardType,
          cardNumber: card.cardNumber.slice(-4),
          status: card.status,
          expiryDate: card.expiryDate,
        },
      });
    }

    if (action === 'block' || action === 'unblock') {
      if (!cardId) {
        return NextResponse.json(
          { success: false, message: 'cardId requis' },
          { status: 400 }
        );
      }

      const newStatus = action === 'block' ? 'blocked' : 'active';

      await db.traitCard.update({
        where: { id: cardId },
        data: { status: newStatus },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: `${action}_card`,
          target: cardId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Carte ${action === 'block' ? 'bloquée' : 'débloquée'}`,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin card manage error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
