"use client";

import React from "react";
import { useAuth } from "@/context/auth-provider";

/**
 * AppHeader
 * - Header bar wrapper that renders the auth/network status strip
 */
export default function AppHeader() {
  return (
    <header className="w-full">
      <HeaderAuthStatus />
    </header>
  );
}

/**
 * HeaderAuthStatus
 * - نمایش وضعیت ورود/خروج کاربر + نقش + وضعیت شبکه + دکمه خروج
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
    <div className="w-full bg-muted/80 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-3 py-2 text-xs">
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
          <span
            className={network === "online" ? "text-green-600" : "text-red-600"}
            suppressHydrationWarning
          >
            {network}
          </span>
        </div>
      </div>
      {/* spacer برای جلوگیری از overlap با محتوای زیرهدر در لایه‌های مختلف */}
      <div className="h-2 md:h-1" aria-hidden="true" />
    </div>
  );
}