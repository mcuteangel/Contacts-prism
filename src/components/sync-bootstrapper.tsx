"use client";

/**
 * SyncBootstrapper (Base)
 * - پایش online/offline و visibilitychange
 * - تریگر سنک دستی/ادواری (بدون Push/Pull واقعی؛ فقط اسکلت و لاگ)
 * - آماده برای اتصال به sync-service در فاز ۲
 *
 * نحوه استفاده: این کامپوننت را در روت شل اپ اضافه کنید (مثلاً در layout یا AuthShell)
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

type SyncState =
  | "idle"
  | "queued"
  | "syncing"
  | "up_to_date"
  | "error";

type NetworkState = "online" | "offline";

type BackoffConfig = {
  initialMs: number;
  maxMs: number;
  factor: number;
};

const DEFAULT_BACKOFF: BackoffConfig = {
  initialMs: 5_000,
  maxMs: 60_000,
  factor: 2,
};

function useBackoffTimer(cfg: BackoffConfig = DEFAULT_BACKOFF) {
  const [delay, setDelay] = useState(cfg.initialMs);

  const reset = () => setDelay(cfg.initialMs);
  const grow = () =>
    setDelay((prev) => Math.min(Math.floor(prev * cfg.factor), cfg.maxMs));

  // jitter تصادفی برای جلوگیری از هم‌زمانی کلاینت‌ها
  const nextWithJitter = React.useCallback(() => {
    const base = Math.min(delay, cfg.maxMs);
    const jitter = Math.floor(base * 0.2 * Math.random()); // تا 20% جیتِر
    return Math.max(0, base - Math.floor(base * 0.1) + jitter); // ±10% حدودی
  }, [delay, cfg.maxMs]);

  return { delay, reset, grow, nextWithJitter };
}

export function SyncBootstrapper({
  pollingMs = 30_000, // در حالت آنلاین، هر 30s یک سنک سبک
  backoff = DEFAULT_BACKOFF,
  onSyncRequested,
}: {
  pollingMs?: number;
  backoff?: BackoffConfig;
  onSyncRequested?: () => Promise<void> | void; // در فاز ۲: به sync-service وصل می‌شود
}) {
  // برای جلوگیری از Hydration mismatch، مقدار اولیه را ثابت و قابل‌پیش‌بینی رندر می‌کنیم
  // و در useEffect (سمت کلاینت) به مقدار واقعی به‌روزرسانی می‌کنیم.
  const [network, setNetwork] = useState<NetworkState>("offline");
  const [state, setState] = useState<SyncState>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<string | null>(null);

  // تنظیمات قابل‌تغییر در runtime
  const [runtimePollingMs, setRuntimePollingMs] = useState<number>(pollingMs);
  const [runtimeBackoff, setRuntimeBackoff] = useState<BackoffConfig>(backoff);

  const { delay, reset, grow, nextWithJitter } = useBackoffTimer(runtimeBackoff);

  const visibleRef = useRef<boolean>(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // listener برای بروزرسانی تنظیمات سنک از Settings (sync:prefs:updated)
  useEffect(() => {
    const onPrefsUpdated = (e: Event) => {
      try {
        // @ts-ignore
        const detail = (e as CustomEvent)?.detail;
        if (detail && typeof detail === "object") {
          const nextPolling = Number(detail.pollingMs);
          const nextBackoff = detail.backoff as Partial<BackoffConfig> | undefined;

          if (!isNaN(nextPolling) && nextPolling > 0) {
            setRuntimePollingMs(nextPolling);
          }
          if (nextBackoff) {
            setRuntimeBackoff((prev) => ({
              initialMs: typeof nextBackoff.initialMs === "number" && nextBackoff.initialMs > 0 ? nextBackoff.initialMs : prev.initialMs,
              factor: typeof nextBackoff.factor === "number" && nextBackoff.factor > 0 ? nextBackoff.factor : prev.factor,
              maxMs: typeof nextBackoff.maxMs === "number" && nextBackoff.maxMs > 0 ? nextBackoff.maxMs : prev.maxMs,
            }));
          }

          // ریست backoff و راه‌اندازی مجدد polling روی مقادیر جدید
          reset();
          if (tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
          }
          // یک سنک فوری پس از تغییر تنظیمات
          runSync("prefs_updated");
        }
      } catch (err) {
        console.warn("[SyncBootstrapper] failed to apply prefs update:", err);
      }
    };

    window.addEventListener("sync:prefs:updated", onPrefsUpdated as EventListener);
    return () => window.removeEventListener("sync:prefs:updated", onPrefsUpdated as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSync = useMemo(() => {
    return network === "online" && visibleRef.current;
  }, [network]);

  const [nextRunInMs, setNextRunInMs] = useState<number | null>(null);

  const runSync = async (reason: string) => {
    if (!canSync) {
      // ذخیره علت برای دیباگ
      console.debug("[SyncBootstrapper] Skip sync: canSync=false reason=", reason);
      return;
    }

    console.debug("[SyncBootstrapper] Sync requested. Reason:", reason);
    setState("syncing");
    setErrors(null);

    try {
      // در فاز ۲ اینجا: await syncService.runSync();
      if (onSyncRequested) {
        await onSyncRequested();
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }

      // موفق
      setLastSyncAt(new Date().toISOString());
      setState("up_to_date");
      reset(); // بازنشانی backoff بعد از موفقیت

      // اطلاع‌رسانی عمومی برای UI‌هایی که گزارش سنک نمایش می‌دهند
      window.dispatchEvent(new CustomEvent("sync:completed", { detail: { reason } }));
      // برخی UI ها از visibilitychange برای رفرش استفاده می‌کنند
      window.dispatchEvent(new Event("visibilitychange"));
    } catch (e: any) {
      console.error("[SyncBootstrapper] Sync error:", e);
      setErrors(e?.message ?? "sync failed");
      setState("error");
      grow();
      window.dispatchEvent(new CustomEvent("sync:failed", { detail: e?.message ?? "sync failed" }));
      // شروع backoff retry با jitter
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
      const wait = nextWithJitter();
      setNextRunInMs(wait);
      backoffTimerRef.current = setTimeout(() => {
        setNextRunInMs(null);
        runSync("backoff_retry");
      }, wait);
    }
  };

  // Online/Offline listeners
  useEffect(() => {
    // همگام‌سازی اولیه روی کلاینت برای جلوگیری از mismatch
    if (typeof navigator !== "undefined") {
      setNetwork(navigator.onLine ? "online" : "offline");
    }

    const handleOnline = () => {
      setNetwork("online");
      // reset backoff روی بازگشت آنلاین و تلاش فوری
      reset();
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
        backoffTimerRef.current = null;
      }
      setNextRunInMs(null);
      runSync("network_online");
    };
    const handleOffline = () => {
      setNetwork("offline");
      // توقف تایمرها
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
        backoffTimerRef.current = null;
      }
      setState("idle");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Visibility listener
  useEffect(() => {
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) {
        // reset backoff روی فوکوس و تلاش فوری
        reset();
        if (backoffTimerRef.current) {
          clearTimeout(backoffTimerRef.current);
          backoffTimerRef.current = null;
        }
        setNextRunInMs(null);
        // وقتی تب فوکوس گرفت یک سنک سبک
        runSync("tab_visible");
      } else {
        // توقف تایمر در صورت عدم فوکوس
        if (tickerRef.current) {
          clearInterval(tickerRef.current);
          tickerRef.current = null;
        }
      }
    };

    if (typeof document !== "undefined" && "visibilityState" in document) {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      if (typeof document !== "undefined" && "visibilityState" in document) {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for app-unlocked to trigger an immediate sync after successful unlock
  useEffect(() => {
    const onUnlocked = () => {
      runSync("app_unlocked");
    };
    window.addEventListener("app-unlocked", onUnlocked as EventListener);
    return () => window.removeEventListener("app-unlocked", onUnlocked as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 // Manual sync event listener: listen to "sync:request" from Settings/others
 useEffect(() => {
   const onManual = (e: Event) => {
     try {
       // @ts-ignore detail optional
       const detail = (e as CustomEvent)?.detail;
       const reason = detail?.reason ? String(detail.reason) : "manual_event";
       runSync(reason);
     } catch {
       runSync("manual_event");
     }
   };
   window.addEventListener("sync:request", onManual as EventListener);
   return () => window.removeEventListener("sync:request", onManual as EventListener);
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
  
 // Online polling (سبک)
 useEffect(() => {
   if (!canSync) return;
   if (tickerRef.current) clearInterval(tickerRef.current);

   tickerRef.current = setInterval(() => {
     runSync("polling");
   }, runtimePollingMs);
   // نمایش شمارنده next-run بر اساس polling
   setNextRunInMs(runtimePollingMs);

   return () => {
     if (tickerRef.current) {
       clearInterval(tickerRef.current);
       tickerRef.current = null;
     }
   };
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [canSync, runtimePollingMs]);

  // Cleanup backoff timer on unmount
  useEffect(() => {
    return () => {
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  // UI کوچک وضعیت (اختیاری)
  // تایمر کوچک برای کم کردن nextRunInMs جهت نمایش زنده
  useEffect(() => {
    if (nextRunInMs == null) return;
    let raf: number | null = null;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setNextRunInMs((v) => (v == null ? null : Math.max(0, v - dt)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [nextRunInMs]);

  return (
    <div className="fixed bottom-3 left-3 z-40 pointer-events-none select-none">
      <div className="px-2 py-1 rounded-md text-xs bg-muted/70 backdrop-blur border border-border" suppressHydrationWarning>
        <span className="font-medium">Sync:</span>{" "}
        <span suppressHydrationWarning>{state}</span>
        {" • "}
        <span className={network === "online" ? "text-green-600" : "text-red-600"} suppressHydrationWarning>
          {network}
        </span>
        {lastSyncAt ? (
          <>
            {" • "}
            <span title={lastSyncAt} suppressHydrationWarning>last: {new Date(lastSyncAt).toLocaleTimeString()}</span>
          </>
        ) : null}
        {typeof nextRunInMs === "number" && nextRunInMs > 0 ? (
          <>
            {" • "}
            <span className="opacity-80" suppressHydrationWarning>
              next: {Math.ceil(nextRunInMs / 1000)}s
            </span>
          </>
        ) : null}
        {errors ? (
          <>
            {" • "}
            <span className="text-red-600">err</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default SyncBootstrapper;