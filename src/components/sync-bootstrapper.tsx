"use client";

import { useEffect, useRef } from "react";
import { supabaseClient } from "@/integrations/supabase/client";
import { SyncService } from "@/services/sync-service";

/**
 * SyncBootstrapper
 * - الگوی استاندارد: تزریق supabaseClient به SyncService
 * - راه‌اندازی سینک دوره‌ای و واکنش به تغییرات سشن
 * - ایمن برای CSR (client-only)
 */
export default function SyncBootstrapper() {
  const serviceRef = useRef<SyncService | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // نمونه سرویس با کلاینت تزریق‌شده
    const service = new SyncService(supabaseClient);
    serviceRef.current = service;

    // شروع همگام‌سازی (هر 5 دقیقه به صورت پیش‌فرض)
    service.start(5 * 60 * 1000);

    // سشن اولیه را برای اطمینان از auth بررسی کنیم (لازم نیست حتماً چیزی انجام دهیم)
    supabaseClient.auth.getSession().then(() => {
      // no-op: صرفاً تضمین آماده بودن کلاینت
    });

    // واکنش به تغییرات وضعیت احراز هویت
    const { data: sub } = supabaseClient.auth.onAuthStateChange((_event, _session) => {
      // در صورت تغییر سشن، یک سینک فوری بزنیم
      service.sync().catch(console.error);
    });

    // پاکسازی
    return () => {
      if (sub) sub.subscription.unsubscribe();
      service.stop();
      serviceRef.current = null;
      startedRef.current = false;
    };
  }, []);

  return null;
}