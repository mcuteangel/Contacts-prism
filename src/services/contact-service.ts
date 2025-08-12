/**
 * ContactService (Offline-first)
 * - Adapter snake_case ↔ camelCase
 * - IndexedDB CRUD + outbox
 * - پاسخ‌ها به‌صورت API-like: { ok, data, error }
 */

import { db, type Contact as ContactDB, nowIso, type OutboxItem, type OutboxOp, type CustomFieldTemplate, type PhoneNumber, type ContactGroup } from '../database/db';
import { ErrorManager } from '@/lib/error-manager';

// ===== Type Definitions =====

/**
 * Represents the data required to create or update a contact
 * Excludes database-generated fields and sync-related fields
 */
export type ContactData = Omit<ContactUI, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'version' | 'conflict'>;

// ========================
// API Result helpers
// ========================
type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiResult<T> = ApiOk<T> | ApiErr;

function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}
function err(message: string): ApiErr {
  return { ok: false, error: message };
}

// ========================
// UI Types (camelCase) — centralized types import
// ========================
import type {
  ContactUI,
  GroupUI,
  PhoneNumberUI,
  EmailAddressUI,
  CustomFieldUI,
} from "@/domain/ui-types";

// ========================
// Adapters
// ========================
function toDB(ui: ContactUI): ContactDB {
  const now = nowIso();
  return {
    id: (ui.id as string) ?? crypto.randomUUID(),
    user_id: ui.userId ?? "anonymous-user",
    first_name: ui.firstName,
    last_name: ui.lastName,
    gender: (ui.gender === 'male' || ui.gender === 'female' || ui.gender === 'other' || ui.gender === 'not_specified') ? ui.gender : 'not_specified',
    role: null, // role فقط برای نوع کاربر در profiles استفاده می‌شود، نه برای مخاطبین
    company: ui.company ?? null,
    address: ui.address ?? null,
    notes: ui.notes ?? null,
    created_at: ui.createdAt ?? now,
    updated_at: ui.updatedAt ?? now,
    _deleted_at: ui.deletedAt ?? null,
    _version: ui.version ?? 1,
    _conflict: ui.conflict ?? false,
    // These fields exist in the database schema but aren't used in the current implementation
    phoneNumbers: Array.isArray(ui.phoneNumbers) ? ui.phoneNumbers : [],
    position: ui.position ?? null,
    groupId: ui.groupId && ui.groupId !== '' && ui.groupId !== 'null' && ui.groupId !== 'undefined' ? String(ui.groupId) : null
  };
}

export function toUI(row: ContactDB): ContactUI {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender as "male" | "female" | "other" | "not_specified" | undefined,
    position: (row as any).position ?? undefined,
    company: row.company ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
    groupId: (row as any).group_id || (row as any).groupId || undefined,
    phoneNumbers: (row as any).phoneNumbers ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: (row as any)._deleted_at ?? null,
    version: (row as any)._version ?? 1,
    conflict: (row as any)._conflict ?? false,
  };
}

// ========================
// Helpers
// ========================
async function enqueue(entity: OutboxItem['entity'], entityId: string, op: OutboxOp, payload: unknown) {
  await db.outbox_queue.add({
    entity,
    entityId,
    op,
    clientTime: nowIso(),
    tryCount: 0,
    status: 'queued',
    payload,
  });
}

