import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sendPushToAll } from '@/lib/push'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { title, message, url } = body as {
      title: string
      message: string
      url?: string
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Titre et message requis' },
        { status: 400 }
      )
    }

    // Send push to all subscribed devices
    const pushResult = await sendPushToAll({
      title,
      body: message,
      url: url || '/',
      tag: 'admin-broadcast',
    })

    // Also create in-app notifications for all users
    const users = await db.user.findMany({
      select: { id: true },
      where: { role: 'client' },
    })

    await db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type: 'announcement',
      })),
    })

    return NextResponse.json({
      success: true,
      message: 'Notification envoyée',
      push: pushResult,
      inAppNotifications: users.length,
    })
  } catch (error) {
    console.error('Broadcast push error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
