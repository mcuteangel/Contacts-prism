# Offline-first Architecture

این سند، معماری و گردش‌کارهای کلیدی اپلیکیشن مخاطبین آفلاین‌فرست را توضیح می‌دهد. تمرکز روی سناریوهای بدون اتصال، همگام‌سازی مبتنی بر Outbox، امنیت و تجربه کاربری پایدار است.

نقشه راه این سند:
- اجزا و جداول اصلی
- Migration و LWW
- Outbox و Push
- Pull و LWW
- Scheduler/Backoff/Triggers
- Log Viewer
- UI DTO Unification
- Live Data Hooks
- ContactList: برچسب‌ها و مجازی‌سازی
- Auth و قفل
- تنظیمات و پالیسی‌ها
- تست و سناریوها (Testing Guide + Acceptance Checklist)
- FAQ و نکات عیب‌یابی

## اجزا و جداول اصلی

- IndexedDB/Dexie
  - contacts, groups, phone_numbers, email_addresses, custom_fields, contact_groups
  - outbox_queue: صف عملیات محلی برای Push
  - sync_meta: تنظیمات و متادیتای سنک مانند lastSyncAt و پالیسی‌ها
  - sync_logs: لاگ تله‌متری سنک
  - auth_secrets: کلیدها و اسرار رمزنگاری برای قفل/بازگشایی
- AuthService
  - مدیریت کلیدهای AES-GCM با WebAuthn/PIN
  - سیاست قفل غیرفعال بودن (inactivity) و پنجره آفلاین ۷ روزه
  - token retrieval، unlock، و بررسی reauth آنلاین
- SyncService
  - Push از outbox_queue
  - Pull دلتا با LWW براساس updated_at و soft delete با deleted_at
  - ثبت telemetry در sync_logs و انتشار رویدادها
- UI
  - SyncBootstrapper برای زمان‌بندی سنک
  - Settings/Advanced شامل کنترل پالیسی‌ها و گزارش لاگ‌ها
  - Live hooks برای داده‌های زنده
  - ContactList با برچسب outbox/conflict و مجازی‌سازی

## Migration و LWW

- Groups دارای فیلدهای updated_at, deleted_at, version هستند.
- Migration v2 در Dexie داده‌های قدیمی را backfill می‌کند.
- سیاست LWW:
  - اگر deleted_at ست شده باشد => حذف نرم
  - بین سرور و کلاینت، رکورد جدیدتر براساس updated_at انتخاب می‌شود.
  - version برای تشخیص نسخه محلی/سروری در برخی مسیرها به‌کار می‌رود.

## Outbox و Push

- outbox_queue عملیات‌های CRUD را برای موجودیت‌ها ثبت می‌کند:
  - status: queued | sending | error | done
  - tryCount: تعداد تلاش‌ها
- Push چرخه‌ای:
  1) انتخاب آیتم‌های queued
  2) ارسال به سرور
  3) بروزرسانی status/tryCount
  4) در صورت موفقیت: علامت done یا حذف از صف
  5) در خطا: backoff و نگه داشتن وضعیت error با tryCount

- نقشه outbox برای UI
  - ContactService.getOutboxMap(entity) یک Map از وضعیت‌ها بر اساس id می‌سازد تا UI بتواند برچسب queued/error/… را نشان دهد.

## Pull و LWW

- Pull بر اساس lastSyncAt در sync_meta.
- دریافت تغییرات دلتایی از سرور و اعمال LWW:
  - updated_at تعیین‌کننده غالب است.
  - اگر deleted_at وجود داشته باشد، در کلاینت soft-delete می‌شود.

## Scheduler/Backoff/Triggers

- SyncBootstrapper:
  - backoff نمایی با jitter تصادفی
  - reset backoff روی online/visibilitychange (focus)
  - سنک فوری در online یا focus
  - شمارش معکوس next-run برای UI
  - اعمال پالیسی‌ها در runtime (inactivityMs، پنجره آفلاین) از sync_meta و رویدادها
- رویدادها:
  - app-unlocked => سنک فوری بعد از unlock
  - sync:started/succeeded/failed => برای UI و Log Viewer

## Log Viewer

- فایل [docs/offline-first-architecture.md](docs/offline-first-architecture.md)
  - auto-refresh با رویدادهای sync و بازه زمانی
  - debounce برای کاهش نویز
  - CSV export
  - نمایش telemetry مانند شمار کش و زمان‌بندی، خطاها و وضعیت‌ها
  - پیاده‌سازی در کامپوننت: [src/components/settings/report-sync-logs.tsx](src/components/settings/report-sync-logs.tsx)

## UI DTO Unification

- فایل انواع مرکزی: [src/domain/ui-types.ts](src/domain/ui-types.ts)
  - ContactUI, GroupUI, PhoneNumberUI, EmailAddressUI, CustomFieldUI
  - IDs می‌توانند string|number باشند؛ در مرز سرویس‌ها String(id) می‌شود.
