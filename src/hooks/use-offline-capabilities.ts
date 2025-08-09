/**
 * Hook برای مدیریت قابلیت‌های آفلاین در PRISM Contacts
 * 
 * این hook امکانات زیر را فراهم می‌کند:
 * - بررسی وضعیت آنلاین/آفلاین
 * - ذخیره تغییرات در IndexedDB
 * - همگام‌سازی خودکار با سرور
 * - مدیریت خطاهای آفلاین
 * - نمایش وضعیت sync به کاربر
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db, nowIso } from '@/database/db';
import { ContactService } from '@/services/contact-service';
import SyncService, { type SyncStats, type SyncOptions } from '@/services/sync-service';

interface OfflineCapabilities {
  // وضعیت شبکه
  isOnline: boolean;
  isOffline: boolean;
  
  // وضعیت sync
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  syncStats: SyncStats | null;
  
  // عملیات
  syncNow: (options?: SyncOptions) => Promise<void>;
  clearSyncError: () => void;
  
  // داده‌های آفلاین
  pendingChanges: number;
  hasPendingChanges: boolean;
}

const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  batchSize: 20,
};

export function useOfflineCapabilities(): OfflineCapabilities {
  const [isOnline, setIsOnline] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  
  const queryClient = useQueryClient();

  // بررسی وضعیت شبکه
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOffline(false);
      console.log('App is online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOffline(true);
      console.log('App is offline');
    };

    // گوش دادن به رویدادهای شبکه
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // بررسی وضعیت اولیه
    setIsOnline(navigator.onLine);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // بررسی تغییرات در صف outbox
  useEffect(() => {
    const checkPendingChanges = async () => {
      try {
        const outboxItems = await db.outbox_queue
          .where('status')
          .equals('queued')
          .toArray();
        
        setPendingChanges(outboxItems.length);
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };

    // بررسی هر 5 ثانیه
    const interval = setInterval(checkPendingChanges, 5000);
    checkPendingChanges(); // بررسی اولیه

    return () => clearInterval(interval);
  }, []);

  // همگام‌سازی خودکار هوشمند
  useEffect(() => {
    let syncTimeout: NodeJS.Timeout;

    const scheduleSmartSync = () => {
      // اگر آنلاین هستیم و تغییرات در صف وجود دارد
      if (isOnline && pendingChanges > 0 && !isSyncing) {
        // همگام‌سازی با تأخیر 2 ثانیه برای جمع‌آوری تغییرات
        syncTimeout = setTimeout(() => {
          performSync();
        }, 2000);
      }
    };

    // اگر آنلاین شدیم و تغییرات وجود دارد، همگام‌سازی را شروع کن
    if (isOnline && pendingChanges > 0 && !isSyncing) {
      scheduleSmartSync();
    }

    return () => {
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [isOnline, pendingChanges, isSyncing]);

  // اجرای همگام‌سازی
  const performSync = useCallback(async (options?: SyncOptions) => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      setSyncError(null);

      const syncOptions = { ...DEFAULT_SYNC_OPTIONS, ...options };
      const result = await SyncService.runSync(syncOptions);

      if (result.ok) {
        setSyncStats(result.data);
        setLastSyncTime(nowIso());
        
        // به‌روزرسانی cache React Query
        await queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'contacts' || 
            query.queryKey[0] === 'groups'
        });
        
        console.log('Sync completed successfully:', result.data);
      } else {
        setSyncError(result.error);
        console.error('Sync failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncError(errorMessage);
      console.error('Sync exception:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queryClient]);

  // همگام‌سازی دستی
  const syncNow = useCallback(async (options?: SyncOptions) => {
    await performSync(options);
  }, [performSync]);

  // پاک کردن خطای sync
  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    syncStats,
    syncNow,
    clearSyncError,
    pendingChanges,
    hasPendingChanges: pendingChanges > 0,
  };
}

// Hook کمکی برای دسترسی به وضعیت آفلاین در کامپوننت‌ها
export function useOfflineStatus() {
  const { isOnline, isOffline, isSyncing, pendingChanges, hasPendingChanges } = useOfflineCapabilities();
  
  return {
    isOnline,
    isOffline,
    isSyncing,
    pendingChanges,
    hasPendingChanges,
    statusText: isOffline ? 'آفلاین' : isSyncing ? 'همگام‌سازی...' : 'آنلاین',
    statusColor: isOffline ? 'destructive' : isSyncing ? 'secondary' : 'default',
  };
}

// Hook برای مدیریت داده‌های آفلاین
export function useOfflineData() {
  const { syncNow, syncError, clearSyncError } = useOfflineCapabilities();

  const saveOffline = useCallback(async (data: any, type: 'contact' | 'group') => {
    try {
      // ذخیره در IndexedDB (از طریق ContactService که این کار رو انجام می‌ده)
      if (type === 'contact') {
        const result = await ContactService.createContact(data);
        if (!result.ok) {
          throw new Error(result.error);
        }
      } else {
        // برای گروه‌ها
        const result = await ContactService.addGroup(data.name, data.userId, data.color);
        if (!result.ok) {
          throw new Error(result.error);
        }
      }
      
      console.log('Data saved offline successfully');
    } catch (error) {
      console.error('Error saving offline data:', error);
      throw error;
    }
  }, []);

  return {
    saveOffline,
    syncNow,
    syncError,
    clearSyncError,
  };
}