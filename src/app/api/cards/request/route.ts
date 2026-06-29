import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

// POST - Client requests a card
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;
    const { userId, cardType } = await request.json() as {
      userId: string;
      cardType: 'USD' | 'FC';
    };

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

    if (!cardType || !['USD', 'FC'].includes(cardType)) {
      return NextResponse.json(
        { success: false, message: 'cardType doit être "USD" ou "FC"' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.suspended) {
      return NextResponse.json(
        { success: false, message: 'Votre compte est suspendu' },
        { status: 403 }
      );
    }

    // Check if user already has a card of that type
    const existingCard = await db.traitCard.findFirst({
      where: { userId, cardType },
    });

    if (existingCard) {
      return NextResponse.json(
        { success: false, message: `Vous possédez déjà une carte ${cardType}` },
        { status: 400 }
      );
    }

    // Check if user already has a pending request for that type
    const existingRequest = await db.cardRequest.findFirst({
      where: { userId, cardType, status: 'pending' },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: `Vous avez déjà une demande de carte ${cardType} en attente` },
        { status: 400 }
      );
    }

    // Create the card request
    const cardRequest = await db.cardRequest.create({
      data: {
        userId,
        cardType,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demande de carte soumise avec succès',
      cardRequest: {
        id: cardRequest.id,
        cardType: cardRequest.cardType,
        status: cardRequest.status,
        createdAt: cardRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Card request error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