- سرویس‌ها و کامپوننت‌ها از این DTOها استفاده می‌کنند تا mapهای تکراری و castهای ناشناخته حذف شوند.

## Live Data Hooks

- فایل [src/hooks/use-live-data.ts](src/hooks/use-live-data.ts)
  - useLiveContacts(search): ContactUI[] زنده با فیلتر سمت کلاینت
  - useLiveGroups(): GroupUI[] زنده (حذف نرم لحاظ می‌شود)
  - useLiveOutboxMap(entity): نقشه وضعیت outbox به‌صورت زنده
- مزیت: کاهش فشار روی setState و سازگاری با offline-first

## ContactList: برچسب‌ها و مجازی‌سازی

پارامترهای مجازی‌سازی در [src/components/contact-list.tsx](src/components/contact-list.tsx):
- virtualizationEnabled?: boolean (پیش‌فرض: true)
- estimatedRowHeight?: number (پیش‌فرض: 88px)
- overscan?: number (پیش‌فرض: 6 ردیف)

الگوریتم windowing:
- نگهداری scrollTop و viewportHeight با useRef/useState/useEffect
- محاسبه startIndex = floor(scrollTop/rowH) و endIndex = startIndex + visibleCount
- اعمال paddingTop/paddingBottom برای پرکردن فضای قبل/بعد از slice
- Row به‌صورت memo با shallowEqualRowProps برای کاهش re-render

- فایل [src/components/contact-list.tsx](src/components/contact-list.tsx)
  - نمایش برچسب‌های outboxById و conflict
  - بهینه‌سازی:
    - ساخت groupMap با useMemo
    - Row memo با shallowEqualRowProps
    - مجازی‌سازی ساده با props:
      - virtualizationEnabled?: boolean
      - estimatedRowHeight?: number
      - overscan?: number
    - Windowing: محاسبه startIndex/endIndex با scrollTop و viewportHeight و اعمال paddingTop/paddingBottom

## Auth و قفل

- AuthService:
  - WebAuthn/PIN برای آنلاک کلید AES-GCM
  - inactivityMs و offlineAllowedUntil
  - روی online، بررسی reauth
- AppLock در UI برای قفل خودکار و بازگشایی با رویداد app-unlocked برای تریگر سنک

## تنظیمات و پالیسی‌ها

- Settings/Advanced:
  - تنظیم backoff و ترجیحات سنک در sync_meta
  - تنظیم inactivityMs و پنجره آفلاین
  - مشاهده لاگ‌ها و خروجی CSV

## تست و سناریوها

1) ایجاد/ویرایش/حذف مخاطب در حالت آفلاین
   - انتظار: آیتم در outbox_queue با status queued
   - UI: نمایش برچسب queued
2) بازگشت آنلاین
   - انتظار: تریگر سنک فوری، push سپس pull
   - UI: بروزرسانی برچسب‌ها و حذف queuedهای موفق
3) Conflict
   - سناریو: تغییر رکورد در سرور و کلاینت در بازه آفلاین
   - انتظار: LWW اعمال، و اگر تعارض تشخیص داده شد، Conflict badge نمایش داده می‌شود
4) Lock/Unlock
   - بعد از inactivity، قفل فعال
   - بعد از unlock، app-unlocked => سنک انجام می‌شود
5) Backoff
   - خطا در سنک => backoff با jitter
   - focus/online => reset backoff و تلاش مجدد
6) Log Viewer
   - اجرای سنک‌های دستی/خودکار => لاگ‌ها با auto-refresh
   - بررسی CSV export

## Testing Guide (Step-by-step)

چک‌لیست اجرای آزمون‌های کلیدی برای اطمینان از رفتار آفلاین‌فرست و سنک:

- پیش‌نیازها
  - یک کاربر لاگین‌شده و آنلاک‌شده (AppLock باز)
  - داده نمونه: حداقل 2 Group، 3 Contact با phone/email

- A. آفلاین و Outbox
  1) مرورگر را به حالت Offline ببرید (DevTools > Network > Offline)
  2) یک مخاطب جدید بسازید و یک مخاطب دیگر را ویرایش کنید
  3) انتظار:
     - در UI: برچسب queued برای هر دو مخاطب
     - در IndexedDB: رکوردهای outbox_queue با status=queued
  4) اسکرین‌گذاری: از ContactList با برچسب‌ها عکس بگیرید

- B. بازگشت آنلاین و Push/Pull
  1) به Online برگردید
  2) انتظار:
     - تریگر سنک فوری (SyncBootstrapper)
     - status در outbox_queue به sending سپس done تغییر می‌کند
     - برچسب queued در UI ناپدید می‌شود
  3) Log Viewer:
     - لاگ‌های sync:started و sync:succeeded قابل مشاهده باشد
     - CSV export کار کند

