import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    if (userId) {
      where.userId = userId
    }
    if (type) {
      where.type = type
    }

    // Fetch paginated history with user info
    const [entries, total] = await Promise.all([
      db.bonusHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, pseudo: true, phone: true },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
      }),
      db.bonusHistory.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      entries: entries.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        user: entry.user,
        type: entry.type,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        adminId: entry.adminId,
        campaign: entry.campaign,
        metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
        createdAt: entry.createdAt,
      })),
    })
  } catch (error) {
    console.error('Bonus history error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
