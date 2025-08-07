"use client";

import React from "react";
import { AuthProvider, useAuth } from "@/context/auth-provider";
import SyncBootstrapper from "@/components/sync-bootstrapper";
import AppSecureLock from "@/components/security/app-secure-lock";
import SyncService from "@/services/sync-service";
import LoginPage from "@/app/login/page";

/**
 * AuthShell
 * - یک شل کلاینتی که AuthProvider را فراهم می‌کند
 * - الزام ورود سراسری را با رندر in-place صفحه لاگین اعمال می‌کند
 * - SyncBootstrapper و قفل لایه دوم UI را نیز مدیریت می‌کند
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HeaderAuthStatus />
      <AuthGateWithSync>{children}</AuthGateWithSync>
      <AppSecureLock />
    </AuthProvider>
  );
}

/**
 * HeaderAuthStatus
 * - نوار هدر برای نمایش وضعیت ورود/خروج کاربر + شبکه
 * - سبک و مستقل از SyncBootstrapper برای جلوگیری از تداخل
 */
function HeaderAuthStatus() {
  const { loading, user, session, role, signOut } = useAuth() as any;
  const [network, setNetwork] = React.useState<"online" | "offline">("offline");

  React.useEffect(() => {
    if (typeof navigator !== "undefined") {
      setNetwork(navigator.onLine ? "online" : "offline");
    }
    const on = () => setNetwork("online");
    const off = () => setNetwork("offline");
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-3 py-2 text-xs bg-muted/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-medium">Auth:</span>
          {loading ? (
            <span className="opacity-70">Loading…</span>
          ) : user && session ? (
            <>
              <span className="text-green-600">Logged in</span>
              <span className="opacity-70">•</span>
              <span title={user?.email ?? user?.id}>{user?.email ?? user?.id}</span>
              {role ? (
                <>
                  <span className="opacity-70">•</span>
                  <span className="uppercase">{role}</span>
                </>
              ) : null}
              <button
                className="ml-3 px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                onClick={() => signOut()}
                title="خروج"
              >
                خروج
              </button>
            </>
          ) : (
            <span className="text-red-600">Logged out</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={network === "online" ? "text-green-600" : "text-red-600"}>{network}</span>
        </div>
      </div>
      {/* spacer to not overlap page content */}
      <div className="h-10" />
    </div>
  );
}

/**
 * HeaderAuthStatus
 * - نمایش وضعیت ورود/خروج کاربر در هدر ثابت
 * - وضعیت شبکه و وضعیت سنک را ساده نشان می‌دهد (از SyncBootstrapper مستقل است تا سبک بماند)
 */

function AuthGateWithSync({ children }: { children: React.ReactNode }) {
  // 1) همه Hookها باید بدون شرط و با ترتیب ثابت فراخوانی شوند
  const { loading, user, session, accessToken } = useAuth() as any;

  // 2) رفرنس و لیسنرهای فعالیت همیشه باید ساخته شوند تا ترتیب Hook تغییر نکند
  const lastActivityRef = React.useRef<number>(Date.now());
  React.useEffect(() => {
    const mark = () => (lastActivityRef.current = Date.now());
    const evts: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    evts.forEach((e) => window.addEventListener(e, mark as EventListener, { passive: true } as AddEventListenerOptions));
    const onVis = () => {
      // هنگام برگشت فوکوس، فقط زمان فعالیت را آپدیت کن؛ باز کردن قفل را به تعامل کاربر بسپار
      mark();
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis as EventListener);
    return () => {
      evts.forEach((e) => window.removeEventListener(e, mark as EventListener));
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis as EventListener);
    };
  }, []);

  // 3) baseUrl از env
  const endpointBaseUrlEnv =
    (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined) ||
    (typeof window !== "undefined" ? (window as any).__API_BASE_URL : undefined);

  // 4) رندر UI
  return (
    <>
      <SyncBootstrapper
        onSyncRequested={async () => {
          try {
            const { AuthService } = await import("@/services/auth-service");

            // اگر هنوز وضعیت auth مشخص نیست یا لاگین نداریم، سنک را رد کن
            if (loading || !session || !user) return;

            // Silent offline-init اگر لازم باشد
            const wrap = await AuthService.getWrapMethod();
            if (!wrap) {
              const supaSession = (session as any) ?? null;
              const at = supaSession?.access_token ?? null;
              const rt = supaSession?.refresh_token ?? null;
              const endpointBaseUrl =
                (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined) ||
                (process.env.VITE_API_BASE_URL as string | undefined) ||
                null;
              if (!at) {
                window.dispatchEvent(new CustomEvent("sync:failed", { detail: "no access token in session" }));
                return;
              }
              const init = await AuthService.initializeAfterOnlineLogin({
                userId: user.id,
                accessToken: at,
                refreshToken: rt,
                endpointBaseUrl,
                preferWebAuthn: true,
                pinForFallback: null,
              });
              if (!init.ok) {
                console.warn("[AuthShell] Silent offline-init failed:", init.error);
                window.dispatchEvent(new CustomEvent("sync:failed", { detail: init.error }));
                return;
              }
            }

            // 7 روز
            if (await AuthService.isOnlineReauthRequired()) {
              window.dispatchEvent(new CustomEvent("sync:failed", { detail: "نیاز به ورود آنلاین (مهلت آفلاین به پایان رسیده)" }));
              return;
            }

            // قفل براساس بیکاری
            if (await AuthService.shouldLock(lastActivityRef.current)) {
              window.dispatchEvent(new CustomEvent("sync:failed", { detail: "قفل فعال است؛ سنک خودکار رد شد." }));
              return;
            }

            // اجرای سنک با توکن‌های امن از AuthService
            const endpointBaseUrl = endpointBaseUrlEnv;
            const wrapMethod = (await AuthService.getWrapMethod()) as "webauthn" | "pin" | null;
            if (!wrapMethod) {
              window.dispatchEvent(new CustomEvent("sync:failed", { detail: "wrap method is not initialized" }));
              return;
            }

            // token retrieval (بدون PIN در سنک خودکار)
            const tokensRes = await AuthService.getTokens(wrapMethod, undefined);
            if (!(tokensRes as any)?.ok) {
              window.dispatchEvent(new CustomEvent("sync:failed", { detail: (tokensRes as any)?.error ?? "failed to retrieve secure tokens" }));
              return;
            }
            const { accessToken: secureAccessToken, endpointBaseUrl: secureEndpointBaseUrl } = (tokensRes as any).data ?? {};

            // چک سخت‌گیرانه endpoint
            const effectiveEndpoint = secureEndpointBaseUrl ?? endpointBaseUrl;
            if (!effectiveEndpoint || typeof effectiveEndpoint !== "string" || !/^https?:\/\//i.test(effectiveEndpoint)) {
              window.dispatchEvent(new CustomEvent("sync:failed", { detail: "Endpoint Base URL is not configured" }));
              return;
            }

            const res = await SyncService.runSync({
              accessToken: secureAccessToken ?? accessToken ?? undefined,
              endpointBaseUrl: effectiveEndpoint,
            });

            if ((res as any)?.ok) {
              window.dispatchEvent(new CustomEvent("sync:completed", { detail: (res as any).data }));
              window.dispatchEvent(new Event("visibilitychange"));
            } else {
              window.dispatchEvent(new CustomEvent("sync:failed", { detail: (res as any)?.error ?? "sync failed" }));
            }
          } catch (e: any) {
            window.dispatchEvent(new CustomEvent("sync:failed", { detail: e?.message ?? "sync failed" }));
          }
        }}
      />
      {/* نمایش children فقط وقتی session و user آماده‌اند؛ بدون تغییر ترتیب Hook */}
      {session && user ? children : null}
    </>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="opacity-80">در حال بارگذاری...</span>
      </div>
    );
  }

  if (!user) {
    const LoginPage = require("@/app/login/page").default;
    return <LoginPage />;
  }

  return <>{children}</>;
}