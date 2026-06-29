import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAndMigratePin, requireUser } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { QRPaymentSchema, validateRequest } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    // Rate limit: 10 payments per minute per user
    const rateLimit = checkRateLimit({
      windowMs: 60 * 1000,
      maxRequests: 10,
      key: `qr:${auth.userId}`,
    })
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const body = await request.json()
    const validation = validateRequest(QRPaymentSchema, body)
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 })
    }

    const { sellerId, qrCode, amount: payAmount, currency, pin } = validation.data

    // Verify Seller
    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (!seller || seller.role !== 'seller' || seller.validationStatus !== 'validated') {
      return NextResponse.json({ success: false, message: 'Service non autorisé' }, { status: 403 })
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

    const isChild = client.parentId !== null
    if (isChild) {
      if (!pin) {
        return NextResponse.json({
          success: false,
          requirePin: true,
          message: "Le code PIN de l'enfant est obligatoire pour valider cet achat."
        }, { status: 400 })
      }
      const pinOk = await verifyAndMigratePin(client.id, pin, client.pin)
      if (!pinOk) {
        return NextResponse.json({
          success: false,
          message: "Code PIN de l'enfant incorrect."
        }, { status: 400 })
      }
    }
    const fee = isChild ? Math.round(payAmount * 0.007 * 100) / 100 : 0
    const totalDeduction = payAmount + fee

    // Check Balance
    if (isUSD) {
      if (client.realBalance < totalDeduction) {
        return NextResponse.json({ success: false, message: `Solde insuffisant (Requis: ${totalDeduction.toFixed(2)} USD)` }, { status: 400 })
      }
    } else {
      if (client.realBalanceFC < totalDeduction) {
        return NextResponse.json({ success: false, message: `Solde insuffisant (Requis: ${totalDeduction.toFixed(2)} FC)` }, { status: 400 })
      }
    }

    // Process Payment
    await db.$transaction(async (tx) => {
      // Deduct from client (including fee)
      await tx.user.update({
        where: { id: client.id },
        data: isUSD ? { realBalance: { decrement: totalDeduction } } : { realBalanceFC: { decrement: totalDeduction } }
      })

      // Credit to seller (amount only, fee goes to TRAIT)
      await tx.user.update({
        where: { id: seller.id },
        data: isUSD ? { realBalance: { increment: payAmount } } : { realBalanceFC: { increment: payAmount } }
      })

      // Record Transaction
      await tx.transaction.create({
        data: {
          type: 'qr_payment',
          amount: payAmount,
          fee,
          currency: currency || 'USD',
          status: 'completed',
          senderId: client.id,
          receiverId: seller.id,
          description: `Paiement QR chez ${seller.businessName || 'Service'}${isChild ? ` (Commission Enfant: ${fee} ${currency || 'USD'})` : ''}`,
        }
      })
    })

    return NextResponse.json({ success: true, message: 'Paiement réussi' })
  } catch (error) {
    console.error('QR Payment error:', error)
    return NextResponse.json({ success: false, message: 'Erreur lors du paiement' }, { status: 500 })
  }
}
