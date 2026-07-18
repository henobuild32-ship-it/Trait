import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const billerToType: Record<string, string> = {
  snel: 'electricity',
  regideso: 'water',
  internet: 'internet',
  ecole: 'subscription',
}

const typeLabels: Record<string, string> = {
  electricity: 'SNEL (Électricité)',
  water: 'REGIDESO (Eau)',
  internet: 'Internet',
  subscription: 'École / Frais scolaires',
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { billerId, fields, amount, currency } = body

    if (!billerId || !amount || amount <= 0 || !fields) {
      return NextResponse.json({ success: false, message: 'Tous les champs requis ne sont pas fournis' }, { status: 400 })
    }

    const billType = billerToType[billerId] || 'other'
    const reference = (fields.contractNumber || fields.studentId || fields.meterNumber || 'REF-' + Math.random().toString(36).substring(7).toUpperCase()).trim()

    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const isFC = currency === 'FC'
    const balanceField = isFC ? 'realBalanceFC' : 'realBalance'
    const userBalance = isFC ? user.realBalanceFC : user.realBalance

    if (userBalance < amount) {
      return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement user balance
      await tx.user.update({
        where: { id: auth.userId },
        data: {
          [balanceField]: { decrement: amount },
        },
      })

      // 2. Create bill payment record
      const billPayment = await tx.billPayment.create({
        data: {
          userId: auth.userId,
          billType,
          reference,
          amount: parseFloat(amount),
          currency: currency || 'USD',
          status: 'completed',
        },
      })

      // 3. Create transaction record
      await tx.transaction.create({
        data: {
          type: 'bill_payment',
          amount: parseFloat(amount),
          fee: 0,
          currency: currency || 'USD',
          status: 'completed',
          senderId: auth.userId,
          receiverId: auth.userId, // paid to utility
          description: `Paiement facture ${typeLabels[billType] || billType} (Réf: ${reference})`,
        },
      })

      // 4. Create notification record
      await tx.notification.create({
        data: {
          userId: auth.userId,
          title: 'Paiement de facture',
          message: `Vous avez payé ${amount.toFixed(2)} ${currency} pour ${typeLabels[billType] || billType} (Réf: ${reference})`,
          type: 'purchase',
        },
      })

      return billPayment
    })

    return NextResponse.json({
      success: true,
      reference: result.reference,
      billPayment: result,
    }, { status: 201 })
  } catch (error) {
    console.error('Bills payment POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
