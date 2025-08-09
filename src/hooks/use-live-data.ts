import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "@/database/db";
import type { ContactUI, GroupUI } from "@/domain/ui-types";

/**
 * انواع عملگرهای پشتیبانی شده در جستجو
 */
type SearchOperator = 'AND' | 'OR' | 'NOT';

/**
 * شرط جستجو می‌تواند یک عبارت ساده یا ترکیبی از شرط‌ها باشد
 */
type SearchCondition = {
  field?: string; // فیلد اختیاری (مثلاً name, company و ...)
  value: string;  // مقدار جستجو
  operator?: SearchOperator; // عملگر منطقی (پیش‌فرض: AND)
  exact?: boolean; // آیا جستجو دقیق باشد یا نه
};

/**
 * تجزیه عبارت جستجو به اجزای مختلف
 * @param query عبارت جستجوی ورودی
 * @returns آرایه‌ای از شرایط جستجو
 */
function parseSearchQuery(query: string): SearchCondition[] {
  if (!query.trim()) return [];
  
  const conditions: SearchCondition[] = [];
  const tokens = query.match(/\S+"\S+\"|\S+'\.*?'|\S+/g) || [];
  
  let currentCondition: SearchCondition = { value: '', operator: 'AND' };
  
  for (const token of tokens) {
    // بررسی عملگرهای منطقی
    if (token.toUpperCase() === 'AND' || token.toUpperCase() === 'OR' || token.toUpperCase() === 'NOT') {
      if (currentCondition.value) {
        conditions.push({...currentCondition});
      }
      currentCondition = { value: '', operator: token.toUpperCase() as SearchOperator };
      continue;
    }
    
    // بررسی فیلدهای خاص (مثلاً name:علی)
    const fieldMatch = token.match(/^(\w+):(.+)$/);
    if (fieldMatch) {
      if (currentCondition.value) {
        conditions.push({...currentCondition});
      }
      currentCondition = {
        field: fieldMatch[1],
        value: fieldMatch[2].replace(/^["']|["']$/g, ''),
        operator: 'AND',
        exact: fieldMatch[2].startsWith('"') && fieldMatch[2].endsWith('"')
      };
      continue;
    }
    
    // اضافه کردن به مقدار فعلی
    if (currentCondition.value) {
      currentCondition.value += ' ' + token.replace(/^["']|["']$/g, '');
    } else {
      currentCondition.value = token.replace(/^["']|["']$/g, '');
      currentCondition.exact = token.startsWith('"') && token.endsWith('"');
    }
  }
  
  // اضافه کردن آخرین شرط
  if (currentCondition.value) {
    conditions.push(currentCondition);
  }
  
  return conditions;
}

/**
 * بررسی می‌کند آیا رشته داده شده با عبارت جستجو مطابقت دارد یا خیر
 * @param text متن مورد بررسی
 * @param searchTerm عبارت جستجو
 * @param exact آیا جستجو دقیق باشد یا نه
 * @returns نتیجه تطابق
 */
function matchesSearchTerm(text: string, searchTerm: string, exact: boolean = false): boolean {
  if (!text) return false;
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  
  if (exact) {
    return normalizedText === normalizedSearch;
  }
  
  return normalizedText.includes(normalizedSearch);
}

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

/**
 * بررسی می‌کند آیا یک مخاطب با شرایط جستجوی داده شده مطابقت دارد یا خیر
 * @param contact مخاطب مورد بررسی
 * @param condition شرط جستجو
 * @returns نتیجه تطابق
 */
function contactMatchesCondition(contact: ContactUI, condition: SearchCondition): boolean {
  const { field, value, exact } = condition;
  
  // اگر فیلد مشخص شده باشد، فقط در آن فیلد جستجو می‌کنیم
  if (field) {
    const fieldValue = (contact as any)[field]?.toString() || '';
    return matchesSearchTerm(fieldValue, value, exact);
  }
  
  // در غیر این صورت در همه فیلدهای متنی جستجو می‌کنیم
  const searchableFields = [
    contact.firstName,
    contact.lastName,
    contact.company,
    contact.address,
    contact.notes,
    contact.position,
  ].filter(Boolean).join(' ');
  
  return matchesSearchTerm(searchableFields, value, exact);
}

/**
 * بررسی می‌کند آیا یک مخاطب با تمامی شرایط جستجو مطابقت دارد یا خیر
 * @param contact مخاطب مورد بررسی
 * @param conditions آرایه‌ای از شرایط جستجو
 * @returns نتیجه نهایی تطابق
 */
function contactMatchesAllConditions(contact: ContactUI, conditions: SearchCondition[]): boolean {
  if (conditions.length === 0) return true;
  
  let result = true;
  let currentOperator: SearchOperator = 'AND';
  
  for (const condition of conditions) {
    const matches = contactMatchesCondition(contact, condition);
    const operator = condition.operator || 'AND';
    
    if (currentOperator === 'AND') {
      result = result && matches;
    } else if (currentOperator === 'OR') {
      result = result || matches;
    } else if (currentOperator === 'NOT') {
      result = result && !matches;
    }
    
    currentOperator = operator;
    
    // بهینه‌سازی: اگر نتیجه قطعی شد، حلقه را زودتر تمام می‌کنیم
    if (result === false && operator === 'AND') return false;
    if (result === true && operator === 'OR') return true;
  }
  
  return result;
}

/**
 * هوک برای دریافت لیست زنده مخاطبان با قابلیت جستجوی پیشرفته
 * @param search عبارت جستجو (می‌تواند شامل عملگرهای منطقی و فیلدهای خاص باشد)
 * @returns لیست فیلتر شده مخاطبان
 */
export function useLiveContacts(search: string) {
  // تجزیه عبارت جستجو به شرایط مختلف
  const searchConditions = useMemo(() => parseSearchQuery(search), [search]);
  
  const data = useDexieLive(async () => {
    // دریافت تمام مخاطبان از دیتابیس
    const all = await db.contacts.orderBy("updated_at").toArray();
    
    // تبدیل به فرمت رابط کاربری
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
    });
    
    const mapped = all.map(toUI);
    
    // اگر عبارت جستجو خالی بود، همه مخاطبان را برگردان
    if (!search.trim()) return mapped;
    
    // فیلتر مخاطبان بر اساس شرایط جستجو
    return mapped.filter(contact => 
      contactMatchesAllConditions(contact, searchConditions)
    );
  }, [search, searchConditions]);

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