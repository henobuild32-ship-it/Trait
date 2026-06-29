import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET: List all active barter offers
export async function GET() {
  try {
    const offers = await db.barterOffer.findMany({
      where: { status: 'active' },
      include: {
        user: {
          select: { id: true, name: true, pseudo: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      offers: offers.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        category: o.category,
        offeredBy: o.offeredBy,
        wantedItem: o.wantedItem,
        images: o.images,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        user: o.user,
      })),
    })
  } catch (error) {
    console.error('Get barter offers error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new barter offer
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const { title, description, category, offeredBy, wantedItem } = body as {
      title: string
      description: string
      category: string
      offeredBy: string
      wantedItem?: string
    }

    if (!title || !description || !category || !offeredBy) {
      return NextResponse.json(
        { success: false, message: 'Title, description, category, and offeredBy are required' },
        { status: 400 }
      )
    }

    if (auth.userId !== offeredBy) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: offeredBy },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const offer = await db.barterOffer.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        offeredBy,
        wantedItem: wantedItem?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        category: offer.category,
        offeredBy: offer.offeredBy,
        wantedItem: offer.wantedItem,
        images: offer.images,
        status: offer.status,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      },
    })
  } catch (error) {
    console.error('Create barter offer error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
