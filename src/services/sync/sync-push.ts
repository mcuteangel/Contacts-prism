/**
 * Sync Push Module - Handle outbox operations
 */

import { db, type OutboxItem, type OutboxStatus, nowIso } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";
import type { ApiResponse, OutboxItemPayload } from "@/types/api";

export interface PushResult {
  pushed: number;
  attempted: number;
  conflicts: number;
  errors: number;
}

export interface PushOptions {
  baseUrl?: string;
  accessToken?: string;
  batchSize?: number;
}

/**
 * Push outbox items to server
 */
export async function pushOutboxToServer(
  items: OutboxItem[],
  options: PushOptions = {}
): Promise<ApiResponse<{ appliedIds: number[]; conflicts: number; errors: number }>> {
  try {
    const { baseUrl, accessToken } = options;
    
    if (!baseUrl) {
      return { ok: false, error: "Missing endpoint baseUrl" };
    }



    const url = new URL("/posts", baseUrl); // استفاده از JSONPlaceholder endpoint
    const body = {
      clientTime: nowIso(),
      batch: items.map((item) => ({
        entity: item.entity,
        entityId: item.entityId,
        op: item.op,
        version: (item.payload as any)?.version ?? 1,
        payload: item.payload ?? {},
      })),
    };

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Push failed: ${response.status} ${response.statusText}`
      };
    }

    // JSONPlaceholder همیشه موفق است - شبیه‌سازی موفقیت
    const appliedIds = items.map(item => item.id!).filter(id => id !== undefined);
    
    return {
      ok: true,
      data: { 
        appliedIds, 
        conflicts: 0, 
        errors: 0 
      }
    };

  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error('Unknown push error');
    ErrorManager.logError(errorInstance, {
      component: 'SyncPush',
      action: 'pushOutboxToServer'
    });
    
    return {
      ok: false,
      error: errorInstance.message
    };
  }
}

/**
 * Deduplicate outbox items by entity and entityId
 */
export function dedupeOutbox(items: OutboxItem[]): OutboxItem[] {
  const byKey = new Map<string, OutboxItem[]>();
  
  for (const item of items) {
    const key = `${item.entity}:${item.entityId}`;
    const arr = byKey.get(key) ?? [];
    arr.push(item);
    byKey.set(key, arr);
  }

  const result: OutboxItem[] = [];
  
  for (const [, arr] of byKey) {
    // Sort by clientTime to get the latest operation
    arr.sort((a, b) => a.clientTime.localeCompare(b.clientTime));
    const last = arr[arr.length - 1];

    // If last operation is delete, only keep the delete
    if (last.op === "delete") {
      result.push(last);
      continue;
    }

    // Otherwise keep only the last operation (update or insert)
    result.push(last);
  }

  // Sort by clientTime for consistent processing
  result.sort((a, b) => a.clientTime.localeCompare(b.clientTime));
  return result;
}

/**
 * Process outbox with batching and retry logic
 */
export async function processOutbox(options: PushOptions = {}): Promise<PushResult> {
  const { batchSize = 20 } = options;
  
  let pushedTotal = 0;
  let attempted = 0;
  let conflictCount = 0;
  let errorCount = 0;

  try {
    while (true) {
      // Get queued items
      const queuedRaw = await db.outbox_queue
        .where("status")
        .equals("queued")
        .limit(batchSize * 3)
        .sortBy("clientTime");

      if (queuedRaw.length === 0) break;

      // Deduplicate and limit to batch size
      const queued = dedupeOutbox(queuedRaw).slice(0, batchSize);
      if (queued.length === 0) break;

      attempted += queued.length;

      // Mark as sending
      await db.transaction("rw", db.outbox_queue, async () => {
        for (const item of queued) {
          await db.outbox_queue.update(item.id!, {
            status: "sending" as OutboxStatus,
            tryCount: (item.tryCount ?? 0) + 1,
          });
        }
      });

      // Push to server
      const pushResult = await pushOutboxToServer(queued, options);

      if (!pushResult.ok) {
        // Mark batch as error and break
        await db.transaction("rw", db.outbox_queue, async () => {
          for (const item of queued) {
            await db.outbox_queue.update(item.id!, { 
              status: "error" as OutboxStatus 
            });
          }
        });
        break;
      }

      const { appliedIds, conflicts, errors } = pushResult.data;
      conflictCount += conflicts;
      errorCount += errors;

      // Mark applied items as done
      const appliedSet = new Set(appliedIds);
      await db.transaction("rw", db.outbox_queue, async () => {
        for (const item of queued) {
          if (appliedSet.has(item.id!)) {
            await db.outbox_queue.update(item.id!, { 
              status: "done" as OutboxStatus 
            });
          }
        }
      });

      pushedTotal += appliedIds.length;

      // Mark remaining items as error if there were conflicts/errors
      if (conflicts > 0 || errors > 0) {
        await db.transaction("rw", db.outbox_queue, async () => {
          for (const item of queued) {
            if (!appliedSet.has(item.id!)) {
              await db.outbox_queue.update(item.id!, {
                status: "error" as OutboxStatus,
              });
            }
          }
        });
      }
    }

    return {
      pushed: pushedTotal,
      attempted,
      conflicts: conflictCount,
      errors: errorCount,
    };

  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error('Unknown outbox processing error');
    ErrorManager.logError(errorInstance, {
      component: 'SyncPush',
      action: 'processOutbox'
    });

    return {
      pushed: pushedTotal,
      attempted,
      conflicts: conflictCount,
      errors: errorCount + 1,
    };
  }
}