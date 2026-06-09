import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalUsers,
      totalAgents,
      suspendedUsers,
      totalTransactions,
      totalDeposits,
      totalWithdrawals,
      totalProducts,
      activeProducts,
      totalBarterOffers,
      activeBarterOffers,
      todayTransactions,
      todayUsers,
      pendingAgents,
      pendingDevelopers,
      approvedDevelopers,
      totalApiCommission,
      internationalTransfers,
      pendingSellers,
      totalSellers,
    ] = await Promise.all([
      // clients only — agents/sellers counted separately below
      db.user.count({ where: { role: 'client' } }),
      db.user.count({ where: { role: 'agent' } }),
      db.user.count({ where: { suspended: true } }),
      db.transaction.count(),
      db.deposit.count({ where: { status: 'completed' } }),
      db.withdrawal.count({ where: { status: 'completed' } }),
      db.marketplaceProduct.count(),
      db.marketplaceProduct.count({ where: { active: true } }),
      db.barterOffer.count(),
      db.barterOffer.count({ where: { status: 'active' } }),
      db.transaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.user.count({ where: { role: 'agent', validationStatus: 'pending' } }),
      db.developer.count({ where: { status: 'pending' } }),
      db.developer.count({ where: { status: 'approved' } }),
      db.apiCommission.aggregate({ _sum: { amount: true } }),
      db.internationalTransfer.count(),
      db.user.count({ where: { role: 'seller', validationStatus: 'pending' } }),
      db.user.count({ where: { role: 'seller' } }),
    ]);

    // ── Volume net (sans double-compte P2P) ─────────────────────────
    // On somme uniquement du côté récepteur : chaque flux ne compte qu'une fois.
    const completedTxs = await db.transaction.findMany({
      where: { status: 'completed', OR: [{ type: 'send' }, { type: 'withdrawal' }, { type: 'deposit' }] },
      select: { amount: true, fee: true, currency: true, type: true },
    });

    const totalVolume = completedTxs.reduce((s, t) => s + (t.amount + (t.fee ?? 0)), 0);
    const sendVolume = completedTxs
      .filter((t) => t.type === 'send')
      .reduce((s, t) => s + t.amount, 0);

    // ── Activité récente ─────────────────────────────────────────────
    const recentLogs = await db.adminActivityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true, username: true } } },
    });

    // ── Stats 30 derniers jours ──────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyTransactions = await db.transaction.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const monthlyDeposits = await db.deposit.aggregate({
      where: { status: 'completed', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });

    const monthlyWithdrawals = await db.withdrawal.aggregate({
      where: { status: 'completed', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalAgents,
        suspendedUsers,
        totalTransactions,
        totalDeposits,
        totalWithdrawals,
        totalProducts,
        activeProducts,
        totalBarterOffers,
        activeBarterOffers,
        todayTransactions,
        todayUsers,
        pendingAgents,
        pendingDevelopers,
        approvedDevelopers,
        totalApiCommission: totalApiCommission._sum.amount ?? 0,
        internationalTransfers,
        pendingSellers,
        totalSellers,
        totalVolume,
        sendVolume,
        monthlyTransactions,
        monthlyDepositVolume: monthlyDeposits._sum.amount ?? 0,
        monthlyWithdrawalVolume: monthlyWithdrawals._sum.amount ?? 0,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
