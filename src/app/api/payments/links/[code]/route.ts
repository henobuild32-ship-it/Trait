import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const link = await prisma.paymentLink.findUnique({
      where: { code },
      include: { user: { select: { id: true, name: true, pseudo: true } } },
    })

    if (!link) {
      return NextResponse.json({ success: false, message: 'Lien de paiement introuvable' }, { status: 404 })
    }

    if (link.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Ce lien de paiement n\'est plus actif' }, { status: 404 })
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json({ success: false, message: 'Ce lien de paiement a expiré' }, { status: 404 })
    }

    if (link.maxUses > 0 && link.useCount >= link.maxUses) {
      return NextResponse.json({ success: false, message: 'Ce lien de paiement a atteint le nombre maximal d\'utilisations' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      link: {
        amount: link.amount,
        currency: link.currency,
        description: link.description,
        status: link.status,
        owner: link.user,
      },
    })
  } catch (error) {
    console.error('Payment link GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const { code } = await params

    const link = await prisma.paymentLink.findUnique({
      where: { code },
    })

    if (!link) {
      return NextResponse.json({ success: false, message: 'Lien de paiement introuvable' }, { status: 404 })
    }

    if (link.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Ce lien de paiement n\'est plus actif' }, { status: 400 })
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: 'expired' },
      })
      return NextResponse.json({ success: false, message: 'Ce lien de paiement a expiré' }, { status: 400 })
    }

    if (link.maxUses > 0 && link.useCount >= link.maxUses) {
      return NextResponse.json({ success: false, message: 'Ce lien de paiement a atteint le nombre maximal d\'utilisations' }, { status: 400 })
    }

    if (link.userId === auth.id) {
      return NextResponse.json({ success: false, message: 'Vous ne pouvez pas payer votre propre lien' }, { status: 400 })
    }

    const isFC = link.currency === 'FC'
    const balanceField = isFC ? 'realBalanceFC' : 'realBalance'

    const payer = await prisma.user.findUnique({ where: { id: auth.id } })
    if (!payer) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const payerBalance = isFC ? payer.realBalanceFC : payer.realBalance
    if (payerBalance < link.amount) {
      return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
    }

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: 'payment_link',
          amount: link.amount,
          fee: 0,
          currency: link.currency,
          status: 'completed',
          senderId: auth.id,
          receiverId: link.userId,
          description: `Paiement via lien ${link.code}`,
        },
      }),
      prisma.user.update({
        where: { id: auth.id },
        data: { [balanceField]: { decrement: link.amount } },
      }),
      prisma.user.update({
        where: { id: link.userId },
        data: { [balanceField]: { increment: link.amount } },
      }),
      prisma.paymentLink.update({
        where: { id: link.id },
        data: { useCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error('Payment link POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
