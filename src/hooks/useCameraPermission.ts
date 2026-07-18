'use client';

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unavailable';

export function useCameraPermission() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (typeof window === 'undefined') return 'denied';

    // Not on Capacitor (regular browser) — use Permissions API
    if (!Capacitor.isNativePlatform()) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const status = result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
        setPermissionStatus(status);
        return status;
      } catch {
        // Permissions API not supported, try getUserMedia
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
    }

    // Capacitor native — use Camera plugin
    try {
      const perm = await Camera.checkPermissions();
      const status = perm.camera;
      setPermissionStatus(status);
      return status;
    } catch {
      setPermissionStatus('unavailable');
      return 'unavailable';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    setPermissionLoading(true);
    try {
      if (!Capacitor.isNativePlatform()) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          stream.getTracks().forEach(t => t.stop());
          setPermissionStatus('granted');
          setPermissionLoading(false);
          return 'granted';
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionStatus('denied');
            setPermissionLoading(false);
            return 'denied';
          }
          setPermissionStatus('prompt');
          setPermissionLoading(false);
          return 'prompt';
        }
      }

      const perm = await Camera.requestPermissions();
      const status = perm.camera;
      setPermissionStatus(status);
      setPermissionLoading(false);
      return status;
    } catch {
      setPermissionStatus('denied');
      setPermissionLoading(false);
      return 'denied';
    }
  }, []);

  return {
    permissionStatus,
    permissionLoading,
    checkPermission,
    requestPermission,
  };
}
