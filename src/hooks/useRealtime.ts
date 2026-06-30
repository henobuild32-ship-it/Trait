'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/lib/store'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ''

export function useRealtime() {
  const socketRef = useRef<Socket | null>(null)
  const { user, setNotifications, notifications } = useAppStore()

  useEffect(() => {
    if (!user?.id) return

    const socketUrl = SOCKET_URL || window.location.origin
    const socket = io(socketUrl, {
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {})

    socket.on('new_notification', (data: any) => {
      setNotifications([data, ...notifications])
    })

    socket.on('notification_read', (data: { id: string }) => {
      setNotifications(
        notifications.map((n) => (n.id === data.id ? { ...n, read: true } : n))
      )
    })

    socket.on('balance_update', (data: { realBalance?: number; realBalanceFC?: number }) => {
      if (data.realBalance !== undefined || data.realBalanceFC !== undefined) {
        useAppStore.getState().setUser({
          ...useAppStore.getState().user!,
          ...(data.realBalance !== undefined ? { realBalance: data.realBalance } : {}),
          ...(data.realBalanceFC !== undefined ? { realBalanceFC: data.realBalanceFC } : {}),
        })
      }
    })

    socket.on('new_message', () => {
      // Trigger messages refresh
      window.dispatchEvent(new CustomEvent('new-message'))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id])

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  return { emit }
}
