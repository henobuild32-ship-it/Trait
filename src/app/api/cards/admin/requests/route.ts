import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomInt, randomBytes } from 'crypto';

function maskCardNumber(num: string): string {
  return num.length >= 4 ? `****${num.slice(-4)}` : num;
}

// Helper: Generate 16-digit card number starting with 4927
function generateCardNumber(): string {
  const prefix = '4927';
  let remaining = '';
  for (let i = 0; i < 12; i++) {
    remaining += randomInt(0, 10).toString();
  }
  return prefix + remaining;
}

// Helper: Generate 3-digit CVV
function generateCVV(): string {
  let cvv = '';
  for (let i = 0; i < 3; i++) {
    cvv += randomInt(0, 10).toString();
  }
  return cvv;
}

// Helper: Generate expiry date (3 years from now in MM/YY)
function generateExpiryDate(): string {
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 3, now.getMonth(), 1);
  const month = (expiry.getMonth() + 1).toString().padStart(2, '0');
  const year = expiry.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
}

// Helper: Generate unique QR code string
function generateQRCode(cardId: string): string {
  return `TRAIT-QR-${cardId}-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

// GET - Get all card requests for admin
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const where: Record<string, string> = {};
    if (status !== 'all' && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      where.status = status;
    }

    const requests = await db.cardRequest.findMany({
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
            createdAt: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        card: {
          select: {
            id: true,
            cardNumber: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const safeRequests = requests.map(req => ({
      ...req,
      card: req.card ? {
        ...req.card,
        cardNumber: maskCardNumber(req.card.cardNumber),
      } : null,
    }));

    return NextResponse.json({
      success: true,
      requests: safeRequests,
    });
  } catch (error) {
    console.error('Admin card requests list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Manage card request (approve/reject/suspend)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
    const { adminId, requestId, action, reason } = await request.json() as {
      adminId: string;
      requestId: string;
      action: 'approve' | 'reject' | 'suspend';
      reason?: string;
    };

    if (!adminId || !requestId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: adminId, requestId, action requis' },
        { status: 400 }
      );
    }

    if (auth.userId !== adminId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    if (!['approve', 'reject', 'suspend'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action non reconnue. Actions possibles: approve, reject, suspend' },
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

    // Get the card request with user info
    const cardRequest = await db.cardRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!cardRequest) {
      return NextResponse.json(
        { success: false, message: 'Demande de carte non trouvée' },
        { status: 404 }
      );
    }

    if (cardRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Cette demande a déjà été traitée (statut: ${cardRequest.status})` },
        { status: 400 }
      );
    }

    // APPROVE action
    if (action === 'approve') {
      // Generate card details
      const cardNumber = generateCardNumber();
      const cvv = generateCVV();
      const expiryDate = generateExpiryDate();

      // Update the card request status
      const updatedRequest = await db.cardRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          adminId,
        },
      });

      // Create the TraitCard
      const card = await db.traitCard.create({
        data: {
          userId: cardRequest.userId,
          cardRequestId: requestId,
          cardType: cardRequest.cardType,
          cardNumber,
          cvv,
          qrCode: generateQRCode(requestId),
          expiryDate,
          status: 'active',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'approve_card_request',
          target: requestId,
          details: JSON.stringify({
            userId: cardRequest.userId,
            userName: cardRequest.user?.name || cardRequest.user?.phone,
            cardType: cardRequest.cardType,
            cardNumber: maskCardNumber(cardNumber),
          }),
        },
      });

      // Create notification for the user
      await db.notification.create({
        data: {
          userId: cardRequest.userId,
          title: 'Carte TRAIT approuvée ✓',
          message: `Votre demande de carte ${cardRequest.cardType} a été approuvée. Votre carte ${maskCardNumber(cardNumber)} est maintenant active. Date d'expiration: ${expiryDate}.`,
          type: 'card_approved',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Demande de carte approuvée avec succès',
        cardRequest: {
          id: updatedRequest.id,
          status: updatedRequest.status,
        },
        card: {
          id: card.id,
          cardType: card.cardType,
          cardNumber: maskCardNumber(card.cardNumber),
          expiryDate: card.expiryDate,
          status: card.status,
        },
      });
    }

    // REJECT action
    if (action === 'reject') {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Une raison du refus est requise' },
          { status: 400 }
        );
      }

      const updatedRequest = await db.cardRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          adminId,
          rejectReason: reason.trim(),
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_card_request',
          target: requestId,
          details: JSON.stringify({
            userId: cardRequest.userId,
            userName: cardRequest.user?.name || cardRequest.user?.phone,
            cardType: cardRequest.cardType,
            reason: reason.trim(),
          }),
        },
      });

      // Create notification for the user
      await db.notification.create({
        data: {
          userId: cardRequest.userId,
          title: 'Demande de carte refusée',
          message: `Votre demande de carte ${cardRequest.cardType} a été refusée. Motif: ${reason.trim()}. Vous pouvez soumettre une nouvelle demande si nécessaire.`,
          type: 'card_rejected',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Demande de carte refusée',
        cardRequest: {
          id: updatedRequest.id,
          status: updatedRequest.status,
          rejectReason: updatedRequest.rejectReason,
        },
      });
    }

    // SUSPEND action
    if (action === 'suspend') {
      const updatedRequest = await db.cardRequest.update({
        where: { id: requestId },
        data: {
          status: 'suspended',
          adminId,
          rejectReason: reason || 'Demande suspendue par l\'administration',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'suspend_card_request',
          target: requestId,
          details: JSON.stringify({
            userId: cardRequest.userId,
            userName: cardRequest.user?.name || cardRequest.user?.phone,
            cardType: cardRequest.cardType,
            reason: reason || 'Non spécifié',
          }),
        },
      });

      // Create notification for the user
      await db.notification.create({
        data: {
          userId: cardRequest.userId,
          title: 'Demande de carte suspendue',
          message: `Votre demande de carte ${cardRequest.cardType} a été suspendue. Motif: ${reason || 'Non spécifié'}. Contactez le support pour plus d'informations.`,
          type: 'card_suspended',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Demande de carte suspendue',
        cardRequest: {
          id: updatedRequest.id,
          status: updatedRequest.status,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin card request action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
