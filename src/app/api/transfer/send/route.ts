import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverPhone, amount, currency } = body as {
      senderId: string
      receiverPhone: string
      amount: number
      currency: string
    }

    if (!senderId || !receiverPhone || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'All fields are required and amount must be positive' },
        { status: 400 }
      )
    }

    // Get sender
    const sender = await db.user.findUnique({
      where: { id: senderId },
    })

    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'Sender not found' },
        { status: 404 }
      )
    }

    // Calculate fee: 0.7%
    const fee = Math.round(amount * 0.007 * 100) / 100
    const totalDeduction = amount + fee

    // Validate sender has sufficient balance (real + bonus)
    const totalBalance = sender.realBalance + sender.bonusBalance
    if (totalBalance < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. You need $${totalDeduction.toFixed(2)} but have $${totalBalance.toFixed(2)}.`,
        },
        { status: 400 }
      )
    }

    // Find or create receiver
    let receiver = await db.user.findUnique({
      where: { phone: receiverPhone.trim() },
    })

    if (!receiver) {
      receiver = await db.user.create({
        data: {
          phone: receiverPhone.trim(),
          bonusBalance: 10,
          realBalance: 0,
          country: 'US',
        },
      })
    }

    // Deduct from sender: use bonus first, then real
    let remainingDeduction = totalDeduction
    let bonusUsed = 0
    let realUsed = 0

    if (sender.bonusBalance > 0) {
      bonusUsed = Math.min(sender.bonusBalance, remainingDeduction)
      remainingDeduction -= bonusUsed
    }
    realUsed = remainingDeduction

    // Update sender balance
    await db.user.update({
      where: { id: senderId },
      data: {
        bonusBalance: Math.max(0, sender.bonusBalance - bonusUsed),
        realBalance: Math.max(0, sender.realBalance - realUsed),
      },
    })

    // Update receiver balance
    await db.user.update({
      where: { id: receiver.id },
      data: {
        realBalance: { increment: amount },
      },
    })

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        type: 'send',
        amount,
        fee,
        currency: currency || 'USD',
        status: 'completed',
        senderId,
        receiverId: receiver.id,
        description: `Transfer of $${amount.toFixed(2)} to ${receiver.phone}`,
      },
    })

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: receiver.id,
        title: 'Transfer Received',
        message: `You received $${amount.toFixed(2)} from ${sender.phone || sender.name || 'Unknown'}`,
        type: 'transfer_received',
      },
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
        senderId: transaction.senderId,
        receiverId: transaction.receiverId,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error('Send transfer error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
