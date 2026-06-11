import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const adminId = auth.userId

    const body = await request.json()
    const { userId, blocked, reason } = body as {
      userId: string
      blocked: boolean
      reason: string
    }

    if (!userId || blocked === undefined || (blocked && !reason)) {
      return NextResponse.json(
        { success: false, message: 'All fields are required: userId, blocked, reason' },
        { status: 400 }
      )
    }

    const admin = await db.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        bonusBlocked: blocked,
        bonusBlockedReason: blocked ? reason : null,
      },
      select: { id: true, name: true, pseudo: true, bonusBlocked: true, bonusBlockedReason: true },
    })

    await db.bonusHistory.create({
      data: {
        userId,
        type: blocked ? 'bonus_blocked' : 'bonus_unblocked',
        amount: 0,
        currency: 'USD',
        description: blocked ? `Bonus usage blocked by admin: ${reason}` : `Bonus usage unblocked by admin`,
        adminId,
        metadata: JSON.stringify({ action: blocked ? 'blocked' : 'unblocked', reason, adminName: admin.name }),
      },
    })

    return NextResponse.json({
      success: true,
      message: blocked ? `User bonus usage has been blocked.` : 'User bonus usage has been unblocked',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Bonus block error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
