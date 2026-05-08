import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, buyerId, useBonus, useReal } = body as {
      productId: string
      buyerId: string
      useBonus?: boolean
      useReal?: boolean
    }

    if (!productId || !buyerId) {
      return NextResponse.json(
        { success: false, message: 'Product ID and buyer ID are required' },
        { status: 400 }
      )
    }

    // Defaults: if neither specified, use real balance only (backward compat)
    const willUseBonus = useBonus === true
    const willUseReal = useReal !== false // default true unless explicitly false

    // ─── Get product ─────────────────────────────────────────────────
    const product = await db.marketplaceProduct.findUnique({
      where: { id: productId },
      include: { seller: true },
    })

    if (!product || !product.active) {
      return NextResponse.json(
        { success: false, message: 'Product not found or unavailable' },
        { status: 404 }
      )
    }

    // ─── Get buyer ───────────────────────────────────────────────────
    const buyer = await db.user.findUnique({
      where: { id: buyerId },
    })

    if (!buyer) {
      return NextResponse.json(
        { success: false, message: 'Buyer not found' },
        { status: 404 }
      )
    }

    // ─── Cannot buy own product ──────────────────────────────────────
    if (product.sellerId === buyerId) {
      return NextResponse.json(
        { success: false, message: 'You cannot purchase your own product' },
        { status: 400 }
      )
    }

    // ─── Determine currency ──────────────────────────────────────────
    const currency = product.currency || 'USD'
    const isFC = currency === 'FC'

    // ─── Determine effective price ───────────────────────────────────
    const effectivePrice = willUseBonus && product.bonusPrice !== null && product.bonusPrice !== undefined
      ? product.bonusPrice
      : product.price

    // ─── Validate bonus-related rules ────────────────────────────────

    // Rule: If product is bonusOnly and user is NOT using bonus, reject
    if (product.bonusOnly && !willUseBonus) {
      return NextResponse.json(
        { success: false, message: 'This product can only be purchased with bonus balance' },
        { status: 400 }
      )
    }

    // Rule: If user wants to use bonus, check bonus is enabled on product
    if (willUseBonus && !product.bonusEnabled) {
      return NextResponse.json(
        { success: false, message: 'Bonus payment is not enabled for this product' },
        { status: 400 }
      )
    }

    // Rule: Check buyer is not bonus-blocked
    if (willUseBonus && buyer.bonusBlocked) {
      return NextResponse.json(
        { success: false, message: `Your bonus usage has been blocked. Reason: ${buyer.bonusBlockedReason || 'Contact support'}` },
        { status: 403 }
      )
    }

    // Rule: Check bonus expiry
    if (willUseBonus && product.bonusExpiryAt && new Date() > new Date(product.bonusExpiryAt)) {
      return NextResponse.json(
        { success: false, message: 'Bonus purchase period for this product has expired' },
        { status: 400 }
      )
    }

    // Rule: Check bonusMaxQty per user
    if (willUseBonus && product.bonusMaxQty !== null) {
      const existingBonusPurchases = await db.purchase.count({
        where: {
          productId,
          buyerId,
          usedBonus: { gt: 0 },
        },
      })

      if (existingBonusPurchases >= product.bonusMaxQty) {
        return NextResponse.json(
          { success: false, message: `You have reached the maximum limit of ${product.bonusMaxQty} bonus purchases for this product` },
          { status: 400 }
        )
      }
    }

    // ─── Calculate payment split ─────────────────────────────────────
    let usedBonus = 0
    let usedReal = 0

    if (willUseBonus && !willUseReal) {
      // Pure bonus payment
      const bonusBalance = isFC ? buyer.bonusBalanceFC : buyer.bonusBalance
      if (bonusBalance < effectivePrice) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient bonus balance. You need ${effectivePrice.toFixed(2)} ${currency} but have ${bonusBalance.toFixed(2)} ${currency}.`,
          },
          { status: 400 }
        )
      }
      usedBonus = effectivePrice
      usedReal = 0
    } else if (willUseBonus && willUseReal) {
      // Mixed payment: use bonus first, then real
      const bonusBalance = isFC ? buyer.bonusBalanceFC : buyer.bonusBalance
      const realBalance = isFC ? buyer.realBalanceFC : buyer.realBalance

      usedBonus = Math.min(bonusBalance, effectivePrice)
      usedReal = effectivePrice - usedBonus

      if (realBalance < usedReal) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient balance. Bonus covers ${usedBonus.toFixed(2)} ${currency}, but you need ${usedReal.toFixed(2)} ${currency} more in real balance (you have ${realBalance.toFixed(2)} ${currency}).`,
          },
          { status: 400 }
        )
      }
    } else {
      // Pure real payment
      const realBalance = isFC ? buyer.realBalanceFC : buyer.realBalance
      if (realBalance < effectivePrice) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient real balance. You need ${effectivePrice.toFixed(2)} ${currency} but have ${realBalance.toFixed(2)} ${currency}.`,
          },
          { status: 400 }
        )
      }
      usedBonus = 0
      usedReal = effectivePrice
    }

    // ─── Create purchase record ──────────────────────────────────────
    const purchase = await db.purchase.create({
      data: {
        productId,
        buyerId,
        amount: effectivePrice,
        usedBonus,
        usedReal,
        status: 'completed',
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true, pseudo: true } },
      },
    })

    // ─── Deduct from buyer ───────────────────────────────────────────
    if (usedBonus > 0 && usedReal > 0) {
      // Mixed: deduct both
      const bonusField = isFC ? 'bonusBalanceFC' : 'bonusBalance'
      const realField = isFC ? 'realBalanceFC' : 'realBalance'
      await db.user.update({
        where: { id: buyerId },
        data: {
          [bonusField]: { decrement: usedBonus },
          [realField]: { decrement: usedReal },
        },
      })
    } else if (usedBonus > 0) {
      // Pure bonus
      const bonusField = isFC ? 'bonusBalanceFC' : 'bonusBalance'
      await db.user.update({
        where: { id: buyerId },
        data: { [bonusField]: { decrement: usedBonus } },
      })
    } else {
      // Pure real
      const realField = isFC ? 'realBalanceFC' : 'realBalance'
      await db.user.update({
        where: { id: buyerId },
        data: { [realField]: { decrement: usedReal } },
      })
    }

    // ─── Credit seller with real balance ─────────────────────────────
    // The seller always receives real balance, regardless of buyer's payment method
    // (The system absorbs the bonus cost)
    const sellerRealField = isFC ? 'realBalanceFC' : 'realBalance'
    await db.user.update({
      where: { id: product.sellerId },
      data: {
        [sellerRealField]: { increment: effectivePrice },
      },
    })

    // ─── Record bonus history if bonus was used ──────────────────────
    if (usedBonus > 0) {
      await db.bonusHistory.create({
        data: {
          userId: buyerId,
          type: 'purchase',
          amount: -usedBonus, // Negative because bonus was consumed
          currency,
          description: `Purchased "${product.name}" using bonus balance`,
          metadata: JSON.stringify({
            productId: product.id,
            productName: product.name,
            purchaseId: purchase.id,
            bonusUsed: usedBonus,
            realUsed: usedReal,
            totalPrice: effectivePrice,
          }),
        },
      })
    }

    // ─── Notify seller ───────────────────────────────────────────────
    await db.notification.create({
      data: {
        userId: product.sellerId,
        title: 'New Purchase',
        message: `${buyer.name || buyer.pseudo || 'Someone'} purchased "${product.name}" for ${effectivePrice.toFixed(2)} ${currency}${usedBonus > 0 ? ' (bonus payment)' : ''}`,
        type: 'purchase',
      },
    })

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        productId: purchase.productId,
        buyerId: purchase.buyerId,
        amount: purchase.amount,
        usedBonus: purchase.usedBonus,
        usedReal: purchase.usedReal,
        currency,
        status: purchase.status,
        createdAt: purchase.createdAt,
      },
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
