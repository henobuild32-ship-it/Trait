import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const SMALL_LOAN_THRESHOLD = 50000
const DEFAULT_INTEREST_RATE = 0.05

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const credits = await prisma.microCredit.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, credits })
  } catch (error) {
    console.error('Microcredit GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: auth.id } })
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (user.kycStatus !== 'verified') {
      return NextResponse.json({ success: false, message: 'Votre compte doit être vérifié (KYC) pour demander un micro-crédit' }, { status: 403 })
    }

    const body = await request.json()
    const { amount, currency, duration } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 })
    }

    const totalDue = parseFloat(amount) * (1 + DEFAULT_INTEREST_RATE)
    const isSmallLoan = parseFloat(amount) <= SMALL_LOAN_THRESHOLD

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (parseInt(duration) || 30))

    const credit = await prisma.microCredit.create({
      data: {
        userId: auth.id,
        amount: parseFloat(amount),
        currency: currency || 'FC',
        interestRate: DEFAULT_INTEREST_RATE,
        totalDue: Math.round(totalDue * 100) / 100,
        duration: duration || '30',
        dueDate,
        status: isSmallLoan ? 'approved' : 'pending',
        approvedAt: isSmallLoan ? new Date() : null,
        approvedBy: isSmallLoan ? 'system' : null,
      },
    })

    if (isSmallLoan) {
      const balanceField = credit.currency === 'FC' ? 'realBalanceFC' : 'realBalance'
      await prisma.user.update({
        where: { id: auth.id },
        data: { [balanceField]: { increment: credit.amount } },
      })
    }

    return NextResponse.json({
      success: true,
      credit,
      message: isSmallLoan
        ? 'Micro-crédit approuvé et déposé sur votre compte'
        : 'Demande de micro-crédit soumise pour approbation',
    }, { status: 201 })
  } catch (error) {
    console.error('Microcredit POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
