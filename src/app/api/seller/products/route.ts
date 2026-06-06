import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sellerId = searchParams.get('sellerId')

    if (!sellerId) {
      return NextResponse.json({ success: false, message: 'Vendeur non spécifié' }, { status: 400 })
    }

    const products = await db.marketplaceProduct.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Get seller products error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sellerId, name, description, price, currency, category, imageUrl } = body

    if (!sellerId || !name || !description || price === undefined || !category) {
      return NextResponse.json({ success: false, message: 'Champs requis manquants' }, { status: 400 })
    }

    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (!seller || seller.role !== 'seller' || seller.validationStatus !== 'validated') {
      return NextResponse.json({ success: false, message: 'Vendeur non autorisé ou non validé' }, { status: 403 })
    }

    const product = await db.marketplaceProduct.create({
      data: {
        sellerId,
        name,
        description,
        price: parseFloat(price),
        currency: currency || 'USD',
        category,
        imageUrl: imageUrl || null,
        active: true,
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Create seller product error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const sellerId = searchParams.get('sellerId')

    if (!productId || !sellerId) {
      return NextResponse.json({ success: false, message: 'Paramètres manquants' }, { status: 400 })
    }

    const product = await db.marketplaceProduct.findUnique({ where: { id: productId } })
    if (!product || product.sellerId !== sellerId) {
      return NextResponse.json({ success: false, message: 'Produit introuvable ou non autorisé' }, { status: 404 })
    }

    await db.marketplaceProduct.delete({ where: { id: productId } })

    return NextResponse.json({ success: true, message: 'Produit supprimé' })
  } catch (error) {
    console.error('Delete seller product error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
