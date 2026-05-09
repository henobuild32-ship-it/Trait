import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    // Aggregate totals
    const [
      totalBonusDistributed,
      totalBonusUsed,
      totalBonusRemaining,
      bonusCompatibleProducts,
      mostActiveUsers,
      recentActivity,
    ] = await Promise.all([
      // Total bonus distributed (sum of positive amounts)
      db.bonusHistory.aggregate({
        _sum: { amount: true },
        where: {
          amount: { gt: 0 },
        },
      }),

      // Total bonus used (sum of negative amounts from purchases)
      db.bonusHistory.aggregate({
        _sum: { amount: true },
        where: {
          type: 'purchase',
        },
      }),

      // Total bonus remaining across all users
      db.user.aggregate({
        _sum: { bonusBalance: true, bonusBalanceFC: true },
      }),

      // Number of products compatible with bonus
      db.marketplaceProduct.count({
        where: { bonusEnabled: true },
      }),

      // Most active bonus users (top 10 by number of bonus history entries)
      db.bonusHistory.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Recent bonus activity (last 20)
      db.bonusHistory.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, pseudo: true, phone: true },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
      }),
    ])

    // Enrich most active users with user info
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

    const activeCampaigns = await db.bonusCampaign.count({
      where: { status: 'active' },
    })

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
        id: entry.id,
        userId: entry.userId,
        userName: entry.user?.name || entry.user?.pseudo || 'Utilisateur',
        type: entry.type,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        createdAt: entry.createdAt,
      })),
    })
  } catch (error) {
    console.error('Bonus stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
