import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const userId = auth.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, pseudo: true,
        bonusBalance: true, bonusBalanceFC: true,
        bonusBlocked: true, bonusBlockedReason: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const [totalGranted, totalUsed, recentHistory] = await Promise.all([
      db.bonusHistory.aggregate({
        _sum: { amount: true },
        where: { userId, amount: { gt: 0 } },
      }),
      db.bonusHistory.aggregate({
        _sum: { amount: true },
        where: { userId, type: 'purchase' },
      }),
      db.bonusHistory.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, amount: true, currency: true, description: true, createdAt: true },
      }),
    ])

    const bonusPurchaseCount = await db.purchase.count({
      where: { buyerId: userId, usedBonus: { gt: 0 } },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id, name: user.name, pseudo: user.pseudo,
        balances: { bonusUSD: user.bonusBalance, bonusFC: user.bonusBalanceFC },
        blocked: { isBlocked: user.bonusBlocked, reason: user.bonusBlockedReason },
        summary: {
          totalGranted: { USD: totalGranted._sum.amount ?? 0 },
          totalUsed: { USD: Math.abs(totalUsed._sum.amount ?? 0) },
          bonusPurchaseCount,
        },
        recentHistory,
      },
    })
  } catch (error) {
    console.error('Bonus user info error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
