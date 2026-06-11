import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const children = await db.user.findMany({
      where: { parentId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        pseudo: true,
        phone: true,
        realBalance: true,
        realBalanceFC: true,
        createdAt: true,
        parent: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json({ success: true, children });
  } catch (error) {
    console.error('Admin children list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
