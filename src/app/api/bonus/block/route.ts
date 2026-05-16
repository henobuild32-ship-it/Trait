import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, userId, blocked, reason } = body as {
      adminId: string
      userId: string
      blocked: boolean
      reason: string
    }

    if (!adminId || !userId || blocked === undefined || (blocked && !reason)) {
      return NextResponse.json(
        { success: false, message: 'All fields are required: adminId, userId, blocked, reason' },
        { status: 400 }
      )
    }

    // Verify admin exists
    const admin = await db.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update user bonus block status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        bonusBlocked: blocked,
        bonusBlockedReason: blocked ? reason : null,
      },
      select: {
        id: true,
        name: true,
        pseudo: true,
        bonusBlocked: true,
        bonusBlockedReason: true,
      },
    })

    // Record in bonus history
    await db.bonusHistory.create({
      data: {
        userId,
        type: blocked ? 'bonus_blocked' : 'bonus_unblocked',
        amount: 0,
        currency: 'USD',
        description: blocked
          ? `Bonus usage blocked by admin: ${reason}`
          : `Bonus usage unblocked by admin`,
        adminId,
        metadata: JSON.stringify({
          action: blocked ? 'blocked' : 'unblocked',
          reason,
          adminName: admin.name,
          previousBlocked: user.bonusBlocked,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: blocked
        ? `User bonus usage has been blocked. Reason: ${reason}`
        : 'User bonus usage has been unblocked',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Bonus block error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
