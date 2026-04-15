import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, buyerId } = body as {
      productId: string
      buyerId: string
    }

    if (!productId || !buyerId) {
      return NextResponse.json(
        { success: false, message: 'Product ID and buyer ID are required' },
        { status: 400 }
      )
    }

    // Get product
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

    // Get buyer
    const buyer = await db.user.findUnique({
      where: { id: buyerId },
    })

    if (!buyer) {
      return NextResponse.json(
        { success: false, message: 'Buyer not found' },
        { status: 404 }
      )
    }

    // Cannot buy own product
    if (product.sellerId === buyerId) {
      return NextResponse.json(
        { success: false, message: 'You cannot purchase your own product' },
        { status: 400 }
      )
    }

    const price = product.price

    // Use bonus balance first, then real balance
    let remaining = price
    let usedBonus = 0
    let usedReal = 0

    if (buyer.bonusBalance > 0) {
      usedBonus = Math.min(buyer.bonusBalance, remaining)
      remaining -= usedBonus
    }
    usedReal = remaining

    // Validate sufficient total balance
    const totalBalance = buyer.bonusBalance + buyer.realBalance
    if (totalBalance < price) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. You need $${price.toFixed(2)} but have $${totalBalance.toFixed(2)}.`,
        },
        { status: 400 }
      )
    }

    // Create purchase record
    const purchase = await db.purchase.create({
      data: {
        productId,
        buyerId,
        amount: price,
        usedBonus,
        usedReal,
        status: 'completed',
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true, pseudo: true } },
      },
    })

    // Deduct from buyer
    await db.user.update({
      where: { id: buyerId },
      data: {
        bonusBalance: Math.max(0, buyer.bonusBalance - usedBonus),
        realBalance: Math.max(0, buyer.realBalance - usedReal),
      },
    })

    // Add to seller's realBalance
    await db.user.update({
      where: { id: product.sellerId },
      data: {
        realBalance: { increment: price },
      },
    })

    // Notify seller
    await db.notification.create({
      data: {
        userId: product.sellerId,
        title: 'New Purchase',
        message: `${buyer.name || buyer.pseudo || 'Someone'} purchased "${product.name}" for $${price.toFixed(2)}`,
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
