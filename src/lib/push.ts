import webPush from 'web-push'
import { db } from '@/lib/db'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@trait-app.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        )
        return { success: true }
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } })
        }
        return { success: false, error: error.message }
      }
    })
  )

  return results
}

export async function sendPushToAll(payload: PushPayload) {
  const subscriptions = await db.pushSubscription.findMany()

  let sent = 0
  let failed = 0

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        )
        sent++
        return { success: true }
      } catch (error: any) {
        failed++
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } })
        }
        return { success: false }
      }
    })
  )

  return { total: subscriptions.length, sent, failed }
}
