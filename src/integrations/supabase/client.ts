/**
 * Supabase Browser Client (Next.js App Router) - Hardened
 * - فقط اگر env معتبر باشد کلاینت واقعی می‌سازیم
 * - در غیر اینصورت یک proxy ایمن برمی‌گردانیم که روی هر call پیام پیکربندی می‌دهد
 */
'use client';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  (process.env.VITE_SUPABASE_URL as string | undefined) ||
  '';

const SUPABASE_ANON_KEY =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (process.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  '';

const hasValidEnv =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.length > 0 &&
  /^https?:\/\//i.test(SUPABASE_URL) &&
  typeof SUPABASE_ANON_KEY === 'string' &&
  SUPABASE_ANON_KEY.length > 0;

function createMisconfiguredClientProxy() {
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      const fn = () => {
        const msg =
          "[Supabase] پیکربندی ناقص است. کلیدهای NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY را در .env.local تنظیم کنید.";
        // eslint-disable-next-line no-console
        console.error(msg);
        throw new Error(msg);
      };
      return fn;
    },
  };
  return new Proxy({}, handler);
}

// اگر درست پیکربندی نشده، پراکسی ایمن بده تا اپ کرش نکند ولی تماس‌ها خطای قابل درمان داشته باشند
export const supabaseClient =
  hasValidEnv
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : (createMisconfiguredClientProxy() as ReturnType<typeof createClient>);

export type SupabaseClientType = typeof supabaseClient;