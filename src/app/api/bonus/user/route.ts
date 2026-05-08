import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Get user with bonus info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        pseudo: true,
        bonusBalance: true,
        bonusBalanceFC: true,
        bonusBlocked: true,
        bonusBlockedReason: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get bonus history summary
    const [totalGranted, totalUsed, recentHistory] = await Promise.all([
      // Total bonus granted (positive amounts)
      db.bonusHistory.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          amount: { gt: 0 },
        },
      }),
      // Total bonus used (from purchases)
      db.bonusHistory.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: 'purchase',
        },
      }),
      // Recent bonus history (last 10)
      db.bonusHistory.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          description: true,
          createdAt: true,
        },
      }),
    ])

    // Count purchases with bonus
    const bonusPurchaseCount = await db.purchase.count({
      where: {
        buyerId: userId,
        usedBonus: { gt: 0 },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        pseudo: user.pseudo,
        balances: {
          bonusUSD: user.bonusBalance,
          bonusFC: user.bonusBalanceFC,
        },
        blocked: {
          isBlocked: user.bonusBlocked,
          reason: user.bonusBlockedReason,
        },
        summary: {
          totalGranted: {
            USD: totalGranted._sum.amount ?? 0,
          },
          totalUsed: {
            USD: Math.abs(totalUsed._sum.amount ?? 0),
          },
          bonusPurchaseCount,
        },
        recentHistory: recentHistory.map((entry) => ({
          id: entry.id,
          type: entry.type,
          amount: entry.amount,
          currency: entry.currency,
          description: entry.description,
          createdAt: entry.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Bonus user info error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
