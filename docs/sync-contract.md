# Sync Contract - Offline First

این سند قرارداد همگام‌سازی (Sync) بین کلاینت آفلاین‌اول (IndexedDB/Dexie) و سرور (Supabase/HTTP API) را تعریف می‌کند. هدف: تضمین سازگاری داده‌ها با حداقل رفت‌وآمد، امکان کار کامل آفلاین، و همگام‌سازی تفاضلی (delta) با حل تعارض ساده و قابل پیش‌بینی.

## زمان و قالب‌ها

- فرمت زمان استاندارد: ISO8601 با Z (UTC)، مثال: `2025-08-07T06:00:00.000Z`
- همه timestampها (created_at/updated_at/deleted_at/serverTime) با UTC و پسوند Z ارسال می‌شوند.
- کلاینت نیز مقادیر `clientTime` را به همین فرمت نگه می‌دارد.

## جداول و فیلدها (سمت سرور)

هم‌راستا با Supabase:

### contacts
- id: string (UUID) - کلید اصلی
- user_id: string (UUID) - مالک رکورد
- version: number - نسخه افزایشی برای ایمنی optimistic (کلاینت نیز نگه می‌دارد)
- updated_at: string (ISO8601 Z) - آخرین زمان تغییر
- deleted_at: string | null (ISO8601 Z) - حذف نرم؛ در صورت null یعنی فعال
- سایر فیلدهای دامنه: first_name, last_name, phone_numbers, email_addresses, note, avatar_url, ... (براساس مدل پروژه)

### groups
- id: string (UUID)
- user_id: string (UUID)
- name: string
- color: string | null
- version: number
- updated_at: string (ISO8601 Z)
- deleted_at: string | null

توجه: برای سازگاری LWW بهتر است groups نیز دقیقا مثل contacts دارای updated_at و deleted_at باشد (در Dexie migration لحاظ می‌شود).

## مسیرهای API

### Pull Delta: دریافت تغییرات
- Method: GET
- Path: `{baseUrl}/sync/delta?since={ISO8601}`  
- Headers:
  - `Authorization: Bearer <accessToken>` (اختیاری/بنا به نیاز)
  - `Content-Type: application/json`
- Query:
  - `since`: زمان آخرین همگام‌سازی موفق که کلاینت نگه داشته است (`lastSyncAt`). اگر مقدار موجود نباشد، سرور می‌تواند full snapshot یا محدودیت زمانی قابل قبول برگرداند (پیشنهاد: full snapshot در اولین sync).

- Response 200:
```
{
  "serverTime": "2025-08-07T06:00:00.000Z",
  "contacts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "version": 3,
      "updated_at": "2025-08-07T05:59:30.000Z",
      "deleted_at": null,
      "...": "سایر فیلدها"
    }
  ],
  "groups": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Friends",
      "color": "#00aaff",
      "version": 2,
      "updated_at": "2025-08-07T05:59:10.000Z",
      "deleted_at": null
    }
  ]
}
```

نکات:
- سرور باید تمام رکوردهایی که `updated_at > since` یا `deleted_at > since` دارند را در نتیجه قرار دهد.
- `serverTime` زمان معتبر سرور پس از تولید payload است؛ کلاینت آن را به عنوان `lastSyncAt` جدید ذخیره می‌کند. این باعث می‌شود delta بعدی مبتنی بر زمان قطعی سرور باشد.

