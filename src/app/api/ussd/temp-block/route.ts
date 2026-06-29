import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, action } = body;

    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 });
    }

    if (!userId || !action) {
      return NextResponse.json({ success: false, message: 'Paramètres manquants' }, { status: 400 });
    }

    if (action === 'block') {
      await db.user.update({
        where: { id: userId },
        data: { tempBlocked: true },
      });
      return NextResponse.json({ success: true, message: 'Compte bloqué temporairement' });
    }

    if (action === 'unblock') {
      await db.user.update({
        where: { id: userId },
        data: { tempBlocked: false, pinAttempts: 0 },
      });
      return NextResponse.json({ success: true, message: 'Compte débloqué' });
    }

    return NextResponse.json({ success: false, message: 'Action non valide' }, { status: 400 });
  } catch (error) {
    console.error('Temp block error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
