/**
 * Database Optimizer - Performance and maintenance utilities for IndexedDB
 */

import { db } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";

export interface DatabaseStats {
  contacts: {
    total: number;
    active: number;
    deleted: number;
    conflicts: number;
  };
  groups: {
    total: number;
    active: number;
    deleted: number;
  };
  outbox: {
    total: number;
    queued: number;
    sending: number;
    error: number;
    done: number;
  };
  syncLogs: {
    total: number;
    successful: number;
    failed: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  };
  storage: {
    estimatedSize: number;
    quota: number;
    usage: number;
  };
}

export interface OptimizationResult {
  success: boolean;
  operations: string[];
  errors: string[];
  stats: {
    before: Partial<DatabaseStats>;
    after: Partial<DatabaseStats>;
  };
  duration: number;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;

  private constructor() {}

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Get comprehensive database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    try {
      const [
        contactsTotal,
        contactsActive,
        contactsDeleted,
        contactsConflicts,
        groupsTotal,
        groupsActive,
        groupsDeleted,
        outboxTotal,
        outboxQueued,
        outboxSending,
        outboxError,
        outboxDone,
        syncLogsTotal,
        syncLogsSuccessful,
        syncLogsFailed,
        syncLogsOldest,
        syncLogsNewest,
        storageEstimate
      ] = await Promise.all([
        // Contacts stats
        db.contacts.count(),
        db.contacts.where('_deleted_at').equals(null).count(),
        db.contacts.where('_deleted_at').notEqual(null).count(),
        db.contacts.where('_conflict').equals(true).count(),
        
        // Groups stats
        db.groups.count(),
        db.groups.where('deleted_at').equals(null).count(),
        db.groups.where('deleted_at').notEqual(null).count(),
        
        // Outbox stats
        db.outbox_queue.count(),
        db.outbox_queue.where('status').equals('queued').count(),
        db.outbox_queue.where('status').equals('sending').count(),
        db.outbox_queue.where('status').equals('error').count(),
        db.outbox_queue.where('status').equals('done').count(),
        
        // Sync logs stats
        db.sync_logs.count(),
        db.sync_logs.where('ok').equals(true).count(),
        db.sync_logs.where('ok').equals(false).count(),
        db.sync_logs.orderBy('startedAt').first(),
        db.sync_logs.orderBy('startedAt').last(),
        
        // Storage estimate
        this.getStorageEstimate()
      ]);

      return {
        contacts: {
          total: contactsTotal,
          active: contactsActive,
          deleted: contactsDeleted,
          conflicts: contactsConflicts,
        },
        groups: {
          total: groupsTotal,
          active: groupsActive,
          deleted: groupsDeleted,
        },
        outbox: {
          total: outboxTotal,
          queued: outboxQueued,
          sending: outboxSending,
          error: outboxError,
          done: outboxDone,
        },
        syncLogs: {
          total: syncLogsTotal,
          successful: syncLogsSuccessful,
          failed: syncLogsFailed,
          oldestEntry: syncLogsOldest?.startedAt || null,
          newestEntry: syncLogsNewest?.startedAt || null,
        },
        storage: storageEstimate,
      };
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'DatabaseOptimizer',
        action: 'getStats'
      });
      throw error;
    }
  }

  /**
   * Get storage usage estimate
   */
  private async getStorageEstimate(): Promise<{ estimatedSize: number; quota: number; usage: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          estimatedSize: estimate.usage || 0,
          quota: estimate.quota || 0,
          usage: estimate.usage && estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0,
        };
      }
      return { estimatedSize: 0, quota: 0, usage: 0 };
    } catch (error) {
      return { estimatedSize: 0, quota: 0, usage: 0 };
    }
  }

  /**
   * Clean up old and unnecessary data
   */
  async cleanup(options: {
    removeOldSyncLogs?: boolean;
    syncLogRetentionDays?: number;
    removeDoneOutboxItems?: boolean;
    removeOldOutboxItems?: boolean;
    outboxRetentionDays?: number;
    compactDatabase?: boolean;
  } = {}): Promise<OptimizationResult> {
    const startTime = Date.now();
    const operations: string[] = [];
    const errors: string[] = [];
    
    const {
      removeOldSyncLogs = true,
      syncLogRetentionDays = 30,
      removeDoneOutboxItems = true,
      removeOldOutboxItems = true,
      outboxRetentionDays = 7,
      compactDatabase = true,
    } = options;

    const statsBefore = await this.getStats();

    try {
      // Clean up old sync logs
      if (removeOldSyncLogs) {
        try {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - syncLogRetentionDays);
          const cutoffIso = cutoffDate.toISOString();
          
          const deletedCount = await db.sync_logs
            .where('startedAt')
            .below(cutoffIso)
            .delete();
          
          operations.push(`Removed ${deletedCount} old sync logs (older than ${syncLogRetentionDays} days)`);
        } catch (error) {
          errors.push(`Failed to clean sync logs: ${(error as Error).message}`);
        }
      }

      // Clean up done outbox items
      if (removeDoneOutboxItems) {
        try {
          const deletedCount = await db.outbox_queue
            .where('status')
            .equals('done')
            .delete();
          
          operations.push(`Removed ${deletedCount} completed outbox items`);
        } catch (error) {
          errors.push(`Failed to clean done outbox items: ${(error as Error).message}`);
        }
      }

      // Clean up old outbox items
      if (removeOldOutboxItems) {
        try {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - outboxRetentionDays);
          const cutoffIso = cutoffDate.toISOString();
          
          const deletedCount = await db.outbox_queue
            .where('clientTime')
            .below(cutoffIso)
            .and(item => item.status === 'error' || item.status === 'done')
            .delete();
          
          operations.push(`Removed ${deletedCount} old outbox items (older than ${outboxRetentionDays} days)`);
        } catch (error) {
          errors.push(`Failed to clean old outbox items: ${(error as Error).message}`);
        }
      }

      // Compact database (if supported)
      if (compactDatabase) {
        try {
          // Note: IndexedDB doesn't have a direct compact operation
          // This is a placeholder for potential future optimization
          operations.push('Database compaction requested (not directly supported by IndexedDB)');
        } catch (error) {
          errors.push(`Failed to compact database: ${(error as Error).message}`);
        }
      }

      const statsAfter = await this.getStats();
      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        operations,
        errors,
        stats: {
          before: statsBefore,
          after: statsAfter,
        },
        duration,
      };

    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'DatabaseOptimizer',
        action: 'cleanup'
      });

      errors.push(`Cleanup failed: ${(error as Error).message}`);
      
      return {
        success: false,
        operations,
        errors,
        stats: {
          before: statsBefore,
          after: statsBefore,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze database performance and suggest optimizations
   */
  async analyzePerformance(): Promise<{
    issues: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      suggestion: string;
    }>;
    recommendations: string[];
  }> {
    try {
      const stats = await this.getStats();
      const issues: Array<{
        type: 'warning' | 'error' | 'info';
        message: string;
        suggestion: string;
      }> = [];
      const recommendations: string[] = [];

      // Check for high storage usage
      if (stats.storage.usage > 80) {
        issues.push({
          type: 'warning',
          message: `Storage usage is high (${stats.storage.usage.toFixed(1)}%)`,
          suggestion: 'Consider running database cleanup to free up space'
        });
        recommendations.push('Run database cleanup');
      }

      // Check for too many sync logs
      if (stats.syncLogs.total > 1000) {
        issues.push({
          type: 'warning',
          message: `Large number of sync logs (${stats.syncLogs.total})`,
          suggestion: 'Clean up old sync logs to improve performance'
        });
        recommendations.push('Clean up old sync logs');
      }

      // Check for stuck outbox items
      if (stats.outbox.error > 50) {
        issues.push({
          type: 'error',
          message: `Many failed outbox items (${stats.outbox.error})`,
          suggestion: 'Review and resolve sync errors'
        });
        recommendations.push('Review sync errors');
      }

      // Check for conflicts
      if (stats.contacts.conflicts > 0) {
        issues.push({
          type: 'warning',
          message: `Contact conflicts detected (${stats.contacts.conflicts})`,
          suggestion: 'Resolve data conflicts'
        });
        recommendations.push('Resolve data conflicts');
      }

      // Check for too many deleted items
      const deletedRatio = stats.contacts.total > 0 ? 
        (stats.contacts.deleted / stats.contacts.total) * 100 : 0;
      
      if (deletedRatio > 20) {
        issues.push({
          type: 'info',
          message: `High ratio of deleted contacts (${deletedRatio.toFixed(1)}%)`,
          suggestion: 'Consider permanent cleanup of old deleted items'
        });
        recommendations.push('Clean up deleted items');
      }

      return { issues, recommendations };

    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'DatabaseOptimizer',
        action: 'analyzePerformance'
      });
      
      return {
        issues: [{
          type: 'error',
          message: 'Failed to analyze database performance',
          suggestion: 'Check database connectivity and try again'
        }],
        recommendations: ['Check database status']
      };
    }
  }

  /**
   * Repair database inconsistencies
   */
  async repairDatabase(): Promise<OptimizationResult> {
    const startTime = Date.now();
    const operations: string[] = [];
    const errors: string[] = [];
    
    const statsBefore = await this.getStats();

    try {
      // Reset stuck outbox items
      const stuckItems = await db.outbox_queue
        .where('status')
        .equals('sending')
        .toArray();

      if (stuckItems.length > 0) {
        await db.transaction('rw', db.outbox_queue, async () => {
          for (const item of stuckItems) {
            await db.outbox_queue.update(item.id!, { status: 'queued' });
          }
        });
        operations.push(`Reset ${stuckItems.length} stuck outbox items`);
      }

      // Fix missing timestamps
      const contactsWithoutTimestamps = await db.contacts
        .where('created_at')
        .equals('')
        .or('updated_at')
        .equals('')
        .toArray();

      if (contactsWithoutTimestamps.length > 0) {
        const now = new Date().toISOString();
        await db.transaction('rw', db.contacts, async () => {
          for (const contact of contactsWithoutTimestamps) {
            const updates: any = {};
            if (!contact.created_at) updates.created_at = now;
            if (!contact.updated_at) updates.updated_at = now;
            
            if (Object.keys(updates).length > 0) {
              await db.contacts.update(contact.id, updates);
            }
          }
        });
        operations.push(`Fixed timestamps for ${contactsWithoutTimestamps.length} contacts`);
      }

      // Clear conflict flags for resolved items
      const conflictedContacts = await db.contacts
        .where('_conflict')
        .equals(true)
        .toArray();

      if (conflictedContacts.length > 0) {
        await db.transaction('rw', db.contacts, async () => {
          for (const contact of conflictedContacts) {
            await db.contacts.update(contact.id, { _conflict: false });
          }
        });
        operations.push(`Cleared conflict flags for ${conflictedContacts.length} contacts`);
      }

      const statsAfter = await this.getStats();
      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        operations,
        errors,
        stats: {
          before: statsBefore,
          after: statsAfter,
        },
        duration,
      };

    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'DatabaseOptimizer',
        action: 'repairDatabase'
      });

      errors.push(`Repair failed: ${(error as Error).message}`);
      
      return {
        success: false,
        operations,
        errors,
        stats: {
          before: statsBefore,
          after: statsBefore,
        },
        duration: Date.now() - startTime,
      };
    }
  }
}

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance();