/**
 * Sync Push Module - Handle outbox operations
 */

import { db, type OutboxItem, type OutboxStatus, nowIso } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";
import type { ApiResponse } from "@/types/api";

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
    // Use singleton Supabase client to avoid multiple instances
    const { supabaseClient } = await import('@/integrations/supabase/client');
    const supabase = supabaseClient;
    
    // Format items to match server expectations
    const itemsToSync = items.map((item) => ({
      entity: item.entity,
      entityId: item.entityId,
      op: item.op,
      payload: item.payload ?? {},
    }));

    const body = {
      clientTime: nowIso(),
      items: itemsToSync,
    };

    console.log('Sending sync request to Supabase function sync-push');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const response = await supabase.functions.invoke('sync-push', {
        body: body
    });

    console.log('Push response received:', {
      error: response.error,
      data: response.data,
      status: response.status
    });

    if (response.error) {
      console.error('Push failed:', response.error);
      return { ok: false, error: response.error.message };
    }
    
    // Map server results to appliedIds
    const appliedIds: number[] = [];
    let conflicts = 0;
    let errors = 0;

    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      response.data.results.forEach((result: any, index: number) => {
        const item = items[index];
        if (!item) return;
        
        if (result.status === 'applied') {
          appliedIds.push(item.id!);
        } else if (result.status === 'conflict') {
          conflicts++;
        } else if (result.status === 'error') {
          errors++;
          console.error(`Error processing item ${item.id}:`, result.error);
        }
      });
    }
    
    console.log('Sync push results:', { appliedIds, conflicts, errors });
    return {
      ok: true,
      data: { 
        appliedIds, 
        conflicts, 
        errors 
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
    
    if (last) {  // Check if last exists
      // If last operation is delete, only keep the delete
      if (last.op === "delete") {
        result.push(last);
        continue;
      }

      // Otherwise keep only the last operation (update or insert)
      result.push(last);
    }
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
  let batchNumber = 0;

  console.log('Starting processOutbox with options:', { batchSize });

  try {
    while (true) {
      batchNumber++;
      console.log(`Processing batch #${batchNumber}`);
      
      // Get queued items
      const queuedRaw = await db.outbox_queue
        .where("status")
        .equals("queued")
        .limit(batchSize * 3)
        .sortBy("clientTime");

      if (queuedRaw.length === 0) {
        console.log('No more queued items found');
        break;
      }
      
      console.log(`Found ${queuedRaw.length} queued items`);

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
      console.log(`Sending batch of ${queued.length} items to server`);
      const pushResult = await pushOutboxToServer(queued, options);

      if (!pushResult.ok) {
        console.error('Push failed:', pushResult.error);
        
        // Only mark as error if we've retried multiple times
        await db.transaction("rw", db.outbox_queue, async () => {
          for (const item of queued) {
            const tryCount = (item.tryCount ?? 0) + 1;
            const newStatus = tryCount >= 3 ? "error" : "queued";
            
            console.log(`Marking item ${item.id} as ${newStatus} (attempt ${tryCount})`);
            
            const updateData: Partial<OutboxItem> = {
              status: newStatus as OutboxStatus,
              tryCount,
              updatedAt: new Date().toISOString()
            };
            
            // Only include lastError if we're marking as error
            if (newStatus === "error") {
              updateData.lastError = pushResult.error || 'Unknown error';
            } else {
              updateData.lastError = null;
            }
            
            await db.outbox_queue.update(item.id!, updateData);
          }
        });
        
        if (pushResult.error?.includes('401') || pushResult.error?.includes('403')) {
          console.error('Authentication failed, stopping sync');
          throw new Error('Authentication failed: ' + pushResult.error);
        }
        
        // Don't break on first error, try next batch
        continue;
      }

      if (!pushResult.data) {
        throw new Error('No data in push response');
      }
      const { appliedIds = [], conflicts = 0, errors = 0 } = pushResult.data;
      conflictCount += conflicts;
      errorCount += errors;

      // Process results
      const appliedSet = new Set(appliedIds);
      const updatedCount = await db.transaction("rw", db.outbox_queue, async () => {
        let updated = 0;
        
        for (const item of queued) {
          if (appliedSet.has(item.id!)) {
            const updateData: Partial<OutboxItem> = {
              status: "done" as OutboxStatus,
              updatedAt: new Date().toISOString(),
              lastError: null
            };
            
            await db.outbox_queue.update(item.id!, updateData);
            updated++;
          }
        }
        
        return updated;
      });
      
      console.log(`Successfully processed ${updatedCount} items in batch #${batchNumber}`);
      pushedTotal += updatedCount;

      pushedTotal += appliedIds.length;

      // Mark remaining items as error if there were conflicts/errors
      if (conflicts > 0 || errors > 0) {
        await db.transaction("rw", db.outbox_queue, async () => {
          for (const item of queued) {
            if (!appliedSet.has(item.id!)) {
              await db.outbox_queue.update(item.id!, {
                status: "error" as OutboxStatus,
                lastError: `Conflict or error during sync`,
                updatedAt: new Date().toISOString()
              });
            }
          }
        });
      }
    }

    console.log(`Outbox processing completed: pushed=${pushedTotal}, attempted=${attempted}, conflicts=${conflictCount}, errors=${errorCount}`);
    return {
      pushed: pushedTotal,
      attempted,
      conflicts: conflictCount,
      errors: errorCount
    };

  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error('Unknown outbox processing error');
    ErrorManager.logError(errorInstance, {
      component: 'SyncPush',
      action: 'processOutbox'
    });
    
    throw error;
  }
}