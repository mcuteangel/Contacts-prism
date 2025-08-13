/**
 * SyncService (Refactored)
 * Modular sync service with separate push, pull, and metadata modules
 */

import { processOutbox } from "./sync/sync-push";
import { processDelta } from "./sync/sync-pull";
import { getLastSyncAt, setLastSyncAt, createSyncLog, saveSyncLog } from "./sync/sync-meta";
import { ErrorManager } from "@/lib/error-manager";

// API Result types
type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

function ok<T>(data: T): ApiOk<T> { return { ok: true, data }; }
function err(message: string): ApiErr { return { ok: false, error: message }; }

// Configuration
const DEFAULT_BATCH_SIZE = 20;

// Sync statistics
export type SyncStats = {
  pushed: number;
  pullInserted: number;
  pullUpdated: number;
  pullDeleted: number;
  errors: number;
  finishedAt: string;
};

// Sync options
export type SyncOptions = {
  batchSize?: number;
  accessToken?: string;
  endpointBaseUrl?: string;
};

/**
 * Main sync service
 */
export const SyncService = {
  /**
   * Run a complete sync cycle (push then pull)
   */
  async runSync(options: SyncOptions = {}): Promise<ApiResult<SyncStats>> {
    const { log, finish } = createSyncLog();
    
    // Ensure we have an access token
    if (!options.accessToken) {
      return { ok: false, error: 'Authentication required. No access token provided.' };
    }
    
    // Set up headers with the access token
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.accessToken}`
    };
    
    // Merge headers into options
    const syncOptions = {
      ...options,
      headers
    };
    
    try {
      const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
      // Use syncOptions instead of options to include the headers
      const baseUrl = options.endpointBaseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL;
      
      if (!baseUrl) {
        const error = "Missing endpoint baseUrl for sync";
        finish(false, error);
        await saveSyncLog(log);
        return err(error);
      }

      log.endpointUsed = baseUrl;
      log.lastSyncBefore = await getLastSyncAt();

      // Push local changes with the syncOptions that include the access token
      const pushResult = await processOutbox({
        batchSize,
        ...syncOptions
      });
      
      // Check if there were any errors during push
      if (pushResult.errors > 0) {
        const errorMsg = `Push completed with ${pushResult.errors} error(s)`;
        log.error = errorMsg;
        // We don't return here because we still want to continue with the pull
      }

      log.pushStats = {
        attempted: pushResult.attempted,
        sent: pushResult.pushed,
        applied: pushResult.pushed,
        conflicts: pushResult.conflicts,
        errors: pushResult.errors,
      };
      log.conflictsCount = pushResult.conflicts;
      log.errorsCount = pushResult.errors;
      log.pushAttemptBatches = Math.ceil(pushResult.attempted / batchSize);

      // Pull phase
      const pullResult = await processDelta(log.lastSyncBefore, {
        baseUrl,
        accessToken: options.accessToken,
      });

      log.pullStats = {
        contacts: { 
          upserts: pullResult.contactsUpserts, 
          deletes: pullResult.contactsDeletes 
        },
        groups: { 
          upserts: pullResult.groupsUpserts, 
          deletes: pullResult.groupsDeletes 
        },
        total: pullResult.inserted + pullResult.updated + pullResult.deleted,
      };

      // Update last sync timestamp
      await setLastSyncAt(pullResult.serverTime);
      log.lastSyncAfter = pullResult.serverTime;

      // Create result
      const stats: SyncStats = {
        pushed: pushResult.pushed,
        pullInserted: pullResult.inserted,
        pullUpdated: pullResult.updated,
        pullDeleted: pullResult.deleted,
        errors: pushResult.errors,
        finishedAt: new Date().toISOString(),
      };

      // Finish log
      finish(true);
      await saveSyncLog(log);

      return ok(stats);

    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown sync error');
      ErrorManager.logError(errorInstance, {
        component: 'SyncService',
        action: 'runSync'
      });

      finish(false, errorInstance.message);
      await saveSyncLog(log);

      return err(errorInstance.message);
    }
  },
};

export default SyncService;
