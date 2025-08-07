/**
 * SyncService (Phase 2 - Skeleton)
 * هدف: اسکلت همگام‌سازی دوطرفه با Push/Outbox + Pull/Delta + مدیریت lastSyncAt
 * - بدون تماس واقعی سرور؛ فقط wiring با IndexedDB و به‌روزرسانی وضعیت Outbox
 * - آماده برای اتصال به API واقعی در مراحل بعد
 */

import { db, type OutboxItem, type OutboxOp, type OutboxStatus, nowIso } from "@/database/db";

// نتایج API مانند
type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;
function ok<T>(data: T): ApiOk<T> { return { ok: true, data }; }
function err(message: string): ApiErr { return { ok: false, error: message }; }

// پیکربندی پایه
const DEFAULT_BATCH_SIZE = 20;

// نوع خلاصه لاگ برای ذخیره در IndexedDB
type SyncLogEntry = {
  startedAt: string;
  endedAt: string;
  ok: boolean;
  tryCount: number;
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
  error?: string | null;
  // telemetry افزوده‌شده
  endpointUsed?: string;
  lastSyncBefore?: string | null;
  lastSyncAfter?: string | null;
  durationMs?: number;
  // آمار ریزتر Push جهت پایش
  pushAttemptBatches?: number;
  pushAppliedIdsSample?: number[];
  // شمارنده‌های تکمیلی
  conflictsCount?: number;
  errorsCount?: number;
};

export type SyncStats = {
  pushed: number;
  pullInserted: number;
  pullUpdated: number;
  pullDeleted: number;
  errors: number;
  finishedAt: string;
};

export type SyncOptions = {
  batchSize?: number;
  // placeholder برای auth و endpoint
  accessToken?: string;
  endpointBaseUrl?: string;
};

async function getLastSyncAt(): Promise<string | null> {
  const row = await db.sync_meta.get("lastSyncAt");
  return (row?.value as string) ?? null;
}

async function setLastSyncAt(iso: string): Promise<void> {
  await db.sync_meta.put({ key: "lastSyncAt", value: iso });
}

/**
 * pushOutboxToServer - پیاده‌سازی واقعی Push مطابق قرارداد
 * Endpoint: POST {baseUrl}/sync/push
 * Header: Authorization: Bearer {token}
 * Body: { clientTime, batch: [...] }
 */
