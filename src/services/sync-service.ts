/**
 * PRISM Contacts - SyncService
 * ریفکتور به تزریق SupabaseClient استاندارد + آماده‌سازی Pull/Push واقعی
 */
import { db, type Contact, Mapping, type OutboxRecord as DBOutboxRecord } from '@/database/db';
import type { SupabaseClientType } from '@/integrations/supabase/client';

// Result type یکنواخت
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// منبع واحد نوع Outbox
export type OutboxRecord = DBOutboxRecord;

export class SyncService {
  constructor(private supabase: SupabaseClientType) {}

  private intervalId: any = null;
  private visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      this.sync().catch(console.error);
    }
  };

  // راه‌اندازی زمان‌بندی سینک
  start(intervalMs = 5 * 60 * 1000) {
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this.visibilityHandler);
    }
    // اولین بار بلافاصله
    this.sync().catch(console.error);
    // هر N دقیقه
    this.stop();
    this.intervalId = setInterval(() => {
      this.sync().catch(console.error);
    }, intervalMs);
  }

  // توقف زمان‌بندی
  stop() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // سینک کامل: ابتدا Push سپس Pull
  async sync(): Promise<Result<{ pushed: number; pulled: number }>> {
    try {
      const pushed = await this.push();
      const pulled = await this.pull();
      return { ok: true, data: { pushed, pulled } };
    } catch (e: any) {
      console.error('sync error:', e);
      return { ok: false, error: e?.message ?? 'sync failed' };
    }
  }

  // Pull: دریافت تغییرات جدید از سرور (contacts فعلاً؛ باقی جداول در فاز بعد)
  async pull(): Promise<number> {
    // Contacts
    const contactsMeta = await db.lastSync.get('contacts');
    const since = contactsMeta?.lastPulledAt || '1970-01-01T00:00:00Z';

    // توجه: برای عبور RLS باید کاربر لاگین باشد
    const { data: contacts, error } = await this.supabase
      .from('contacts')
      .select('id, first_name, last_name, gender, role, address, notes, created_at, updated_at')
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Pull contacts error:', error);
      return 0;
    }

    const nowIso = new Date().toISOString();

    let applied = 0;
    await db.transaction('rw', db.contacts, db.mappings, db.lastSync, async () => {
      for (const row of contacts ?? []) {
        const serverId: string = row.id as string;
        const map = await Mapping.getByServer('contact', serverId);
        const mappedPartial: Partial<Contact> = {
          firstName: (row as any).first_name ?? '',
          lastName: (row as any).last_name ?? undefined,
          gender: mapGender((row as any).gender),
          address: (row as any).address ?? undefined,
          notes: (row as any).notes ?? undefined,
          position: (row as any).role ?? undefined,
          phoneNumbers: [],
          searchablePhoneNumbers: [],
          createdAt: (row as any).created_at ? new Date((row as any).created_at) : new Date(),
          updatedAt: (row as any).updated_at ? new Date((row as any).updated_at) : new Date(),
        };

        if (map?.localId) {
          await db.contacts.update(map.localId, mappedPartial);
        } else {
          const localId = await db.contacts.add(mappedPartial as Contact);
          await Mapping.upsert('contact', localId, serverId);
        }
        applied++;
      }
      await db.lastSync.put({ key: 'contacts', lastPulledAt: nowIso });
    });
    return applied;

    // TODO: Pull phone_numbers, email_addresses, custom_fields, contact_groups
    // - کوئری بر اساس updated_at > lastPulledAt هر جدول
    // - resolve mapping برای contact_id / group_id
    // - درج/به‌روزرسانی local و به‌روزرسانی lastSync هر جدول
  }

  // Push: ارسال تغییرات Outbox به سرور به صورت ترتیبی
  async push(): Promise<number> {
    const queue = await db.outbox.orderBy('createdAt').toArray();
    if (queue.length === 0) return 0;

    let succeeded = 0;
    for (const item of queue) {
      try {
        switch (item.entity) {
          case 'contact':
            await this.pushContact(item);
            break;
          case 'phone':
            await this.pushPhone(item);
            break;
          case 'email':
            await this.pushEmail(item);
            break;
          case 'custom':
            await this.pushCustom(item);
            break;
          case 'cglink':
            await this.pushContactGroupLink(item);
            break;
          default:
            console.warn('Unknown outbox entity:', item.entity);
        }
        if (item.id !== undefined) {
          await db.outbox.delete(item.id);
        }
        succeeded++;
      } catch (err) {
        console.error('Push item failed, will retry later:', item, err);
      }
    }
    return succeeded;
  }

  // ارسال عملیات contact
  private async pushContact(item: OutboxRecord) {
    const { op, payload } = item;
    const localId: number | undefined = payload.localId;
    const serverId: string | undefined = payload.serverId;

    if (op === 'contact_create') {
      const body = mapContactToServer(payload.data);
      const { data, error } = await this.supabase
        .from('contacts')
        .insert(body)
        .select('id')
        .single();
      if (error) throw error;
      if (localId != null && data?.id) {
        await Mapping.upsert('contact', localId, data.id as string);
      }
    } else if (op === 'contact_update') {
      let sid = serverId;
      if (!sid && localId !== undefined) {
        const map = await Mapping.getByLocal('contact', localId);
        sid = map?.serverId;
      }
      if (!sid) throw new Error('Missing serverId mapping for contact update');
      const body = mapContactToServer(payload.changes);
      const { error } = await this.supabase.from('contacts').update(body).eq('id', sid);
      if (error) throw error;
    } else if (op === 'contact_delete') {
      let sid = serverId;
      if (!sid && localId !== undefined) {
        const map = await Mapping.getByLocal('contact', localId);
        sid = map?.serverId;
      }
      if (!sid) return; // چیزی برای حذف در سرور نیست
      const { error } = await this.supabase.from('contacts').delete().eq('id', sid);
      if (error) throw error;
    }
  }

  // ارسال عملیات phone_numbers
  private async pushPhone(item: OutboxRecord) {
    const { op, payload } = item;
    // انتظار: payload شامل contactLocalId و/یا contactServerId باشد
    // اینجا فقط اسکلت ثبت شده؛ پیاده‌سازی واقعی در مرحله بعد اضافه می‌شود
    console.log('[SYNC PUSH] phone', op, payload);
  }

  // ارسال عملیات email_addresses
  private async pushEmail(item: OutboxRecord) {
    const { op, payload } = item;
    console.log('[SYNC PUSH] email', op, payload);
  }

  // ارسال عملیات custom_fields
  private async pushCustom(item: OutboxRecord) {
    const { op, payload } = item;
    console.log('[SYNC PUSH] custom', op, payload);
  }

  // ارسال عملیات contact_groups
  private async pushContactGroupLink(item: OutboxRecord) {
    const { op, payload } = item;
    console.log('[SYNC PUSH] cglink', op, payload);
  }
}

// نگاشت جنسیت از سرور به کلاینت
function mapGender(value: string | null): Contact['gender'] {
  if (!value) return undefined;
  if (value === 'male' || value === 'female' || value === 'other') return value;
  return undefined;
}

// نگاشت کلاینت -> سرور
export function mapContactToServer(c: Partial<Contact>) {
  return {
    first_name: c.firstName ?? null,
    last_name: c.lastName ?? null,
    gender: c.gender ?? 'not_specified',
    role: c.position ?? null,
    address: c.address ?? null,
    notes: c.notes ?? null,
  };
}
