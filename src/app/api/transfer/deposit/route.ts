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

    // Demo mode: auto-complete the deposit
    const deposit = await db.deposit.create({
      data: {
        userId,
        amount,
        currency: currency || 'USD',
        method: method || 'mobile_money',
        status: 'completed',
      },
    })

    // Add amount to user's realBalance
    await db.user.update({
      where: { id: userId },
      data: {
        realBalance: { increment: amount },
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Deposit Completed',
        message: `Your deposit of $${amount.toFixed(2)} via ${method || 'mobile money'} has been completed.`,
        type: 'general',
      },
    })

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        currency: deposit.currency,
        method: deposit.method,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
