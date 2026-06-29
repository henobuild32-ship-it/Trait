import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID requis' }, { status: 400 });
    }

    const favorites = await db.ussdFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, label, phone, type } = body;

    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 });
    }

    if (!userId || !label || !phone) {
      return NextResponse.json({ success: false, message: 'Tous les champs sont requis' }, { status: 400 });
    }

    const favorite = await db.ussdFavorite.create({
      data: {
        userId,
        label: label.trim(),
        phone: phone.trim(),
        type: type || 'transfer',
      },
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('id');

    if (!favoriteId) {
      return NextResponse.json({ success: false, message: 'ID du favori requis' }, { status: 400 });
    }

    // Verify the favorite belongs to the authenticated user
    const favorite = await db.ussdFavorite.findUnique({ where: { id: favoriteId } });
    if (favorite && favorite.userId !== auth.userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 });
    }

    await db.ussdFavorite.delete({ where: { id: favoriteId } });
    return NextResponse.json({ success: true, message: 'Favori supprimé' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
