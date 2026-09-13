/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
export type ProfileState = "idle" | "loading" | "ready" | "error";
export type SignUpOutcome = "signed_in" | "confirmation_required";
export type PasswordRecoveryPath = "/you" | "/fr/you";

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileState: ProfileState;
  isPasswordRecovery: boolean;
  isReviewer: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<ProfileState>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    redirectPath: PasswordRecoveryPath,
  ) => Promise<SignUpOutcome>;
  requestPasswordReset: (
    email: string,
    redirectPath: PasswordRecoveryPath,
  ) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
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

export function passwordRecoveryRedirect(path: PasswordRecoveryPath): string {
  if (path !== "/you" && path !== "/fr/you") {
    throw new Error("Invalid password recovery redirect path.");
  }
  return new URL(path, window.location.origin).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileState, setProfileState] = useState<ProfileState>("idle");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const profileRequest = useRef(0);
  const currentUserId = useRef<string | null>(null);
  const currentProfileState = useRef<ProfileState>("idle");

  const applySession = useCallback(async (nextSession: Session | null): Promise<ProfileState> => {
    const requestId = ++profileRequest.current;
    currentUserId.current = nextSession?.user.id ?? null;
    setSession(nextSession);
    if (!nextSession?.user) {
      setProfile(null);
      currentProfileState.current = "idle";
      setProfileState("idle");
      setStatus("anonymous");
      return "idle";
    }
    setProfile(null);
    currentProfileState.current = "loading";
    setProfileState("loading");
    try {
      const nextProfile = await loadProfile(nextSession.user.id);
      if (requestId !== profileRequest.current) return "idle";
      if (!nextProfile) throw new Error("Authenticated account has no profile.");
      setProfile(nextProfile);
      currentProfileState.current = "ready";
      setProfileState("ready");
      return "ready";
    } catch {
      if (requestId !== profileRequest.current) return "idle";
      setProfile(null);
      currentProfileState.current = "error";
      setProfileState("error");
      return "error";
    } finally {
      if (requestId === profileRequest.current) setStatus("authenticated");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const client = supabase;
    if (!client) return "idle";
    const { data, error } = await client.auth.getSession();
    if (error) {
      setProfile(null);
      currentProfileState.current = "error";
      setProfileState("error");
      throw error;
    }
    return applySession(data.session);
  }, [applySession]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    void client.auth.getSession().then(
      async ({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        await applySession(data.session);
      },
      () => {
        if (cancelled) return;
        setProfile(null);
        currentProfileState.current = "error";
        setProfileState("error");
        setStatus("anonymous");
      },
    ).catch(() => {
      if (cancelled) return;
      setProfile(null);
      currentProfileState.current = "error";
      setProfileState("error");
      setStatus("anonymous");
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      if (!nextSession) setIsPasswordRecovery(false);
      if (
        nextSession?.user.id === currentUserId.current &&
        currentProfileState.current === "ready"
      ) {
        setSession(nextSession);
        setStatus("authenticated");
        return;
      }
      queueMicrotask(() => {
        if (!cancelled) void applySession(nextSession);
      });
    });
    return () => {
      cancelled = true;
      profileRequest.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      profileState,
      isPasswordRecovery,
      isReviewer: profile?.role === "reviewer" || profile?.role === "admin",
      isAdmin: profile?.role === "admin",
      refreshProfile,
      signIn: async (email, password) => {
        const client = supabase;
        if (!client) throw new Error("Supabase is not configured.");
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await applySession(data.session);
      },
      signUp: async (email, password, redirectPath) => {
        const client = supabase;
        if (!client) throw new Error("Supabase is not configured.");
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: email.split("@")[0] },
            emailRedirectTo: passwordRecoveryRedirect(redirectPath),
          },
        });
        if (error) throw error;
        if (!data.session) return "confirmation_required";
        await applySession(data.session);
        return "signed_in";
      },
      requestPasswordReset: async (email, redirectPath) => {
        const client = supabase;
        if (!client) throw new Error("Supabase is not configured.");
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: passwordRecoveryRedirect(redirectPath),
        });
        if (error) throw error;
      },
      updatePassword: async (password) => {
        const client = supabase;
        if (!client) throw new Error("Supabase is not configured.");
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        setIsPasswordRecovery(false);
      },
      signOut: async () => {
        const client = supabase;
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) throw error;
        setIsPasswordRecovery(false);
        await applySession(null);
      },
    }),
    [
      applySession,
      isPasswordRecovery,
      profile,
      profileState,
      refreshProfile,
      session,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
