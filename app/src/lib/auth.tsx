/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export type AppRole = "normal" | "reviewer" | "admin";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
}

type AuthStatus = "loading" | "anonymous" | "authenticated" | "unconfigured";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isReviewer: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );

  const refreshProfile = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const nextSession = data.session;
    setSession(nextSession);
    if (!nextSession?.user) {
      setProfile(null);
      setStatus("anonymous");
      return;
    }
    const nextProfile = await loadProfile(nextSession.user.id);
    setProfile(nextProfile);
    setStatus("authenticated");
  };

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.user) {
        const nextProfile = await loadProfile(data.session.user.id);
        if (!cancelled) setProfile(nextProfile);
      }
      if (!cancelled) setStatus(data.session ? "authenticated" : "anonymous");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        setStatus("anonymous");
        return;
      }
      loadProfile(nextSession.user.id)
        .then(setProfile)
        .finally(() => setStatus("authenticated"));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      isReviewer: profile?.role === "reviewer" || profile?.role === "admin",
      isAdmin: profile?.role === "admin",
      refreshProfile,
      signIn: async (email, password) => {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password) => {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: email.split("@")[0] } },
        });
        if (error) throw error;
      },
      signOut: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [profile, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
