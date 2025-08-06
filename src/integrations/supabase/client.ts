/**
 * Supabase Browser Client (Next.js App Router)
 * - خواندن env کاملاً سازگار با Next: فقط از process.env در زمان بیلد
 * - نیاز: تعریف کلیدهای NEXT_PUBLIC_* در فایل‌های env (مانند .env.local برای dev)
 * - برای سازگاری با فایل فعلی، اگر NEXT_PUBLIC_* نبود از VITE_* نیز در زمان بیلد fallback می‌گیریم
 */
'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * نکته خیلی مهم Next.js:
 * فقط متغیرهایی که با NEXT_PUBLIC_ شروع می‌شوند به باندل کلاینت تزریق می‌شوند.
 * بنابراین استاندارد این پروژه را به NEXT_PUBLIC_* تغییر می‌دهیم.
 *
 * برای راحتی، اگر کاربر فقط VITE_* را در .env گذاشته باشد،
 * در زمان بیلد از process.env.VITE_* نیز fallback می‌کنیم.
 * (Next هنگام بیلد این‌ها را resolve می‌کند.)
 */
const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  (process.env.VITE_SUPABASE_URL as string | undefined) ||
  '';

const SUPABASE_ANON_KEY =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (process.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  '';

/**
 * به‌جای throw کردن خطا در runtime (که ممکن است باعث قطع رندر شود)،
 * یک fallback امن می‌گذاریم تا حداقل اپ بالا بیاید و لاگ واضح بدهد.
 * اما برای صحت اتصال، باید envها را مطابق README تنظیم کنید.
 */
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] متغیرهای محیطی یافت نشدند. توصیه: NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY را در .env.local تنظیم کنید. برای سازگاری موقت، VITE_* نیز پشتیبانی می‌شود."
  );
}

// حتی اگر رشته‌ها خالی باشند، createClient مقداردهی می‌شود تا اپ کرش نکند.
// اما تا وقتی env صحیح ست نشود، درخواست‌ها به خطا می‌خورند که در کنسول دیده می‌شود.
export const supabaseClient = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type SupabaseClientType = typeof supabaseClient;