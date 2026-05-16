import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, amount, fee, currency, method, agentCode } = body as {
      userId: string
      amount: number
      fee: number
      currency: string
      method: string
      agentCode?: string
    }

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'User ID and positive amount are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Resolve agentId from agentCode if provided
    let linkedAgentId: string | undefined
    if (agentCode) {
      const agent = await db.user.findUnique({
        where: { agentCode },
      })
      if (agent && agent.role === 'agent') {
        linkedAgentId = agent.id
      }
    }

    // Create a pending Withdrawal record
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        fee: fee || 0,
        currency: currency || 'USD',
        method: method || 'mobile_money',
        status: 'pending',
        agentId: linkedAgentId,
      },
    })

    // Deduct balance immediately when creating pending withdrawal
    const isFC = (currency || 'USD') === 'FC';
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: amount + (fee || 0) } }
        : { realBalance: { decrement: amount + (fee || 0) } },
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
        agentId: withdrawal.agentId,
        createdAt: withdrawal.createdAt,
      },
    })
  } catch (error) {
    console.error('Create withdrawal error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
