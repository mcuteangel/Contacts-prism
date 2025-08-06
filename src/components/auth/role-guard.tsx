"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";

type Role = "admin" | "user" | null;

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="opacity-80">در حال بارگذاری...</span>
      </div>
    );
  }
  if (!user) return null; // لحظه‌ای تا ریدایرکت

  return <>{children}</>;
}

export function RequireRole({
  role,
  children,
}: {
  role: Exclude<Role, null>;
  children: React.ReactNode;
}) {
  const { loading, user, role: currentRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="opacity-80">در حال بررسی نقش...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="glass rounded-lg p-6 text-center space-y-3">
          <p>برای دسترسی باید ابتدا وارد شوید.</p>
          <Button onClick={() => (window.location.href = "/login")}>ورود</Button>
        </div>
      </div>
    );
  }

  if (currentRole !== role) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="glass rounded-lg p-6 text-center space-y-2">
          <h2 className="font-bold">دسترسی غیرمجاز</h2>
          <p className="text-sm text-muted-foreground">
            شما مجوز مشاهده این بخش را ندارید.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}