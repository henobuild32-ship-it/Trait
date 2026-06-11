import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const offers = await db.barterOffer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, pseudo: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error('Admin barter list error:', error);
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

    const { offerId, action } = await request.json();

    if (!offerId || !action || !['remove', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants ou invalides' },
        { status: 400 }
      );
    }

    if (action === 'remove') {
      await db.barterOffer.delete({ where: { id: offerId } });
    } else {
      await db.barterOffer.update({
        where: { id: offerId },
        data: { status: 'inactive' },
      });
    }

    await db.adminActivityLog.create({
      data: {
        adminId,
        action: `${action}_barter`,
        target: offerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin barter action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
