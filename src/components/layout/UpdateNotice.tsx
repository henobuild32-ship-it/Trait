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
  const [showUpdate, setShowUpdate] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(API_VERSION);
      const data = await res.json();
      if (data.success) {
        setAppVersion(data.version);
        setChangelog(data.changelog || []);

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
          <Button onClick={handleDismiss} className="w-full">
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
