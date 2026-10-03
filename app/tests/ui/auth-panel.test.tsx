import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../src/i18n";

const authMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const localIdentityMock = vi.hoisted(() => ({
  value: null as null | {
    identities: { label: string; email: string }[];
    password: string;
  },
}));

vi.mock("../../src/lib/auth", () => ({
  useAuth: () => authMock.value,
}));

vi.mock("../../src/lib/localTestIdentities", () => ({
  get localTestIdentityHelp() {
    return localIdentityMock.value;
  },
}));

vi.mock("../../src/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: null,
}));

vi.mock("../../src/features/dossier/DossierViews", () => ({
  MyClaimDossiers: () => null,
}));

import { AuthPanel } from "../../src/pages/You";

function baseAuth() {
  return {
    status: "anonymous",
    session: null,
    user: null,
    profile: null,
    profileState: "idle",
    isPasswordRecovery: false,
    isReviewer: false,
    isAdmin: false,
    refreshProfile: vi.fn().mockResolvedValue("ready"),
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue("confirmation_required"),
    requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
}

function renderPanel(path = "/you") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <AuthPanel />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("AuthPanel", () => {
  beforeEach(() => {
    authMock.value = baseAuth();
    localIdentityMock.value = null;
  });

  it("starts with empty public fields and exposes no seed credential", () => {
    renderPanel();

    expect(screen.getByLabelText("Email address")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    for (const credential of [
      "user@example.test",
      "reviewer@example.test",
      "admin@example.test",
      "Parallax123!",
    ]) {
      expect(document.body).not.toHaveTextContent(credential);
    }
  });

  it("shows local seed help only when the opt-in helper is enabled", () => {
    localIdentityMock.value = {
      identities: [
        { label: "user", email: "user@example.test" },
        { label: "reviewer", email: "reviewer@example.test" },
        { label: "admin", email: "admin@example.test" },
      ],
      password: "Parallax123!",
    };
    renderPanel();

    expect(screen.getByText(/Local test help only/)).toHaveTextContent(
      "user: user@example.test",
    );
    expect(screen.getByText(/Local test help only/)).toHaveTextContent(
      "shared password: Parallax123!",
    );
    expect(screen.getByLabelText("Email address")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("does not claim account creation when signup requires confirmation", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Signup" }));
    await user.type(screen.getByLabelText("Email address"), "pending@example.com");
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("minlength", "12");
    await user.type(password, "Safe-password1!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(authMock.value.signUp).toHaveBeenCalledWith(
      "pending@example.com",
      "Safe-password1!",
      "/you",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "If this address can be registered, check your email to confirm it before signing in.",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("Account created");
  });

  it("announces an active-session signup distinctly", async () => {
    const user = userEvent.setup();
    authMock.value = {
      ...baseAuth(),
      signUp: vi.fn().mockResolvedValue("signed_in"),
    };
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Signup" }));
    await user.type(screen.getByLabelText("Email address"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "Safe-password1!");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Account created. You’re signed in.",
    );
  });

  it("uses the localized signup redirect and confirmation-safe French message", async () => {
    const user = userEvent.setup();
    renderPanel("/fr/you");

    await user.click(screen.getByRole("button", { name: "Inscription" }));
    await user.type(screen.getByLabelText("Adresse e-mail"), "pending@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Safe-password1!");
    await user.click(screen.getByRole("button", { name: "Créer le compte" }));

    expect(authMock.value.signUp).toHaveBeenCalledWith(
      "pending@example.com",
      "Safe-password1!",
      "/fr/you",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Si cette adresse peut être inscrite, consultez vos e-mails pour la confirmer avant de vous connecter.",
    );
  });

  it("requests reset with a localized same-origin path and an anti-enumeration message", async () => {
    const user = userEvent.setup();
    renderPanel("/fr/you");

    await user.click(screen.getByRole("button", { name: "Mot de passe oublié ?" }));
    await user.type(screen.getByLabelText("Adresse e-mail"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: "Envoyer le lien de réinitialisation" }));

    expect(authMock.value.requestPasswordReset).toHaveBeenCalledWith(
      "unknown@example.com",
      "/fr/you",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation du mot de passe.",
    );
  });

  it("never displays a provider error that could enumerate reset accounts", async () => {
    const user = userEvent.setup();
    authMock.value = {
      ...baseAuth(),
      requestPasswordReset: vi.fn().mockRejectedValue(new Error("User not found")),
    };
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    await user.type(screen.getByLabelText("Email address"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The password reset request could not be completed. Try again.",
    );
    expect(document.body).not.toHaveTextContent("User not found");
  });

  it("validates and submits the localized password recovery form", async () => {
    const user = userEvent.setup();
    authMock.value = {
      ...baseAuth(),
      user: { id: "user-1", email: "person@example.com" },
      profileState: "ready",
      isPasswordRecovery: true,
    };
    renderPanel("/fr/you");

    expect(screen.getByLabelText("Nouveau mot de passe")).toHaveAttribute("minlength", "12");
    await user.type(screen.getByLabelText("Nouveau mot de passe"), "New-password1!");
    await user.type(screen.getByLabelText("Confirmer le nouveau mot de passe"), "New-password2!");
    await user.click(screen.getByRole("button", { name: "Mettre à jour le mot de passe" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Les deux mots de passe ne correspondent pas.",
    );
    expect(authMock.value.updatePassword).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Confirmer le nouveau mot de passe"));
    await user.type(screen.getByLabelText("Confirmer le nouveau mot de passe"), "New-password1!");
    await user.click(screen.getByRole("button", { name: "Mettre à jour le mot de passe" }));

    expect(authMock.value.updatePassword).toHaveBeenCalledWith("New-password1!");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Votre mot de passe a été mis à jour.",
    );
  });

  it("marks the role unavailable when profile loading fails", () => {
    authMock.value = {
      ...baseAuth(),
      status: "authenticated",
      user: { id: "user-1", email: "person@example.com" },
      profileState: "error",
    };
    renderPanel();

    expect(screen.getByText(/role:/)).toHaveTextContent("role: unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The account role is temporarily unavailable.",
    );
    expect(document.body).not.toHaveTextContent("role: loading");
  });
});
