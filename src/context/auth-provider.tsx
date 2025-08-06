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
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchRoleForUser(userId: string): Promise<Role> {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[AuthProvider] error fetching role:", error.message);
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

  const signInWithPassword = useCallback(async (email: string, password: string) => {
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
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
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

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      signInWithPassword,
      signOut,
      refreshRole,
    }),
    [state, signInWithPassword, signOut, refreshRole]
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