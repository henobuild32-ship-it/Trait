import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomInt, randomBytes } from 'crypto';

function maskCardNumber(num: string): string {
  return num.length >= 4 ? `****${num.slice(-4)}` : num;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function generateCardNumber(): string {
  const prefix = '4927';
  let remaining = '';
  for (let i = 0; i < 12; i++) {
    remaining += randomInt(0, 10).toString();
  }
  return prefix + remaining;
}

function generateCVV(): string {
  let cvv = '';
  for (let i = 0; i < 3; i++) {
    cvv += randomInt(0, 10).toString();
  }
  return cvv;
}

function generateExpiryDate(): string {
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 3, now.getMonth(), 1);
  const month = (expiry.getMonth() + 1).toString().padStart(2, '0');
  const year = expiry.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
}

function generateQRCode(cardId: string): string {
  return `TRAIT-QR-${cardId}-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

// ─── GET – List all generated cards with filters ──────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const cardType = searchParams.get('cardType') || 'all';
    const search = searchParams.get('search') || '';

    const where: Record<string, any> = {};

    if (status !== 'all' && ['active', 'suspended', 'blocked'].includes(status)) {
      where.status = status;
    }

    if (cardType !== 'all' && ['USD', 'FC'].includes(cardType)) {
      where.cardType = cardType;
    }

    if (search.trim()) {
      where.OR = [
        { cardNumber: { contains: search.trim() } },
        { user: { name: { contains: search.trim() } } },
        { user: { phone: { contains: search.trim() } } },
      ];
    }

    const cards = await db.traitCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            photoId: true,
            isVerified: true,
            realBalance: true,
            realBalanceFC: true,
            suspended: true,
            createdAt: true,
          },
        },
        request: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { payments: true },
        },
      },
    });

    // Stats
    const totalCards = await db.traitCard.count();
    const activeCards = await db.traitCard.count({ where: { status: 'active' } });
    const suspendedCards = await db.traitCard.count({ where: { status: 'suspended' } });
    const blockedCards = await db.traitCard.count({ where: { status: 'blocked' } });
    const usdCards = await db.traitCard.count({ where: { cardType: 'USD' } });
    const fcCards = await db.traitCard.count({ where: { cardType: 'FC' } });

    const safeCards = cards.map(({ cvv, ...rest }) => ({
      ...rest,
      cardNumber: maskCardNumber(rest.cardNumber),
    }));

    return NextResponse.json({
      success: true,
      cards: safeCards,
      stats: {
        total: totalCards,
        active: activeCards,
        suspended: suspendedCards,
        blocked: blockedCards,
        usd: usdCards,
        fc: fcCards,
      },
    });
  } catch (error) {
    console.error('Admin cards list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── POST – Generate a new card for a client ─────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json() as {
      adminId: string;
      userId: string;
      cardType: 'USD' | 'FC';
      action: 'generate' | 'send-info' | 'block';
      cardId?: string;
      message?: string;
    };

    const { adminId, action } = body;

    if (!adminId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    if (auth.userId !== adminId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Verify admin
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin non trouvé' },
        { status: 404 }
      );
    }

    // ── GENERATE ACTION ──────────────────────────────────────────────

    if (action === 'generate') {
      const { userId, cardType } = body;

      if (!userId || !cardType) {
        return NextResponse.json(
          { success: false, message: 'userId et cardType requis' },
          { status: 400 }
        );
      }

      // Verify user is a client
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          suspended: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      if (user.role !== 'client') {
        return NextResponse.json(
          { success: false, message: 'Seuls les comptes clients peuvent recevoir des cartes' },
          { status: 400 }
        );
      }

      if (user.suspended) {
        return NextResponse.json(
          { success: false, message: 'Ce compte est suspendu' },
          { status: 400 }
        );
      }

      // Check if user already has a card of this type
      const existingCard = await db.traitCard.findFirst({
        where: { userId, cardType, status: { in: ['active', 'suspended'] } },
      });

      if (existingCard) {
        return NextResponse.json(
          { success: false, message: `Ce client possède déjà une carte ${cardType} (${existingCard.status === 'active' ? 'active' : 'suspendue'})` },
          { status: 400 }
        );
      }

      // Generate card details
      let cardNumber = generateCardNumber();
      // Ensure uniqueness
      let attempts = 0;
      while (await db.traitCard.findUnique({ where: { cardNumber } }) && attempts < 10) {
        cardNumber = generateCardNumber();
        attempts++;
      }

      const cvv = generateCVV();
      const expiryDate = generateExpiryDate();

      // Create CardRequest + TraitCard atomically
      const cardRequest = await db.cardRequest.create({
        data: {
          userId,
          cardType,
          status: 'approved',
          adminId,
        },
      });

      const card = await db.traitCard.create({
        data: {
          userId,
          cardRequestId: cardRequest.id,
          cardType,
          cardNumber,
          cvv,
          qrCode: generateQRCode(cardRequest.id),
          expiryDate,
          status: 'active',
        },
      });

      // Activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'generate_card',
          target: card.id,
          details: JSON.stringify({
            userId,
            userName: user.name || user.phone,
            cardType,
            cardNumber: maskCardNumber(cardNumber),
          }),
        },
      });

      // Notification to client
      await db.notification.create({
        data: {
          userId,
          title: 'Carte TRAIT générée avec succès',
          message: `Une carte TRAIT ${cardType} (****${cardNumber.slice(-4)}) a été générée pour votre compte. Date d'expiration: ${expiryDate}. Conservez vos informations de carte en sécurité.`,
          type: 'card_approved',
        },
      });

      // Send client message with card details
      await db.adminClientMessage.create({
        data: {
          adminId,
          recipientId: userId,
          title: `Carte TRAIT ${cardType} – Informations`,
          message: `Cher(e) ${user.name || 'Client'},\n\nVotre carte TRAIT ${cardType} a été générée avec succès.\n\nNuméro de carte: ${maskCardNumber(cardNumber)}\nDate d'expiration: ${expiryDate}\nType: ${cardType}\n\nSécurité:\n- Ne partagez jamais votre CCV\n- Conservez votre carte en lieu sûr\n- En cas de perte ou vol, contactez immédiatement le support\n\nTRAIT – Votre partenaire de confiance`,
          type: 'individual',
          allowCopy: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Carte générée avec succès',
        card: {
          id: card.id,
          cardType: card.cardType,
          cardNumber: maskCardNumber(card.cardNumber),
          qrCode: card.qrCode,
          expiryDate: card.expiryDate,
          status: card.status,
          createdAt: card.createdAt,
        },
      });
    }

    // ── SEND INFO ACTION ─────────────────────────────────────────────

    if (action === 'send-info') {
      const { cardId } = body;

      if (!cardId) {
        return NextResponse.json(
          { success: false, message: 'cardId requis' },
          { status: 400 }
        );
      }

      const card = await db.traitCard.findUnique({
        where: { id: cardId },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      if (!card) {
        return NextResponse.json(
          { success: false, message: 'Carte non trouvée' },
          { status: 404 }
        );
      }

      // Notification
      await db.notification.create({
        data: {
          userId: card.userId,
          title: 'Rappel – Informations de votre carte TRAIT',
          message: `Voici vos informations de carte TRAIT ${card.cardType}:\nNuméro: ${maskCardNumber(card.cardNumber)}\nExpiration: ${card.expiryDate}\nStatut: ${card.status}\n\nConservez ces informations en sécurité.`,
          type: 'security',
        },
      });

      // Client message
      await db.adminClientMessage.create({
        data: {
          adminId,
          recipientId: card.userId,
          title: `Rappel – Carte TRAIT ${card.cardType}`,
          message: `Cher(e) ${card.user?.name || 'Client'},\n\nVoici un rappel des informations de votre carte TRAIT ${card.cardType}:\n\nNuméro de carte: ${maskCardNumber(card.cardNumber)}\nDate d'expiration: ${card.expiryDate}\nStatut: ${card.status}\n\nSécurité:\n- Ne partagez jamais votre CCV\n- Si vous n'avez pas demandé ce rappel, contactez le support immédiatement\n\nTRAIT – Sécurité & Confiance`,
          type: 'individual',
          allowCopy: true,
        },
      });

      // Activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'send_card_info',
          target: cardId,
          details: JSON.stringify({
            cardNumber: maskCardNumber(card.cardNumber),
            cardType: card.cardType,
            userId: card.userId,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Informations envoyées au client',
      });
    }

    // ── BLOCK ACTION ─────────────────────────────────────────────────

    if (action === 'block') {
      const { cardId, message } = body;

      if (!cardId) {
        return NextResponse.json(
          { success: false, message: 'cardId requis' },
          { status: 400 }
        );
      }

      const card = await db.traitCard.findUnique({
        where: { id: cardId },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      if (!card) {
        return NextResponse.json(
          { success: false, message: 'Carte non trouvée' },
          { status: 404 }
        );
      }

      const updatedCard = await db.traitCard.update({
        where: { id: cardId },
        data: { status: 'blocked' },
      });

      // Activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'block_card',
          target: cardId,
          details: JSON.stringify({
            cardNumber: maskCardNumber(card.cardNumber),
            cardType: card.cardType,
            userId: card.userId,
            reason: message || 'Non spécifié',
          }),
        },
      });

      // Notification
      await db.notification.create({
        data: {
          userId: card.userId,
          title: 'Carte TRAIT bloquée',
          message: `Votre carte TRAIT ${maskCardNumber(card.cardNumber)} (${card.cardType}) a été bloquée par l'administration. ${message ? `Motif: ${message}` : ''} Contactez le support pour plus d'informations.`,
          type: 'security',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Carte bloquée avec succès',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin cards action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
