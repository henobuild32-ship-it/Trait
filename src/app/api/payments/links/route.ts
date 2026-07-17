import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { userId: auth.id }
    if (status) where.status = status

    const links = await prisma.paymentLink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, links })
  } catch (error) {
    console.error('Payment links GET error:', error)
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
    const { amount, currency, description, maxUses, expiresAt } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 })
    }

    const code = crypto.randomBytes(4).toString('hex')

    const link = await prisma.paymentLink.create({
      data: {
        userId: auth.id,
        amount: parseFloat(amount),
        currency: currency || 'FC',
        description: description || null,
        code,
        maxUses: maxUses ? parseInt(maxUses) : 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        url: `https://trait-rho.vercel.app/pay/link/${code}`,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Payment links POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
