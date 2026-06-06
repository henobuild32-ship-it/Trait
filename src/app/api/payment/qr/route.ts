import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sellerId, qrCode, amount, currency } = body

    if (!sellerId || !qrCode || !amount) {
      return NextResponse.json({ success: false, message: 'Champs requis manquants' }, { status: 400 })
    }

    const payAmount = parseFloat(amount)
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 })
    }

    // Verify Seller
    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (!seller || seller.role !== 'seller' || seller.validationStatus !== 'validated') {
      return NextResponse.json({ success: false, message: 'Vendeur non autorisé' }, { status: 403 })
    }

    // Verify Client via QR Code
    const traitCard = await db.traitCard.findFirst({
      where: { qrCode, status: 'active' },
      include: { user: true }
    })

    if (!traitCard || !traitCard.user) {
      return NextResponse.json({ success: false, message: 'Carte invalide' }, { status: 400 })
    }

    const client = traitCard.user
    
    // Prevent self-payment
    if (client.id === seller.id) {
      return NextResponse.json({ success: false, message: 'Vous ne pouvez pas payer vous-même' }, { status: 400 })
    }

    const isUSD = (currency || 'USD') === 'USD'

    // Check Balance
    if (isUSD) {
      if (client.realBalance < payAmount) {
        return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
      }
    } else {
      if (client.realBalanceFC < payAmount) {
        return NextResponse.json({ success: false, message: 'Solde insuffisant' }, { status: 400 })
      }
    }

    // Process Payment
    await db.$transaction(async (tx) => {
      // Deduct from client
      await tx.user.update({
        where: { id: client.id },
        data: isUSD ? { realBalance: { decrement: payAmount } } : { realBalanceFC: { decrement: payAmount } }
      })

      // Credit to seller
      await tx.user.update({
        where: { id: seller.id },
        data: isUSD ? { realBalance: { increment: payAmount } } : { realBalanceFC: { increment: payAmount } }
      })

      // Record Transaction
      await tx.transaction.create({
        data: {
          type: 'qr_payment',
          amount: payAmount,
          currency: currency || 'USD',
          status: 'completed',
          senderId: client.id,
          receiverId: seller.id,
          description: `Paiement QR chez ${seller.businessName || 'Vendeur'}`,
        }
      })
    })

    return NextResponse.json({ success: true, message: 'Paiement réussi' })
  } catch (error) {
    console.error('QR Payment error:', error)
    return NextResponse.json({ success: false, message: 'Erreur lors du paiement' }, { status: 500 })
  }
}
