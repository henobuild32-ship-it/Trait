import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const products = await db.marketplaceProduct.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, name: true, pseudo: true } },
      },
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Admin market list error:', error);
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

    const { productId, action } = await request.json();

    if (!productId || !action || !['remove', 'deactivate', 'activate'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants ou invalides' },
        { status: 400 }
      );
    }

    if (action === 'remove') {
      await db.marketplaceProduct.delete({ where: { id: productId } });
    } else {
      await db.marketplaceProduct.update({
        where: { id: productId },
        data: { active: action === 'activate' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin market action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
