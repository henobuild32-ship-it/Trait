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
    const realBal = isFC ? user.realBalanceFC : user.realBalance

    // Calculate fee: 0.7%
    const fee = Math.round(amount * 0.007 * 100) / 100
    const totalDeduction = amount + fee

    if (realBal < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          message: `Solde insuffisant. Solde: ${realBal.toFixed(2)} ${cur}, Requis: ${totalDeduction.toFixed(2)} ${cur}`,
        },
        { status: 400 }
      )
    }

    // Create withdrawal
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        fee,
        currency: cur,
        method: method || 'mobile_money',
        status: 'completed',
      },
    })

    // Deduct from correct balance based on currency
    await db.user.update({
      where: { id: userId },
      data: isFC
        ? { realBalanceFC: { decrement: totalDeduction } }
        : { realBalance: { decrement: totalDeduction } },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Retrait effectué',
        message: `Votre retrait de ${amount.toFixed(2)} ${cur} (frais: ${fee.toFixed(2)} ${cur}) via ${method || 'mobile money'} a été effectué.`,
        type: 'withdrawal_validated',
      },
    })

    // Return updated balances
    const updatedUser = await db.user.findUnique({ where: { id: userId } })

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
      updatedBalances: updatedUser ? {
        realBalance: updatedUser.realBalance,
        realBalanceFC: updatedUser.realBalanceFC,
        bonusBalance: updatedUser.bonusBalance,
        bonusBalanceFC: updatedUser.bonusBalanceFC,
      } : undefined,
    })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
