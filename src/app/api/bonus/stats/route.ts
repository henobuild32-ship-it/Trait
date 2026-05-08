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

    // Summary stats per currency
    const bonusUSD = await db.user.aggregate({
      _sum: { bonusBalance: true },
    })
    const bonusFC = await db.user.aggregate({
      _sum: { bonusBalanceFC: true },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalDistributed: {
          USD: totalBonusDistributed._sum.amount ?? 0,
        },
        totalUsed: {
          USD: Math.abs(totalBonusUsed._sum.amount ?? 0),
        },
        totalRemaining: {
          USD: totalBonusRemaining._sum.bonusBalance ?? 0,
          FC: totalBonusRemaining._sum.bonusBalanceFC ?? 0,
        },
        bonusCompatibleProducts,
        topUsers,
        recentActivity: recentActivity.map((entry) => ({
          id: entry.id,
          userId: entry.userId,
          user: entry.user,
          type: entry.type,
          amount: entry.amount,
          currency: entry.currency,
          description: entry.description,
          campaign: entry.campaign,
          createdAt: entry.createdAt,
        })),
        distributionSummary: {
          usersWithBonus: await db.user.count({
            where: { bonusBalance: { gt: 0 } },
          }),
          usersWithBonusFC: await db.user.count({
            where: { bonusBalanceFC: { gt: 0 } },
          }),
          totalUsers: await db.user.count(),
        },
      },
    })
  } catch (error) {
    console.error('Bonus stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
