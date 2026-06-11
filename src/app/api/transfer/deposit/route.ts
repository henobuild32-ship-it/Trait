import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkChildBalanceLimit } from '@/lib/security'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { amount, currency, method } = body as {
      amount: number
      currency: string
      method: string
    }

    const userId = auth.userId

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Montant positif requis' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ success: false, message: 'Votre compte est temporairement bloqué.' }, { status: 403 })
    }

    const isFC = currency === 'FC'
    const cur = isFC ? 'FC' : (currency || 'USD')

    const limitCheck = await checkChildBalanceLimit(userId, amount, cur)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: limitCheck.message },
        { status: 400 }
      )
    }

    // Atomic: create deposit + update balance + notification
    const [deposit] = await db.$transaction([
      db.deposit.create({
        data: {
          userId,
          amount,
          currency: cur,
          method: method || 'mobile_money',
          status: 'completed',
        },
      }),
      db.user.update({
        where: { id: userId },
        data: isFC
          ? { realBalanceFC: { increment: amount } }
          : { realBalance: { increment: amount } },
      }),
      db.notification.create({
        data: {
          userId,
          title: 'Dépôt effectué',
          message: `Votre dépôt de ${amount.toFixed(2)} ${cur} via ${method || 'mobile money'} a été effectué.`,
          type: 'general',
        },
      }),
    ])

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: { realBalance: true, realBalanceFC: true, bonusBalance: true, bonusBalanceFC: true },
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
      updatedBalances: updatedUser,
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
