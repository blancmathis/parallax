import { act, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  maybeSingle: vi.fn(),
  unsubscribe: vi.fn(),
  authStateCallback: null as null | ((event: string, session: unknown) => void),
}));

vi.mock("../../src/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: backend.getSession,
      signInWithPassword: backend.signInWithPassword,
      signUp: backend.signUp,
      signOut: backend.signOut,
      resetPasswordForEmail: backend.resetPasswordForEmail,
      updateUser: backend.updateUser,
      onAuthStateChange: vi.fn((callback) => {
        backend.authStateCallback = callback;
        return { data: { subscription: { unsubscribe: backend.unsubscribe } } };
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: backend.maybeSingle })),
      })),
    })),
  },
}));

import {
  AuthProvider,
  passwordRecoveryRedirect,
  useAuth,
  type AuthContextValue,
  type PasswordRecoveryPath,
} from "../../src/lib/auth";

let currentAuth: AuthContextValue | null = null;

function Probe() {
  currentAuth = useAuth();
  return (
    <dl>
      <dt>Status</dt>
      <dd>{currentAuth.status}</dd>
      <dt>Profile</dt>
      <dd>{currentAuth.profileState}</dd>
      <dt>User</dt>
      <dd>{currentAuth.user?.email ?? "none"}</dd>
      <dt>Recovery</dt>
      <dd>{String(currentAuth.isPasswordRecovery)}</dd>
      <dt>Reviewer</dt>
      <dd>{String(currentAuth.isReviewer)}</dd>
    </dl>
  );
}

function auth(): AuthContextValue {
  if (!currentAuth) throw new Error("Auth context has not rendered.");
  return currentAuth;
}

function session(email = "person@example.com"): Session {
  return {
    access_token: "access",
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: { id: "user-1", email },
  } as unknown as Session;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    currentAuth = null;
    backend.authStateCallback = null;
    vi.clearAllMocks();
    backend.getSession.mockResolvedValue({ data: { session: null }, error: null });
    backend.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null });
    backend.signUp.mockResolvedValue({ data: { session: null, user: {} }, error: null });
    backend.signOut.mockResolvedValue({ error: null });
    backend.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    backend.updateUser.mockResolvedValue({ data: { user: {} }, error: null });
    backend.maybeSingle.mockResolvedValue({
      data: {
        id: "user-1",
        email: "person@example.com",
        display_name: "Person",
        role: "normal",
      },
      error: null,
    });
  });

  it("distinguishes confirmation-required signup from an active session", async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText("anonymous");

    let outcome = await auth().signUp("pending@example.com", "Safe-password1!", "/you");
    expect(outcome).toBe("confirmation_required");
    expect(backend.signUp).toHaveBeenCalledWith({
      email: "pending@example.com",
      password: "Safe-password1!",
      options: {
        data: { display_name: "pending" },
        emailRedirectTo: new URL("/you", window.location.origin).toString(),
      },
    });

    backend.signUp.mockResolvedValueOnce({
      data: { session: session(), user: {} },
      error: null,
    });
    await act(async () => {
      outcome = await auth().signUp("person@example.com", "Safe-password1!", "/you");
    });

    expect(outcome).toBe("signed_in");
    expect(screen.getByText("person@example.com")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it("absorbs profile-load failures from auth events without granting a role", async () => {
    backend.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: new Error("profile unavailable"),
    });
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText("anonymous");

    act(() => {
      backend.authStateCallback?.("SIGNED_IN", session());
    });
    expect(backend.maybeSingle).not.toHaveBeenCalled();

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByText("person@example.com")).toBeInTheDocument();
    expect(screen.getByText("false", { selector: "dd:last-child" })).toBeInTheDocument();
  });

  it("defers profile queries until after the auth callback returns", async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText("anonymous");

    act(() => {
      backend.authStateCallback?.("SIGNED_IN", session());
      expect(backend.maybeSingle).not.toHaveBeenCalled();
    });

    await waitFor(() => expect(backend.maybeSingle).toHaveBeenCalledTimes(1));
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it("does not reload a ready profile for a same-user token refresh", async () => {
    backend.getSession.mockResolvedValueOnce({ data: { session: session() }, error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());
    expect(backend.maybeSingle).toHaveBeenCalledTimes(1);

    act(() => {
      backend.authStateCallback?.("TOKEN_REFRESHED", session());
    });
    await Promise.resolve();

    expect(backend.maybeSingle).toHaveBeenCalledTimes(1);
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it("treats a missing authenticated profile as an unavailable role", async () => {
    backend.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText("anonymous");

    act(() => {
      backend.authStateCallback?.("SIGNED_IN", session());
    });

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByText("false", { selector: "dd:last-child" })).toBeInTheDocument();
  });

  it("uses a controlled same-origin reset URL and completes PASSWORD_RECOVERY", async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText("anonymous");

    await auth().requestPasswordReset("person@example.com", "/fr/you");
    expect(backend.resetPasswordForEmail).toHaveBeenCalledWith(
      "person@example.com",
      { redirectTo: new URL("/fr/you", window.location.origin).toString() },
    );
    expect(() => passwordRecoveryRedirect("https://evil.example" as PasswordRecoveryPath))
      .toThrow("Invalid password recovery redirect path.");

    await act(async () => {
      backend.authStateCallback?.("PASSWORD_RECOVERY", session());
    });
    await waitFor(() => expect(screen.getByText("true")).toBeInTheDocument());

    await act(async () => {
      await auth().updatePassword("new-safe-password");
    });
    expect(backend.updateUser).toHaveBeenCalledWith({ password: "new-safe-password" });
    expect(screen.getByText("false", { selector: "dd:nth-of-type(4)" })).toBeInTheDocument();
  });
});
