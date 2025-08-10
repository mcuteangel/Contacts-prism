/**
 * PRISM Contacts - IndexedDB (Dexie) offline database
 * 
 * این ماژول شامل تعاریف پایگاه داده و مدل‌های داده‌ای است.
 * همگام با اسکیمای Supabase و شامل فیلدهای کمکی برای سنکرون آفلاین.
 */

import Dexie, { type Table } from 'dexie';

// ===== Type Definitions =====

/**
 * شناسه یکتای جهانی (UUID)
 */
export type UUID = string;

/**
 * انواع جنسیت
 */
export type Gender = 'male' | 'female' | 'other' | 'not_specified';

/**
 * وضعیت‌های مختلف آیتم‌های صف خروجی
 */
export type OutboxStatus = 'queued' | 'sending' | 'error' | 'done';

/**
 * انواع عملیات قابل انجام بر روی آیتم‌های صف خروجی
 */
export type OutboxOp = 'insert' | 'update' | 'delete';

/**
 * انواع موجودیت‌هایی که می‌توانند در صف خروجی قرار گیرند
 */
export type OutboxEntity = 
  | 'contacts' 
  | 'phone_numbers' 
  | 'email_addresses' 
  | 'groups' 
  | 'custom_fields' 
  | 'contact_groups';

// ===== Core Models =====

/**
 * مدل مخاطب
 */
