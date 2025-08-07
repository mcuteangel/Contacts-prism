import { useEffect, useState, useMemo, useRef } from "react";
import { liveQuery } from "dexie";
import { db } from "@/database/db";
import type { ContactUI, GroupUI } from "@/domain/ui-types";

/**
 * shallowEqualArray - مقایسه سطحی آرایه‌ها (طول و === برای آیتم‌ها)
 */
function shallowEqualArray<T>(a: readonly T[] | null | undefined, b: readonly T[] | null | undefined) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * useStableArray - تثبیت رفرنس خروجی آرایه بر اساس shallowEqual
 */
function useStableArray<T>(value: readonly T[] | null | undefined) {
  const ref = useRef<readonly T[] | null | undefined>(null);
  if (!shallowEqualArray(ref.current, value)) {
    ref.current = value ?? [];
  }
  return (ref.current as T[]) ?? [];
}

// Utility to subscribe to a Dexie liveQuery inside React
function useDexieLive<T>(factory: () => Promise<T> | T, deps: any[]): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let unsub = false;
    const sub = liveQuery(factory).subscribe({
      next: (v) => {
        // جلوگیری از ست‌استیت غیرضروری با مقایسه JSON در حالت آبجکت
        setValue((prev) => {
          try {
            if (prev && typeof prev === "object" && v && typeof v === "object") {
              const a = JSON.stringify(prev);
              const b = JSON.stringify(v);
              if (a === b) return prev;
            }
          } catch {
            // در صورت خطا در stringify، ادامه می‌دهیم
          }
          return v as T;
        });
      },
      error: (e) => {
        console.warn("liveQuery error:", e);
      },
    });
    return () => {
      unsub = true;
      sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

// Live contacts with client-side search (case-insensitive)
export function useLiveContacts(search: string) {
  const normalized = useMemo(() => (search || "").trim().toLowerCase(), [search]);
  const data = useDexieLive(async () => {
    const all = await db.contacts.orderBy("updated_at").toArray();
    // map to UI
    const toUI = (row: any): ContactUI => ({
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      position: row.role ?? undefined,
      company: row.company ?? null,
      address: row.address ?? null,
      notes: row.notes ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row._deleted_at ?? null,
      version: row._version ?? 1,
      conflict: row._conflict ?? false,
      // relations are optional; keep undefined to avoid heavy joins
    });
    const mapped = all.map(toUI);
    if (!normalized) return mapped;
    const hay = (c: ContactUI) =>
      [
        c.firstName,
        c.lastName,
        c.company ?? "",
        c.address ?? "",
        c.notes ?? "",
        c.position ?? "",
      ]
        .join(" ")
        .toLowerCase();
    return mapped.filter((c) => hay(c).includes(normalized));
  }, [normalized]);

  // خروجی پایدار
  return useStableArray<ContactUI>(data as unknown as ContactUI[]);
}

// Live groups (excluding soft-deleted)
export function useLiveGroups() {
  const raw = useDexieLive(async () => {
    const rows = await db.groups.toArray();
    rows.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    return rows.filter((g: any) => !g.deleted_at);
  }, []);

  const mapped = useMemo(() => {
    const rows = (raw ?? []) as any[];
    const out: GroupUI[] = rows.map((g: any) => ({
      id: String(g.id ?? ""),
      userId: g.user_id,
      name: g.name,
      color: g.color ?? null,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      deletedAt: g.deleted_at ?? null,
      version: g.version ?? 1,
    }));
    return out;
  }, [raw]);

  return useStableArray<GroupUI>(mapped);
}

// Live Outbox map for given entity
export function useLiveOutboxMap(entity: "contacts" | "groups") {
  const raw = useDexieLive(async () => {
    const rows = await db.outbox_queue.where("entity").equals(entity).toArray();
    rows.sort((a: any, b: any) => String(a.entityId).localeCompare(String(b.entityId)));
    return rows;
  }, [entity]);

  const mapped = useMemo(() => {
    const rows = (raw ?? []) as any[];
    const map: Record<string, { status: string; tryCount: number }> = {};
    for (const r of rows) {
      map[String(r.entityId)] = { status: r.status, tryCount: r.tryCount ?? 0 };
    }
    return map;
  }, [raw]);

  return mapped;
}