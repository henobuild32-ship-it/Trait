import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const developers = await db.developer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, developers });
  } catch (error) {
    console.error('Admin developers list error:', error);
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

    const { developerId, action, rejectReason, commissionRate } = await request.json();

    if (!developerId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const developer = await db.developer.update({
        where: { id: developerId },
        data: {
          status: 'approved',
          ...(commissionRate ? { commissionRate } : {}),
        },
      });

      // Auto-generate API keys on approval
      await db.developerApiKey.create({
        data: {
          developerId,
          publicKey: `pub_${crypto.randomUUID().replace(/-/g, '')}`,
          secretKey: `sec_${crypto.randomUUID().replace(/-/g, '')}`,
          mode: 'live',
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'approve_developer',
          target: developerId,
          details: `Développeur ${developer.fullName} approuvé`,
        },
      });

      return NextResponse.json({ success: true, developer });
    }

    if (action === 'reject') {
      const developer = await db.developer.update({
        where: { id: developerId },
        data: { status: 'rejected', rejectReason: rejectReason || 'Non conforme' },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_developer',
          target: developerId,
          details: `Développeur ${developer.fullName} rejeté`,
        },
      });

      return NextResponse.json({ success: true, developer });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin developer action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
