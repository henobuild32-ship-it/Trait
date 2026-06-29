import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const requests = await db.cardRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Admin card requests list error:', error);
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

    const { requestId, action, rejectReason } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const cardRequest = await db.cardRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!cardRequest) {
        return NextResponse.json(
          { success: false, message: 'Demande non trouvée' },
          { status: 404 }
        );
      }

      // Generate card
      const cardNumber = Array.from({ length: 4 }, () =>
        crypto.randomInt(0, 10000).toString().padStart(4, '0')
      ).join(' ');

      const cvv = crypto.randomInt(100, 1000).toString();
      const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const expiryYear = String(new Date().getFullYear() + 4);

      await db.$transaction([
        db.traitCard.create({
          data: {
            userId: cardRequest.userId,
            cardRequestId: cardRequest.id,
            cardType: cardRequest.cardType,
            cardNumber,
            cvv,
            qrCode: crypto.randomUUID(),
            expiryDate: `${expiryMonth}/${expiryYear}`,
            status: 'active',
          },
        }),
        db.cardRequest.update({
          where: { id: requestId },
          data: { status: 'approved', adminId },
        }),
      ]);

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'approve_card_request',
          target: requestId,
          details: `Demande de carte ${cardRequest.cardType} approuvée pour ${cardRequest.user.name || cardRequest.user.phone}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Carte approuvée' });
    }

    if (action === 'reject') {
      await db.cardRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', rejectReason: rejectReason || 'Non conforme', adminId },
      });

      return NextResponse.json({ success: true, message: 'Demande rejetée' });
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
