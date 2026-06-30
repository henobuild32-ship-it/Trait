'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { syncPendingTransactions } from '@/lib/offline-queue'
import { toast } from 'sonner'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = async () => {
      setIsOnline(true)
      setSyncing(true)
      const result = await syncPendingTransactions()
      if (result.synced > 0) {
        toast.success(`${result.synced} transaction(s) synchronisée(s)`)
      }
      setSyncing(false)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator.onLine) {
      syncPendingTransactions().then((r) => {
        if (r.synced > 0) toast.success(`${r.synced} transaction(s) synchronisée(s)`)
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
        <WifiOff className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Vous êtes hors ligne</p>
          <p className="text-xs text-white/80">Les transactions seront synchronisées automatiquement</p>
        </div>
        {syncing && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
      </div>
    </div>
  )
}
