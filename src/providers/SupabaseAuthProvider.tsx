import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserRole, UserProfile, AccountStatus } from "@/types/auth";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  status: AccountStatus;
  email_confirmed_at?: string;
  isAnonymous?: boolean;
}

export interface SignUpParams {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: "entrepreneur" | "advisor";
}

export interface SignInParams {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEntrepreneur: boolean;
  isAdvisor: boolean;
  isAdmin: boolean;
  roleDashboardUrl: string;
  signUpWithPassword: (params: SignUpParams) => Promise<{ user: any; session: any; error?: any }>;
  signInWithPassword: (params: SignInParams) => Promise<{ user: any; session: any; error?: any }>;
  signInWithGoogle: () => Promise<void>;
  signIn: (provider: string, formData?: FormData) => Promise<any>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ error?: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: any }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LOCAL_GUEST_KEY = "gramudaan_guest_user";
const LOCAL_PROFILE_KEY = "gramudaan_cached_profile";

function getLocalGuestUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalGuestUser(): AuthUser {
  const guest: AuthUser = {
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: "guest@gramudaan.local",
    name: "अतिथि उद्यमी (Guest)",
    role: "entrepreneur",
    status: "active",
    isAnonymous: true,
  };
  localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(guest));
  return guest;
}

function clearLocalGuestUser() {
  localStorage.removeItem(LOCAL_GUEST_KEY);
  localStorage.removeItem(LOCAL_PROFILE_KEY);
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or create profile from Supabase profiles table
  const fetchProfileForUser = async (sbUser: User): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sbUser.id)
        .maybeSingle();

      if (!error && data) {
        const prof = data as UserProfile;
        setProfile(prof);
        try {
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(prof));
        } catch {}
        return prof;
      }

      // If profile record does not exist yet (e.g., direct DB insert needed)
      const requestedRole: UserRole =
        sbUser.user_metadata?.role === "advisor" || sbUser.user_metadata?.role === "admin"
          ? sbUser.user_metadata.role
          : "entrepreneur";

      const newProfile: Partial<UserProfile> = {
        user_id: sbUser.id,
        email: sbUser.email || "",
        full_name:
          sbUser.user_metadata?.full_name ||
          sbUser.user_metadata?.name ||
          sbUser.email?.split("@")[0] ||
          "उद्यमी",
        phone: sbUser.user_metadata?.phone || "",
        role: requestedRole,
        status: "active",
        preferred_language: "hi",
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        const prof = inserted as UserProfile;
        setProfile(prof);
        try {
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(prof));
        } catch {}
        return prof;
      }
    } catch (err) {
      console.warn("[SupabaseAuthProvider] Profile fetch notice:", err);
    }
    return null;
  };

  const syncUserFromSupabase = async (sbUser: User | null) => {
    if (sbUser) {
      const metaRole = (sbUser.user_metadata?.role as UserRole) || "entrepreneur";
      const metaName =
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split("@")[0] ||
        "उद्यमी";
      const metaPhone = sbUser.user_metadata?.phone || "";

      // Set initial user immediately from JWT
      const initialUser: AuthUser = {
        id: sbUser.id,
        email: sbUser.email,
        name: metaName,
        phone: metaPhone,
        role: metaRole,
        status: "active",
        email_confirmed_at: sbUser.email_confirmed_at,
        isAnonymous: sbUser.is_anonymous || false,
      };
      setUser(initialUser);

      // Then sync full database profile
      const prof = await fetchProfileForUser(sbUser);
      if (prof) {
        setUser({
          ...initialUser,
          name: prof.full_name || initialUser.name,
          phone: prof.phone || initialUser.phone,
          role: prof.role || initialUser.role,
          avatar_url: prof.avatar_url,
          status: prof.status || "active",
        });
      }
    } else {
      const guest = getLocalGuestUser();
      setUser(guest);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial session load
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        await syncUserFromSupabase(session?.user || null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        syncUserFromSupabase(null);
        setIsLoading(false);
      });

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      await syncUserFromSupabase(currentSession?.user || null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfileForUser(session.user);
    }
  };

  const signUpWithPassword = async ({
    email,
    password,
    full_name,
    phone = "",
    role,
  }: SignUpParams) => {
    clearLocalGuestUser();
    // Safety check: ensure role is only entrepreneur or advisor
    const safeRole: "entrepreneur" | "advisor" = role === "advisor" ? "advisor" : "entrepreneur";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          role: safeRole,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      await syncUserFromSupabase(data.user);
    }

    return { user: data.user, session: data.session };
  };

  const signInWithPassword = async ({ email, password }: SignInParams) => {
    clearLocalGuestUser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      await syncUserFromSupabase(data.user);
    }

    return { user: data.user, session: data.session };
  };

  const signInWithGoogle = async () => {
    clearLocalGuestUser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return {};
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return {};
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    return {};
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user) return null;

    try {
      // Non-admins cannot update role or status
      const cleanUpdates = { ...updates };
      if (!isAdmin) {
        delete cleanUpdates.role;
        delete cleanUpdates.status;
      }
      cleanUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("profiles")
        .update(cleanUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (!error && data) {
        const updated = data as UserProfile;
        setProfile(updated);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                name: updated.full_name || prev.name,
                phone: updated.phone || prev.phone,
                avatar_url: updated.avatar_url || prev.avatar_url,
              }
            : null
        );
        try {
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      }
    } catch (err) {
      console.error("[SupabaseAuthProvider] updateUserProfile error:", err);
    }
    return null;
  };

  // Backwards compatible signIn method (for OTP and anonymous guest login)
  const signIn = async (provider: string, formData?: FormData) => {
    if (provider === "email-otp" && formData) {
      const email = String(formData.get("email") || "").trim();
      const code = String(formData.get("code") || "").trim();

      if (code) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });
        if (error) throw error;
        clearLocalGuestUser();
        return data;
      } else {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: { role: "entrepreneur" },
          },
        });
        if (error) throw error;
        return data;
      }
    }

    if (provider === "anonymous") {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          const guest = setLocalGuestUser();
          setUser(guest);
          return { user: guest };
        }
        return data;
      } catch {
        const guest = setLocalGuestUser();
        setUser(guest);
        return { user: guest };
      }
    }

    throw new Error(`Unsupported auth provider: ${provider}`);
  };

  const signOut = async () => {
    clearLocalGuestUser();
    setUser(null);
    setProfile(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Supabase Auth] Sign out notice:", err);
    }
  };

  const isAuthenticated = Boolean(user || session);
  const currentRole: UserRole = user?.role || "entrepreneur";
  const isEntrepreneur = currentRole === "entrepreneur";
  const isAdvisor = currentRole === "advisor";
  const isAdmin = currentRole === "admin";

  const roleDashboardUrl =
    currentRole === "admin"
      ? "/dashboard/admin"
      : currentRole === "advisor"
        ? "/dashboard/advisor"
        : "/dashboard/entrepreneur";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated,
        isEntrepreneur,
        isAdvisor,
        isAdmin,
        roleDashboardUrl,
        signUpWithPassword,
        signInWithPassword,
        signInWithGoogle,
        signIn,
        resetPasswordForEmail,
        updatePassword,
        resendVerificationEmail,
        updateUserProfile,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}
