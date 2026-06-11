import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const sellers = await db.user.findMany({
      where: { role: 'seller' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        name: true,
        businessName: true,
        businessType: true,
        location: true,
        country: true,
        validationStatus: true,
        suspended: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { marketplaceProducts: true },
        },
      },
    });

    return NextResponse.json({ success: true, sellers });
  } catch (error) {
    console.error('Admin sellers list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
