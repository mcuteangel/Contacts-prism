"use client";

import React from "react";
import { RequireRole } from "@/components/auth/role-guard";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppSecureLock, { useAppSecureLock } from "@/components/security/app-secure-lock";

const LS_ENABLED = "app_lock_enabled";
const LS_PIN = "app_lock_pin";
const LS_BIOMETRIC = "app_lock_biometric";
const LS_SESSION_UNLOCKED = "app_lock_session_unlocked";
const LS_IDLE_TIMEOUT_MS = "app_lock_idle_timeout_ms";
const LS_LAST_ACTIVITY = "app_lock_last_activity";

export default function SettingsAdvancedPage() {
  const { user, role, signOut } = useAuth();
  const { enable: enableAppLock, lockNow } = useAppSecureLock();

  // state های UI برای کنترل قفل
  const [enabled, setEnabled] = React.useState(false);
  const [biometric, setBiometric] = React.useState(false);
  const [idleMinutes, setIdleMinutes] = React.useState<number>(60);
  const [hasPin, setHasPin] = React.useState(false);

  // بارگذاری اولیه وضعیت از storage
  React.useEffect(() => {
    try {
      const en = localStorage.getItem(LS_ENABLED) === "true";
      const bio = localStorage.getItem(LS_BIOMETRIC) === "true";
      const timeoutMs = Number(localStorage.getItem(LS_IDLE_TIMEOUT_MS) || 60 * 60 * 1000);
      const pin = localStorage.getItem(LS_PIN);
      setEnabled(en);
      setBiometric(bio);
      setIdleMinutes(Math.max(1, Math.round(timeoutMs / 60000)));
      setHasPin(!!pin);
    } catch {}
  }, []);

  // هندل‌ها
  const toggleEnabled = React.useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    try {
      if (next) {
        localStorage.setItem(LS_ENABLED, "true");
        // اگر فعال شد ولی PIN ندارد، کاربر را به جریان setup هدایت می‌کنیم
        const pin = localStorage.getItem(LS_PIN);
        if (!pin) {
          enableAppLock(true); // Overlay را باز می‌کند
        }
      } else {
        // غیرفعال: فقط فلگ را برمی‌داریم (حذف کامل PIN از بخش تغییر PIN انجام می‌شود)
        localStorage.removeItem(LS_ENABLED);
      }
    } catch {}
  }, [enabled, enableAppLock]);

  const toggleBiometric = React.useCallback(() => {
    const next = !biometric;
    setBiometric(next);
    try {
      localStorage.setItem(LS_BIOMETRIC, String(next));
    } catch {}
  }, [biometric]);

  const saveIdleMinutes = React.useCallback(() => {
    const minutes = Number(idleMinutes);
    const clamped = Number.isFinite(minutes) ? Math.max(1, Math.min(24 * 60, Math.round(minutes))) : 60;
    setIdleMinutes(clamped);
    try {
      localStorage.setItem(LS_IDLE_TIMEOUT_MS, String(clamped * 60000));
    } catch {}
  }, [idleMinutes]);

  const changePin = React.useCallback(() => {
    // برای تغییر PIN از خود Overlay استفاده می‌کنیم تا اعتبارسنجی در همان کامپوننت انجام شود
    // اگر قفل فعال است و PIN وجود دارد، overlay را به حالت تغییر می‌بریم
    try {
      const en = localStorage.getItem(LS_ENABLED) === "true";
      const pin = localStorage.getItem(LS_PIN);
      if (en && pin) {
        // ساده‌ترین روش: Overlay را باز کنیم، کاربر می‌تواند از دکمه "تغییر PIN" استفاده کند
        // یا یک رویداد اختصاصی برای حالت change تعریف شود. فعلاً Overlay را باز می‌کنیم.
        window.dispatchEvent(new Event("app-lock:lock"));
      } else {
        enableAppLock(true); // اگر فعال نیست، برد به setup
      }
    } catch {}
  }, [enableAppLock]);

  return (
    <RequireRole role="admin">
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">تنظیمات پیشرفته (ادمین)</h1>
          <div className="text-sm opacity-80">
            {user ? <span dir="ltr">{user.email}</span> : null} {role ? `• ${role}` : ""}
          </div>
        </div>

        {/* مدیریت قفل برنامه (UI لایه دوم امنیت) */}
        <div className="glass rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">قفل برنامه</h2>
            <div className="text-xs text-muted-foreground">UI Security Overlay</div>
          </div>

          <p className="text-muted-foreground text-sm">
            قفل برنامه یک لایهٔ امنیتی UI است که مستقل از سشن عمل می‌کند. می‌توانید PIN تنظیم کنید، بیومتریک را فعال کنید، مدت بیکاری تا قفل را تعیین نمایید یا فوراً برنامه را قفل کنید.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={enabled ? "default" : "outline"} onClick={toggleEnabled}>
              {enabled ? "غیرفعال‌سازی قفل" : "فعال‌سازی قفل"}
            </Button>
            <Button variant="secondary" onClick={() => enableAppLock(true)}>فعال‌سازی و تنظیم PIN</Button>
            <Button variant="outline" onClick={changePin} disabled={!enabled || !hasPin}>تغییر PIN</Button>
            <Button variant="outline" onClick={lockNow}>قفل کردن اکنون</Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">بیومتریک</span>
                <Button size="sm" variant={biometric ? "default" : "outline"} onClick={toggleBiometric}>
                  {biometric ? "فعال" : "غیرفعال"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                در صورت پشتیبانی مرورگر، تلاش برای احراز هویت بیومتریک انجام می‌شود؛ در غیر این صورت PIN استفاده می‌گردد.
              </p>
            </div>

            <div className="glass rounded-md p-3 space-y-2">
              <label className="text-sm">مدت بیکاری تا قفل (دقیقه)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={24 * 60}
                  value={idleMinutes}
                  onChange={(e) => setIdleMinutes(Number(e.target.value))}
                  className="w-32"
                  dir="ltr"
                />
                <Button size="sm" onClick={saveIdleMinutes}>ثبت</Button>
              </div>
              <p className="text-xs text-muted-foreground">۱ تا ۱۴۴۰ دقیقه. پیش‌فرض: ۶۰ دقیقه.</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            نکته: AppSecureLock فقط باید یک بار در سطح بالای اپ mount شود تا از تداخل UI جلوگیری شود.
          </div>
        </div>

        {/* عملیات سیستمی نمایشی (می‌تواند بعداً به سرویس واقعی متصل شود) */}
        <div className="glass rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">عملیات سیستمی</h2>
          <p className="text-muted-foreground text-sm">
            این اقدامات نمونه هستند. در آینده می‌توان آن‌ها را به سرویس‌های واقعی (پشتیبان‌گیری، حالت نگهداری و ...) متصل کرد.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => console.log("[Advanced] Backup triggered")}>تهیه نسخه پشتیبان</Button>
            <Button variant="secondary" onClick={() => console.log("[Advanced] Maintenance mode toggled")}>حالت نگهداری</Button>
            <Button variant="destructive" onClick={() => console.warn("[Advanced] Dangerous operation executed!")}>عملیات حساس</Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={signOut}>خروج از حساب</Button>
        </div>
      </div>
    </RequireRole>
  );
}