# PRISM Contacts - Database Setup

این راهنما نحوه راه‌اندازی دیتابیس برای دو سناریو را توضیح می‌دهد:
1) Supabase (با auth و RLS آماده)
2) PostgreSQL مستقل (بدون Supabase)

برای هر دو سناریو، اسکریپت‌ها idempotent هستند (اجرای مجدد امن).

## ساختار فایل‌ها

- supabase/schema.supabase.sql
  - مخصوص Supabase
  - استفاده از auth.users، تابع auth.uid()، RLS و تریگر پروفایل
- supabase/schema.postgres.sql
  - مخصوص PostgreSQL استاندارد
  - شامل لایه سازگاری چندکاربری (جدول users) و تابع current_user_id() مبتنی بر GUC
  - RLS با current_user_id()

## 1) اجرای اسکریپت در Supabase

روش پیشنهادی: Supabase SQL Editor

گام‌ها:
1. به پروژه Supabase خود وارد شوید.
2. از منوی SQL، روی New Query کلیک کنید.
3. محتوای فایل supabase/schema.supabase.sql را کپی و اجرا کنید.
4. پس از اجرا:
   - جدول‌های اصلی (contacts, phone_numbers, email_addresses, groups, custom_fields, contact_groups) ایجاد می‌شوند.
   - RLS فعال و پالیسی‌ها برای هر جدول اعمال می‌شوند.
   - جدول profiles و تریگر handle_new_user برای auth.users ساخته می‌شود.
   - تریگر handle_updated_at روی contacts به‌روزرسانی می‌شود.

نکات:
- این اسکریپت فرض می‌کند auth.users در Supabase موجود است؛ بنابراین در PostgreSQL خام اجرا نشود.
- برای پرفورمنس سینک، ایندکس idx_contacts_updated_at روی contacts ساخته شده است.

تست سریع:
- ثبت‌نام/ورود یک کاربر در Supabase
- درج یک مخاطب:
  insert into public.contacts (user_id, first_name, last_name) values (auth.uid(), 'Ali', 'Rezayi');
- کوئری:
  select * from public.contacts where user_id = auth.uid();

## 2) اجرای اسکریپت در PostgreSQL مستقل

پیش‌نیاز: PostgreSQL 13+

روش اجرا (psql):
- لینوکس/مک:
  psql postgresql://USER:PASSWORD@HOST:PORT/DBNAME -f ./supabase/schema.postgres.sql
- ویندوز (PowerShell):
  psql "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" -f ".\supabase\schema.postgres.sql"

پس از اجرا:
- جدول users به‌عنوان لایه لاجیکال احراز هویت ساخته می‌شود.
- تابع public.current_user_id() با استفاده از GUC prism.current_user_id برای RLS استفاده می‌شود.
- برای هر سشن/ریکوئست باید current_user_id را ست کنید.

تنظیم کاربر جاری (نمونه):
-- ایجاد کاربر دمو
insert into public.users (email, full_name, role)
values ('demo@example.com','Demo User','admin')
on conflict (email) do nothing;

-- تنظیم کاربر جاری برای سشن/کانکشن
select public.set_current_user_id(
  (select id from public.users where email='demo@example.com'),
  true -- ست برای کل سشن
);

-- درج مخاطب برای کاربر جاری
insert into public.contacts (user_id, first_name, last_name)
values (public.current_user_id(), 'Sara', 'Ahmadi');

-- مشاهده داده‌ها محدود به کاربر جاری
select * from public.contacts;

نکات RLS در نسخه Postgres:
- اگر prism.current_user_id ست نشده باشد، current_user_id() خطا می‌دهد تا دسترسی تصادفی بین اجاره‌کننده‌ها رخ ندهد.
- در اپلیکیشن، هنگام ساخت Connection/Pool، بعد از اتصال، set_config را یک‌بار فراخوانی کنید.

## تفاوت‌های کلیدی Supabase vs Postgres

Supabase:
- user_id به auth.users اشاره دارد.
- auth.uid() در RLS و مقادیر insert استفاده می‌شود.
- تریگر پروفایل از auth.users استفاده می‌کند.

Postgres مستقل:
- user_id به public.users اشاره دارد.
- current_user_id() از GUC (prism.current_user_id) می‌آید؛ باید توسط اپ ست شود.
- جدول profiles اختیاری است و مستقل از users ساخته می‌شود.

