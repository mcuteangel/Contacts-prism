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
  lastActivityAt?: number; // Add lastActivityAt to the state type
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
      lastActivityAt: Date.now(),
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







  // Track auth state changes
  useEffect(() => {
    console.log('[AuthProvider] Setting up auth state listener');
    let mounted = true;
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AuthProvider] Auth state changed:', event);
        if (!mounted) return;
        
        const user = newSession?.user ?? null;
        let role: Role = null;
        
        if (user?.id) {
          try {
            role = await fetchRoleForUser(user.id);
            console.log('[AuthProvider] Fetched user role:', role);
          } catch (error) {
            console.error('[AuthProvider] Error fetching user role:', error);
          }
        }
        
        console.log('[AuthProvider] Updating auth state with new session');
        setState({
          loading: false,
          session: newSession ?? null,
          user,
          role,
          error: null,
        });
        
        // If this is a sign in event, dispatch unlock event
        if (event === 'SIGNED_IN') {
          console.log('[AuthProvider] User signed in, dispatching app-unlock event');
          window.dispatchEvent(new Event('app-unlock'));
        }
      }
    );

    // Initial load
    const initialize = async () => {
      try {
        console.log('[AuthProvider] Starting initial auth state load');
        await loadInitial();
        console.log('[AuthProvider] Initial auth state loaded successfully');
      } catch (error) {
        console.error('[AuthProvider] Error during initial auth load:', error);
      }
    };
    
    initialize();

    return () => {
      console.log('[AuthProvider] Cleaning up auth state listener');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string, opts?: { pinFallback?: string | null }) => {
      console.log('[AuthProvider] signInWithPassword called for email:', email);
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) {
          console.error('[AuthProvider] Sign in error:', error);
          setState(prev => ({ ...prev, loading: false, error: error.message }));
          return { error: error.message };
        }
        
        const user = data.user ?? null;
        let role: Role = null;
        
        if (user?.id) {
          try {
            role = await fetchRoleForUser(user.id);
            console.log('[AuthProvider] Fetched user role after sign in:', role);
          } catch (roleError) {
            console.error('[AuthProvider] Error fetching user role after sign in:', roleError);
          }
        }
        
        console.log('[AuthProvider] User signed in successfully, updating state');
        setState({
          loading: false,
          session: data.session ?? null,
          user,
          role,
          error: null,
        });
        
        // Dispatch unlock event after successful sign in
        window.dispatchEvent(new Event('app-unlock'));
        console.log('[AuthProvider] Dispatched app-unlock event after sign in');
        
        return { error: undefined };
        
      } catch (error) {
        console.error('[AuthProvider] Unexpected error in signInWithPassword:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return { error: errorMessage };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    console.log('[AuthProvider] Signing out user');
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      
      setState({
        loading: false,
        session: null,
        user: null,
        role: null,
        error: null,
      });
      
    } catch (error) {
      console.error('[AuthProvider] Error signing out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (!state.user?.id) return;
    
    try {
      const role = await fetchRoleForUser(state.user.id);
      setState(prev => ({
        ...prev,
        role,
      }));
    } catch (error) {
      console.error('[AuthProvider] Error refreshing role:', error);
    }
  }, [state.user?.id]);

  const unlockOffline = useCallback(async (method?: 'webauthn' | 'pin', pinIfNeeded?: string) => {
    console.log('[AuthProvider] unlockOffline called with method:', method);
    try {
      const { AuthService } = await import('@/services/auth-service');
      const result = await AuthService.unlock(method, pinIfNeeded);
      
      if (result.ok) {
        console.log('[AuthProvider] Offline unlock successful');
        window.dispatchEvent(new Event('app-unlock'));
      } else {
        console.error('[AuthProvider] Offline unlock failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[AuthProvider] Error in unlockOffline:', error);
      return { ok: false, error: 'An error occurred during offline unlock' };
    }
  }, []);

  const isOnlineReauthRequired = useCallback(async () => {
    try {
      const { AuthService } = await import('@/services/auth-service');
      return await AuthService.isOnlineReauthRequired();
    } catch (error) {
      console.error('[AuthProvider] Error checking if online reauth is required:', error);
      return true; // Default to requiring reauth if we can't determine
    }
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