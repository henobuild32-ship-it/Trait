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
        { success: false, message: 'Tous les champs sont requis et le montant doit être positif' },
        { status: 400 }
      )
    }

    // Get sender
    const sender = await db.user.findUnique({
      where: { id: senderId },
    })

    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'Expéditeur non trouvé' },
        { status: 404 }
      )
    }

    if (sender.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' })
    }

    if (sender.suspended) {
      return NextResponse.json({ success: false, message: 'Votre compte est suspendu.' })
    }

    const isFC = currency === 'FC'
    const cur = isFC ? 'FC' : (currency || 'USD')
    const realBal = isFC ? sender.realBalanceFC : sender.realBalance
    const bonusBal = isFC ? sender.bonusBalanceFC : sender.bonusBalance
    const totalBalance = realBal + bonusBal

    // Calculate fee: 0.7%
    const fee = Math.round(amount * 0.007 * 100) / 100
    const totalDeduction = amount + fee

    if (totalBalance < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde insuffisant. Vous avez ${totalBalance.toFixed(2)} ${cur} mais ${totalDeduction.toFixed(2)} ${cur} est requis.`,
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
          bonusBalance: isFC ? 0 : 10,
          bonusBalanceFC: 0,
          realBalance: 0,
          realBalanceFC: 0,
          country: 'CD',
        },
      })
    }

    // Deduct from sender: use bonus first, then real
    let remainingDeduction = totalDeduction
    const bonusUsed = Math.min(bonusBal, remainingDeduction)
    remainingDeduction -= bonusUsed
    const realUsed = remainingDeduction

    // Update sender balance based on currency
    await db.user.update({
      where: { id: senderId },
      data: isFC
        ? {
            bonusBalanceFC: Math.max(0, sender.bonusBalanceFC - bonusUsed),
            realBalanceFC: Math.max(0, sender.realBalanceFC - realUsed),
          }
        : {
            bonusBalance: Math.max(0, sender.bonusBalance - bonusUsed),
            realBalance: Math.max(0, sender.realBalance - realUsed),
          },
    })

    // Update receiver balance based on currency
    await db.user.update({
      where: { id: receiver.id },
      data: isFC
        ? { realBalanceFC: { increment: amount } }
        : { realBalance: { increment: amount } },
    })

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        type: 'send',
        amount,
        fee,
        currency: cur,
        status: 'completed',
        senderId,
        receiverId: receiver.id,
        description: `Transfert de ${amount.toFixed(2)} ${cur} vers ${receiver.phone}`,
      },
    })

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: receiver.id,
        title: 'Transfert reçu',
        message: `Vous avez reçu ${amount.toFixed(2)} ${cur} de ${sender.phone || sender.name || 'Inconnu'}`,
        type: 'transfer_received',
      },
    })

    // Return updated balances for the sender
    const updatedSender = await db.user.findUnique({ where: { id: senderId } })

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
      updatedBalances: updatedSender ? {
        realBalance: updatedSender.realBalance,
        realBalanceFC: updatedSender.realBalanceFC,
        bonusBalance: updatedSender.bonusBalance,
        bonusBalanceFC: updatedSender.bonusBalanceFC,
      } : undefined,
    })
  } catch (error) {
    console.error('Send transfer error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
