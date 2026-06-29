import { NextRequest, NextResponse } from 'next/server'
import { sendPushToAll } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const title = (body as any)?.title || 'Test TRAIT'
    const message = (body as any)?.message || 'Notifications push fonctionnent !'

    const result = await sendPushToAll({
      title,
      body: message,
      url: '/',
      tag: 'test-push',
    })

    return NextResponse.json({
      success: true,
      message: `Push envoyé: ${result.sent}/${result.total} (${result.failed} échecs)`,
      result,
    })
  } catch (error) {
    console.error('Push test error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
