import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, currency, method } = body as {
      userId: string
      amount: number
      currency: string
      method: string
    }

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'User ID and a positive amount are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate fee: 0.7%
    const fee = Math.round(amount * 0.007 * 100) / 100
    const totalDeduction = amount + fee

    // Validate sufficient balance
    if (user.realBalance < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient real balance. You need $${totalDeduction.toFixed(2)} but have $${user.realBalance.toFixed(2)}.`,
        },
        { status: 400 }
      )
    }

    // Demo mode: auto-complete the withdrawal
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        fee,
        currency: currency || 'USD',
        method: method || 'mobile_money',
        status: 'completed',
      },
    })

    // Deduct (amount + fee) from realBalance
    await db.user.update({
      where: { id: userId },
      data: {
        realBalance: { decrement: totalDeduction },
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Withdrawal Completed',
        message: `Your withdrawal of $${amount.toFixed(2)} (fee: $${fee.toFixed(2)}) via ${method || 'mobile money'} has been completed.`,
        type: 'withdrawal_validated',
      },
    })

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        currency: withdrawal.currency,
        method: withdrawal.method,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
