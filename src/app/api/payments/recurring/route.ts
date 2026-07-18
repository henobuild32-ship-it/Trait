import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const payments = await prisma.recurringPayment.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, payments })
  } catch (error) {
    console.error('Recurring payments GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientPhone, amount, currency, frequency, description, nextRun } = body

    if (!recipientPhone || !amount || !nextRun) {
      return NextResponse.json({ success: false, message: 'Téléphone destinataire, montant et prochaine exécution requis' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 })
    }

    const nextRunDate = new Date(nextRun)
    if (nextRunDate <= new Date()) {
      return NextResponse.json({ success: false, message: 'La prochaine exécution doit être dans le futur' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({ where: { phone: recipientPhone } })
    if (!recipient) {
      return NextResponse.json({ success: false, message: 'Destinataire non trouvé' }, { status: 404 })
    }

    const recurring = await prisma.recurringPayment.create({
      data: {
        userId: auth.userId,
        recipientId: recipient.id,
        amount: parseFloat(amount),
        currency: currency || 'FC',
        frequency: frequency || 'monthly',
        description: description || null,
        nextRun: nextRunDate,
      },
    })

    return NextResponse.json({ success: true, payment: recurring }, { status: 201 })
  } catch (error) {
    console.error('Recurring payments POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
