import { db } from '@/lib/db'
import webpush from 'web-push'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const privateKey = process.env.VAPID_PRIVATE_KEY || ''
const subject = process.env.VAPID_SUBJECT || 'mailto:trait137@gmail.com'

webpush.setVapidDetails(subject, publicKey, privateKey)

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body?: string; icon?: string; badge?: string; data?: Record<string, unknown> }
): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      { TTL: 86400 }
    )
  } catch (error: any) {
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      await db.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {})
      return
    }
    console.error('Web push error:', error)
    throw error
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body?: string
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await db.pushSubscription.findMany({ where: { userId } })
  let sent = 0, failed = 0
  for (const sub of subscriptions) {
    try {
      await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, { title, body })
      sent++
    } catch { failed++ }
  }
  return { sent, failed }
}
