'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushSubscription() {
  const { user } = useAppStore()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })

    setPermission(Notification.permission)
  }, [user])

  const subscribe = useCallback(async () => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return false

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result !== 'granted') return false

    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return false

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }

      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      })

      setIsSubscribed(true)
      return true
    } catch (error) {
      console.error('Push subscribe error:', error)
      return false
    }
  }, [user])

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/notifications/push', { method: 'DELETE' })
      }
      setIsSubscribed(false)
    } catch (error) {
      console.error('Push unsubscribe error:', error)
    }
  }, [])

  return { isSubscribed, permission, subscribe, unsubscribe }
}
