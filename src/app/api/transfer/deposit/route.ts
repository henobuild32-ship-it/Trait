import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkChildBalanceLimit } from '@/lib/security'

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
        { success: false, message: 'ID utilisateur et montant positif requis' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    if (user.tempBlocked) {
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' })
    }

    const isFC = currency === 'FC'
    const cur = isFC ? 'FC' : (currency || 'USD')

    // Check child balance limit
    const limitCheck = await checkChildBalanceLimit(userId, amount, cur)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: limitCheck.message },
        { status: 400 }
      )
    }

    // Create deposit
    const deposit = await db.deposit.create({
      data: {
        userId,
        amount,
        currency: cur,
        method: method || 'mobile_money',
        status: 'completed',
      },
    })

    // Add amount to correct balance based on currency
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { increment: amount } }
        : { realBalance: { increment: amount } },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Dépôt effectué',
        message: `Votre dépôt de ${amount.toFixed(2)} ${cur} via ${method || 'mobile money'} a été effectué.`,
        type: 'general',
      },
    })

    // Return updated balances
    const updatedUser = await db.user.findUnique({ where: { id: userId } })

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
      updatedBalances: updatedUser ? {
        realBalance: updatedUser.realBalance,
        realBalanceFC: updatedUser.realBalanceFC,
        bonusBalance: updatedUser.bonusBalance,
        bonusBalanceFC: updatedUser.bonusBalanceFC,
      } : undefined,
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
