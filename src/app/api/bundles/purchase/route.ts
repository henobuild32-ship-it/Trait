import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, phoneNumber } = body

    if (!productId) {
      return NextResponse.json({ success: false, message: 'ID produit requis' }, { status: 400 })
    }

    const product = await prisma.bundleProduct.findUnique({
      where: { id: productId },
      include: { category: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, message: 'Produit introuvable' }, { status: 404 })
    }

    if (!product.active) {
      return NextResponse.json({ success: false, message: 'Ce produit n\'est plus disponible' }, { status: 400 })
    }

    if ((product.type === 'airtime' || product.type === 'data') && !phoneNumber) {
      return NextResponse.json({ success: false, message: 'Numéro de téléphone requis pour ce type de produit' }, { status: 400 })
    }

    const isFC = product.currency === 'FC'
    const balanceField = isFC ? 'realBalanceFC' : 'realBalance'

    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const userBalance = isFC ? user.realBalanceFC : user.realBalance
    if (userBalance < product.price) {
      return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
    }

    const reference = `BUN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const [purchase] = await prisma.$transaction([
      prisma.bundlePurchase.create({
        data: {
          userId: auth.userId,
          productId: product.id,
          phoneNumber: phoneNumber || null,
          amount: product.price,
          currency: product.currency,
          status: 'completed',
          reference,
        },
      }),
      prisma.user.update({
        where: { id: auth.userId },
        data: { [balanceField]: { decrement: product.price } },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Achat effectué avec succès',
      purchase: {
        id: purchase.id,
        reference: purchase.reference,
        product: product.name,
        amount: product.price,
        currency: product.currency,
        phoneNumber: phoneNumber || null,
        status: purchase.status,
        createdAt: purchase.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Bundle purchase POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