## پیشنهادات برای Offline-first + Sync

- از فیلد updated_at (UTC) برای تشخیص تغییرات استفاده کنید.
- ایندکس idx_contacts_updated_at برای Pullهای افزایشی.
- در کلاینت، یک outbox (صف تغییرات) نگه دارید و Pushها را به‌صورت ترتیبی اجرا کنید.
- حل تعارض پیشنهادی: Server-wins با مقایسه updated_at؛ یا Field-level merge در صورت نیاز.
- برای soft-delete می‌توانید در کلاینت deleted_at داشته باشید و در سرور ردیف‌ها را بلافاصله حذف نکنید (در این اسکیما حذف سخت است؛ می‌توانید در نسخه‌های بعدی ستون deleted_at اضافه کنید).

## احراز هویت و نقش‌ها (Client Integration)

کلاینت Next.js از Supabase Auth استفاده می‌کند. اجزای اصلی:

- [src/context/auth-provider.tsx](src/context/auth-provider.tsx:1)
  - مدیریت session و user و role (خواندن از جدول profiles).
  - APIها: auth.signInWithPassword، signOut، refreshRole.
- [src/app/login/page.tsx](src/app/login/page.tsx:1)
  - صفحه ورود ایمیل/پسورد.
- [src/components/auth/role-guard.tsx](src/components/auth/role-guard.tsx:1)
  - RequireAuth و RequireRole برای محافظت مسیری.
- [src/app/layout.tsx](src/app/layout.tsx:1)
  - سیم‌کشی AuthProvider، SyncBootstrapper و قفل لایه دوم.
- مسیرهای مدیر محافظت شده:
  - [src/app/settings-advanced/page.tsx](src/app/settings-advanced/page.tsx:1)
  - [src/app/tools/page.tsx](src/app/tools/page.tsx:1)

نقش‌ها:
- نقش کاربر در جدول profiles.role ذخیره می‌شود (admin | user).
- برای تغییر نقش، از کنسول Supabase مقدار role را آپدیت کنید.

ENV لازم برای کلاینت:
- [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts:1) از NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY (با fallback به VITE_*) در زمان بیلد استفاده می‌کند.
- فایل .env.local (Development) نمونه:
  NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"

## قفل لایه دوم (AppSecureLock)

- کامپوننت: [src/components/security/app-secure-lock.tsx](src/components/security/app-secure-lock.tsx:1)
  - صرفاً UI را قفل می‌کند و ارتباطی با session ندارد.
  - وضعیت در localStorage نگهداری می‌شود (app_lock_enabled, app_lock_pin, app_lock_biometric).
  - در [src/app/layout.tsx](src/app/layout.tsx:1) پس از AuthProvider رندر می‌شود.
- کامپوننت قبلی غیرفعال شد:
  - [src/components/app-lock.tsx](src/components/app-lock.tsx:1) اکنون یک شل خالی است برای سازگاری import.

رویدادهای کمکی:
- dispatchEvent(new Event("app-lock:lock")) برای قفل‌کردن آنی UI (اگر فعال باشد).

نکات امنیتی:
- نسخه فعلی PIN را hash نمی‌کند؛ برای تولیدی پیشنهاد می‌شود از WebCrypto برای مشتق کلید و ذخیره امن (یا Secure Storage در PWA) استفاده شود.

## عیب‌یابی رایج

Supabase:
- خطای مجوز هنگام SELECT/INSERT: بررسی کنید RLS فعال است و auth.uid() مقدار دارد (کاربر احراز هویت شده).
- خطا در تریگر پروفایل: اطمینان از وجود auth.users و دسترسی‌های لازم.

Client:
- مقداردهی env: کنسول را برای هشدارهای "[Supabase]" بررسی کنید و NEXT_PUBLIC_* را در .env.local تکمیل کنید.
- نقش null: بررسی کنید ردیف profiles برای کاربر ایجاد شده و ستون role مقدار دارد.

Postgres:
- خطا: prism.current_user_id is not set
  - قبل از هر عملیات، set_current_user_id را فراخوانی کنید.
- عدم مشاهده داده‌ها:
  - RLS داده‌ها را فیلتر می‌کند؛ user_id و current_user_id باید منطبق باشند.

## لینک‌های مرجع

- Supabase Policies & RLS: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL GUCs: https://www.postgresql.org/docs/current/runtime-config.html