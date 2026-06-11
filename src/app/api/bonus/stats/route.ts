import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const [totalBonusDistributed, totalBonusUsed, totalBonusRemaining,
      bonusCompatibleProducts, mostActiveUsers, recentActivity] = await Promise.all([
      db.bonusHistory.aggregate({ _sum: { amount: true }, where: { amount: { gt: 0 } } }),
      db.bonusHistory.aggregate({ _sum: { amount: true }, where: { type: 'purchase' } }),
      db.user.aggregate({ _sum: { bonusBalance: true, bonusBalanceFC: true } }),
      db.marketplaceProduct.count({ where: { bonusEnabled: true } }),
      db.bonusHistory.groupBy({
        by: ['userId'], _count: { id: true }, _sum: { amount: true },
        orderBy: { _count: { id: 'desc' } }, take: 10,
      }),
      db.bonusHistory.findMany({
        take: 20, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, pseudo: true, phone: true } },
          campaign: { select: { id: true, name: true } },
        },
      }),
    ])

    const activeUserIds = mostActiveUsers.map((u) => u.userId)
    const activeUsersData = activeUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: activeUserIds } },
          select: { id: true, name: true, pseudo: true, phone: true, bonusBalance: true, bonusBalanceFC: true },
        })
      : []

    const userMap = new Map(activeUsersData.map((u) => [u.id, u]))
    const topUsers = mostActiveUsers.map((u) => ({
      userId: u.userId,
      userInfo: userMap.get(u.userId),
      transactionCount: u._count.id,
      totalAmount: u._sum.amount ?? 0,
    }))

    const activeCampaigns = await db.bonusCampaign.count({ where: { status: 'active' } })

    return NextResponse.json({
      success: true,
      stats: {
        totalDistributed: totalBonusDistributed._sum.amount ?? 0,
        totalUsed: Math.abs(totalBonusUsed._sum.amount ?? 0),
        totalRemaining: totalBonusRemaining._sum.bonusBalance ?? 0,
        activeCampaigns,
        bonusCompatibleProducts,
      },
      topUsers: topUsers.map((u) => ({
        id: u.userId,
        name: u.userInfo?.name || u.userInfo?.pseudo || 'Anonyme',
        phone: u.userInfo?.phone || '—',
        totalBonusReceived: Math.abs(u.totalAmount),
        currency: 'USD',
      })),
      history: recentActivity.map((entry) => ({
        id: entry.id, userId: entry.userId,
        userName: entry.user?.name || entry.user?.pseudo || 'Utilisateur',
        type: entry.type, amount: entry.amount, currency: entry.currency,
        description: entry.description, createdAt: entry.createdAt,
      })),
    })
  } catch (error) {
    console.error('Bonus stats error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
