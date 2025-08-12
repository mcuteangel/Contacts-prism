import { dbOptimizer } from '../db-optimizer';
import { db } from '@/database/db';

// Mock the database
jest.mock('@/database/db', () => ({
  db: {
    contacts: {
      count: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          count: jest.fn(),
        })),
        notEqual: jest.fn(() => ({
          count: jest.fn(),
        })),
      })),
    },
    groups: {
      count: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          count: jest.fn(),
        })),
        notEqual: jest.fn(() => ({
          count: jest.fn(),
        })),
      })),
    },
    outbox_queue: {
      count: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          count: jest.fn(),
          delete: jest.fn(),
        })),
        below: jest.fn(() => ({
          delete: jest.fn(),
          and: jest.fn(() => ({
            delete: jest.fn(),
          })),
        })),
      })),
    },
    sync_logs: {
      count: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          count: jest.fn(),
        })),
        below: jest.fn(() => ({
          delete: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        first: jest.fn(),
        last: jest.fn(),
      })),
    },
  },
}));

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn().mockResolvedValue({
      usage: 1024 * 1024, // 1MB
      quota: 1024 * 1024 * 100, // 100MB
    }),
  },
  writable: true,
});

describe('DatabaseOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return comprehensive database statistics', async () => {
      // Setup mocks
      (db.contacts.count as jest.Mock).mockResolvedValue(100);
      (db.contacts.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          count: jest.fn().mockResolvedValue(90),
        }),
        notEqual: jest.fn().mockReturnValue({
          count: jest.fn().mockResolvedValue(10),
        }),
      });

      (db.groups.count as jest.Mock).mockResolvedValue(10);
      (db.outbox_queue.count as jest.Mock).mockResolvedValue(5);
      (db.sync_logs.count as jest.Mock).mockResolvedValue(50);

      const stats = await dbOptimizer.getStats();

      expect(stats).toHaveProperty('contacts');
      expect(stats).toHaveProperty('groups');
      expect(stats).toHaveProperty('outbox');
      expect(stats).toHaveProperty('syncLogs');
      expect(stats).toHaveProperty('storage');

      expect(stats.contacts.total).toBe(100);
      expect(stats.storage.estimatedSize).toBe(1024 * 1024);
    });

    it('should handle errors gracefully', async () => {
      (db.contacts.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(dbOptimizer.getStats()).rejects.toThrow('Database error');
    });
  });

  describe('cleanup', () => {
    it('should clean up old data successfully', async () => {
      const mockDelete = jest.fn().mockResolvedValue(5);
      
      (db.sync_logs.where as jest.Mock).mockReturnValue({
        below: jest.fn().mockReturnValue({
          delete: mockDelete,
        }),
      });

      (db.outbox_queue.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          delete: mockDelete,
        }),
        below: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            delete: mockDelete,
          }),
        }),
      });

      // Mock getStats for before/after comparison
      const mockStats = {
        contacts: { total: 100, active: 90, deleted: 10, conflicts: 0 },
        groups: { total: 10, active: 10, deleted: 0 },
        outbox: { total: 5, queued: 2, sending: 0, error: 1, done: 2 },
        syncLogs: { total: 50, successful: 45, failed: 5, oldestEntry: null, newestEntry: null },
        storage: { estimatedSize: 1024, quota: 1024 * 100, usage: 1 },
      };

      jest.spyOn(dbOptimizer, 'getStats').mockResolvedValue(mockStats);

      const result = await dbOptimizer.cleanup({
        removeOldSyncLogs: true,
        removeDoneOutboxItems: true,
        removeOldOutboxItems: true,
      });

      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(mockDelete).toHaveBeenCalledTimes(3);
    });

    it('should handle cleanup errors', async () => {
      (db.sync_logs.where as jest.Mock).mockReturnValue({
        below: jest.fn().mockReturnValue({
          delete: jest.fn().mockRejectedValue(new Error('Delete failed')),
        }),
      });

      const mockStats = {
        contacts: { total: 0, active: 0, deleted: 0, conflicts: 0 },
        groups: { total: 0, active: 0, deleted: 0 },
        outbox: { total: 0, queued: 0, sending: 0, error: 0, done: 0 },
        syncLogs: { total: 0, successful: 0, failed: 0, oldestEntry: null, newestEntry: null },
        storage: { estimatedSize: 0, quota: 0, usage: 0 },
      };

      jest.spyOn(dbOptimizer, 'getStats').mockResolvedValue(mockStats);

      const result = await dbOptimizer.cleanup();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('analyzePerformance', () => {
    it('should identify performance issues', async () => {
      const mockStats = {
        contacts: { total: 100, active: 90, deleted: 10, conflicts: 5 },
        groups: { total: 10, active: 10, deleted: 0 },
        outbox: { total: 100, queued: 20, sending: 5, error: 60, done: 15 },
        syncLogs: { total: 2000, successful: 1800, failed: 200, oldestEntry: null, newestEntry: null },
        storage: { estimatedSize: 1024 * 1024 * 90, quota: 1024 * 1024 * 100, usage: 90 },
      };

      jest.spyOn(dbOptimizer, 'getStats').mockResolvedValue(mockStats);

      const analysis = await dbOptimizer.analyzePerformance();

      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);

      // Should detect high storage usage
      const storageIssue = analysis.issues.find(issue => 
        issue.message.includes('Storage usage is high')
      );
      expect(storageIssue).toBeDefined();

      // Should detect many sync logs
      const syncLogIssue = analysis.issues.find(issue => 
        issue.message.includes('Large number of sync logs')
      );
      expect(syncLogIssue).toBeDefined();

      // Should detect failed outbox items
      const outboxIssue = analysis.issues.find(issue => 
        issue.message.includes('Many failed outbox items')
      );
      expect(outboxIssue).toBeDefined();
    });

    it('should handle analysis errors', async () => {
      jest.spyOn(dbOptimizer, 'getStats').mockRejectedValue(new Error('Stats failed'));

      const analysis = await dbOptimizer.analyzePerformance();

      expect(analysis.issues).toHaveLength(1);
      expect(analysis.issues[0].type).toBe('error');
      expect(analysis.issues[0].message).toBe('Failed to analyze database performance');
    });
  });

  describe('repairDatabase', () => {
    it('should repair database inconsistencies', async () => {
      // Mock stuck outbox items
      const stuckItems = [
        { id: 1, status: 'sending' },
        { id: 2, status: 'sending' },
      ];

      (db.outbox_queue.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(stuckItems),
        }),
      });

      // Mock transaction
      const mockTransaction = jest.fn().mockImplementation(async (mode, tables, callback) => {
        return callback();
      });
      (db as any).transaction = mockTransaction;

      // Mock update
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      (db.outbox_queue as any).update = mockUpdate;

      // Mock contacts without timestamps
      (db.contacts as any).where = jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            equals: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Mock conflicted contacts
      (db.contacts as any).where = jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      });

      const mockStats = {
        contacts: { total: 100, active: 90, deleted: 10, conflicts: 0 },
        groups: { total: 10, active: 10, deleted: 0 },
        outbox: { total: 5, queued: 2, sending: 0, error: 1, done: 2 },
        syncLogs: { total: 50, successful: 45, failed: 5, oldestEntry: null, newestEntry: null },
        storage: { estimatedSize: 1024, quota: 1024 * 100, usage: 1 },
      };

      jest.spyOn(dbOptimizer, 'getStats').mockResolvedValue(mockStats);

      const result = await dbOptimizer.repairDatabase();

      expect(result.success).toBe(true);
      expect(result.operations.length).toBeGreaterThan(0);
      expect(mockUpdate).toHaveBeenCalledTimes(2); // For 2 stuck items
    });
  });
});