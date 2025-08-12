/**
 * SyncService Wrapper - Safe wrapper to avoid import issues
 */

import { SyncService, type SyncStats, type SyncOptions, type ApiResult } from './sync-service';

/**
 * Safe wrapper for SyncService.runSync that handles potential import issues
 */
export async function runSync(options: SyncOptions = {}): Promise<ApiResult<SyncStats>> {
  try {
    // Ensure SyncService is properly loaded
    if (!SyncService || typeof SyncService.runSync !== 'function') {
      throw new Error('SyncService is not properly initialized');
    }
    
    return await SyncService.runSync(options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

export { type SyncStats, type SyncOptions, type ApiResult };