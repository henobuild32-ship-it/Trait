import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let requests
    if (role === 'sent') {
      requests = await prisma.paymentRequest.findMany({
        where: { requesterId: auth.id },
        orderBy: { createdAt: 'desc' },
      })
    } else if (role === 'received') {
      requests = await prisma.paymentRequest.findMany({
        where: { targetPhone: auth.phone },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      const sent = await prisma.paymentRequest.findMany({
        where: { requesterId: auth.id },
        orderBy: { createdAt: 'desc' },
      })
      const received = await prisma.paymentRequest.findMany({
        where: { targetPhone: auth.phone },
        orderBy: { createdAt: 'desc' },
      })
      const map = new Map()
      for (const r of sent) map.set(r.id, { ...r, direction: 'sent' })
      for (const r of received) map.set(r.id, { ...r, direction: 'received' })
      requests = Array.from(map.values()).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return NextResponse.json({ success: true, requests })
  } catch (error) {
    console.error('Payment requests GET error:', error)
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
    const { targetPhone, amount, currency, description } = body

    if (!targetPhone || !amount) {
      return NextResponse.json({ success: false, message: 'Téléphone et montant requis' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { phone: targetPhone } })
    if (!target) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        requesterId: auth.id,
        targetId: target.id,
        targetPhone,
        amount: parseFloat(amount),
        currency: currency || 'FC',
        description: description || null,
      },
    })

    return NextResponse.json({ success: true, request: paymentRequest }, { status: 201 })
  } catch (error) {
    console.error('Payment requests POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
