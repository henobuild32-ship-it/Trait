import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: Mark all notifications as read for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    })
  } catch (error) {
    console.error('Mark all notifications error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
