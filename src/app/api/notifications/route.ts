import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET: Get notifications for user
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    if (auth.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      )
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const { notificationId } = body as { notificationId: string }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      )
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    try {
      const { getIO } = require('@/lib/realtime-server')
      const io = getIO()
      if (io) io.to(`user:${auth.userId}`).emit('notification_read', { id: notificationId })
    } catch {}

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    })
  } catch (error) {
    console.error('Mark notification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
