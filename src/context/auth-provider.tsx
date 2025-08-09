"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/integrations/supabase/client";

type Role = "admin" | "user" | null;

type AuthState = {
  loading: boolean;
  session: import("@supabase/supabase-js").Session | null;
  user: import("@supabase/supabase-js").User | null;
  role: Role;
  error?: string | null;
};

type AuthContextType = AuthState & {
  signInWithPassword: (email: string, password: string, opts?: { pinFallback?: string | null }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  // Offline auth helpers
  unlockOffline: (method?: "webauthn" | "pin", pinIfNeeded?: string) => Promise<{ ok: boolean; error?: string }>;
  isOnlineReauthRequired: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchRoleForUser(userId: string): Promise<Role> {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Error will be handled by the caller
    return null;
  }
  const role = (data?.role ?? null) as Role;
  return role;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    role: null,
    error: null,
  });
  // آخرین فعالیت کاربر برای قفل آفلاین
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());

  const loadInitial = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) {
      setState({
        loading: false,
        session: null,
        user: null,
        role: null,
        error: sessionError.message,
      });
      return;
    }
    const session = sessionData.session ?? null;
    const user = session?.user ?? null;

    let role: Role = null;
    if (user?.id) {
      role = await fetchRoleForUser(user.id);
    }
    setState({
      loading: false,
      session,
      user,
      role,
      error: null,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    loadInitial();

    const { data: sub } = supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      const user = newSession?.user ?? null;
      let role: Role = null;
      if (user?.id) {
        role = await fetchRoleForUser(user.id);
      }
      setState({
        loading: false,
        session: newSession ?? null,
        user,
        role,
        error: null,
      });
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadInitial]);

  const signInWithPassword = useCallback(async (email: string, password: string, opts?: { pinFallback?: string | null }) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    const user = data.user ?? null;
    let role: Role = null;
    if (user?.id) {
      role = await fetchRoleForUser(user.id);
    }
    setState({
      loading: false,
      session: data.session ?? null,
      user,
      role,
      error: null,
    });

    // پس از ورود آنلاین، مقداردهی احراز هویت آفلاین
    try {
      const accessToken = data.session?.access_token ?? "";
      const refreshToken = data.session?.refresh_token ?? null;
      // استخراج endpoint از env (در صورت نیاز برای ذخیره)
      const endpointBaseUrl =
        (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined) ||
        (process.env.VITE_API_BASE_URL as string | undefined) ||
        null;

      // به‌صورت پیش‌فرض WebAuthn ترجیح دارد؛ اگر موجود نبود از PIN ورودی استفاده می‌کنیم
      const { AuthService } = await import("@/services/auth-service");
      const init = await AuthService.initializeAfterOnlineLogin({
        userId: user?.id ?? "unknown",
        accessToken,
        refreshToken,
        endpointBaseUrl,
        preferWebAuthn: true,
        pinForFallback: opts?.pinFallback ?? null,
      });
      if (!init.ok) {
        // Error will be handled by the outer catch block
      }
    } catch (e) {
      // Error will be handled by the outer catch block
    }

    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    try {
      const { AuthService } = await import("@/services/auth-service");
      await AuthService.clearAll();
    } catch {}
    setState({
      loading: false,
      session: null,
      user: null,
      role: null,
      error: null,
    });
  }, []);

  const refreshRole = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;
    const role = await fetchRoleForUser(userId);
    setState((s) => ({ ...s, role }));
  }, [state.user?.id]);

  const unlockOffline = useCallback(async (method?: "webauthn" | "pin", pinIfNeeded?: string) => {
    const { AuthService } = await import("@/services/auth-service");
    const res = await AuthService.unlock(method, pinIfNeeded);
    if (res.ok) setLastActivityAt(Date.now());
    return res;
  }, []);

  const isOnlineReauthRequired = useCallback(async () => {
    const { AuthService } = await import("@/services/auth-service");
    return AuthService.isOnlineReauthRequired();
  }, []);

  // ردیاب فعالیت کاربر برای قفل خودکار
  useEffect(() => {
    const mark = () => setLastActivityAt(Date.now());
    const evts: ("mousemove" | "mousedown" | "keydown" | "touchstart" | "visibilitychange")[] = ["mousemove", "mousedown", "keydown", "touchstart", "visibilitychange"];
    evts.forEach((e) => window.addEventListener(e, mark as EventListener, { passive: true } as AddEventListenerOptions));
    return () => {
      evts.forEach((e) => window.removeEventListener(e, mark as EventListener));
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      signInWithPassword,
      signOut,
      refreshRole,
      unlockOffline,
      isOnlineReauthRequired,
    }),
    [state, signInWithPassword, signOut, refreshRole, unlockOffline, isOnlineReauthRequired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}