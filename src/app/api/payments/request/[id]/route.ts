import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Action invalide. Utilisez "accept" ou "reject"' }, { status: 400 })
    }

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { requester: true },
    })

    if (!paymentRequest) {
      return NextResponse.json({ success: false, message: 'Demande de paiement introuvable' }, { status: 404 })
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Cette demande a déjà été traitée' }, { status: 400 })
    }

    if (paymentRequest.targetPhone !== auth.phone) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
    }

    if (action === 'reject') {
      await prisma.paymentRequest.update({
        where: { id },
        data: { status: 'rejected' },
      })

      return NextResponse.json({ success: true, message: 'Demande rejetée' })
    }

    const isFC = paymentRequest.currency === 'FC'
    const balanceField = isFC ? 'realBalanceFC' : 'realBalance'

    const payer = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!payer) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const payerBalance = isFC ? payer.realBalanceFC : payer.realBalance
    if (payerBalance < paymentRequest.amount) {
      return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
    }

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: 'payment_request',
          amount: paymentRequest.amount,
          fee: 0,
          currency: paymentRequest.currency,
          status: 'completed',
          senderId: auth.userId,
          receiverId: paymentRequest.requesterId,
          description: paymentRequest.description || `Paiement de demande à ${paymentRequest.requester.phone}`,
        },
      }),
      prisma.user.update({
        where: { id: auth.userId },
        data: { [balanceField]: { decrement: paymentRequest.amount } },
      }),
      prisma.user.update({
        where: { id: paymentRequest.requesterId },
        data: { [balanceField]: { increment: paymentRequest.amount } },
      }),
      prisma.paymentRequest.update({
        where: { id },
        data: { status: 'completed' },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Demande acceptée et payée',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error('Payment request action error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
