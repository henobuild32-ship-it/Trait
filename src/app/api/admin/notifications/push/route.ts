import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { broadcastNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { title, message, url, roleFilter } = body as {
      title: string
      message: string
      url?: string
      roleFilter?: string
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Titre et message requis' },
        { status: 400 }
      )
    }

    const result = await broadcastNotification(title, message, 'announcement', true, roleFilter)

    return NextResponse.json({
      success: true,
      message: 'Notification envoyée',
      count: result.count,
    })
  } catch (error) {
    console.error('Broadcast push error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
