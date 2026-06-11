import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const agents = await db.user.findMany({
      where: { role: 'agent', validationStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        name: true,
        pseudo: true,
        email: true,
        country: true,
        city: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('Admin agent validation error:', error);
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

    const { userId, action, rejectReason } = await request.json();

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants ou invalides' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await db.user.update({
        where: { id: userId },
        data: { validationStatus: 'validated', isVerified: true },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'validate_agent',
          target: userId,
          details: `Agent validé: ${userId}`,
        },
      });
    } else {
      await db.user.update({
        where: { id: userId },
        data: { validationStatus: 'rejected', validationRejectReason: rejectReason || 'Non conforme' },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_agent',
          target: userId,
          details: `Agent rejeté: ${userId}. Motif: ${rejectReason || 'Non conforme'}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin agent validation action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
