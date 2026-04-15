import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereClause: Record<string, unknown> = { active: true }
    if (category && category.trim() !== '') {
      whereClause.category = category.trim()
    }

    const products = await db.marketplaceProduct.findMany({
      where: whereClause,
      include: {
        seller: {
          select: { id: true, name: true, pseudo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: p.imageUrl,
        active: p.active,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        seller: p.seller,
      })),
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
