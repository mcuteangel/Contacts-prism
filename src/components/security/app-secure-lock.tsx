"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Lock, Eye, EyeOff } from "lucide-react";

/**
 * قفل جدید برنامه (لایه دوم امنیتی UI)
 * - مستقل از سشن Supabase است؛ صرفاً UI را قفل/آزاد می‌کند.
 * - وضعیت قفل در localStorage نگهداری می‌شود (app_lock_enabled, app_lock_pin).
 * - در صورت فعال بودن، یک لایه‌ی تمام‌صفحه روی اپ قرار می‌گیرد تا کاربر PIN یا بیومتریک وارد کند.
 * - برای سادگی در این نسخه، PIN با WebCrypto هش نمی‌شود؛ در نسخه‌های بعدی می‌توان افزود.
 */

type Mode = "locked" | "setup" | "change" | "disabled";

function getLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setLS(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}
function removeLS(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

const LS_ENABLED = "app_lock_enabled";
const LS_PIN = "app_lock_pin";
const LS_BIOMETRIC = "app_lock_biometric";
const LS_SESSION_UNLOCKED = "app_lock_session_unlocked"; // وضعیت باز بودن در این نشست (تا رفرش بعدی)
const LS_IDLE_TIMEOUT_MS = "app_lock_idle_timeout_ms";   // مدت بیکاری تا قفل (ms)، پیش‌فرض 1 ساعت
const LS_LAST_ACTIVITY = "app_lock_last_activity";       // آخرین زمان فعالیت (Date.now())

export default function AppSecureLock() {
  const [enabled, setEnabled] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("disabled");
  const [pin, setPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [currentPin, setCurrentPin] = React.useState("");
  const [showPin, setShowPin] = React.useState(false);
  const [showCurrentPin, setShowCurrentPin] = React.useState(false);
  const [biometric, setBiometric] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // اگر رویداد بیرونی خواست قفل کند، گوش بده
  React.useEffect(() => {
    const onLockRequest = () => {
      const en = getLS(LS_ENABLED) === "true";
      if (en) {
        setMode("locked");
      }
    };
    window.addEventListener("app-lock:lock", onLockRequest as EventListener);
    return () => window.removeEventListener("app-lock:lock", onLockRequest as EventListener);
  }, []);

  React.useEffect(() => {
    const en = getLS(LS_ENABLED) === "true";
    const savedPin = getLS(LS_PIN);
    const savedBiometric = getLS(LS_BIOMETRIC) === "true";
    const sessionUnlocked = typeof window !== "undefined" ? sessionStorage.getItem(LS_SESSION_UNLOCKED) === "true" : false;
 
    setEnabled(en);
    setBiometric(savedBiometric);
 
    // راه‌اندازی پیش‌فرض تایمر بیکاری (۱ ساعت) اگر تنظیم نشده باشد
    if (typeof window !== "undefined") {
      const hasTimeout = localStorage.getItem(LS_IDLE_TIMEOUT_MS);
      if (!hasTimeout) {
        try { localStorage.setItem(LS_IDLE_TIMEOUT_MS, String(60 * 60 * 1000)); } catch {}
      }
    }
 
    // اگر در همین نشست قبلاً باز شده باشد و هنوز تایم‌اوت بیکاری نگذشته، Overlay را نشان نده
    const now = Date.now();
    const last = Number(localStorage.getItem(LS_LAST_ACTIVITY) || "0");
    const timeout = Number(localStorage.getItem(LS_IDLE_TIMEOUT_MS) || (60 * 60 * 1000));
    const idleExceeded = last > 0 ? (now - last) > timeout : false;
 
    if (en && savedPin && sessionUnlocked && !idleExceeded) {
      setMode("disabled");
    } else if (en && !savedPin) {
      setMode("setup");
    } else if (en && savedPin) {
      setMode("locked");
    } else {
      setMode("disabled");
    }
 
    // شنونده‌های فعالیت کاربر برای تمدید زمان آخرین فعالیت
    function markActivity() {
      try { localStorage.setItem(LS_LAST_ACTIVITY, String(Date.now())); } catch {}
    }
    window.addEventListener("mousemove", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity, { passive: true });
    window.addEventListener("click", markActivity, { passive: true });
    window.addEventListener("scroll", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });
 
    // تایمر بررسی بیکاری برای قفل خودکار
    const interval = window.setInterval(() => {
      try {
        const en2 = localStorage.getItem(LS_ENABLED) === "true";
        const hasPin = !!localStorage.getItem(LS_PIN);
        const unlocked = sessionStorage.getItem(LS_SESSION_UNLOCKED) === "true";
        const last2 = Number(localStorage.getItem(LS_LAST_ACTIVITY) || "0");
        const timeout2 = Number(localStorage.getItem(LS_IDLE_TIMEOUT_MS) || (60 * 60 * 1000));
        const now2 = Date.now();
        const idleExceeded2 = last2 > 0 ? (now2 - last2) > timeout2 : false;
        // اگر فعال است، پین دارد، نشست باز است و بیکاری از حد گذشته → قفل کن
        if (en2 && hasPin && unlocked && idleExceeded2) {
          setMode("locked");
          // نشست دیگر باز نیست تا زمانی که کاربر دوباره باز کند
          sessionStorage.removeItem(LS_SESSION_UNLOCKED);
        }
      } catch {}
    }, 30_000); // هر 30 ثانیه بررسی کن
 
    return () => {
      window.removeEventListener("mousemove", markActivity as EventListener);
      window.removeEventListener("keydown", markActivity as EventListener);
      window.removeEventListener("click", markActivity as EventListener);
      window.removeEventListener("scroll", markActivity as EventListener);
      window.removeEventListener("touchstart", markActivity as EventListener);
      window.clearInterval(interval);
    };
  }, []);

  const handleSetup = React.useCallback(() => {
    setError(null);
    if (!pin || pin.length < 4) {
      setError("PIN باید حداقل ۴ رقم باشد.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN و تأیید آن یکسان نیستند.");
      return;
    }
    setLS(LS_PIN, pin);
    setLS(LS_ENABLED, "true");
    setEnabled(true);
    // بلافاصله آخرین فعالیت را ذخیره کن
    try { localStorage.setItem(LS_LAST_ACTIVITY, String(Date.now())); } catch {}
    setMode("locked");
    setPin("");
    setConfirmPin("");
  }, [pin, confirmPin]);

  const handleUnlock = React.useCallback(async () => {
    setError(null);
    const savedPin = getLS(LS_PIN);
    // اگر بیومتریک فعال باشد، تلاش ساده و نمایشی:
    if (biometric && "credentials" in navigator) {
      try {
        // نمایش ساده: اکثر مرورگرها نیاز به PublicKeyCredential دارند؛ اینجا صرفاً تلاش تستی می‌کنیم.
        // در نسخه کامل، باید WebAuthn به‌درستی پیاده‌سازی شود.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).credentials.get?.({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: "required",
          },
        });
        // نشست جاری را بازشده علامت بزن و آخرین فعالیت را به روز کن
        try {
          sessionStorage.setItem(LS_SESSION_UNLOCKED, "true");
          localStorage.setItem(LS_LAST_ACTIVITY, String(Date.now()));
        } catch {}
        setMode("disabled"); // باز شد
        setPin("");
        return;
      } catch {
        // اگر بیومتریک شکست خورد، به PIN برمی‌گردیم
      }
    }
    if (pin && savedPin && pin === savedPin) {
      try {
        sessionStorage.setItem(LS_SESSION_UNLOCKED, "true");
        localStorage.setItem(LS_LAST_ACTIVITY, String(Date.now()));
      } catch {}
      setMode("disabled");
      setPin("");
    } else {
      setError("PIN اشتباه است.");
    }
  }, [pin, biometric]);

  const handleDisable = React.useCallback(() => {
    setError(null);
    const savedPin = getLS(LS_PIN);
    if (!currentPin || currentPin !== savedPin) {
      setError("PIN فعلی اشتباه است.");
      return;
    }
    removeLS(LS_PIN);
    removeLS(LS_ENABLED);
    removeLS(LS_BIOMETRIC);
    setEnabled(false);
    setBiometric(false);
    setCurrentPin("");
    setPin("");
    setConfirmPin("");
    setMode("disabled");
  }, [currentPin]);

  const handleChangePin = React.useCallback(() => {
    setError(null);
    const savedPin = getLS(LS_PIN);
    if (currentPin !== savedPin) {
      setError("PIN فعلی اشتباه است.");
      return;
    }
    if (!pin || pin.length < 4) {
      setError("PIN باید حداقل ۴ رقم باشد.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN جدید و تأیید آن یکسان نیستند.");
      return;
    }
    setLS(LS_PIN, pin);
    setCurrentPin("");
    setPin("");
    setConfirmPin("");
    setMode("locked");
  }, [currentPin, pin, confirmPin]);

  const toggleBiometric = React.useCallback(() => {
    const next = !biometric;
    setBiometric(next);
    setLS(LS_BIOMETRIC, String(next));
  }, [biometric]);
 
  // دکمه قفل‌کردن صریح (نمایش overlay در حالت locked اگر فعال است)
  const lockNowExplicit = React.useCallback(() => {
    const en = getLS(LS_ENABLED) === "true";
    if (en) {
      setMode("locked");
    } else {
      // اگر هنوز فعال نشده، ابتدا فعال و وارد setup شو
      setLS(LS_ENABLED, "true");
      setMode("setup");
    }
  }, []);
 
  // سناریوهای نمایش لایه قفل:
  // - اگر قبلاً فعال شده و PIN ذخیره شده: نمایش حالت locked
  // - اگر فقط enable شده ولی PIN تنظیم نشده: نمایش setup
  // - اگر هیچ‌کدام: اجازه می‌دهیم با دکمه "فعال‌سازی و تنظیم PIN" وارد setup شویم
  const shouldRenderOverlay = mode !== "disabled";
 
  return (
    <div
      className={`fixed inset-0 z-[60] ${shouldRenderOverlay ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!shouldRenderOverlay}
    >
      {/* پس‌زمینه هماهنگ با پروژه: از bg-background و شیشه‌ای استفاده می‌کنیم */}
      <div className="fixed inset-0 bg-background/60 dark:bg-background/70 backdrop-blur-md transition-colors" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* کارت شیشه‌ای هماهنگ با theme و radius پروژه */}
        <div className="w-full max-w-md glass rounded-[var(--radius)] border border-border/60 shadow-2xl p-6 space-y-5">
          {(mode === "setup" || (!enabled && mode === "disabled")) && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Lock size={18} /> تنظیم قفل برنامه
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("disabled")}
                  title="بستن بدون فعال‌سازی"
                >
                  بستن
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    dir="ltr"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="مثلاً 1234"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPin((s) => !s)}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPin">تأیید PIN</Label>
                <Input
                  id="confirmPin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  dir="ltr"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="تکرار PIN"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">بیومتریک</span>
                <Button type="button" variant={biometric ? "default" : "outline"} size="sm" onClick={toggleBiometric}>
                  <Fingerprint size={16} className="mr-1" /> {biometric ? "فعال" : "غیرفعال"}
                </Button>
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSetup}>ثبت</Button>
                <Button className="flex-1" variant="outline" onClick={() => setMode("disabled")}>انصراف</Button>
              </div>
            </>
          )}

          {mode === "locked" && (
            <>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Lock size={18} /> برنامه قفل است
              </h2>

              <div className="space-y-2">
                <Label htmlFor="unlockPin">PIN</Label>
                <div className="relative">
                  <Input
                    id="unlockPin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    dir="ltr"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN خود را وارد کنید"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPin((s) => !s)}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleUnlock}>باز کردن</Button>
                <Button variant="outline" onClick={() => setMode("change")}>تغییر PIN</Button>
              </div>

              <div className="flex justify-between">
                <Button
                  variant={biometric ? "default" : "outline"}
                  onClick={handleUnlock}
                  className="flex items-center gap-2"
                  title="تلاش بیومتریک اگر فعال است، در غیر این صورت PIN بررسی می‌شود"
                >
                  <Fingerprint size={16} /> بیومتریک
                </Button>
                <Button variant="ghost" onClick={() => setMode("disabled")}>بستن لایه</Button>
              </div>
            </>
          )}

          {mode === "change" && (
            <>
              <h2 className="text-lg font-bold">تغییر یا حذف PIN</h2>

              <div className="space-y-2">
                <Label htmlFor="currentPin">PIN فعلی</Label>
                <div className="relative">
                  <Input
                    id="currentPin"
                    type={showCurrentPin ? "text" : "password"}
                    inputMode="numeric"
                    dir="ltr"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="PIN فعلی"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPin((s) => !s)}
                  >
                    {showCurrentPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPin">PIN جدید</Label>
                <Input
                  id="newPin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  dir="ltr"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="حداقل ۴ رقم"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPin">تأیید PIN جدید</Label>
                <Input
                  id="confirmNewPin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  dir="ltr"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="تکرار PIN"
                />
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleChangePin}>ذخیره</Button>
                <Button variant="destructive" onClick={handleDisable}>حذف قفل</Button>
              </div>
              <Button variant="outline" onClick={() => setMode("locked")} className="w-full">بازگشت</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * هوک کمکی برای کنترل قفل در هر جای اپ
 * - enable: کاربر می‌تواند از داخل تنظیمات، قفل را فعال و PIN تنظیم کند (mode = setup)
 * - lockNow: فوراً UI را قفل کن (اگر فعال است)
 */
export function useAppSecureLock() {
  const enable = React.useCallback(() => {
    setLS(LS_ENABLED, "true");
    window.dispatchEvent(new Event("app-lock:lock"));
  }, []);

  const lockNow = React.useCallback(() => {
    window.dispatchEvent(new Event("app-lock:lock"));
  }, []);

  return { enable, lockNow };
}