### Push Outbox: ارسال تغییرات کلاینت
- Method: POST
- Path: `{baseUrl}/sync/push`
- Headers:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`
- Body:
```
{
  "clientTime": "2025-08-07T05:58:00.000Z",
  "batch": [
    {
      "entity": "contacts" | "groups",
      "entityId": "uuid",
      "op": "insert" | "update" | "delete",
      "version": 3, // نسخه‌ای که کلاینت از آن رکورد می‌داند
      "payload": {
        // داده‌های لازم برای اعمال تغییر (snake_case هم‌راستا با سرور)
      }
    }
  ]
}
```

- Response 200:
```
{
  "ok": true,
  "serverTime": "2025-08-07T05:58:05.000Z",
  "results": [
    {
      "entity": "contacts",
      "entityId": "uuid",
      "status": "applied" | "conflict" | "skipped",
      "serverVersion": 4,
      "serverUpdatedAt": "2025-08-07T05:58:04.000Z",
      "conflict": {
        "reason": "version_mismatch" | "deleted_on_server" | "not_found",
        "serverSnapshot": { ... } // اختیاری برای نمایش یا حل تعارض UI
      }
    }
  ]
}
```

- خطاها:
  - 400 بدنه نامعتبر
  - 401/403 احراز هویت/مجوز
  - 409 تعارض (در حالت دسته‌ای، بهتر است 200 با status per-item برگردد تا کل batch قفل نشود)
  - 500 خطاهای غیرمنتظره

توصیه:
- Push در سمت سرور با سیاست upsert امن و بررسی version انجام شود. اگر نسخه کلاینت عقب‌تر باشد، status=conflict و snapshot برگردد.
- برای delete: سرور deleted_at را ست می‌کند و version/updated_at افزایش می‌یابد.

## سیاست حل تعارض (Conflict Resolution)

- سیاست پیش‌فرض: Last-Write-Wins (LWW) با تکیه بر `updated_at`.
- هنگام Pull:
  - اگر رکورد remote.deleted_at != null و `remote.updated_at >= local.updated_at` => در کلاینت soft delete شود.
  - اگر remote.updated_at > local.updated_at => apply remote (upsert) و هر فلگ `_conflict` محلی پاک شود.
- هنگام Push:
  - اگر سرور تشخیص دهد نسخه/به‌روزرسانی محلی قدیمی است، آیتم را conflict علامت بزند و snapshot بدهد.
  - کلاینت می‌تواند آیتم‌های conflict را در UI لیبل کند و نیازمند مداخله کاربر کند (خودکار یا دستی).

یادداشت: در فاز بعدی می‌توان Field-level merge یا 3-way merge را برای برخی فیلدها اضافه کرد؛ فعلا LWW.

## ذخیره وضعیت همگام‌سازی در کلاینت

- IndexedDB (Dexie):
  - جدول `sync_meta`:
    - key: string (مثلا `lastSyncAt`)
    - value: string (ISO8601 Z)
  - جدول `outbox_queue`:
    - id: auto
    - entity: "contacts" | "groups"
    - entityId: string
    - op: "insert" | "update" | "delete"
    - clientTime: string (ISO8601 Z)
    - tryCount: number
    - status: "queued" | "sending" | "done" | "error"
    - payload: any

- کلید `lastSyncAt` بعد از Pull موفق با `serverTime` بروزرسانی می‌شود.

## نگاشت Case و DTOها

- API سرور: snake_case
- IndexedDB/UI: camelCase
- آداپترها:
  - Contacts:
    - `updated_at` ⇄ `updatedAt`
    - `deleted_at` ⇄ `deletedAt`
    - `user_id` ⇄ `userId`
    - سایر فیلدها مطابق قرارداد
  - Groups:
    - `updated_at` ⇄ `updatedAt`
    - `deleted_at` ⇄ `deletedAt`
    - `user_id` ⇄ `userId`

- نسخه‌های داده:
  - version به صورت عدد صحیح افزایشی است؛ در هر تغییر سمت سرور افزایش می‌یابد. کلاینت نیز هنگام ایجاد/ویرایش محلی می‌تواند version را افزایش دهد تا optimistic flow ساده‌تری داشته باشد؛ اما معیار نهایی حل تعارض `updated_at` (LWW) است.

## جریان Sync

1) Push Outbox
- کلاینت outbox را dedupe می‌کند (delete غالب است؛ insert→update فشرده می‌شود).
- ارسال در batchها با backoff برای خطاها.
- سرور per-item پاسخ می‌دهد؛ applied/ conflict/ skipped.
- آیتم‌های applied → done، conflict → error با متادیتا برای UI.

2) Pull Delta
- GET delta با since = `lastSyncAt` (ISO8601 Z).
- کلاینت برای هر رکورد:
  - اگر deleted_at: soft delete محلی.
  - در غیر این صورت، با LWW upsert کند.
  - فلگ‌های محلی conflict پاک شوند.
- در پایان، `lastSyncAt = serverTime`.

3) رویدادها و UX
- SyncBootstrapper وضعیت را مدیریت و رویدادهای `sync:completed`/`sync:failed` را dispatch می‌کند.
- Settings صفحه‌ای برای manual trigger و مشاهده Outbox دارد.
- در فاز ۴: نشانگرها و توست‌ها تکمیل می‌شوند.

## مثال‌های Edge Case

- First sync (بدون lastSyncAt): کل snapshot یا delta از بازه بلندتر برگردانده شود. سمت کلاینت: `since` را null نفرستید، یا اگر null، سرور full را برگرداند. تصمیم نهایی: اگر lastSyncAt وجود ندارد، کلاینت `since` را قدیمی معنادار (یا حذف query) بفرستد؛ سرور در هر دو حالت باید full result برگرداند.
- Clock skew: معیار `serverTime` برای ذخیره lastSyncAt و مقایسه‌ها استفاده شود، نه زمان کلاینت.
- Multi-device: LWW بر اساس updated_at به‌صورت جهانی رفتار پیش‌بینی‌پذیر دارد.

## چک‌لیست پیاده‌سازی (وضعیت فعلی پروژه)

- GET /sync/delta پیاده و مصرف می‌شود: بله
- Authorization header در pull: بله
- Push endpoint /sync/push: در کلاینت اسکلت batch/queue آماده است؛ سمت سرور نیازمند پیاده‌سازی قرارداد push
- Dexie: contacts دارای updated_at/deleted_at؛ groups نیازمند migration برای updated_at/deleted_at/version (در گام بعد)
- آداپترهای camelCase⇄snake_case: موجود برای contacts؛ برای groups هم‌راستاسازی کامل با فیلدهای جدید پس از migration انجام می‌شود.
- LWW: در pullDelta اعمال شده؛ برای groups پس از migration دقیق‌تر می‌شود.

## نسخه‌گذاری سند

- v1.0.0 (این سند): تثبیت قرارداد زمان‌بندی، ساختار DTOها، مسیرها و LWW.
- تغییرات آینده:
  - افزودن فیلدهای اختصاصی دامنه در Contacts/Groups و به‌روزرسانی DTO
  - پشتیبانی از conflict detail بیشتر در Push
  - بهبودهای امنیتی و pagination deltas (در صورت رشد داده)