- C. Conflict و LWW
  1) Online: یک Contact را در سرور (یا شبیه‌ساز) تغییر دهید
  2) Offline: همان Contact را در کلاینت تغییر دهید
  3) بازگشت Online:
     - انتظار: LWW براساس updated_at اعمال شود
     - اگر تعارض تشخیص داده شود: Conflict badge در UI نمایان
     - sync_logs حاوی جزئیات pull و اعمال LWW

- D. Lock/Unlock و سنک پس از بازگشایی
  1) inactivityMs را در Settings کم کنید (مثلا 20 ثانیه)
  2) منتظر قفل شدن AppLock شوید
  3) Unlock کنید
  4) انتظار: رویداد app-unlocked باعث اجرای سنک شود؛ Log Viewer این رخداد را نشان می‌دهد

- E. Scheduler/Backoff/Triggers
  1) یک خطای عمدی در سنک ایجاد کنید (مانند قطع موقت API)
  2) انتظار: backoff با jitter شروع شود
  3) window.focus یا online تغییر دهید
  4) انتظار: reset backoff و سنک مجدد
  5) UI شمارش next-run را به‌روز نمایش دهد

- F. Live Hooks و Virtualization
  1) تعداد زیادی مخاطب (500+) اضافه کنید
  2) اسکرول در لیست
  3) انتظار: مصرف حافظه کنترل‌شده، فریم‌ریت روان، فقط window آیتم‌ها رندر می‌شوند
  4) جستجو (search) باعث فیلتر کلاینتی سریع شود

## Acceptance Checklist

- [ ] عملیات آفلاین همیشه صف می‌شود و برچسب queued نمایش داده می‌شود
- [ ] بازگشت آنلاین Push/Pull را سریع آغاز می‌کند و برچسب‌ها رفع می‌شوند
- [ ] LWW براساس updated_at اعمال و تعارض‌ها با badge مشخص می‌شوند
- [ ] AppLock بعد از inactivity فعال و پس از Unlock سنک انجام می‌شود
- [ ] Scheduler دارای backoff با jitter و reset روی focus/online است
- [ ] Log Viewer رویدادها را زنده نشان می‌دهد و CSV export دارد
- [ ] Live hooks داده‌ها را به‌روز و با churn کم نگه می‌دارند
- [ ] Virtualization برای لیست‌های بزرگ روان و پایدار عمل می‌کند

## نکات عملکردی

- memoization برای Mapها و Rowها
- کاهش churn با مقایسه شناسه‌ها و طول آرایه‌ها قبل از setState
- windowing برای لیست‌های بزرگ
- debounce برای رویدادهای با فرکانس بالا (اختیاری)

### بهینه‌سازی اسکرول با rAF
- در [src/components/contact-list.tsx](src/components/contact-list.tsx) از batching مبتنی بر [TypeScript.requestAnimationFrame()](typescript.requestAnimationFrame():1) برای اندازه‌گیری اسکرول استفاده می‌شود و در unmount با [TypeScript.cancelAnimationFrame()](typescript.cancelAnimationFrame():1) پاکسازی می‌گردد.
- این کار باعث می‌شود در هر فریم حداکثر یک بار setState انجام شود و از layout thrashing جلوگیری شود.
- در سناریوهای اسکرول سریع یا inertial scrolling ترک‌پد، برش آیتم‌ها همچنان دقیق دنبال می‌شود.

### ارتفاع ثابت اختیاری ردیف‌ها
- می‌توانید برای پایداری بیشتر مجازی‌سازی، ارتفاع ثابت برای ردیف‌ها تعیین کنید:
  - prop جدید: `fixedRowHeight?: number` در [src/components/contact-list.tsx](src/components/contact-list.tsx)
  - وقتی مقداردهی شود، محاسبات startIndex/endIndex دقیق و paddingها قابل پیش‌بینی می‌شوند.
  - برای داده‌های بسیار بزرگ (۵۰هزار+)، پیشنهاد: fixedRowHeight بین 80 تا 96 و overscan بین 6 تا 10.

### چک‌لیست تست عملکردی مجازی‌سازی
- اسکرول بدون jank روی لیست‌های طولانی
- badgeهای outbox/conflict برای آیتم‌های visible به‌روز می‌مانند
- Row memoization مؤثر است (عدم رندر مجدد برای ردیف‌های بدون تغییر)
- با fixedRowHeight هیچ layout shift قابل مشاهده‌ای رخ نمی‌دهد
- با rAF debounce، هندلر اسکرول حداکثر یک‌بار در هر فریم اجرا می‌شود

## آینده و بهبودها

- یکپارچه‌سازی react-virtual یا react-window در صورت نیاز به مجازی‌سازی پیشرفته
- granular conflict resolution UI
- batching برای Push/Pull
- بهبود سیاست امنیتی WebAuthn و rotation کلیدها