"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReportSyncLogs from "@/components/settings/report-sync-logs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { RequireRole } from "@/components/auth/role-guard";
import { db, type OutboxItem } from "@/database/db";
import { cn } from "@/lib/utils";
import { HelpCircle, RefreshCw, Wifi, WifiOff, ListOrdered, Trash2, Sun, Moon, Monitor, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

/**
 * SettingsUnifiedPanel (AdminSyncPanel)
 * - یک کامپوننت واحد که هم کنترل‌های عمومی (سنک دستی/Outbox/تم/لینک راهنما)
 *   و هم گزارش‌های پیشرفته سنک (ادمین) را در خود دارد.
 * - این کامپوننت در هر دو مسیر Settings و Advanced استفاده می‌شود تا یکپارچگی حفظ شود.
 * - افزوده شد: کنترل‌گر زمان‌بندی سنک (polling/backoff) با ذخیره‌سازی در sync_meta و اطلاع‌رسانی به Bootstrapper
 */
export default function AdminSyncPanel({ pageSize = 100 }: { pageSize?: number }) {
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Outbox state
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [outboxLoading, setOutboxLoading] = useState(false);

  // تنظیمات سنک (polling/backoff) که در sync_meta ذخیره می‌شود
  type BackoffCfg = { initialMs: number; factor: number; maxMs: number };
  type SyncPrefs = { pollingMs: number; backoff: BackoffCfg };

  const DEFAULT_PREFS: SyncPrefs = {
    pollingMs: 30000,
    backoff: { initialMs: 5000, factor: 2, maxMs: 60000 },
  };

  const [prefs, setPrefs] = useState<SyncPrefs>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // همگام با تغییر وضعیت شبکه
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // تریگر سنک دستی
  const { t } = useTranslation("common");

  const handleManualSync = useCallback(async () => {
    setError(null);
    setSyncing(true);
    try {
      window.dispatchEvent(new CustomEvent("sync:request", { detail: { reason: "settings_unified_manual" } }));
      await new Promise((r) => setTimeout(r, 300));
      setLastSyncAt(new Date().toISOString());
      refreshOutbox();
    } catch (e: any) {
      setError(e?.message ?? "sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  const refreshOutbox = useCallback(async () => {
    try {
      setOutboxLoading(true);
      const items = await db.outbox_queue.orderBy("clientTime").toArray();
      setOutbox(items.reverse());
    } catch (e) {
      console.error("load outbox failed:", e);
    } finally {
      setOutboxLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOutbox();
    const vis = () => {
      if (document.visibilityState === "visible") {
        refreshOutbox();
        // بارگذاری ترجیحات سنک هنگام فوکوس
        loadPrefs();
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [refreshOutbox]);

  const outboxStats = useMemo(() => {
    const total = outbox.length;
    const queued = outbox.filter((i) => i.status === "queued").length;
    const sending = outbox.filter((i) => i.status === "sending").length;
    const errorC = outbox.filter((i) => i.status === "error").length;
    const done = outbox.filter((i) => i.status === "done").length;
    return { total, queued, sending, error: errorC, done };
  }, [outbox]);

  // بارگذاری/ذخیره ترجیحات سنک از/به IndexedDB (sync_meta)
  const loadPrefs = useCallback(async () => {
    try {
      setPrefsLoading(true);
      const row = await db.sync_meta.get("sync:prefs");
      if (row && row.value && typeof row.value === "object") {
        const v = row.value as any;
        const next: SyncPrefs = {
          pollingMs: Number(v.pollingMs) > 0 ? Number(v.pollingMs) : DEFAULT_PREFS.pollingMs,
          backoff: {
            initialMs: Number(v?.backoff?.initialMs) > 0 ? Number(v.backoff.initialMs) : DEFAULT_PREFS.backoff.initialMs,
            factor: Number(v?.backoff?.factor) > 0 ? Number(v.backoff.factor) : DEFAULT_PREFS.backoff.factor,
            maxMs: Number(v?.backoff?.maxMs) > 0 ? Number(v.backoff.maxMs) : DEFAULT_PREFS.backoff.maxMs,
          },
        };
        setPrefs(next);
      } else {
        // اگر چیزی نبود، مقدار پیش‌فرض را ذخیره کنیم تا UI یکسان باشد
        await db.sync_meta.put({ key: "sync:prefs", value: DEFAULT_PREFS });
        setPrefs(DEFAULT_PREFS);
      }
    } catch (e) {
      console.error("load sync prefs failed:", e);
      setPrefs(DEFAULT_PREFS);
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  const savePrefs = useCallback(async (next: SyncPrefs) => {
    try {
      setPrefsSaving(true);
      // اعتبارسنجی حداقل‌ها
      const normalized: SyncPrefs = {
        pollingMs: Math.max(3000, Math.min(24 * 60 * 60 * 1000, Math.floor(next.pollingMs))), // 3s .. 24h
        backoff: {
          initialMs: Math.max(1000, Math.floor(next.backoff.initialMs)),
          factor: Math.min(10, Math.max(1.1, Number(next.backoff.factor))),
          maxMs: Math.max(2000, Math.floor(next.backoff.maxMs)),
        },
      };
      await db.sync_meta.put({ key: "sync:prefs", value: normalized });
      setPrefs(normalized);
      // اطلاع‌رسانی به Bootstrapper برای اعمال فوری
      window.dispatchEvent(new CustomEvent("sync:prefs:updated", { detail: normalized }));
    } catch (e) {
      console.error("save sync prefs failed:", e);
    } finally {
      setPrefsSaving(false);
    }
  }, []);

  // بارگذاری اولیه prefs
  useEffect(() => {
    loadPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // کامپوننت داخلی: AuthSecuritySettings - از اثر قبلی خارج و در JSX رندر می‌شود
  function AuthSecuritySettings() {
    const [loading, setLoading] = React.useState(false);
    const [policy, setPolicy] = React.useState<{
      inactivityMs: number;
      offlineAllowedUntil: string | null;
      wrapMethod: "webauthn" | "pin" | null;
    } | null>(null);
    const [inactivityMinutes, setInactivityMinutes] = React.useState<number>(15);
    const [extending, setExtending] = React.useState<boolean>(false);

    React.useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const { AuthService } = await import("@/services/auth-service");
          const p = await AuthService.getPolicy();
          const wrap = await AuthService.getWrapMethod();
          if (!mounted) return;
          setPolicy({
            inactivityMs: p?.inactivityMs ?? 15 * 60_000,
            offlineAllowedUntil: p?.offlineAllowedUntil ?? null,
            wrapMethod: wrap,
          });
          setInactivityMinutes(Math.round(((p?.inactivityMs ?? 15 * 60_000) / 1000) / 60));
        } catch {
          // ignore
        }
      })();
      return () => {
        mounted = false;
      };
    }, []);

    const onApplyInactivity = React.useCallback(async () => {
      try {
        setLoading(true);
        const { AuthService } = await import("@/services/auth-service");
        const ms = Math.max(1, inactivityMinutes) * 60_000;
        await AuthService.setInactivityMs(ms);
        const p = await AuthService.getPolicy();
        setPolicy((prev) => {
          const wrap = prev?.wrapMethod ?? null;
          return {
            inactivityMs: p?.inactivityMs ?? ms,
            offlineAllowedUntil: p?.offlineAllowedUntil ?? null,
            wrapMethod: wrap,
          };
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, [inactivityMinutes]);

    // دکمه تمدید مهلت آفلاین تا ۷ روز جلوتر (در صورتی که آنلاین هستیم و AuthService API را پشتیبانی کند)
    const onExtendOfflineWindow = React.useCallback(async () => {
      try {
        setExtending(true);
        const { AuthService } = await import("@/services/auth-service");
        // اگر API اختصاصی نداریم، از مسیر markOnlineReauthSucceeded به‌عنوان «تازه‌سازی» پنجره استفاده می‌کنیم
        if (typeof AuthService.markOnlineReauthSucceeded === "function") {
          await AuthService.markOnlineReauthSucceeded();
        }
        const p = await AuthService.getPolicy();
        setPolicy((prev) => ({
          inactivityMs: p?.inactivityMs ?? prev?.inactivityMs ?? 15 * 60_000,
          offlineAllowedUntil: p?.offlineAllowedUntil ?? prev?.offlineAllowedUntil ?? null,
          wrapMethod: prev?.wrapMethod ?? null,
        }));
      } catch {
        // ignore
      } finally {
        setExtending(false);
      }
    }, []);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{t("settings.security.offline.title")}</CardTitle>
        <CardDescription>{t("settings.security.offline.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">{t("settings.security.offline.inactivityLabel")}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="h-9 w-28 rounded border border-input bg-background px-2 text-sm"
                value={inactivityMinutes}
                onChange={(e) => setInactivityMinutes(parseInt(e.target.value || "0", 10))}
                min={1}
                step={1}
                aria-label={t("settings.security.offline.inactivityAria")}
              />
              <Button size="sm" onClick={onApplyInactivity} disabled={loading} aria-label={t("settings.security.offline.applyAria")}>
                {t("settings.security.offline.apply")}
              </Button>
            </div>
            {policy ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("settings.security.offline.currentValue", { minutes: (policy.inactivityMs / 1000 / 60).toFixed(0) })}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm mb-1">{t("settings.security.offline.offlineWindow")}</label>
            <div className="text-sm">
              {policy?.offlineAllowedUntil ? (
                <span title={policy.offlineAllowedUntil}>
                  {t("settings.security.offline.until", { value: new Date(policy.offlineAllowedUntil).toLocaleString() })}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("settings.common.unknown")}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("settings.security.offline.wrapMethod", { method: policy?.wrapMethod ?? t("settings.common.unknown") })}
            </p>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onExtendOfflineWindow}
                disabled={extending || !navigator.onLine}
                title={navigator.onLine ? t("settings.security.offline.extendTitleOnline") : t("settings.security.offline.extendTitleOffline")}
                aria-label={t("settings.security.offline.extendAria")}
              >
                {extending ? t("settings.common.extending") : t("settings.security.offline.extend")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  }
  
  return (
    <div className="space-y-8">
      {/* سکشن عمومی */}
      <section aria-label="settings-general" className="space-y-6">
        {/* کنترل‌گر زمان‌بندی سنک */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle>زمان‌بندی همگام‌سازی</CardTitle>
            <CardDescription>تنظیم فاصله سنک خودکار و سیاست backoff برای تلاش مجدد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefsLoading ? (
              <div className="text-sm text-muted-foreground">در حال بارگذاری تنظیمات...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pollingMs">فاصله سنک خودکار (میلی‌ثانیه)</Label>
                    <input
                      id="pollingMs"
                      type="number"
                      className="h-9 rounded-md border px-2 bg-background"
                      min={3000}
                      max={86400000}
                      value={prefs.pollingMs}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        setPrefs((p) => ({ ...p, pollingMs: v }));
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      مقدار فعلی: {Math.round(prefs.pollingMs / 1000)} ثانیه
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="initialMs">Backoff: شروع (ms)</Label>
                    <input
                      id="initialMs"
                      type="number"
                      className="h-9 rounded-md border px-2 bg-background"
                      min={1000}
                      value={prefs.backoff.initialMs}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        setPrefs((p) => ({ ...p, backoff: { ...p.backoff, initialMs: v } }));
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="factor">Backoff: ضریب رشد</Label>
                    <input
                      id="factor"
                      type="number"
                      step="0.1"
                      className="h-9 rounded-md border px-2 bg-background"
                      min={1.1}
                      max={10}
                      value={prefs.backoff.factor}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        setPrefs((p) => ({ ...p, backoff: { ...p.backoff, factor: v } }));
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-1">
                    <Label htmlFor="maxMs">Backoff: سقف (ms)</Label>
                    <input
                      id="maxMs"
                      type="number"
                      className="h-9 rounded-md border px-2 bg-background"
                      min={2000}
                      value={prefs.backoff.maxMs}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        setPrefs((p) => ({ ...p, backoff: { ...p.backoff, maxMs: v } }));
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={prefsSaving}
                    onClick={() => savePrefs(prefs)}
                  >
                    {prefsSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPrefs(DEFAULT_PREFS)}
                  >
                    بازنشانی به پیش‌فرض
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // ارسال prefs فعلی به Bootstrapper بدون ذخیره (تست سریع)
                      window.dispatchEvent(new CustomEvent("sync:prefs:updated", { detail: prefs }));
                    }}
                  >
                    اعمال موقت
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  نکته: برای اعمال دائمی، ذخیره تنظیمات را بزنید. «اعمال موقت» فقط تنظیمات جاری را به Bootstrapper ارسال می‌کند.
                </div>

                {/* تنظیمات امنیت آفلاین */}
                <AuthSecuritySettings />
              </>
            )}
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* راهنما */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle>مرکز راهنما</CardTitle>
              <CardDescription>پاسخ سوالات پرتکرار، راهنماها و نکات کاربردی</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/help" aria-label="رفتن به مرکز راهنما">
                <Button className="w-full justify-center gap-2" variant="outline">
                  <HelpCircle size={18} />
                  رفتن به راهنما
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* سنک دستی */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {online ? <Wifi size={18} className="text-green-600" /> : <WifiOff size={18} className="text-red-600" />}
                همگام‌سازی
              </CardTitle>
              <CardDescription>سنک دستی و وضعیت شبکه/آخرین سنک</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>وضعیت شبکه:</span>
                <span className={online ? "text-green-600" : "text-red-600"}>{online ? "آنلاین" : "آفلاین"}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                آخرین همگام‌سازی: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "هنوز انجام نشده"}
              </div>
              {error ? <div className="text-sm text-red-600">خطا: {error}</div> : null}
              <div className="flex gap-2">
                <Button
                  onClick={handleManualSync}
                  disabled={syncing || !online}
                  className="gap-2"
                  variant="outline"
                >
                  <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "در حال سنک..." : "سنک دستی"}
                </Button>
                {!online && (
                  <span className="text-xs text-muted-foreground self-center">برای سنک، اتصال اینترنت لازم است.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Outbox */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered size={18} />
                وضعیت Outbox (آفلاین)
              </CardTitle>
              <CardDescription>صف عملیات آفلاین آماده Push</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>مجموع:</span>
                <span className="font-medium">{outboxStats.total}</span>
                <span className="mx-1">|</span>
                <span className="text-blue-600">Queued: {outboxStats.queued}</span>
                <span className="text-amber-600">Sending: {outboxStats.sending}</span>
                <span className="text-red-600">Error: {outboxStats.error}</span>
                <span className="text-green-600">Done: {outboxStats.done}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refreshOutbox}>
                  بازخوانی
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    try {
                      const doneItems = await db.outbox_queue.where("status").equals("done").toArray();
                      if (doneItems.length === 0) return;
                      await db.transaction("rw", db.outbox_queue, async () => {
                        for (const it of doneItems) {
                          if (it.id != null) await db.outbox_queue.delete(it.id);
                        }
                      });
                      await refreshOutbox();
                    } catch (e) {
                      console.error("clear done outbox failed:", e);
                    }
                  }}
                >
                  <Trash2 size={16} className="mr-1" /> پاک‌سازی Done
                </Button>
              </div>

              <div className={cn("rounded-md border p-2 max-h-64 overflow-auto", outboxLoading && "opacity-70")}>
                {outboxLoading ? (
                  <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
                ) : outbox.length === 0 ? (
                  <div className="text-sm text-muted-foreground">صف Outbox خالی است.</div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {outbox.slice(0, 50).map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.entity}/{item.op} • <span className="uppercase">{item.status}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(item.clientTime).toLocaleString()} • try#{item.tryCount}
                          </div>
                          <pre className="mt-1 bg-muted/30 rounded p-2 overflow-auto max-h-24">
{JSON.stringify(item.payload, null, 2)}
                          </pre>
                        </div>
                        {item.status === "error" ? <span className="text-red-600 whitespace-nowrap ml-2">خطا</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تنظیم تم */}
        <div className="grid gap-4 py-2 w-full max-w-sm">
          <div className="flex flex-col gap-2">
            <Label className="text-right">تم پیش‌فرض</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className={cn("flex flex-col items-center justify-center p-4 h-auto", theme === "light" && "ring-2 ring-ring ring-offset-2")}
                onClick={() => setTheme("light")}
              >
                <Sun size={24} />
                <span className="mt-2 text-sm">روشن</span>
              </Button>
              <Button
                variant="outline"
                className={cn("flex flex-col items-center justify-center p-4 h-auto", theme === "dark" && "ring-2 ring-ring ring-offset-2")}
                onClick={() => setTheme("dark")}
              >
                <Moon size={24} />
                <span className="mt-2 text-sm">تاریک</span>
              </Button>
              <Button
                variant="outline"
                className={cn("flex flex-col items-center justify-center p-4 h-auto", theme === "system" && "ring-2 ring-ring ring-offset-2")}
                onClick={() => setTheme("system")}
              >
                <Monitor size={24} />
                <span className="mt-2 text-sm">سیستم</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* سکشن گزارش سنک (ادمین) */}
      <RequireRole role="admin">
        <section aria-label="settings-sync-report" className="space-y-6">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Shield size={18} /> گزارش همگام‌سازی</span>
                <Button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("sync:request", { detail: { reason: "settings_unified_admin" } }))}
                  variant="secondary"
                  aria-label="settings-sync-admin-manual"
                >
                  سنک دستی
                </Button>
              </CardTitle>
              <CardDescription>گزارش کامل سنک‌های اخیر</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportSyncLogs pageSize={pageSize} />
            </CardContent>
          </Card>
        </section>
      </RequireRole>
    </div>
  );
}