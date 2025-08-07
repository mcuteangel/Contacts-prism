"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Lock, Eye, EyeOff } from "lucide-react";

/**
 * AppSecureLock (Aligned with AuthService)
 * - No longer stores PIN/biometric flags in localStorage.
 * - Uses AuthService for:
 *   • shouldLock(lastActivityAt)
 *   • unlock(method, pin?)
 *   • getWrapMethod()
 *   • getPolicy() and setInactivityMs(ms)
 * - Listens to "app-lock:lock" to force overlay open.
 */

type WrapMethod = "webauthn" | "pin" | null;

export default function AppSecureLock() {
  const [visible, setVisible] = React.useState(false);
  const [wrapMethod, setWrapMethod] = React.useState<WrapMethod>(null);
  const [policy, setPolicy] = React.useState<{
    inactivityMs: number;
    offlineAllowedUntil: string | null;
    lastOnlineAuthAt: string | null;
    lastUnlockAt: string | null;
  } | null>(null);
  const [pin, setPin] = React.useState("");
  const [showPin, setShowPin] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Utilities to import AuthService lazily
  const loadAuth = React.useCallback(async () => {
    const { AuthService } = await import("@/services/auth-service");
    return AuthService;
  }, []);

  const refreshMeta = React.useCallback(async () => {
    try {
      const AuthService = await loadAuth();
      const wm = await AuthService.getWrapMethod();
      const pol = await AuthService.getPolicy();
      setWrapMethod(wm);
      setPolicy(pol);
    } catch (e) {
      // ignore
    }
  }, [loadAuth]);

  // Track activity locally to decide locking
  React.useEffect(() => {
    const mark = () => {
      lastActivityRef.current = Date.now();
    };
    const winEvents: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    winEvents.forEach((e) => window.addEventListener(e, mark as EventListener, { passive: true } as AddEventListenerOptions));
    // visibilitychange باید روی document شنیده شود
    const onVis = () => mark();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis as EventListener);
    }
    return () => {
      winEvents.forEach((e) => window.removeEventListener(e, mark as EventListener));
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis as EventListener);
      }
    };
  }, []);

  // Respond to external lock requests
  React.useEffect(() => {
    const onLock = () => {
      setVisible(true);
      setError(null);
      void refreshMeta();
    };
    window.addEventListener("app-lock:lock", onLock as EventListener);
    return () => window.removeEventListener("app-lock:lock", onLock as EventListener);
  }, [refreshMeta]);

  // Periodic check for inactivity-based lock
  React.useEffect(() => {
    let timer: number | null = null;
    const tick = async () => {
      try {
        const AuthService = await loadAuth();
        const should = await AuthService.shouldLock(lastActivityRef.current);
        setVisible(should);
        if (should) {
          await refreshMeta();
        }
      } catch {
        // ignore
      } finally {
        timer = window.setTimeout(tick, 30_000);
      }
    };
    tick();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loadAuth, refreshMeta]);

  // Try unlock via method
  const handleUnlock = React.useCallback(async () => {
    setError(null);
    try {
      const AuthService = await loadAuth();
      if (wrapMethod === "webauthn") {
        const res = await AuthService.unlock("webauthn");
        if (!res.ok) {
          setError(res.error || "باز کردن با WebAuthn ناموفق بود.");
          return;
        }
        setVisible(false);
        lastActivityRef.current = Date.now();
      } else if (wrapMethod === "pin") {
        if (!pin || pin.length < 4) {
          setError("PIN باید حداقل ۴ رقم باشد.");
          return;
        }
        const res = await AuthService.unlock("pin", pin);
        if (!res.ok) {
          setError(res.error || "PIN نادرست است.");
          return;
        }
        setVisible(false);
        setPin("");
        lastActivityRef.current = Date.now();
      } else {
        setError("احراز هویت آفلاین پیکربندی نشده است.");
      }
      await refreshMeta();

      // رویداد اطلاع‌رسانی برای سنک خودکار پس از unlock موفق
      try {
        window.dispatchEvent(new Event("app-unlocked"));
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "unlock failed");
    }
  }, [wrapMethod, pin, loadAuth, refreshMeta]);

  // Update inactivity timeout
  const handleUpdateInactivity = React.useCallback(async (nextMs: number) => {
    try {
      const AuthService = await loadAuth();
      await AuthService.setInactivityMs(nextMs);
      await refreshMeta();
    } catch (e) {
      // ignore
    }
  }, [loadAuth, refreshMeta]);

  const shouldRenderOverlay = visible;

  return (
    <div
      className={`fixed inset-0 z-[60] ${shouldRenderOverlay ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!shouldRenderOverlay}
    >
      <div className="fixed inset-0 bg-background/60 dark:bg-background/70 backdrop-blur-md transition-colors" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass rounded-[var(--radius)] border border-border/60 shadow-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lock size={18} /> برنامه قفل است
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisible(false)}
              title="بستن موقت لایه (قفل باقی‌ست تا unlock کنید)"
            >
              بستن
            </Button>
          </div>

          {/* Policy summary */}
          <div className="text-xs opacity-80 space-y-1">
            <div>روش احراز هویت: <span className="font-medium">{wrapMethod ?? "نامشخص"}</span></div>
            {policy?.offlineAllowedUntil ? (
              <div>مهلت آفلاین تا: <span className="font-medium">{new Date(policy.offlineAllowedUntil).toLocaleString()}</span></div>
            ) : null}
            {policy?.lastOnlineAuthAt ? (
              <div>آخرین ورود آنلاین: <span className="font-medium">{new Date(policy.lastOnlineAuthAt).toLocaleString()}</span></div>
            ) : null}
            {policy?.lastUnlockAt ? (
              <div>آخرین بازکردن: <span className="font-medium">{new Date(policy.lastUnlockAt).toLocaleString()}</span></div>
            ) : null}
            <div className="flex items-center gap-2">
              <span>قفل پس از بیکاری (دقیقه):</span>
              <Input
                type="number"
                min={1}
                step={1}
                className="h-8 w-20"
                defaultValue={Math.floor((policy?.inactivityMs ?? 60 * 60 * 1000) / 60000)}
                onBlur={(e) => {
                  const v = Number(e.currentTarget.value);
                  if (!isNaN(v) && v > 0) {
                    handleUpdateInactivity(v * 60 * 1000);
                  }
                }}
              />
            </div>
          </div>

          {/* Unlock controls */}
          {wrapMethod === "webauthn" ? (
            <div className="flex items-center justify-between">
              <Button onClick={handleUnlock} className="flex items-center gap-2">
                <Fingerprint size={16} /> باز کردن با WebAuthn
              </Button>
            </div>
          ) : wrapMethod === "pin" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="unlockPin">PIN</Label>
                <div className="relative">
                  <Input
                    id="unlockPin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    dir="ltr"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
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
              <div className="flex gap-2">
                <Button onClick={handleUnlock} className="flex-1">باز کردن</Button>
                <Button variant="outline" onClick={() => setVisible(false)} className="flex-1">بستن لایه</Button>
              </div>
            </>
          ) : (
            <div className="text-sm opacity-80">
              احراز هویت آفلاین هنوز مقداردهی نشده است. ابتدا یک ورود آنلاین انجام دهید.
            </div>
          )}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * هوک کمکی برای کنترل قفل از هر جای اپ
 */
export function useAppSecureLock() {
  const lockNow = React.useCallback(() => {
    window.dispatchEvent(new Event("app-lock:lock"));
  }, []);
  return { lockNow };
}