// ===== IMPORTS & DEPENDENCIES =====
import Dexie, { type Table } from 'dexie';

// ===== TYPES & INTERFACES =====
export interface Contact {
  id?: number;
  firstName: string;
  lastName?: string;
  phoneNumbers: { type: string; number: string }[];
  searchablePhoneNumbers: string[]; // برای ایندکس سریع شماره‌ها
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  position?: string;
  address?: string;
  groupId?: number;
  customFields?: { name: string; value: string; type: 'text' | 'number' | 'date' | 'list' }[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Phone Numbers (لوکال معادل public.phone_numbers)
export interface PhoneNumber {
  id?: number;
  contactLocalId: number;     // ارتباط به لوکال contact
  type: string;               // mobile/work/home...
  number: string;
  createdAt: Date;
  updatedAt: Date;
}

// Email Addresses (لوکال معادل public.email_addresses)
export interface EmailAddress {
  id?: number;
  contactLocalId: number;
  type: string;               // personal/work...
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Custom Fields (لوکال معادل public.custom_fields)
export interface CustomField {
  id?: number;
  contactLocalId: number;
  name: string;
  value: string;
  // نوع فیلد برای همگرایی با دامِین و Templateها
  type?: 'text' | 'number' | 'date' | 'list';
  // اگر نوع list باشد، گزینه‌ها
  options?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Global Custom Field Template (schema سراسری برای پیشنهاد به فرم‌ها)
export interface CustomFieldTemplate {
  id?: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'list';
  options?: string[];     // فقط برای list
  description?: string;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Contact-Groups (لوکال معادل public.contact_groups)
export interface ContactGroupLink {
  id?: number;                // برای سهولت CRUD در Dexie
  contactLocalId: number;
  groupLocalId: number;
  assignedAt: Date;
  updatedAt: Date;
}

// Outbox operation kinds for sync
export type OutboxOpType =
  | 'contact_create' | 'contact_update' | 'contact_delete'
  | 'phone_create' | 'phone_update' | 'phone_delete'
  | 'email_create' | 'email_update' | 'email_delete'
  | 'custom_create' | 'custom_update' | 'custom_delete'
  | 'cglink_create' | 'cglink_delete';

// Outbox record stored in IndexedDB
export interface OutboxRecord {
  id?: number;
  op: OutboxOpType;
  entity: 'contact' | 'phone' | 'email' | 'custom' | 'cglink';
  // payload شامل localId و در صورت وجود serverId و داده/تغییرات
  payload: any;
  createdAt: Date;
}

// Meta key-value برای ذخیره زمان آخرین سینک هر دامنه
export interface LastSyncMeta {
  key: 'contacts' | 'phone_numbers' | 'email_addresses' | 'custom_fields' | 'contact_groups';
  lastPulledAt: string; // ISO string
}

// Mapping بین آیدی لوکال و سروری
export interface IdMapping {
  id?: number;
  entity: 'contact' | 'phone' | 'email' | 'custom' | 'cglink' | 'group';
  localId: number;     // Dexie auto-increment id
  serverId: string;    // Supabase UUID (یا ترکیبی)
  updatedAt: Date;     // آخرین زمان آپدیت مپ
}

// ===== CORE BUSINESS LOGIC =====
export class PrismContactsDB extends Dexie {
  contacts!: Table<Contact>;
  groups!: Table<Group>;
  phoneNumbers!: Table<PhoneNumber>;
  emailAddresses!: Table<EmailAddress>;
  customFields!: Table<CustomField>;
  // جدول Templateهای سراسری
  customFieldTemplates!: Table<CustomFieldTemplate>;
  contactGroupLinks!: Table<ContactGroupLink>;
  outbox!: Table<OutboxRecord>;
  lastSync!: Table<LastSyncMeta>;
  mappings!: Table<IdMapping>;

  constructor() {
    super('PrismContactsDB');

    // نسخه 7: افزودن جدول customFieldTemplates و بهبود ایندکس‌ها
    this.version(7).stores({
      // Contacts و Groups
      contacts:
        '++id, firstName, lastName, *searchablePhoneNumbers, position, groupId, createdAt, updatedAt',
      groups: '++id, name, createdAt, updatedAt',

      // جدیدها: phoneNumbers/emailAddresses/customFields/contactGroupLinks
      phoneNumbers: '++id, contactLocalId, type, number, createdAt, updatedAt, [contactLocalId+number]',
      emailAddresses: '++id, contactLocalId, type, email, createdAt, updatedAt, [contactLocalId+email]',
      customFields: '++id, contactLocalId, name, createdAt, updatedAt, [contactLocalId+name]',
      contactGroupLinks: '++id, contactLocalId, groupLocalId, assignedAt, updatedAt, [contactLocalId+groupLocalId]',

      // Templateهای سراسری
      customFieldTemplates: '++id, name, type, createdAt, updatedAt, [name+type]',

      // Outbox / lastSync / mappings
      outbox: '++id, op, entity, createdAt',
      lastSync: '&key',
      mappings: '++id, [entity+localId], [entity+serverId], updatedAt'
    });

    // نسخه 6: افزودن جداول چندجدولی برای سینک کامل
    this.version(6).stores({
      // Contacts و Groups
      contacts:
        '++id, firstName, lastName, *searchablePhoneNumbers, position, groupId, createdAt, updatedAt',
      groups: '++id, name, createdAt, updatedAt',

      // جدیدها: phoneNumbers/emailAddresses/customFields/contactGroupLinks
      phoneNumbers: '++id, contactLocalId, type, number, createdAt, updatedAt, [contactLocalId+number]',
      emailAddresses: '++id, contactLocalId, type, email, createdAt, updatedAt, [contactLocalId+email]',
      customFields: '++id, contactLocalId, name, createdAt, updatedAt, [contactLocalId+name]',
      contactGroupLinks: '++id, contactLocalId, groupLocalId, assignedAt, updatedAt, [contactLocalId+groupLocalId]',

      // Outbox / lastSync / mappings
      outbox: '++id, op, entity, createdAt',
      lastSync: '&key',
      mappings: '++id, [entity+localId], [entity+serverId], updatedAt'
    });

    // نسخه 5: mappings
    this.version(5).stores({
      contacts:
        '++id, firstName, lastName, *searchablePhoneNumbers, position, groupId, createdAt, updatedAt',
      groups: '++id, name, createdAt, updatedAt',
      outbox: '++id, op, entity, createdAt',
      lastSync: '&key',
      mappings: '++id, [entity+localId], [entity+serverId], updatedAt'
    });

    // نسخه 4: outbox + lastSync
    this.version(4).stores({
      contacts:
        '++id, firstName, lastName, *searchablePhoneNumbers, position, groupId, createdAt, updatedAt',
      groups: '++id, name, createdAt, updatedAt',
      outbox: '++id, op, entity, createdAt',
      lastSync: '&key'
    });

    // نسخه 3: searchablePhoneNumbers
    this.version(3)
      .stores({
        contacts:
          '++id, firstName, lastName, *searchablePhoneNumbers, position, groupId, createdAt, updatedAt',
        groups: '++id, name, createdAt, updatedAt'
      })
      .upgrade(async (tx) => {
        // Migration: ensure searchablePhoneNumbers exists based on phoneNumbers
        await tx
          .table('contacts')
          .toCollection()
          .modify((contact: any) => {
            if (contact.phoneNumbers && !contact.searchablePhoneNumbers) {
              contact.searchablePhoneNumbers = contact.phoneNumbers.map((pn: any) => pn.number);
            }
          });
      });

    // نسخه 2: قدیمی
    this.version(2).stores({
      contacts:
        '++id, firstName, lastName, *phoneNumbers.number, position, groupId, createdAt, updatedAt',
      groups: '++id, name, createdAt, updatedAt'
    });
  }
}

// ===== INITIALIZATION & STARTUP =====
export const db = new PrismContactsDB();

/**
 * Helper utilities to interact with Outbox (enqueue changes)
 */
export const Outbox = {
  // Contacts
  async enqueueCreateContact(payload: any) {
    return db.outbox.add({ op: 'contact_create', entity: 'contact', payload, createdAt: new Date() });
  },
  async enqueueUpdateContact(payload: any) {
    return db.outbox.add({ op: 'contact_update', entity: 'contact', payload, createdAt: new Date() });
  },
  async enqueueDeleteContact(payload: any) {
    return db.outbox.add({ op: 'contact_delete', entity: 'contact', payload, createdAt: new Date() });
  },

  // Phones
  async enqueueCreatePhone(payload: any) {
    return db.outbox.add({ op: 'phone_create', entity: 'phone', payload, createdAt: new Date() });
  },
  async enqueueUpdatePhone(payload: any) {
    return db.outbox.add({ op: 'phone_update', entity: 'phone', payload, createdAt: new Date() });
  },
  async enqueueDeletePhone(payload: any) {
    return db.outbox.add({ op: 'phone_delete', entity: 'phone', payload, createdAt: new Date() });
  },

  // Emails
  async enqueueCreateEmail(payload: any) {
    return db.outbox.add({ op: 'email_create', entity: 'email', payload, createdAt: new Date() });
  },
  async enqueueUpdateEmail(payload: any) {
    return db.outbox.add({ op: 'email_update', entity: 'email', payload, createdAt: new Date() });
  },
  async enqueueDeleteEmail(payload: any) {
    return db.outbox.add({ op: 'email_delete', entity: 'email', payload, createdAt: new Date() });
  },

  // Custom fields
  async enqueueCreateCustom(payload: any) {
    return db.outbox.add({ op: 'custom_create', entity: 'custom', payload, createdAt: new Date() });
  },
  async enqueueUpdateCustom(payload: any) {
    return db.outbox.add({ op: 'custom_update', entity: 'custom', payload, createdAt: new Date() });
  },
  async enqueueDeleteCustom(payload: any) {
    return db.outbox.add({ op: 'custom_delete', entity: 'custom', payload, createdAt: new Date() });
  },

  // Contact-Group link
  async enqueueCreateContactGroupLink(payload: any) {
    return db.outbox.add({ op: 'cglink_create', entity: 'cglink', payload, createdAt: new Date() });
  },
  async enqueueDeleteContactGroupLink(payload: any) {
    return db.outbox.add({ op: 'cglink_delete', entity: 'cglink', payload, createdAt: new Date() });
  }
};

/**
 * Mapping helpers: find or create link between local and server ids
 */
export const Mapping = {
  async getByLocal(entity: IdMapping['entity'], localId: number) {
    return db.mappings.where('[entity+localId]').equals([entity, localId]).first();
  },
  async getByServer(entity: IdMapping['entity'], serverId: string) {
    return db.mappings.where('[entity+serverId]').equals([entity, serverId]).first();
  },
  async upsert(entity: IdMapping['entity'], localId: number, serverId: string) {
    const existing = await db.mappings.where('[entity+localId]').equals([entity, localId]).first();
    const now = new Date();
    if (existing?.id) {
      await db.mappings.update(existing.id, { serverId, updatedAt: now });
      return existing.id;
    }
    return db.mappings.add({ entity, localId, serverId, updatedAt: now });
  }
};