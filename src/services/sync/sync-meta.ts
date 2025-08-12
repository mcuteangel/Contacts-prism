/**
 * Sync Metadata Module - Handle sync state and logging
 */

import { db, nowIso } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";

export interface SyncLogEntry {
  startedAt: string;
  endedAt: string;
  ok: boolean;
  tryCount: number;
  pushStats?: {
    attempted?: number;
    sent?: number;
    applied?: number;
    conflicts?: number;
    errors?: number;
  } | null;
  pullStats?: {
    contacts?: { upserts?: number; deletes?: number } | null;
    groups?: { upserts?: number; deletes?: number } | null;
    total?: number;
  } | null;
  error?: string | null;
  endpointUsed?: string;
  lastSyncBefore?: string | null;
  lastSyncAfter?: string | null;
  durationMs?: number;
  pushAttemptBatches?: number;
  conflictsCount?: number;
  errorsCount?: number;
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncAt(): Promise<string | null> {
  try {
    const row = await db.sync_meta.get("lastSyncAt");
    return (row?.value as string) ?? null;
  } catch (error) {
    ErrorManager.logError(error as Error, {
      component: 'SyncMeta',
      action: 'getLastSyncAt'
    });
    return null;
  }
}

/**
 * Set last sync timestamp
 */
export async function setLastSyncAt(iso: string): Promise<void> {
  try {
    await db.sync_meta.put({ key: "lastSyncAt", value: iso });
  } catch (error) {
    ErrorManager.logError(error as Error, {
      component: 'SyncMeta',
      action: 'setLastSyncAt',
      metadata: { timestamp: iso }
    });
    throw error;
  }
}

/**
 * Save sync log entry
 */
export async function saveSyncLog(log: SyncLogEntry): Promise<void> {
  try {
    await db.sync_logs.add({
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      ok: log.ok,
      tryCount: log.tryCount,
      pushStats: log.pushStats,
      pullStats: log.pullStats,
      error: log.error,
      endpointUsed: log.endpointUsed,
      lastSyncBefore: log.lastSyncBefore ?? null,
      lastSyncAfter: log.lastSyncAfter ?? null,
      durationMs: log.durationMs,
      pushAttemptBatches: log.pushAttemptBatches,
    });
  } catch (error) {
    ErrorManager.logError(error as Error, {
      component: 'SyncMeta',
      action: 'saveSyncLog'
    });
    // Don't throw - logging failure shouldn't break sync
  }
}

/**
 * Get recent sync logs
 */
export async function getRecentSyncLogs(limit: number = 10): Promise<SyncLogEntry[]> {
  try {
    const logs = await db.sync_logs
      .orderBy('startedAt')
      .reverse()
      .limit(limit)
      .toArray();
    
    return logs.map(log => ({
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      ok: log.ok,
      tryCount: log.tryCount,
      pushStats: log.pushStats,
      pullStats: log.pullStats,
      error: log.error,
      endpointUsed: log.endpointUsed,
      lastSyncBefore: log.lastSyncBefore,
      lastSyncAfter: log.lastSyncAfter,
      durationMs: log.durationMs,
      pushAttemptBatches: log.pushAttemptBatches,
      conflictsCount: 0, // Calculate from pushStats if needed
      errorsCount: 0, // Calculate from pushStats if needed
    }));
  } catch (error) {
    ErrorManager.logError(error as Error, {
      component: 'SyncMeta',
      action: 'getRecentSyncLogs'
    });
    return [];
  }
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<{
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSuccessfulSync: string | null;
  lastFailedSync: string | null;
  averageDuration: number;
}> {
  try {
    const logs = await db.sync_logs.toArray();
    
    const totalSyncs = logs.length;
    const successfulSyncs = logs.filter(log => log.ok).length;
    const failedSyncs = logs.filter(log => !log.ok).length;
    
    const successfulLogs = logs.filter(log => log.ok);
    const failedLogs = logs.filter(log => !log.ok);
    
    const lastSuccessfulSync = successfulLogs.length > 0 
      ? successfulLogs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0].startedAt
      : null;
      
    const lastFailedSync = failedLogs.length > 0
      ? failedLogs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0].startedAt
      : null;
    
    const durationsMs = logs
      .filter(log => log.durationMs && log.durationMs > 0)
      .map(log => log.durationMs!);
    
    const averageDuration = durationsMs.length > 0
      ? durationsMs.reduce((sum, duration) => sum + duration, 0) / durationsMs.length
      : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      lastSuccessfulSync,
      lastFailedSync,
      averageDuration: Math.round(averageDuration),
    };
  } catch (error) {
    ErrorManager.logError(error as Error, {
      component: 'SyncMeta',
      action: 'getSyncStats'
    });
    
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSuccessfulSync: null,
      lastFailedSync: null,
      averageDuration: 0,
    };
  }
}

/**
 * Clean up old sync logs
 */
export async function cleanupOldSyncLogs(keepDays: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const cutoffIso = cutoffDate.toISOString();
    
    const oldLogs = await db.sync_logs
      .where('startedAt')
      .below(cutoffIso)
      .toArray();
    
    if (oldLogs.length > 0) {
      await db.sync_logs
        .where('startedAt')
        .below(cutoffIso)
        .delete();
    }
    
    return oldLogs.length;
  } catch (error) {
    ErrorManager.logError(error as Error, {
      component: 'SyncMeta',
      action: 'cleanupOldSyncLogs',
      metadata: { keepDays }
    });
    return 0;
  }
}

/**
 * Create sync log entry with timing
 */
export function createSyncLog(startedAt: string = nowIso()): {
  log: SyncLogEntry;
  finish: (success: boolean, error?: string) => SyncLogEntry;
} {
  const log: SyncLogEntry = {
    startedAt,
    endedAt: startedAt,
    ok: false,
    tryCount: 0,
    pushStats: null,
    pullStats: null,
    error: null,
    endpointUsed: undefined,
    lastSyncBefore: null,
    lastSyncAfter: null,
    durationMs: undefined,
    conflictsCount: 0,
    errorsCount: 0,
  };

  const finish = (success: boolean, error?: string): SyncLogEntry => {
    const endedAt = nowIso();
    log.endedAt = endedAt;
    log.ok = success;
    log.error = error || null;
    
    // Calculate duration
    try {
      const startTime = Date.parse(log.startedAt);
      const endTime = Date.parse(endedAt);
      if (!Number.isNaN(startTime) && !Number.isNaN(endTime)) {
        log.durationMs = Math.max(0, endTime - startTime);
      }
    } catch {
      // Ignore duration calculation errors
    }
    
    return log;
  };

  return { log, finish };
}