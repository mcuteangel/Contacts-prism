/**
 * Deprecated: این کامپوننت با نسخه جدید قفل (AppSecureLock) جایگزین شده است.
 * برای سازگاری با importهای قدیمی، یک شِل خالی صادر می‌کنیم تا هیچ UI اضافه‌ای رندر نشود.
 * مسیر جدید: "@/components/security/app-secure-lock"
 */
"use client";

import React from "react";

interface AppLockProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** شِل خالی - بدون رندر UI */
export function AppLock(_props: AppLockProps) {
  return null;
}