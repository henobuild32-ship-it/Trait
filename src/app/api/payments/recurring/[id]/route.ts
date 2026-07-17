import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.recurringPayment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Paiement récurrent introuvable' }, { status: 404 })
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { amount, frequency, status, nextRun } = body

    const data: any = {}
    if (amount !== undefined) data.amount = parseFloat(amount)
    if (frequency !== undefined) data.frequency = frequency
    if (status !== undefined) data.status = status
    if (nextRun !== undefined) {
      const nextRunDate = new Date(nextRun)
      if (nextRunDate <= new Date()) {
        return NextResponse.json({ success: false, message: 'La prochaine exécution doit être dans le futur' }, { status: 400 })
      }
      data.nextRun = nextRunDate
    }

    const updated = await prisma.recurringPayment.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, payment: updated })
  } catch (error) {
    console.error('Recurring payment PUT error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.recurringPayment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Paiement récurrent introuvable' }, { status: 404 })
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.recurringPayment.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ success: true, message: 'Paiement récurrent annulé', payment: updated })
  } catch (error) {
    console.error('Recurring payment DELETE error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
