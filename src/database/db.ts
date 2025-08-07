/**
 * PRISM Contacts - IndexedDB (Dexie) offline database
 * همگام با اسکیمای Supabase و افزودن فیلدهای کمکی برای سنکرون (prefixed with _)
 */
import Dexie, { Table } from 'dexie';

// Types aligned with Supabase schema (plus local sync helpers)
export type UUID = string;

export type Contact = {
  id: UUID;
  user_id: UUID;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'not_specified';
  role: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
  // Local-only sync helpers
  _deleted_at?: string | null; // ISO or null
  _version?: number; // increment per local change
  _conflict?: boolean; // mark if conflict detected
};

export type PhoneNumber = {
  id: UUID;
  user_id: UUID;
  contact_id: UUID;
  phone_type: string;
  phone_number: string;
  created_at: string; // ISO
};

export type EmailAddress = {
  id: UUID;
  user_id: UUID;
  contact_id: UUID;
  email_type: string;
  email_address: string;
  created_at: string; // ISO
};

export type Group = {
  id: UUID;
  user_id: UUID;
  name: string;
  color: string | null;
  created_at: string; // ISO
  // برای هم‌راستاسازی با قرارداد Sync (LWW)
  updated_at: string; // ISO
  deleted_at?: string | null; // ISO or null
  version?: number; // نسخه افزایشی
};

export type CustomField = {
  id: UUID;
  user_id: UUID;
  contact_id: UUID;
  field_name: string;
  field_value: string;
  created_at: string; // ISO
};

export type ContactGroup = {
  contact_id: UUID;
  group_id: UUID;
  user_id: UUID;
  assigned_at: string; // ISO
};

export type SyncMeta = {
  key: string;
  value: unknown;
};

// ذخایر Auth آفلاین
export type AuthSecretRow = {
  key: string; // 'auth:secret' یا کلیدهای مرتبط
  value: {
    // AES-GCM master key بسته‌بندی‌شده
    wrappedAesKey?: ArrayBuffer | Uint8Array | string | null;
    wrapMethod?: 'webauthn' | 'pin';
    pinKdf?: {
      saltB64: string;
      iterations: number;
      hash: 'SHA-256';
    } | null;
    // متادیتا
    createdAt: string;    // ISO
    lastOnlineAuthAt: string; // ISO - آخرین تایید آنلاین Supabase
    lastUnlockAt?: string | null; // ISO - آخرین بازکردن قفل آفلاین
    offlineAllowedUntil?: string | null; // ISO - سقف 7 روز
    inactivityMs?: number; // مثلا 3600000 (1h)
  };
};

// Telemetry: لاگ‌های همگام‌سازی
export type SyncLog = {
  id?: number;             // auto-increment
  startedAt: string;       // ISO
  endedAt: string;         // ISO
  ok: boolean;
  tryCount: number;        // تعداد تلاش‌ها در این ران
  // آمار push/pull (ساختار سبک برای ثبت خلاصه)
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
  error?: string | null;   // خلاصه پیام خطا در صورت ok=false

  // Telemetry افزوده‌شده
  endpointUsed?: string;          // آدرس پایه استفاده‌شده برای pull
  lastSyncBefore?: string | null; // مقدار lastSyncAt قبل از اجرا
  lastSyncAfter?: string | null;  // مقدار جدید (serverTime) بعد از pull
  durationMs?: number;            // مدت‌زمان اجرای runSync برحسب میلی‌ثانیه
};

export type OutboxStatus = 'queued' | 'sending' | 'error' | 'done';
export type OutboxOp = 'insert' | 'update' | 'delete';

export type OutboxItem = {
  id?: number; // auto-increment
  entity: 'contacts' | 'phone_numbers' | 'email_addresses' | 'groups' | 'custom_fields' | 'contact_groups';
  entityId: string; // UUID or composite key stringified for join table
  op: OutboxOp;
  clientTime: string; // ISO
  tryCount: number;
  status: OutboxStatus;
  payload: unknown; // the delta or full row to push
};

class PrismContactsDB extends Dexie {
  // Tables
  contacts!: Table<Contact, string>;
  phone_numbers!: Table<PhoneNumber, string>;
  email_addresses!: Table<EmailAddress, string>;
  groups!: Table<Group, string>;
  custom_fields!: Table<CustomField, string>;
  contact_groups!: Table<ContactGroup, [string, string]>; // composite pk (contact_id, group_id) stringified via idx
  sync_meta!: Table<SyncMeta, string>;
  outbox_queue!: Table<OutboxItem, number>;
  sync_logs!: Table<SyncLog, number>;
  // جدول اختصاصی برای اسرار auth (کلید بسته‌بندی‌شده، متادیتا)
  auth_secrets!: Table<AuthSecretRow, string>;

  constructor() {
    super('prism_contacts_db');

    // Versioned schema for evolvability
    // v1: initial schema aligned with Supabase
    this.version(1).stores({
      // Primary keys and indexes:
      // Dexie syntax: 'primaryKey, idx1, idx2, [compoundIdx1+compoundIdx2]'
      contacts:
        'id, user_id, updated_at, [_deleted_at], [_conflict]',
      phone_numbers:
        'id, user_id, contact_id',
      email_addresses:
        'id, user_id, contact_id',
      groups:
        'id, user_id',
      custom_fields:
        'id, user_id, contact_id',
      // For join table, we simulate composite primary key by using compound index and uniqueness handled in code
      contact_groups:
        '[contact_id+group_id], user_id',
      sync_meta:
        'key',
      outbox_queue:
        '++id, entity, entityId, op, clientTime, status'
    });

    // v3: جدول لاگ‌های سنک
    this.version(3).stores({
      sync_logs: '++id, startedAt, endedAt, ok, tryCount'
    });

    // v4: جدول اسرار احراز هویت آفلاین
    this.version(4).stores({
      auth_secrets: 'key'
    });

    // v2: افزودن ایندکس‌های LWW برای groups (updated_at, deleted_at, version)
    this.version(2).stores({
      groups:
        'id, user_id, updated_at, [deleted_at], version',
    }).upgrade(async (tx) => {
      const now = new Date().toISOString();
      // backfill برای رکوردهای موجود: مقداردهی updated_at, version, deleted_at
      const all = await tx.table('groups').toArray();
      for (const g of all as any[]) {
        if (g.updated_at == null) g.updated_at = g.created_at ?? now;
        if (g.version == null) g.version = 1;
        if (typeof g.deleted_at === 'undefined') g.deleted_at = null;
        await tx.table('groups').put(g);
      }
    });

    // Map tables
    this.contacts = this.table('contacts');
    this.phone_numbers = this.table('phone_numbers');
    this.email_addresses = this.table('email_addresses');
    this.groups = this.table('groups');
    this.custom_fields = this.table('custom_fields');
    this.contact_groups = this.table('contact_groups');
    this.sync_meta = this.table('sync_meta');
    this.outbox_queue = this.table('outbox_queue');
    this.sync_logs = this.table('sync_logs');
    this.auth_secrets = this.table('auth_secrets');
  }
}

// Singleton DB instance
export const db = new PrismContactsDB();

// Small helpers
export function nowIso(): string {
  return new Date().toISOString();
}