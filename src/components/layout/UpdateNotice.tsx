'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_VERSION = '/api/app/version';

export function UpdateNotice() {
  const { user, lastSeenVersion, setLastSeenVersion } = useAppStore();
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(API_VERSION);
      const data = await res.json();
      if (data.success) {
        setAppVersion(data.version);
        setChangelog(data.changelog || []);
        setDownloadUrl(data.downloadUrl || null);
        if (lastSeenVersion !== data.version) {
          setShowUpdate(true);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [lastSeenVersion]);

  useEffect(() => {
    if (user) {
      checkVersion();
    }
  }, [user, checkVersion]);

  const handleDismiss = () => {
    if (appVersion) {
      setLastSeenVersion(appVersion);
    }
    setShowUpdate(false);
  };

  const handleInstall = async () => {
    if (!downloadUrl) {
      window.open('/downloads/trait.apk', '_blank');
      return;
    }
    setInstalling(true);
    try {
      const { AppUpdate } = await import('@/plugins/app-update');
      await AppUpdate.downloadAndInstall({ url: downloadUrl });
    } catch {
      const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : window.location.origin + downloadUrl;
      window.open(fullUrl, '_blank');
    } finally {
      setInstalling(false);
      handleDismiss();
    }
  };

  if (loading || !showUpdate || !appVersion) return null;

  return (
    <Dialog open={showUpdate} onOpenChange={() => handleDismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            🚀 Nouvelle version disponible
            <Badge variant="default" className="text-xs">{appVersion}</Badge>
          </DialogTitle>
          <DialogDescription>
            L&apos;application a été mise à jour. Voici les nouveautés :
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {changelog.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <Button onClick={handleDismiss} variant="outline" className="flex-1">
            Plus tard
          </Button>
          <Button onClick={handleInstall} className="flex-1" disabled={installing}>
            {installing ? 'Téléchargement...' : 'Mettre à jour'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
