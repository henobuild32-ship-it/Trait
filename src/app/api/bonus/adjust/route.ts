import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const adminId = auth.userId

    const body = await request.json()
    const { userId, amount, currency, reason } = body as {
      userId: string
      amount: number
      currency: string
      reason: string
    }

    if (!userId || amount === undefined || !currency || !reason) {
      return NextResponse.json(
        { success: false, message: 'All fields are required: userId, amount, currency, reason' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be a non-zero number' },
        { status: 400 }
      )
    }

    if (!['USD', 'FC'].includes(currency)) {
      return NextResponse.json(
        { success: false, message: 'Currency must be USD or FC' },
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

    if (amount < 0) {
      const currentBalance = currency === 'USD' ? user.bonusBalance : user.bonusBalanceFC
      if (currentBalance + amount < 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient bonus balance. Current: ${currentBalance} ${currency}, attempted to remove: ${Math.abs(amount)} ${currency}`,
          },
          { status: 400 }
        )
      }
    }

    const updateField = currency === 'USD' ? 'bonusBalance' : 'bonusBalanceFC'
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { [updateField]: { increment: amount } },
      select: { id: true, name: true, pseudo: true, bonusBalance: true, bonusBalanceFC: true },
    })

    const historyType = amount > 0 ? 'admin_grant' : 'admin_remove'
    await db.bonusHistory.create({
      data: {
        userId,
        type: historyType,
        amount,
        currency,
        description: reason,
        adminId,
        metadata: JSON.stringify({
          previousBalance: currency === 'USD' ? user.bonusBalance : user.bonusBalanceFC,
          newBalance: currency === 'USD' ? updatedUser.bonusBalance : updatedUser.bonusBalanceFC,
          adminName: admin.name,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Bonus ${amount > 0 ? 'added' : 'removed'} successfully`,
      adjustment: {
        userId: updatedUser.id,
        amount, currency,
        newBalance: currency === 'USD' ? updatedUser.bonusBalance : updatedUser.bonusBalanceFC,
        type: historyType,
      },
    })
  } catch (error) {
    console.error('Bonus adjust error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