export type Contact = {
  phoneNumbers: any;
  position: unknown;
  groupId: string;
  id: UUID;
  user_id: UUID;
  first_name: string;
  last_name: string;
  /** جنسیت */
  gender: Gender;
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

/**
 * مدل شماره تلفن
 */
export interface PhoneNumber {
  /** شناسه یکتای شماره تلفن */
  id: UUID;
  /** شناسه کاربر مالک */
  user_id: UUID;
  /** شناسه مخاطب مرتبط */
  contact_id: UUID;
  /** نوع شماره (مثل: موبایل، منزل، محل کار) */
  phone_type: string;
  /** شماره تلفن */
  phone_number: string;
  /** تاریخ ایجاد به فرمت ISO */
  created_at: string;
}

/**
 * مدل آدرس ایمیل
 */
export interface EmailAddress {
  /** شناسه یکتای ایمیل */
  id: UUID;
  /** شناسه کاربر مالک */
  user_id: UUID;
  /** شناسه مخاطب مرتبط */
  contact_id: UUID;
  /** نوع ایمیل (مثل: شخصی، کاری) */
  email_type: string;
  /** آدرس ایمیل */
  email_address: string;
  /** تاریخ ایجاد به فرمت ISO */
  created_at: string;
}

/**
 * مدل گروه‌بندی مخاطبین
 */
export interface Group {
  /** شناسه یکتای گروه */
  id: UUID;
  /** شناسه کاربر مالک */
  user_id: UUID;
  /** نام گروه */
  name: string;
  /** رنگ گروه (اختیاری) */
  color: string | null;
  /** تاریخ ایجاد به فرمت ISO */
  created_at: string;
  /** تاریخ آخرین به‌روزرسانی برای سنکرون */
  updated_at: string;
  /** تاریخ حذف (حذف نرم‌افزاری) */
  deleted_at?: string | null;
  /** شماره نسخه برای حل تعارض */
  version?: number;
}

/**
 * مدل فیلدهای سفارشی مخاطبین
 */
export interface CustomField {
  /** شناسه یکتای فیلد */
  id: UUID;
  /** شناسه کاربر مالک */
  user_id: UUID;
  /** شناسه مخاطب مرتبط */
  contact_id: UUID;
  /** نام فیلد */
  field_name: string;
  /** مقدار فیلد */
  field_value: string;
  /** تاریخ ایجاد به فرمت ISO */
  created_at: string;
}

/**
 * مدل قالب‌های فیلدهای سفارشی
 */
export interface CustomFieldTemplate {
  /** شناسه یکتای قالب */
  id: number; // Auto-incremented
  /** نام قالب */
  name: string;
  /** نوع داده (text, number, date, list) */
  type: string;
  /** گزینه‌ها (برای نوع list) */
  options?: string[];
  /** توضیحات */
  description?: string;
  /** آیا فیلد الزامی است؟ */
  required: boolean;
  /** آیا این یک قالب پیش‌فرض است؟ */
  is_default: boolean;
  /** تاریخ حذف (حذف نرم) */
  deleted_at?: string | null;
}

/**
 * رابطه چند به چند بین مخاطبین و گروه‌ها
 */
export interface ContactGroup {
  /** شناسه مخاطب */
  contact_id: UUID;
  /** شناسه گروه */
  group_id: UUID;
  /** شناسه کاربر مالک */
  user_id: UUID;
  /** تاریخ انتساب به فرمت ISO */
  assigned_at: string;
}

// ===== Sync & Auth Models =====

/**
 * متادیتاهای سنکرون
 */
export interface SyncMeta {
  /** کلید متادیتا */
  key: string;
  /** مقدار متادیتا */
  value: unknown;
}

/**
 * اطلاعات احراز هویت آفلاین
 */
export interface AuthSecretRow {
  /** کلید ذخیره اطلاعات احراز هویت */
  key: 'auth:secret' | string;
  /** مقدار رمزگذاری شده */
  value: {
    /** کلید اصلی رمزگذاری شده */
    wrappedAesKey?: ArrayBuffer | Uint8Array | string | null;
    /** روش بسته‌بندی کلید */
    wrapMethod?: 'webauthn' | 'pin';
    /** تنظیمات KDF برای رمز عبور */
    pinKdf?: {
      saltB64: string;
      iterations: number;
      hash: 'SHA-256';
    } | null;
    // متادیتا
    /** تاریخ ایجاد */
    createdAt: string;    // ISO
    /** آخرین احراز هویت آنلاین */
    lastOnlineAuthAt: string; // ISO
    /** آخرین باز کردن قفل آفلاین */
    lastUnlockAt?: string | null; // ISO
    /** حداکثر زمان مجاز برای استفاده آفلاین */
    offlineAllowedUntil?: string | null; // ISO
    /** زمان عدم فعالیت مجاز (به میلی‌ثانیه) */
    inactivityMs?: number;
  };
}

/**
 * لاگ عملیات سنکرون
 */
export interface SyncLog {
  /** شناسه یکتای لاگ (اتوماتیک) */
  id?: number;
  /** زمان شروع سنکرون به فرمت ISO */
  startedAt: string;
  /** زمان پایان سنکرون به فرمت ISO */
  endedAt: string;
  /** آیا عملیات با موفقیت انجام شد؟ */
  ok: boolean;
  /** تعداد تلاش‌ها */
  tryCount: number;
  
  /** آمار ارسال داده به سرور */
  pushStats?: {
    /** تعداد رکوردهای ارسال شده */
    attempted?: number;
    /** تعداد رکوردهای ارسال شده با موفقیت */
    sent?: number;
    /** تعداد رکوردهای اعمال شده در سرور */
    applied?: number;
    /** تعداد تعارضات */
    conflicts?: number;
    /** تعداد خطاها */
    errors?: number;
  } | null;
  
  /** آمار دریافت داده از سرور */
  pullStats?: {
    /** آمار مخاطبین */
    contacts?: { 
      /** تعداد افزوده/به‌روزرسانی شده‌ها */
      upserts?: number;
      /** تعداد حذف شده‌ها */
      deletes?: number;
    } | null;
    /** آمار گروه‌ها */
    groups?: { 
      /** تعداد افزوده/به‌روزرسانی شده‌ها */
      upserts?: number;
      /** تعداد حذف شده‌ها */
      deletes?: number;
    } | null;
    /** تعداد کل رکوردهای دریافت شده */
    total?: number;
  } | null;
  
  /** پیغام خطا در صورت شکست */
  error?: string | null;
  
  // --- اطلاعات تکمیلی ---
  
  /** آدرس سرور استفاده شده */
  endpointUsed?: string;
  /** مقدار lastSyncAt قبل از اجرا */
  lastSyncBefore?: string | null;
  /** مقدار جدید lastSyncAt بعد از اجرا */
  lastSyncAfter?: string | null;
  /** مدت زمان اجرا به میلی‌ثانیه */
  durationMs?: number;
}

/**
 * آیتم‌های صف خروجی برای سنکرون
 */
export interface OutboxItem {
  /** شناسه یکتای آیتم (اتوماتیک) */
  id?: number;
  /** نوع موجودیت */
  entity: OutboxEntity;
  /** شناسه موجودیت (ممکن است به صورت رشته ترکیبی باشد) */
  entityId: string;
  /** نوع عملیات */
  op: OutboxOp;
  /** زمان ثبت درخواست به فرمت ISO */
  clientTime: string;
  /** تعداد دفعات تلاش برای ارسال */
  tryCount: number;
  /** وضعیت فعلی آیتم */
  status: OutboxStatus;
  /** محتوای درخواست */
  payload: unknown;
}

/**
 * کلاس اصلی پایگاه داده Prism Contacts
 * 
 * این کلاس ساختار پایگاه داده IndexedDB را با استفاده از Dexie تعریف می‌کند
 * و شامل تمام جداول و روابط بین آن‌ها می‌شود.
 */
class PrismContactsDB extends Dexie {
  // ===== Table Definitions =====
  
  /** جدول مخاطبین */
  contacts!: Table<Contact, string>;
  
  /** جدول شماره تلفن‌ها */
  phone_numbers!: Table<PhoneNumber, string>;
  
  /** جدول آدرس‌های ایمیل */
  email_addresses!: Table<EmailAddress, string>;
  
  /** جدول گروه‌ها */
  groups!: Table<Group, string>;
  
  /** جدول فیلدهای سفارشی */
  custom_fields!: Table<CustomField, string>;
  
  /** جدول قالب‌های فیلدهای سفارشی */
  custom_field_templates!: Table<CustomFieldTemplate, number>;

  /** 
   * جدول رابطه چند به چند بین مخاطبین و گروه‌ها
   * از کلید ترکیبی (contact_id, group_id) استفاده می‌کند
   */
  contact_groups!: Table<ContactGroup, [string, string]>;
  
  /** جدول متادیتاهای سنکرون */
  sync_meta!: Table<SyncMeta, string>;
  
  /** صف عملیات خروجی برای سنکرون */
  outbox_queue!: Table<OutboxItem, number>;
  
  /** جدول لاگ‌های عملیات سنکرون */
  sync_logs!: Table<SyncLog, number>;
  /** 
   * جدول ذخیره اطلاعات احراز هویت آفلاین
   * شامل کلیدهای رمزگذاری شده و اطلاعات احراز هویت
   */
  auth_secrets!: Table<AuthSecretRow, string>;

  constructor() {
    super('prism_contacts_db');

    // ===== Schema Versions =====
    // هر نسخه شامل تغییرات اسکیمای پایگاه داده است
    // و می‌تواند شامل منطق ارتقا (upgrade) باشد

    // نسخه 1: اسکیمای اولیه منطبق با Supabase
    this.version(1).stores({
      // ساختار ایندکس‌ها:
      // سینتکس Dexie: 'کلید_اصلی, ایندکس1, ایندکس2, [ایندکس_ترکیبی1+ایندکس_ترکیبی2]'
      
      // ایندکس‌های جدول مخاطبین
      contacts: 'id, user_id, updated_at, [_deleted_at], [_conflict]',
      
      // ایندکس‌های جدول شماره تلفن‌ها
      phone_numbers: 'id, user_id, contact_id',
      
      // ایندکس‌های جدول آدرس‌های ایمیل
      email_addresses: 'id, user_id, contact_id',
      
      // ایندکس‌های جدول گروه‌ها
      groups: 'id, user_id',
      
      // ایندکس‌های جدول فیلدهای سفارشی
      custom_fields: 'id, user_id, contact_id',
      
      // ایندکس‌های جدول رابطه مخاطبین و گروه‌ها
      contact_groups: '[contact_id+group_id], user_id, group_id',
      
      // ایندکس‌های جدول متادیتاهای سنکرون
      sync_meta: 'key',
      
      // ایندکس‌های صف عملیات خروجی
      outbox_queue: '++id, entity, entityId, op, clientTime, status, [entity+status]',
    });

    // نسخه 2: افزودن ایندکس‌های LWW برای گروه‌ها (updated_at, deleted_at, version)
    this.version(2)
      .stores({
        groups: 'id, user_id, updated_at, [deleted_at], version',
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();
        
        // مقداردهی اولیه برای رکوردهای موجود
        const groups = await tx.table('groups').toArray();
        for (const group of groups) {
          const updates: Partial<Group> = {};
          
          if (!group.updated_at) {
            updates.updated_at = group.created_at || now;
          }
          
          if (typeof group.version === 'undefined') {
            updates.version = 1;
          }
          
          if (typeof group.deleted_at === 'undefined') {
            updates.deleted_at = null;
          }
          
          if (Object.keys(updates).length > 0) {
            await tx.table('groups').update(group.id, updates);
          }
        }
      });

    // نسخه 3: اضافه کردن جدول لاگ‌های سنکرون
    this.version(3).stores({
      sync_logs: '++id, startedAt, endedAt, ok, tryCount, [startedAt+ok]',
    });

    // نسخه 4: اضافه کردن جدول اسرار احراز هویت آفلاین
    this.version(4).stores({
      auth_secrets: 'key',
    });

    // نسخه 5: اضافه کردن جدول قالب‌های فیلدهای سفارشی
    this.version(5).stores({
      custom_field_templates: '++id, name, type, is_default, [deleted_at]',
    });

    // نسخه 6: اضافه کردن ایندکس group_id به جدول contact_groups
    this.version(6).stores({
      contact_groups: '[contact_id+group_id], user_id, group_id',
    });

    // ===== Initialize Table Mappings =====
    
    /** @inheritdoc */
    this.contacts = this.table('contacts');
    /** @inheritdoc */
    this.phone_numbers = this.table('phone_numbers');
    /** @inheritdoc */
    this.email_addresses = this.table('email_addresses');
    /** @inheritdoc */
    this.groups = this.table('groups');
    /** @inheritdoc */
    this.custom_fields = this.table('custom_fields');
    /** @inheritdoc */
    this.custom_field_templates = this.table('custom_field_templates');
    /** @inheritdoc */
    this.contact_groups = this.table('contact_groups');
    /** @inheritdoc */
    this.sync_meta = this.table('sync_meta');
    /** @inheritdoc */
    this.outbox_queue = this.table('outbox_queue');
    /** @inheritdoc */
    this.sync_logs = this.table('sync_logs');
    /** @inheritdoc */
    this.auth_secrets = this.table('auth_secrets');
  }
}

// ===== Singleton Instance =====

/**
 * نمونه یکتای پایگاه داده Prism Contacts
 * 
 * این نمونه برای دسترسی به تمام جداول و عملیات پایگاه داده در سراسر برنامه استفاده می‌شود.
 */
export const db = new PrismContactsDB();

// ===== Helper Functions =====

/**
 * تاریخ و زمان فعلی را به فرمت ISO برمی‌گرداند
 * 
 * @returns رشته حاوی تاریخ و زمان فعلی به فرمت ISO
 * 
 * @example
 * const timestamp = nowIso();
 * // مثال خروجی: '2023-04-05T12:34:56.789Z'
 */
export function nowIso(): string {
  return new Date().toISOString();
}