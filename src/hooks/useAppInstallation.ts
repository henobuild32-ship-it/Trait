'use client'

export function useAppInstallation() {
  if (typeof window === 'undefined') {
    return { isPWA: false, isAPK: false, isNativeApp: false, isInstalled: false }
  }

  const isPWA = window.matchMedia('(display-mode: standalone)').matches
  const isAPK = typeof (window as any).Capacitor !== 'undefined'
  const isNativeApp = isPWA || isAPK

  return { isPWA, isAPK, isNativeApp, isInstalled: isNativeApp }
}