// ========================
// Service API
// ========================
export const ContactService = {
  // لیست مخاطبین یک کاربر
  async listByUser(userId: string): Promise<ApiResult<ContactUI[]>> {
    try {
      const rows = await db.contacts.where('user_id').equals(userId).sortBy('updated_at');
      return ok(rows.map(toUI));
    } catch (e: any) {
      return err(e?.message ?? 'listByUser failed');
    }
  },

  // دریافت یک مخاطب
  async getById(id: string): Promise<ApiResult<ContactUI | null>> {
    try {
      const row = await db.contacts.get(id);
      return ok(row ? toUI(row) : null);
    } catch (e: any) {
      return err(e?.message ?? 'getById failed');
    }
  },

  // ایجاد مخاطب (لوکال + صف)
  async createContact(input: Omit<ContactUI, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResult<ContactUI>> {
    try {
      const contactId = crypto.randomUUID();
      const now = nowIso();
      
      const dbRow = toDB({ ...input, id: contactId } as ContactUI);
      dbRow.created_at = now;
      dbRow.updated_at = now;
      dbRow._version = 1;

      await db.transaction('rw', db.contacts, db.phone_numbers, db.contact_groups, db.outbox_queue, async () => {
        // Add contact
        await db.contacts.add(dbRow);
        await enqueue('contacts', dbRow.id, 'insert', dbRow);

        // Add phone numbers
        if (input.phoneNumbers && input.phoneNumbers.length > 0) {
          for (const phone of input.phoneNumbers) {
            if (phone.number?.trim()) {
              const phoneNumber = phone.number.trim();
              
              // Check if phone number already exists
              const existingPhone = await db.phone_numbers
                .where('phone_number')
                .equals(phoneNumber)
                .first();
              
              if (existingPhone) {
                // Skip adding duplicate phone number
                console.warn(`Phone number ${phoneNumber} already exists, skipping...`);
                continue;
              }
              
              const phoneId = crypto.randomUUID();
              const phoneRow: PhoneNumber = {
                id: phoneId,
                user_id: dbRow.user_id,
                contact_id: contactId,
                phone_type: phone.type || 'mobile',
                phone_number: phoneNumber,
                created_at: now,
              };
              await db.phone_numbers.add(phoneRow);
              await enqueue('phone_numbers', phoneId, 'insert', phoneRow);
            }
          }
        }

        // Add to group if specified
        if (input.groupId) {
          const contactGroupRow: ContactGroup = {
            contact_id: contactId,
            group_id: String(input.groupId),
            user_id: dbRow.user_id,
            assigned_at: now,
          };
          await db.contact_groups.add(contactGroupRow);
          await enqueue('contact_groups', `${contactId}_${input.groupId}`, 'insert', contactGroupRow);
        }
      });

      // Return the created contact with phone numbers
      const createdContact = toUI(dbRow);
      createdContact.phoneNumbers = input.phoneNumbers;
      return ok(createdContact);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('createContact failed');
      ErrorManager.logError(error, {
        component: 'ContactService',
        action: 'createContact'
      });
      return err(error.message ?? 'createContact failed');
    }
  },

  // به‌روزرسانی مخاطب (Partial)
  async updateContact(id: string, patch: Partial<ContactUI>): Promise<ApiResult<ContactUI>> {
    try {
      const row = await db.contacts.get(id);
      if (!row) return err('Contact not found');

      const currentUI = toUI(row);
      // فیلتر کردن فیلدهای undefined از patch
      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, value]) => value !== undefined)
      );
      const nextUI: ContactUI = { ...currentUI, ...cleanPatch, id };
      const nextDB = toDB(nextUI);
      nextDB.created_at = row.created_at;
      nextDB.updated_at = nowIso();
      nextDB._version = (row._version ?? 1) + 1;

      await db.transaction('rw', db.contacts, db.outbox_queue, async () => {
        await db.contacts.put(nextDB);
        await enqueue('contacts', id, 'update', nextDB);
      });

      return ok(toUI(nextDB));
    } catch (e: any) {
      return err(e?.message ?? 'updateContact failed');
    }
  },

  // حذف نرم (soft delete) + صف
  async deleteContact(id: string): Promise<ApiResult<null>> {
    try {
      const row = await db.contacts.get(id);
      if (!row) return ok(null);

      const deletedAt = nowIso();
      const next = { ...row, _deleted_at: deletedAt, updated_at: deletedAt, _version: (row._version ?? 1) + 1 };

      await db.transaction('rw', db.contacts, db.outbox_queue, async () => {
        await db.contacts.put(next);
        await enqueue('contacts', id, 'delete', { id, _deleted_at: deletedAt });
      });

      return ok(null);
    } catch (e: any) {
      return err(e?.message ?? 'deleteContact failed');
    }
  },

  // بازگرداندن همه مخاطبین (با صفحه‌بندی اختیاری)
  async getAllContacts(opts?: { pageSize?: number }): Promise<ApiResult<{ data: ContactUI[] }>> {
    try {
      const all = await db.contacts.orderBy('updated_at').toArray();
      const mapped = all.map(toUI);
      const data = opts?.pageSize && opts.pageSize > 0 ? mapped.slice(-opts.pageSize) : mapped;
      return ok({ data });
    } catch (e: any) {
      return err(e?.message ?? 'getAllContacts failed');
    }
  },

  /**
   * پارسر کوئری جستجو برای تجزیه عملگرهای پیشرفته
   * @param query متن جستجو
   * @returns آبجکت حاوی فیلدها و مقادیر جستجو
   */
  parseSearchQuery(query: string): Record<string, string> {
    const result: Record<string, string> = {};
  
    // استخراج جستجوهای فیلد خاص با فرمت field:value
    const fieldRegex = /(\w+):([^\s"]+|"[^"]+")/g;
    let match;
  
    while ((match = fieldRegex.exec(query)) !== null) {
      const [, field, value] = match;
      result[field] = value.replace(/^"|"$/g, ''); // حذف کوتیشن‌ها در صورت وجود
      query = query.replace(match[0], '').trim(); // حذف عبارت پردازش شده از کوئری
    }
  
    // اگر متن باقی‌مانده‌ای وجود داشت، به عنوان جستجوی عمومی در نظر بگیر
    if (query.trim()) {
      result['_all'] = query.trim();
    }
  
    return result;
  },

  /**
   * بررسی تطابق یک مخاطب با معیارهای جستجو
   */
  matchContact(contact: ContactUI, searchTerms: Record<string, string>): boolean {
    // تابع کمکی برای جستجوی فازی
    const fuzzyMatch = (text: string, term: string): boolean => {
      if (!text) return false;
      text = text.toLowerCase();
      term = term.toLowerCase();
    
      // تطابق دقیق
      if (text.includes(term)) return true;
    
      // تطابق فازی (حداقل 3 کاراکتر اول مشترک)
      if (term.length >= 3 && text.startsWith(term)) return true;
    
      // تطابق کلمات (حتی اگر بهم چسبیده باشند)
      const words = term.split(/\s+/);
      return words.every(word => 
        word.length >= 2 && text.includes(word)
      );
    };

    // بررسی هر فیلد جستجو
    return Object.entries(searchTerms).every(([field, term]) => {
      // جستجوی عمومی در همه فیلدها
      if (field === '_all') {
        const searchableText = [
          contact.firstName,
          contact.lastName,
          contact.position,
          contact.company,
          contact.address,
          contact.notes,
          ...(contact.phoneNumbers?.map(p => p.number) || []),
          ...(contact.emails?.map(e => e.address) || []),
          ...(contact.customFields?.map(f => f.value) || [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
      
        return fuzzyMatch(searchableText, term);
      }
    
      // جستجوی فیلد خاص
      switch (field) {
        case 'name':
          return fuzzyMatch(`${contact.firstName} ${contact.lastName}`, term);
        case 'firstname':
          return fuzzyMatch(contact.firstName ?? '', term);
        case 'lastname':
          return fuzzyMatch(contact.lastName ?? '', term);
        case 'company':
          return fuzzyMatch(contact.company ?? '', term);
        case 'position':
          return fuzzyMatch(contact.position ?? '', term);
        case 'phone':
          return (contact.phoneNumbers || []).some(p => fuzzyMatch(p.number ?? '', term));
        case 'email':
          return (contact.emails || []).some(e => fuzzyMatch(e.address ?? '', term));
        case 'address':
          return fuzzyMatch(contact.address ?? '', term);
        case 'notes':
          return fuzzyMatch(contact.notes ?? '', term);
        case 'group':
          // در اینجا باید منطق جستجوی گروه را اضافه کنید
          return false;
        default:
          // بررسی فیلدهای سفارشی
          if (contact.customFields) {
            return contact.customFields.some(
              f => f.name.toLowerCase() === field && fuzzyMatch(f.value ?? '', term)
            );
          }
          return false;
      }
    });
  },

  /**
   * جستجوی پیشرفته در مخاطبین با پشتیبانی از فیلدهای مختلف و عملگرها
   * @param query متن جستجو (مثال: 'name:علی company:شرکت تلفن همراه')
   * @returns لیست مخاطبین منطبق با جستجو
   */
  async searchContacts(query: string): Promise<ApiResult<{ data: ContactUI[] }>> {
    try {
      const q = (query || '').trim();
    
      // اگر کوئری خالی بود، همه مخاطبین را برگردان
      if (!q) {
        return this.getAllContacts();
      }

      // تجزیه کوئری به فیلدها و مقادیر
      const searchTerms = this.parseSearchQuery(q);
    
      // دریافت همه مخاطبین از دیتابیس
      const allContacts = await db.contacts.toArray();
      const mappedContacts = allContacts.map(toUI);
    
      // فیلتر کردن مخاطبین بر اساس معیارهای جستجو
      const filtered = mappedContacts.filter(contact => 
        this.matchContact(contact, searchTerms)
      );

      // ذخیره جستجوی اخیر
      this.saveRecentSearch(q);

      return ok({ data: filtered });
    } catch (error: unknown) {
      const errorInstance = error instanceof Error ? error : new Error('خطا در جستجوی مخاطبین');
      ErrorManager.logError(errorInstance, {
        component: 'ContactService',
        action: 'searchContacts'
      });
      return err(errorInstance.message ?? 'خطا در جستجوی مخاطبین');
    }
  },

  /**
   * ذخیره جستجوی اخیر کاربر
   */
  saveRecentSearch(query: string) {
    try {
      const recentSearches = JSON.parse(
        localStorage.getItem('recentSearches') || '[]'
      ) as string[];
    
      // حذف موارد تکراری و اضافه کردن به ابتدای لیست
      const updatedSearches = [
        query,
        ...recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase())
      ].slice(0, 10); // فقط 10 مورد آخر را نگه دار
    
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Error saving recent search');
      ErrorManager.logError(errorInstance, {
        component: 'ContactService',
        action: 'saveRecentSearch'
      });
    }
  },

  // گروه‌ها
  async getAllGroups(): Promise<ApiResult<GroupUI[]>> {
    try {
      const rows = await db.groups.toArray();
      // مرتب‌سازی در حافظه چون ایندکس name نداریم
      rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      const data: GroupUI[] = rows
        .filter((g) => !g.deleted_at) // حذف‌های نرم شده را نمایش نده
        .map((g: any) => ({
          id: g.id,
          userId: g.user_id,
          name: g.name,
          color: g.color ?? null,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
          deletedAt: g.deleted_at ?? null,
          version: g.version ?? 1,
        }));
      return ok(data);
    } catch (e: any) {
      return err(e?.message ?? 'getAllGroups failed');
    }
  },

  async addGroup(name: string, userId?: string, color?: string | null): Promise<ApiResult<GroupUI>> {
    try {
      const id = crypto.randomUUID();
      const now = nowIso();
      const row = {
        id,
        user_id: userId ?? 'anonymous-user',
        name,
        color: color ?? null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        version: 1,
      };
      await db.transaction('rw', db.groups, db.outbox_queue, async () => {
        await db.groups.add(row as any);
        await enqueue('groups', id, 'insert', row);
      });
      return ok({
        id,
        userId: row.user_id,
        name: row.name,
        color: row.color,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
      });
    } catch (e: any) {
      return err(e?.message ?? 'addGroup failed');
    }
  },

  /**
   * حذف یک گروه و حذف آن از تمام مخاطبین مرتبط
   * @param id شناسه گروه برای حذف
   * @returns نتیجه عملیات
   */
  async deleteGroup(id: string): Promise<ApiResult<null>> {
    try {
      // دریافت گروه برای بررسی وجود
      const group = await db.groups.get(id as any);
      if (!group) {
        // اگر گروه وجود ندارد، برای idempotency موفق برگردیم
        return ok(null);
      }

      const deletedAt = nowIso();
      
      // شروع تراکنش اتمی
      await db.transaction('rw', 
        db.groups, 
        db.contact_groups, 
        db.outbox_queue, 
        db.contacts, 
      async () => {
        // 1. حذف تمام روابط گروه-مخاطب
        const contactGroups = await db.contact_groups
          .where('group_id')
          .equals(id)
          .toArray();

        // 2. به‌روزرسانی هر مخاطب برای حذف گروه
        for (const cg of contactGroups) {
          // حذف رابطه گروه-مخاطب
          await db.contact_groups
            .where(['contact_id', 'group_id'])
            .equals([cg.contact_id, cg.group_id])
            .delete();

          // اضافه کردن به صف برای همگام‌سازی
          await enqueue('contact_groups', `${cg.contact_id}_${cg.group_id}`, 'delete', {
            contact_id: cg.contact_id,
            group_id: cg.group_id,
            deleted_at: deletedAt
          });
        }

        // 3. حذف نرم گروه
        const updatedGroup = { 
          ...group, 
          deleted_at: deletedAt, 
          updated_at: deletedAt, 
          version: (group.version ?? 1) + 1 
        };
        
        await db.groups.put(updatedGroup as any);
        
        // 4. اضافه کردن به صف برای همگام‌سازی
        await enqueue('groups', id, 'delete', { 
          id, 
          deleted_at: deletedAt 
        });
      });

      return ok(null);
    } catch (error: any) {
      console.error('Error in deleteGroup:', error);
      return err(error?.message ?? 'خطا در حذف گروه');
    }
  },
  // وضعیت صف Outbox برای یک entity خاص را به‌صورت map برمی‌گرداند
  async getOutboxMap(entity: 'contacts' | 'groups'): Promise<ApiResult<Record<string, { status: OutboxItem['status']; tryCount: number }>>> {
    try {
      const rows = await db.outbox_queue.where('entity').equals(entity).toArray();
      const map: Record<string, { status: OutboxItem['status']; tryCount: number }> = {};
      for (const r of rows) {
        // آخرین وضعیت برای هر entityId غالب است
        map[r.entityId] = { status: r.status, tryCount: r.tryCount ?? 0 };
      }
      return ok(map);
    } catch (e: any) {
      return err(e?.message ?? 'getOutboxMap failed');
    }
  },

  /**
   * صادر کردن تمام مخاطبین و گروه‌ها به فرمت JSON
   * @returns رشته JSON حاوی تمام داده‌های صادر شده
   */
  async exportAllData(): Promise<ApiResult<string>> {
    try {
      // دریافت تمام داده‌های مورد نیاز
      const [contacts, groups, contactGroups] = await Promise.all([
        db.contacts.toArray(),
        db.groups.toArray(),
        db.contact_groups.toArray()
      ]);

      // ساخت شیء داده نهایی
      const exportData = {
        meta: {
          version: '1.0',
          exportedAt: nowIso(),
          itemCount: {
            contacts: contacts.length,
            groups: groups.length,
            contactGroups: contactGroups.length
          }
        },
        data: {
          contacts: contacts.map(c => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            position: (c as any).position,
            company: c.company,
            address: c.address,
            notes: c.notes,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            version: c._version,
            deletedAt: c._deleted_at
          })),
          groups: groups.map(g => ({
            id: g.id,
            name: g.name,
            color: g.color,
            createdAt: g.created_at,
            updatedAt: g.updated_at,
            version: g.version,
            deletedAt: g.deleted_at
          })),
          contactGroups: contactGroups.map(cg => ({
            contactId: cg.contact_id,
            groupId: cg.group_id,
            assignedAt: cg.assigned_at
          }))
        }
      };

      return ok(JSON.stringify(exportData, null, 2));
    } catch (error: any) {
      console.error('Error in exportAllData:', error);
      return err(error?.message ?? 'خطا در صادر کردن داده‌ها');
    }
  },

  /**
   * وارد کردن داده‌ها از یک رشته JSON
   * @param jsonString رشته JSON حاوی داده‌های وارد شونده
   * @returns نتیجه عملیات وارد کردن
   */
  async importData(jsonString: string): Promise<ApiResult<{
    imported: { contacts: number; groups: number; contactGroups: number };
    skipped: { contacts: number; groups: number; contactGroups: number };
  }>> {
    try {
      const data = JSON.parse(jsonString);
      
      // اعتبارسنجی اولیه ساختار داده
      if (!data || typeof data !== 'object' || !data.data) {
        return err('قالب فایل وارد شده نامعتبر است');
      }

      const { contacts = [], groups = [], contactGroups = [] } = data.data;
      const result = {
        imported: { contacts: 0, groups: 0, contactGroups: 0 },
        skipped: { contacts: 0, groups: 0, contactGroups: 0 }
      };

      // شروع تراکنش اتمی
      await db.transaction('rw', 
        db.contacts, 
        db.groups, 
        db.contact_groups, 
        db.outbox_queue,
      async () => {
        const now = nowIso();
        
        // وارد کردن گروه‌ها
        for (const group of groups) {
          try {
            // بررسی وجود گروه با همین شناسه
            const exists = await db.groups.get(group.id);
            if (exists) {
              result.skipped.groups++;
              continue;
            }

            // ایجاد رکورد جدید گروه
            await db.groups.add({
              id: group.id,
              user_id: group.user_id || 'imported-user',
              name: group.name,
              color: group.color || null,
              created_at: group.createdAt || now,
              updated_at: group.updatedAt || now,
              deleted_at: group.deletedAt || null,
              version: group.version || 1
            });

            // اضافه کردن به صف همگام‌سازی
            await enqueue('groups', group.id, 'insert', {
              ...group,
              created_at: group.createdAt || now,
              updated_at: group.updatedAt || now
            });

            result.imported.groups++;
          } catch (error) {
            console.error('Error importing group:', group.id, error);
            result.skipped.groups++;
          }
        }

        // وارد کردن مخاطبین
        for (const contact of contacts) {
          try {
            // بررسی وجود مخاطب با همین شناسه
            const exists = await db.contacts.get(contact.id);
            if (exists) {
              result.skipped.contacts++;
              continue;
            }

            // ایجاد رکورد جدید مخاطب
            await db.contacts.add({
              id: contact.id,
              user_id: contact.user_id || 'imported-user',
              first_name: contact.firstName,
              last_name: contact.lastName,
              role: null, // role فقط برای نوع کاربر استفاده می‌شود
              company: contact.company || null,
              address: contact.address || null,
              notes: contact.notes || null,
              gender: 'not_specified',
              created_at: contact.createdAt || now,
              updated_at: contact.updatedAt || now,
              _deleted_at: contact.deletedAt || null,
              _version: contact.version || 1,
              _conflict: false,
              // اضافه کردن فیلدهای اجباری
              phoneNumbers: contact.phoneNumbers || [],
              position: contact.position || null,
              groupId: contact.groupId || null
            });

            // اضافه کردن به صف همگام‌سازی
            await enqueue('contacts', contact.id, 'insert', {
              ...contact,
              created_at: contact.createdAt || now,
              updated_at: contact.updatedAt || now,
              _deleted_at: contact.deletedAt || null
            });

            result.imported.contacts++;
          } catch (error) {
            console.error('Error importing contact:', contact.id, error);
            result.skipped.contacts++;
          }
        }

        // وارد کردن ارتباطات مخاطب-گروه
        for (const cg of contactGroups) {
          try {
            // بررسی وجود رابطه
            const exists = await db.contact_groups
              .where(['contact_id', 'group_id'])
              .equals([cg.contactId, cg.groupId])
              .first();

            if (exists) {
              result.skipped.contactGroups++;
              continue;
            }

            // ایجاد رابطه جدید
            await db.contact_groups.add({
              contact_id: cg.contactId,
              group_id: cg.groupId,
              user_id: 'imported-user',
              assigned_at: cg.assignedAt || now
            });

            // اضافه کردن به صف همگام‌سازی
            await enqueue('contact_groups', `${cg.contactId}_${cg.groupId}`, 'insert', {
              contact_id: cg.contactId,
              group_id: cg.groupId,
              assigned_at: cg.assignedAt || now
            });

            result.imported.contactGroups++;
          } catch (error) {
            console.error('Error importing contact-group relationship:', cg, error);
            result.skipped.contactGroups++;
          }
        }
      });

      // Return the import results
      return ok(result);
    } catch (error: any) {
      console.error('Error in importData:', error);
      return err(error?.message ?? 'خطا در وارد کردن داده‌ها');
    }
  },

  /**
   * مقداردهی اولیه قالب‌های فیلد سفارشی پیش‌فرض
   */
  async seedDefaultCustomFieldTemplates() {
    try {
      // First check if table exists
      try {
        await db.custom_field_templates.count();
      } catch (e) {
        console.error('custom_field_templates table does not exist or is not accessible');
        return;
      }

      const count = await db.custom_field_templates.count();
      if (count > 0) {
        return; // فقط اگر خالی بود، مقداردهی اولیه کن
      }

      const defaultTemplates: Omit<CustomFieldTemplate, 'id'>[] = [
        { 
          name: 'تاریخ تولد', 
          type: 'date', 
          required: false, 
          is_default: true, 
          deleted_at: '' 
        },
        { 
          name: 'آدرس وبسایت', 
          type: 'text', 
          required: false, 
          is_default: true, 
          deleted_at: '' 
        },
        { 
          name: 'لینکدین', 
          type: 'text', 
          required: false, 
          is_default: true, 
          deleted_at: '' 
        },
      ];

      try {
        await db.custom_field_templates.bulkAdd(defaultTemplates as any);
        console.log('Successfully seeded default custom field templates');
      } catch (e) {
        console.error('Error adding default templates:', e);
      }
    } catch (e) {
      console.error("Failed to seed default custom field templates", e);
    }
  },

  /**
   * دریافت تمام قالب‌های فیلد سفارشی (به‌جز حذف شده‌ها)
   */
  async getAllCustomFieldTemplates(): Promise<ApiResult<CustomFieldTemplate[]>> {
    try {
      await this.seedDefaultCustomFieldTemplates(); // Ensure defaults are seeded
      
      // Get all templates and filter in memory since we can't use the compound index directly
      const allTemplates = await db.custom_field_templates.toArray();
      
      // Filter out deleted templates (where deleted_at is not empty)
      const activeTemplates = allTemplates.filter(template => 
        !template.deleted_at || template.deleted_at === ''
      );
      
      console.log('Retrieved custom field templates:', activeTemplates);
      return ok(activeTemplates);
    } catch (e: any) {
      console.error('Error in getAllCustomFieldTemplates:', e);
      return err(e?.message ?? 'Failed to get custom field templates');
    }
  },

  /**
   * افزودن یک قالب فیلد سفارشی جدید
   */
  async addCustomFieldTemplate(template: Omit<CustomFieldTemplate, 'id' | 'is_default' | 'deleted_at'>): Promise<ApiResult<CustomFieldTemplate>> {
    try {
      const newTemplate: Omit<CustomFieldTemplate, 'id'> = {
        ...template,
        is_default: false,
        deleted_at: null,
      };
      const id = await db.custom_field_templates.add(newTemplate as any);
      return ok({ ...newTemplate, id });
    } catch (e: any) {
      return err(e?.message ?? 'Failed to add custom field template');
    }
  },

  /**
   * به‌روزرسانی یک قالب فیلد سفارشی
   */
  async updateCustomFieldTemplate(id: number, patch: Partial<CustomFieldTemplate>): Promise<ApiResult<CustomFieldTemplate>> {
    try {
      await db.custom_field_templates.update(id, patch);
      const updatedTemplate = await db.custom_field_templates.get(id);
      return ok(updatedTemplate!);
    } catch (e: any) {
      return err(e?.message ?? 'Failed to update custom field template');
    }
  },

  /**
   * حذف یک قالب فیلد سفارشی
   * - اگر پیش‌فرض بود، حذف نرم
   * - اگر کاربر ساخته بود، حذف کامل
   */
  async deleteCustomFieldTemplate(id: number): Promise<ApiResult<null>> {
    try {
      const template = await db.custom_field_templates.get(id);
      if (!template) return ok(null);

      if (template.is_default) {
        await db.custom_field_templates.update(id, { deleted_at: nowIso() });
      } else {
        await db.custom_field_templates.delete(id);
      }
      return ok(null);
    } catch (e: any) {
      return err(e?.message ?? 'Failed to delete custom field template');
    }
  },

  /**
   * انتقال داده‌های role به position برای مخاطبین موجود
   * این تابع یک بار اجرا می‌شود تا داده‌های قدیمی را اصلاح کند
   */
  async migrateRoleToPosition(): Promise<ApiResult<{ migrated: number }>> {
    try {
      const contacts = await db.contacts.toArray();
      let migratedCount = 0;

      await db.transaction('rw', db.contacts, async () => {
        for (const contact of contacts) {
          // اگر role دارد اما position ندارد، role را به position منتقل کن
          if (contact.role && !(contact as any).position) {
            const updatedContact = {
              ...contact,
              position: contact.role,
              role: null, // role را پاک کن
              updated_at: nowIso(),
              _version: (contact._version ?? 1) + 1
            };
            
            await db.contacts.put(updatedContact);
            migratedCount++;
          }
        }
      });

      console.log(`Migrated ${migratedCount} contacts from role to position`);
      return ok({ migrated: migratedCount });
    } catch (error: any) {
      console.error('Error in migrateRoleToPosition:', error);
      return err(error?.message ?? 'Migration failed');
    }
  },

  /**
   * مقداردهی اولیه و migration های لازم
   */
  async initialize(): Promise<ApiResult<{ migrations: { roleToPosition: number } }>> {
    try {
      // اجرای migration برای انتقال role به position
      const migrationResult = await this.migrateRoleToPosition();
      
      if (!migrationResult.ok) {
        return err(`Migration failed: ${migrationResult.error}`);
      }

      // مقداردهی اولیه قالب‌های فیلد سفارشی
      await this.seedDefaultCustomFieldTemplates();

      return ok({
        migrations: {
          roleToPosition: migrationResult.data.migrated
        }
      });
    } catch (error: any) {
      console.error('Error in ContactService.initialize:', error);
      return err(error?.message ?? 'Initialization failed');
    }
  },
};