'use client';

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unavailable';

export function useCameraPermission() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (typeof window === 'undefined') return 'denied';

    if (Capacitor.isNativePlatform()) {
      try {
        const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
        const { camera } = await BarcodeScanner.checkPermissions();
        setPermissionStatus(camera as PermissionStatus);
        return camera as PermissionStatus;
      } catch {
        // fallback
      }
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const status = result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
      setPermissionStatus(status);
      return status;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach(t => t.stop());
        setPermissionStatus('granted');
        return 'granted';
      } catch {
        setPermissionStatus('denied');
        return 'denied';
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    setPermissionLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
          const { camera } = await BarcodeScanner.requestPermissions();
          setPermissionStatus(camera as PermissionStatus);
          setPermissionLoading(false);
          return camera as PermissionStatus;
        } catch {
          // fallback to getUserMedia
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
      setPermissionStatus('granted');
      setPermissionLoading(false);
      return 'granted';
    } catch (err: any) {
      const status = (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') ? 'denied' : 'prompt';
      setPermissionStatus(status);
      setPermissionLoading(false);
      return status;
    }
  }, []);

  return { permissionStatus, permissionLoading, checkPermission, requestPermission };
}
