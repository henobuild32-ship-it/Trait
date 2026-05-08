import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { pseudo: { contains: search } },
      ];
    }

    if (role) where.role = role;
    if (status === 'suspended') where.suspended = true;
    if (status === 'active') where.suspended = false;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          phone: true,
          name: true,
          pseudo: true,
          country: true,
          role: true,
          agentCode: true,
          realBalance: true,
          bonusBalance: true,
          isVerified: true,
          suspended: true,
          suspensionReason: true,
          hasCompletedOnboarding: true,
          createdAt: true,
          _count: {
            select: {
              sentTransactions: true,
              receivedTransactions: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: suspend or delete user
export async function POST(request: NextRequest) {
  try {
    const { userId, adminId, action, reason } = await request.json();

    if (!userId || !adminId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (action === 'suspend') {
      if (!reason) {
        return NextResponse.json(
          { success: false, message: 'Motif de suspension requis' },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: userId },
        data: {
          suspended: true,
          suspensionReason: reason,
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'suspend_user',
          target: userId,
          details: `Utilisateur ${user.name || user.phone} suspendu. Motif: ${reason}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Utilisateur suspendu' });
    }

    if (action === 'unsuspend') {
      await db.user.update({
        where: { id: userId },
        data: {
          suspended: false,
          suspensionReason: null,
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'unsuspend_user',
          target: userId,
          details: `Utilisateur ${user.name || user.phone} réactivé`,
        },
      });

      return NextResponse.json({ success: true, message: 'Utilisateur réactivé' });
    }

    if (action === 'delete') {
      // Delete related data first
      await db.notification.deleteMany({ where: { userId } });
      await db.barterChatParticipant.deleteMany({ where: { userId } });
      await db.barterMessage.deleteMany({
        where: { chat: { participants: { some: { userId } } } },
      });

      // Delete user
      await db.user.delete({ where: { id: userId } });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'delete_user',
          target: userId,
          details: `Utilisateur ${user.name || user.phone} supprimé définitivement`,
        },
      });

      return NextResponse.json({ success: true, message: 'Utilisateur supprimé' });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
