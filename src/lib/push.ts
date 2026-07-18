import webpush from 'web-push'
import { db } from '@/lib/db'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:trait@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    })

    if (!subscriptions.length) return

    const data = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/trait-logo.png',
      badge: '/trait-logo.png',
      url: payload.url || '/',
    })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        )
      )
    )

    // Clean up expired subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        const err = result.reason as any
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          // Subscription expired or invalid — delete it
          await db.pushSubscription.deleteMany({
            where: { endpoint: subscriptions[i].endpoint },
          })
        }
      }
    }
  } catch (error) {
    console.error('sendPushToUser error:', error)
  }
}

export async function sendPushToMany(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)))
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  try {
    const subscriptions = await db.pushSubscription.findMany()
    if (!subscriptions.length) return

    const data = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/trait-logo.png',
      badge: '/trait-logo.png',
      url: payload.url || '/',
    })

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        ).catch(() => {})
      )
    )
  } catch (error) {
    console.error('sendPushToAll error:', error)
  }
}
