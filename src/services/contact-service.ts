/**
 * ContactService (Offline-first)
 * - Adapter snake_case ↔ camelCase
 * - IndexedDB CRUD + outbox
 * - پاسخ‌ها به‌صورت API-like: { ok, data, error }
 */

import { db, type Contact as ContactDB, nowIso, type OutboxItem, type OutboxOp } from '../database/db';

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
    gender: 'not_specified',
    role: ui.position ?? null,
    company: ui.company ?? null,
    address: ui.address ?? null,
    notes: ui.notes ?? null,
    created_at: ui.createdAt ?? now,
    updated_at: ui.updatedAt ?? now,
    _deleted_at: ui.deletedAt ?? null,
    _version: ui.version ?? 1,
    _conflict: ui.conflict ?? false,
  };
}

function toUI(row: ContactDB): ContactUI {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    position: row.role ?? undefined,
    company: row.company ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
    groupId: (row as any).group_id ?? (row as any).groupId ?? undefined,
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
      const dbRow = toDB(input as ContactUI);
      const now = nowIso();
      dbRow.created_at = now;
      dbRow.updated_at = now;
      dbRow._version = 1;

      await db.transaction('rw', db.contacts, db.outbox_queue, async () => {
        await db.contacts.add(dbRow);
        await enqueue('contacts', dbRow.id, 'insert', dbRow);
      });

      return ok(toUI(dbRow));
    } catch (e: any) {
      return err(e?.message ?? 'createContact failed');
    }
  },

  // به‌روزرسانی مخاطب (Partial)
  async updateContact(id: string, patch: Partial<ContactUI>): Promise<ApiResult<ContactUI>> {
    try {
      const row = await db.contacts.get(id);
      if (!row) return err('Contact not found');

      const currentUI = toUI(row);
      const nextUI: ContactUI = { ...currentUI, ...patch, id };
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
   * جستجوی پیشرفته در مخاطبین با پشتیبانی از فیلدهای مختلف
   * @param query متن جستجو
   * @returns لیست مخاطبین منطبق با جستجو
   */
  async searchContacts(query: string): Promise<ApiResult<{ data: ContactUI[] }>> {
    try {
      const q = (query || "").trim().toLowerCase();
      if (!q) {
        // If query is empty, return all contacts (paginated if needed)
        return this.getAllContacts();
      }

      // Get all contacts from the database
      const allContacts = await db.contacts.toArray();
      const mappedContacts = allContacts.map(toUI);

      // Define searchable fields for each contact
      const getSearchableText = (contact: ContactUI): string => {
        const searchableFields = [
          contact.firstName,
          contact.lastName,
          contact.position,
          contact.company,
          contact.address,
          contact.notes,
          // Search in phone numbers
          ...(contact.phoneNumbers?.map(p => p.number) || []),
          // Search in email addresses
          ...(contact.emails?.map(e => e.address) || []),
          // Search in custom fields (if any)
          ...(contact.customFields?.map(f => f.value) || [])
        ];

        // Join all fields with spaces and convert to lowercase for case-insensitive search
        return searchableFields
          .filter(Boolean) // Remove empty/null/undefined values
          .join(' ')
          .toLowerCase();
      };

      // Filter contacts where any field contains the query
      const filtered = mappedContacts.filter(contact => 
        getSearchableText(contact).includes(q)
      );

      return ok({ data: filtered });
    } catch (error: any) {
      console.error('Error in searchContacts:', error);
      return err(error?.message ?? 'خطا در جستجوی مخاطبین');
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
            position: c.role,
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
              role: contact.position || null,
              company: contact.company || null,
              address: contact.address || null,
              notes: contact.notes || null,
              gender: 'not_specified',
              created_at: contact.createdAt || now,
              updated_at: contact.updatedAt || now,
              _deleted_at: contact.deletedAt || null,
              _version: contact.version || 1,
              _conflict: false
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

      return ok(result);
    } catch (error: any) {
      console.error('Error in importData:', error);
      return err(error?.message ?? 'خطا در وارد کردن داده‌ها');
    }
  },
};
 
export default ContactService;