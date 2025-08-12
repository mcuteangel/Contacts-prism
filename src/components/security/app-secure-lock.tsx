"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [redirectToLogin, setRedirectToLogin] = React.useState(false);
  const lastActivityRef = React.useRef<number>(typeof window !== 'undefined' ? Date.now() : 0);
  const router = useRouter();

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
      console.log("[AppSecureLock] refreshMeta - wrapMethod:", wm, "policy:", pol);
      setWrapMethod(wm);
      setPolicy(pol);
    } catch (e) {
      console.error("[AppSecureLock] refreshMeta error:", e);
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

  // Initial load check
  React.useEffect(() => {
    console.log('[AppSecureLock] Component mounted, checking initial lock state');
    const checkInitialLock = async () => {
      try {
        const AuthService = await loadAuth();
        // First check if we have any auth data
        const wrapMethod = await AuthService.getWrapMethod();
        console.log(`[AppSecureLock] Initial wrap method: ${wrapMethod}`);
        
        if (!wrapMethod) {
          console.log('[AppSecureLock] No auth data found, not showing lock');
          setVisible(false);
          return;
        }
        
        // If we have auth data, check if we should lock
        const should = await AuthService.shouldLock(lastActivityRef.current);
        console.log(`[AppSecureLock] Initial lock check - should lock: ${should}`);
        
        if (should) {
          await refreshMeta();
        }
        
        // Small delay to prevent flash of lock screen
        setTimeout(() => {
          setVisible(should);
        }, 100);
      } catch (e) {
        console.error('[AppSecureLock] Error in initial lock check:', e);
        setVisible(false);
      }
    };
    
    // Add a small delay to ensure AuthProvider is initialized
    const timer = setTimeout(() => {
      checkInitialLock().catch(console.error);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [loadAuth, refreshMeta]);

  // Respond to external lock requests
  React.useEffect(() => {
    console.log('[AppSecureLock] Setting up event listeners');
    
    const onLock = () => {
      console.log('[AppSecureLock] Received app-lock:lock event');
      setVisible(true);
      setError(null);
      void refreshMeta();
    };
    
    window.addEventListener("app-lock:lock", onLock as EventListener);
    
    // Listen for login redirect
    const onLoginRedirect = () => {
      console.log('[AppSecureLock] Received app-lock:login event');
      setVisible(false);
      setError(null);
    };
    
    // Listen for unlock after successful auth
    const onUnlock = (e: Event) => {
      console.log('[AppSecureLock] Received app-unlock event', { 
        source: e.type, 
        timestamp: new Date().toISOString() 
      });
      setVisible(false);
      setError(null);
      console.log("[AppSecureLock] App unlocked after successful authentication");
      // آپدیت زمان آخرین فعالیت برای جلوگیری از قفل فوری
      lastActivityRef.current = Date.now();
    };
    
    window.addEventListener("app-lock:login", onLoginRedirect as EventListener);
    window.addEventListener("app-unlock", onUnlock as EventListener);
    
    return () => {
      window.removeEventListener("app-lock:lock", onLock as EventListener);
      window.removeEventListener("app-lock:login", onLoginRedirect as EventListener);
      window.removeEventListener("app-unlock", onUnlock as EventListener);
    };
  }, [refreshMeta]);

  // Periodic check for inactivity-based lock
  React.useEffect(() => {
    console.log('[AppSecureLock] Setting up inactivity timer');
    let timer: number | null = null;
    const tick = async () => {
      try {
        console.log('[AppSecureLock] Checking if should lock...');
        const AuthService = await loadAuth();
        const should = await AuthService.shouldLock(lastActivityRef.current);
        console.log(`[AppSecureLock] Should lock: ${should}, lastActivity: ${new Date(lastActivityRef.current).toISOString()}`);
        setVisible(should);
        if (should) {
          console.log('[AppSecureLock] Locking app, refreshing meta...');
          await refreshMeta();
        }
      } catch (e) {
        console.error('[AppSecureLock] Error in inactivity check:', e);
      } finally {
        timer = window.setTimeout(tick, 30_000);
      }
    };
    // Initial check immediately
    tick().catch(console.error);
    return () => {
      console.log('[AppSecureLock] Cleaning up inactivity timer');
      if (timer) window.clearTimeout(timer);
    };
  }, [loadAuth, refreshMeta]);

  // Try unlock via method
  const handleUnlock = React.useCallback(async () => {
    console.log('[AppSecureLock] handleUnlock called', { wrapMethod, hasPin: !!pin });
    setError(null);
    try {
      const AuthService = await loadAuth();
      console.log('[AppSecureLock] AuthService loaded, attempting unlock with method:', wrapMethod);
      
      if (wrapMethod === "webauthn") {
        console.log('[AppSecureLock] Attempting WebAuthn unlock');
        const res = await AuthService.unlock("webauthn");
        console.log('[AppSecureLock] WebAuthn unlock result:', res);
        
        if (!res.ok) {
          const errorMsg = res.error || "باز کردن با WebAuthn ناموفق بود.";
          console.error('[AppSecureLock] WebAuthn unlock failed:', errorMsg);
          setError(errorMsg);
          return;
        }
        
        console.log('[AppSecureLock] WebAuthn unlock successful, hiding lock screen');
        setVisible(false);
        lastActivityRef.current = Date.now();
        
      } else if (wrapMethod === "pin") {
        console.log('[AppSecureLock] Attempting PIN unlock');
        
        if (!pin || pin.length < 4) {
          const errorMsg = "PIN باید حداقل ۴ رقم باشد.";
          console.error('[AppSecureLock] Invalid PIN format');
          setError(errorMsg);
          return;
        }
        
        const res = await AuthService.unlock("pin", pin);
        console.log('[AppSecureLock] PIN unlock result:', res);
        
        if (!res.ok) {
          const errorMsg = res.error || "PIN نادرست است.";
          console.error('[AppSecureLock] PIN unlock failed:', errorMsg);
          setError(errorMsg);
          return;
        }
        
        console.log('[AppSecureLock] PIN unlock successful, hiding lock screen');
        setVisible(false);
        setPin("");
        lastActivityRef.current = Date.now();
        
      } else {
        const errorMsg = "احراز هویت آفلاین پیکربندی نشده است.";
        console.error('[AppSecureLock] No unlock method configured');
        setError(errorMsg);
        return;
      }
      
      console.log('[AppSecureLock] Refresh meta after successful unlock');
      await refreshMeta();

      // رویداد اطلاع‌رسانی برای سنک خودکار پس از unlock موفق
      try {
        console.log('[AppSecureLock] Dispatching app-unlocked event');
        window.dispatchEvent(new Event("app-unlocked"));
      } catch (e) {
        console.error('[AppSecureLock] Error dispatching app-unlocked event:', e);
      }
      
    } catch (e: any) {
      const errorMsg = e?.message ?? "unlock failed";
      console.error('[AppSecureLock] Error during unlock:', e);
      setError(errorMsg);
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
      suppressHydrationWarning
    >
      <div className="fixed inset-0 bg-background/60 dark:bg-background/70 backdrop-blur-md transition-colors" suppressHydrationWarning />
      <div className="absolute inset-0 flex items-center justify-center p-4" suppressHydrationWarning>
        <div className="w-full max-w-md glass rounded-[var(--radius)] border border-border/60 shadow-2xl p-6 space-y-5" suppressHydrationWarning>
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
            <div className="space-y-4">
              <div className="text-sm opacity-80">
                احراز هویت آفلاین هنوز مقداردهی نشده است. ابتدا یک ورود آنلاین انجام دهید.
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    window.dispatchEvent(new Event("app-lock:login"));
                    router.push('/login');
                  }}
                  className="flex-1 flex items-center gap-2"
                  variant="outline"
                >
                  <LogIn size={16} />
                  ورود آنلاین
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setVisible(false)}
                  className="flex-1"
                >
                  بستن
                </Button>
              </div>
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
  
  const redirectToLogin = React.useCallback(() => {
    window.dispatchEvent(new Event("app-lock:login"));
  }, []);

  const enable = React.useCallback((enabled: boolean) => {
    localStorage.setItem("app_lock_enabled", enabled.toString());
    window.dispatchEvent(new CustomEvent("app-lock:toggle", { detail: { enabled } }));
  }, []);
  
  return { lockNow, redirectToLogin, enable };
}