"use client";

import React from "react";
import { AuthProvider, useAuth } from "@/context/auth-provider";
import SyncBootstrapper from "@/components/sync-bootstrapper";
import AppSecureLock from "@/components/security/app-secure-lock";

/**
 * AuthShell
 * - یک شل کلاینتی که AuthProvider را فراهم می‌کند
 * - الزام ورود سراسری را با رندر in-place صفحه لاگین اعمال می‌کند
 * - SyncBootstrapper و قفل لایه دوم UI را نیز مدیریت می‌کند
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncBootstrapper />
      <AuthGate>{children}</AuthGate>
      <AppSecureLock />
    </AuthProvider>
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