async function pushOutboxToServer(
  items: OutboxItem[],
  opts?: { baseUrl?: string; accessToken?: string }
): Promise<ApiResult<{ appliedIds: number[]; conflicts: number; errors: number }>> {
  try {
    const base = opts?.baseUrl ?? (process.env.NEXT_PUBLIC_API_BASE_URL || "");
    if (!base) return err("Missing endpoint baseUrl");
    const url = new URL("/sync/push", base);

    const body = {
      clientTime: nowIso(),
      batch: items.map((it) => ({
        entity: it.entity,
        entityId: it.entityId,
        op: it.op,
        version: (it as any).version ?? 1,
        payload: it.payload ?? {},
      })),
    };

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...(opts?.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return err(`pushOutboxToServer failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    // انتظار پاسخ:
    // { ok: true, serverTime: "...", results: [{ entity, entityId, status, serverVersion, serverUpdatedAt, conflict? }] }
    const results = Array.isArray(json.results) ? json.results : [];
    const appliedIds: number[] = [];
    let conflicts = 0;
    let errors = 0;

    // نگاشت appliedها به idهای outbox
    const mapByEntityId = new Map<string, number>();
    for (const it of items) {
      mapByEntityId.set(`${it.entity}:${it.entityId}`, it.id!);
    }

    for (const r of results) {
      const key = `${r.entity}:${r.entityId}`;
      const outboxId = mapByEntityId.get(key);
      if (!outboxId) continue;
      if (r.status === "applied" || r.status === "skipped") {
        appliedIds.push(outboxId);
      } else if (r.status === "conflict") {
        conflicts++;
      } else {
        errors++;
      }
    }

    return ok({ appliedIds, conflicts, errors });
  } catch (e: any) {
    return err(e?.message ?? "pushOutboxToServer exception");
  }
}

type ContactDelta = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gender?: string | null;
  role?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at: string; // برای LWW
  _deleted_at?: string | null;
};

type GroupDelta = {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  created_at?: string;
  updated_at: string; // برای LWW
  _deleted_at?: string | null;
};

type ServerDeltaPayload = {
  serverTime: string; // زمان مرجع سرور
  contacts: ContactDelta[];
  groups: GroupDelta[];
};

/**
 * fetchServerPull - جایگزین واقعی mockServerPull
 * Endpoint: GET {baseUrl}/sync/delta?since=ISO8601
 * Header: Authorization: Bearer {token} (اختیاری بسته به احراز هویت)
 */
async function fetchServerPull(
  since: string | null,
  opts?: { baseUrl?: string; accessToken?: string }
): Promise<ApiResult<ServerDeltaPayload>> {
  try {
    const base = opts?.baseUrl ?? (process.env.NEXT_PUBLIC_API_BASE_URL || "");
    if (!base) return err("Missing endpoint baseUrl");
    const url = new URL("/sync/delta", base);
    if (since) url.searchParams.set("since", since);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        ...(opts?.accessToken ? { "Authorization": `Bearer ${opts.accessToken}` } : {}),
      },
    });

    if (!res.ok) {
      return err(`fetchServerPull failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();

    // انتظار ساختار:
    // {
    //   serverTime: "ISO8601",
    //   contacts: [...], // ContactDelta[]
    //   groups: [...]    // GroupDelta[]
    // }
    const payload: ServerDeltaPayload = {
      serverTime: json.serverTime,
      contacts: Array.isArray(json.contacts) ? json.contacts : [],
      groups: Array.isArray(json.groups) ? json.groups : [],
    };

    return ok(payload);
  } catch (e: any) {
    return err(e?.message ?? "fetchServerPull exception");
  }
}

/**
 * Deduplicate strategy:
 * - برای هر entityId، آخرین عملیات را نگه‌دار (آخرین clientTime بزرگ‌تر است)
 * - اگر آخرین عملیات delete است، تمام before ها حذف (only delete remains)
 * - اگر insert و سپس updateهای متعدد داریم: فقط آخرین update لازم است (insert اولیه را می‌توان با upsert سمت سرور پوشش داد)
 * توجه: این dedupe در سطح کلاینت انجام می‌شود تا تعداد درخواست‌ها کاهش یابد. منطق دقیق سمت سرور باید upsert را پشتیبانی کند.
 */
function dedupeOutbox(items: OutboxItem[]): OutboxItem[] {
  const byKey = new Map<string, OutboxItem[]>();
  for (const it of items) {
    const key = `${it.entity}:${it.entityId}`;
    const arr = byKey.get(key) ?? [];
    arr.push(it);
    byKey.set(key, arr);
  }

  const result: OutboxItem[] = [];
  for (const [, arr] of byKey) {
    // sort by clientTime asc to evaluate final operation
    arr.sort((a, b) => a.clientTime.localeCompare(b.clientTime));
    const last = arr[arr.length - 1];

    // if last is delete -> only keep last delete
    if (last.op === "delete") {
      result.push(last);
      continue;
    }

    // otherwise keep only the last op (update or insert)
    result.push(last);
  }
  // مرتب‌سازی کلی برای push پایدار
  result.sort((a, b) => a.clientTime.localeCompare(b.clientTime));
  return result;
}

/**
 * Push Outbox با batching چندمرحله‌ای تا خالی شدن صف + backoff ساده روی خطا
 * - شامل dedupe روی entityId برای کاهش ترافیک
 */
async function pushOutbox(
  batchSize: number,
  opts?: { baseUrl?: string; accessToken?: string }
): Promise<{ pushed: number; attempted: number; conflicts: number; errors: number }> {
  let pushedTotal = 0;
  let attempted = 0;
  let conflictCount = 0;
  let errorCount = 0;

  while (true) {
    // 1) خواندن batch از queued
    const queuedRaw = await db.outbox_queue
      .where("status")
      .equals("queued")
      .limit(batchSize * 3)
      .sortBy("clientTime");

    if (queuedRaw.length === 0) break;

    // 2) dedupe
    const queued = dedupeOutbox(queuedRaw).slice(0, batchSize);
    if (queued.length === 0) break;
    attempted += queued.length;

    // 3) علامت‌گذاری sending و افزایش tryCount
    await db.transaction("rw", db.outbox_queue, async () => {
      for (const it of queued) {
        await db.outbox_queue.update(it.id!, {
          status: "sending" as OutboxStatus,
          tryCount: (it.tryCount ?? 0) + 1,
        });
      }
    });

    // 4) ارسال واقعی به سرور
    const pushRes = await pushOutboxToServer(queued, { baseUrl: opts?.baseUrl, accessToken: opts?.accessToken });

    if (!pushRes.ok) {
      // backoff: فقط batch جاری را error می‌کنیم و از لوپ خارج می‌شویم
      await db.transaction("rw", db.outbox_queue, async () => {
        for (const it of queued) {
          await db.outbox_queue.update(it.id!, { status: "error" as OutboxStatus });
        }
      });
      break;
    }

    const { appliedIds, conflicts, errors } = pushRes.data;
    conflictCount += conflicts;
    errorCount += errors;

    // 5) applied/skipped -> done
    const appliedSet = new Set(appliedIds);
    await db.transaction("rw", db.outbox_queue, async () => {
      for (const it of queued) {
        if (appliedSet.has(it.id!)) {
          await db.outbox_queue.update(it.id!, { status: "done" as OutboxStatus });
        }
      }
    });

    pushedTotal += appliedIds.length;

    // 6) علامت‌گذاری conflict/error برای باقی مانده‌های batch (برای UI/SRE قابل مشاهده بمانند)
    if (conflicts > 0 || errors > 0) {
      await db.transaction("rw", db.outbox_queue, async () => {
        for (const it of queued) {
          if (!appliedSet.has(it.id!)) {
            await db.outbox_queue.update(it.id!, {
              status: "error" as OutboxStatus,
              // فیلدهای اختیاری - اگر در schema وجود دارند:
              // @ts-ignore
              conflictMeta: { at: nowIso(), note: "server conflict/error" },
            } as any);
          }
        }
      });
    }

    // اگر کمتر از batchSize ارسال شد، احتمالاً صف رو به اتمام است؛ حلقه خودش بررسی را ادامه می‌دهد
  }

  return { pushed: pushedTotal, attempted, conflicts: conflictCount, errors: errorCount };
}

/**
 * Pull Delta بر اساس lastSyncAt (LWW مینیمال روی contacts و groups)
 */
async function pullDelta(
  since: string | null,
  opts?: { baseUrl?: string; accessToken?: string }
): Promise<{ inserted: number; updated: number; deleted: number; serverTime: string; groupsUpserts: number; groupsDeletes: number; contactsUpserts: number; contactsDeletes: number; }> {
  const res = await fetchServerPull(since, { baseUrl: opts?.baseUrl, accessToken: opts?.accessToken });
  if (!res.ok) {
    const fallback = since ?? nowIso();
    return { inserted: 0, updated: 0, deleted: 0, serverTime: fallback, groupsUpserts: 0, groupsDeletes: 0, contactsUpserts: 0, contactsDeletes: 0 };
  }

  const { contacts, groups, serverTime } = res.data;

  let inserted = 0, updated = 0, deleted = 0;
  let groupsUpserts = 0, groupsDeletes = 0;
  let contactsUpserts = 0, contactsDeletes = 0;

  const isNewer = (localUpdatedAt?: string, remoteUpdatedAt?: string) => {
    if (!localUpdatedAt) return true;
    if (!remoteUpdatedAt) return false;
    return Date.parse(remoteUpdatedAt) > Date.parse(localUpdatedAt);
  };

  await db.transaction("rw", db.contacts, db.groups, async () => {
    // Contacts - LWW + soft delete
    for (const c of contacts) {
      const local = await db.contacts.get(c.id);

      if (c._deleted_at) {
        if (local && isNewer(local.updated_at, c.updated_at)) {
          const next = { ...local, _deleted_at: c._deleted_at, updated_at: c.updated_at, _conflict: false };
          await db.contacts.put(next);
          deleted++;
          contactsDeletes++;
        }
        continue;
      }

      if (!local) {
        await db.contacts.put({
          id: c.id,
          user_id: c.user_id,
          first_name: c.first_name,
          last_name: c.last_name,
          gender: (c as any).gender ?? "not_specified",
          role: (c as any).role ?? null,
          company: (c as any).company ?? null,
          address: (c as any).address ?? null,
          notes: (c as any).notes ?? null,
          created_at: c.created_at ?? c.updated_at,
          updated_at: c.updated_at,
          _deleted_at: null,
          _version: 1,
          _conflict: false,
        });
        inserted++;
        contactsUpserts++;
      } else {
        if (isNewer(local.updated_at, c.updated_at)) {
          const next = {
            ...local,
            first_name: c.first_name,
            last_name: c.last_name,
            gender: (c as any).gender ?? local.gender,
            role: (c as any).role ?? local.role,
            company: (c as any).company ?? local.company,
            address: (c as any).address ?? local.address,
            notes: (c as any).notes ?? local.notes,
            updated_at: c.updated_at,
            _deleted_at: null,
            _conflict: false,
          };
          await db.contacts.put(next);
          updated++;
          contactsUpserts++;
        }
      }
    }

    // Groups - اکنون بر پایه فیلدهای updated_at/deleted_at/version
    for (const g of groups) {
      const local = await db.groups.get(g.id);

      if ((g as any)._deleted_at || (g as any).deleted_at) {
        if (local) {
          // اگر سرور حذف نرم را گزارش می‌کند، در کلاینت هم soft کنیم
          const deletedAt = (g as any)._deleted_at ?? (g as any).deleted_at ?? nowIso();
          const next = { ...local, deleted_at: deletedAt, updated_at: (g as any).updated_at ?? deletedAt };
          await db.groups.put(next as any);
          deleted++;
          groupsDeletes++;
        }
        continue;
      }

      if (!local) {
        await db.groups.put({
          id: g.id,
          user_id: g.user_id,
          name: g.name,
          color: g.color ?? null,
          created_at: g.created_at ?? g.updated_at,
          updated_at: g.updated_at,
          deleted_at: null,
          version: (g as any).version ?? 1,
        } as any);
        inserted++;
        groupsUpserts++;
      } else {
        // LWW برای گروه‌ها
        if (isNewer((local as any).updated_at, (g as any).updated_at)) {
          const next = {
            ...local,
            name: g.name,
            color: g.color ?? null,
            updated_at: (g as any).updated_at,
            deleted_at: null,
            version: (g as any).version ?? (local as any).version ?? 1,
          };
          await db.groups.put(next as any);
          updated++;
          groupsUpserts++;
        }
      }
    }
  });

  return { inserted, updated, deleted, serverTime, groupsUpserts, groupsDeletes, contactsUpserts, contactsDeletes };
}

/**
 * اجرای یک دور سنک کامل (Push سپس Pull)
 */
export const SyncService = {
  async runSync(opts: SyncOptions = {}): Promise<ApiResult<SyncStats>> {
    const startedAt = nowIso();
    let log: SyncLogEntry = {
      startedAt,
      endedAt: startedAt,
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
    };

    try {
      const batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE;

      // 2) Pull Delta نیاز به baseUrl دارد؛ ابتدا آن را resolve می‌کنیم تا برای Push هم استفاده کنیم
      const resolvedBaseUrl = opts.endpointBaseUrl ?? (process.env.NEXT_PUBLIC_API_BASE_URL || undefined);
      log.endpointUsed = resolvedBaseUrl ?? "";

      // اعتبارسنجی حداقلی endpoint
      if (!log.endpointUsed) {
        throw new Error("Missing endpoint baseUrl for sync");
      }

      // 1) Push Outbox (batching تا خالی شدن صف) - با اتصال واقعی
      const pushRes = await pushOutbox(batchSize, { baseUrl: resolvedBaseUrl, accessToken: opts.accessToken });
      const totalPushed = pushRes.pushed;
      log.conflictsCount = pushRes.conflicts ?? 0;
      log.errorsCount = pushRes.errors ?? 0;
      log.pushStats = {
        attempted: pushRes.attempted,
        sent: totalPushed,
        applied: totalPushed,
        conflicts: pushRes.conflicts,
        errors: pushRes.errors,
      };
      // اطلاعات تکمیلی برای دیباگ میدانی
      log.pushAttemptBatches = Math.ceil((pushRes.attempted ?? 0) / (batchSize || 1));

      // 2) Pull Delta (اتصال به سرور واقعی با baseUrl و هدر Authorization)
      const last = await getLastSyncAt();
      log.lastSyncBefore = last ?? null;

      const pullRes = await pullDelta(last, {
        baseUrl: resolvedBaseUrl,
        accessToken: opts.accessToken,
      });

      // 3) Update lastSyncAt با serverTime
      await setLastSyncAt(pullRes.serverTime);
      log.lastSyncAfter = pullRes.serverTime ?? null;

      // ثبت pullStats
      log.pullStats = {
        contacts: { upserts: pullRes.contactsUpserts, deletes: pullRes.contactsDeletes },
        groups: { upserts: pullRes.groupsUpserts, deletes: pullRes.groupsDeletes },
        total: pullRes.inserted + pullRes.updated + pullRes.deleted,
      };

      const stats: SyncStats = {
        pushed: totalPushed,
        pullInserted: pullRes.inserted,
        pullUpdated: pullRes.updated,
        pullDeleted: pullRes.deleted,
        errors: (pushRes.errors ?? 0),
        finishedAt: new Date().toISOString(),
      };

      log.ok = true;
      log.endedAt = stats.finishedAt;
      // محاسبه مدت‌زمان
      try {
        const s = Date.parse(log.startedAt);
        const e = Date.parse(log.endedAt);
        if (!Number.isNaN(s) && !Number.isNaN(e)) {
          log.durationMs = Math.max(0, e - s);
        }
      } catch { /* ignore */ }

      // نوشتن لاگ در IndexedDB
      await db.sync_logs.add({
        startedAt: log.startedAt,
        endedAt: log.endedAt,
        ok: log.ok,
        tryCount: log.tryCount,
        pushStats: log.pushStats,
        pullStats: log.pullStats,
        error: log.error,
        endpointUsed: log.endpointUsed,
        lastSyncBefore: log.lastSyncBefore ?? null,
        lastSyncAfter: log.lastSyncAfter ?? null,
        durationMs: log.durationMs,
        // فیلدهای تلمتری تکمیلی
        pushAttemptBatches: log.pushAttemptBatches,
      } as any);

      return ok(stats);
    } catch (e: any) {
      log.ok = false;
      log.error = e?.message ?? "runSync failed";
      log.endedAt = nowIso();
      // محاسبه مدت‌زمان در خطا هم
      try {
        const s = Date.parse(log.startedAt);
        const eT = Date.parse(log.endedAt);
        if (!Number.isNaN(s) && !Number.isNaN(eT)) {
          log.durationMs = Math.max(0, eT - s);
        }
      } catch { /* ignore */ }

      // تلاش برای ذخیره لاگ خطا
      try {
        await db.sync_logs.add({
          startedAt: log.startedAt,
          endedAt: log.endedAt,
          ok: log.ok,
          tryCount: log.tryCount,
          pushStats: log.pushStats,
          pullStats: log.pullStats,
          error: log.error,
          endpointUsed: log.endpointUsed,
          lastSyncBefore: log.lastSyncBefore ?? null,
          lastSyncAfter: log.lastSyncAfter ?? null,
          durationMs: log.durationMs,
        } as any);
      } catch {
        // ignore logging failure
      }

      return err(e?.message ?? "runSync failed");
    }
  },
};

export default SyncService;
