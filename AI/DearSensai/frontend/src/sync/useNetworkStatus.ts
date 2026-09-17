import { useState, useEffect } from 'react';
import { db } from '../storage/db';

export interface NetworkSyncStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;
}

export function useNetworkStatus(): NetworkSyncStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending sync items count periodically
    const checkSyncQueue = async () => {
      try {
        const count = await db.syncQueue.where('synced').equals(0 as any).count();
        setPendingSyncCount(count);
      } catch (e) {
        // ignore if db opening
      }
    };

    checkSyncQueue();
    const interval = setInterval(checkSyncQueue, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine) return;
    try {
      // In Phase 1, we mark pending items as locally verified/queued for backend
      // Phase 2 will execute real POST /api/v1/sync
      const pendingEvents = await db.syncQueue.where('synced').equals(0 as any).toArray();
      if (pendingEvents.length > 0) {
        for (const ev of pendingEvents) {
          ev.synced = true;
          await db.syncQueue.put(ev);
        }
      }
      setPendingSyncCount(0);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  return {
    isOnline,
    pendingSyncCount,
    lastSyncedAt,
    triggerSync,
  };
}
