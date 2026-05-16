import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List client accounts only (not agents or admins) for card generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, any> = {
      role: 'client',
    };

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { phone: { contains: search.trim() } },
        { email: { contains: search.trim() } },
      ];
    }

    const clients = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        _count: {
          select: {
            cards: true,
          },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error('Admin clients list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
