import { SyncService } from '../sync-service';

// Mock the sync modules
jest.mock('../sync/sync-push', () => ({
  processOutbox: jest.fn().mockResolvedValue({
    pushed: 5,
    attempted: 10,
    conflicts: 1,
    errors: 0,
  }),
}));

jest.mock('../sync/sync-pull', () => ({
  processDelta: jest.fn().mockResolvedValue({
    inserted: 2,
    updated: 3,
    deleted: 1,
    serverTime: '2025-08-12T10:00:00.000Z',
    groupsUpserts: 1,
    groupsDeletes: 0,
    contactsUpserts: 4,
    contactsDeletes: 1,
  }),
}));

jest.mock('../sync/sync-meta', () => ({
  getLastSyncAt: jest.fn().mockResolvedValue('2025-08-12T09:00:00.000Z'),
  setLastSyncAt: jest.fn().mockResolvedValue(undefined),
  createSyncLog: jest.fn().mockReturnValue({
    log: {
      startedAt: '2025-08-12T10:00:00.000Z',
      endedAt: '2025-08-12T10:00:00.000Z',
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
    },
    finish: jest.fn().mockReturnValue({}),
  }),
  saveSyncLog: jest.fn().mockResolvedValue(undefined),
}));

// Mock environment variable
process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and have runSync method', () => {
    expect(SyncService).toBeDefined();
    expect(typeof SyncService.runSync).toBe('function');
  });

  it('should run sync successfully', async () => {
    const result = await SyncService.runSync({
      batchSize: 10,
      accessToken: 'test-token',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('pushed');
      expect(result.data).toHaveProperty('pullInserted');
      expect(result.data).toHaveProperty('pullUpdated');
      expect(result.data).toHaveProperty('pullDeleted');
      expect(result.data).toHaveProperty('errors');
      expect(result.data).toHaveProperty('finishedAt');
    }
  });

  it('should handle missing baseUrl', async () => {
    // Temporarily remove the env var
    const originalUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const result = await SyncService.runSync();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Missing endpoint baseUrl for sync');
    }

    // Restore env var
    process.env.NEXT_PUBLIC_API_BASE_URL = originalUrl;
  });

  it('should use provided endpointBaseUrl', async () => {
    const customUrl = 'https://custom.api.com';
    const result = await SyncService.runSync({
      endpointBaseUrl: customUrl,
    });

    expect(result.ok).toBe(true);
  });
});