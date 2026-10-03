import type { Locale } from "../../i18n";

export const MIN_AUTH_PASSWORD_LENGTH = 12;

export function authPasswordMeetsPolicy(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(password);
}

const copy = {
  fr: {
    auth: "Authentification Supabase",
    signInTitle: "Connectez-vous pour les parcours backend",
    recoveryTitle: "Choisissez un nouveau mot de passe",
    recoveryHint: "Utilisez au moins 12 caractères, avec une minuscule, une majuscule, un chiffre et un symbole.",
    email: "Adresse e-mail",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le nouveau mot de passe",
    login: "Connexion",
    signup: "Inscription",
    logIn: "Se connecter",
    createAccount: "Créer le compte",
    forgotPassword: "Mot de passe oublié ?",
    sendReset: "Envoyer le lien de réinitialisation",
    backToLogin: "Retour à la connexion",
    updatePassword: "Mettre à jour le mot de passe",
    working: "Traitement…",
    loggedIn: "Connexion réussie.",
    signedUp: "Compte créé. Vous êtes connecté.",
    confirmationRequired:
      "Si cette adresse peut être inscrite, consultez vos e-mails pour la confirmer avant de vous connecter.",
    resetRequested:
      "Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation du mot de passe.",
    passwordUpdated: "Votre mot de passe a été mis à jour.",
    loginFailed: "L’adresse e-mail ou le mot de passe n’a pas été accepté.",
    signupFailed: "La demande d’inscription n’a pas abouti. Vérifiez les champs et réessayez.",
    resetFailed: "La demande de réinitialisation n’a pas abouti. Réessayez.",
    updateFailed: "Le mot de passe n’a pas pu être mis à jour. Réessayez depuis le lien reçu.",
    passwordInvalid: "Le mot de passe doit contenir au moins 12 caractères, avec une minuscule, une majuscule, un chiffre et un symbole.",
    passwordMismatch: "Les deux mots de passe ne correspondent pas.",
    refreshSession: "Actualiser la session",
    sessionRefreshed: "Session actualisée.",
    profileUnavailable: "Le rôle du compte est momentanément indisponible. Réessayez d’actualiser la session.",
    role: "rôle",
    loading: "chargement",
    unavailable: "indisponible",
    logOut: "Se déconnecter",
    signOutFailed: "La déconnexion n’a pas abouti. Réessayez.",
    localOnly: "Aide de test locale uniquement",
    localAccounts: "comptes",
    localPassword: "mot de passe partagé",
  },
  en: {
    auth: "Supabase auth",
    signInTitle: "Sign in for backend workflows",
    recoveryTitle: "Choose a new password",
    recoveryHint: "Use at least 12 characters, with a lowercase letter, uppercase letter, number, and symbol.",
    email: "Email address",
    password: "Password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    login: "Login",
    signup: "Signup",
    logIn: "Log in",
    createAccount: "Create account",
    forgotPassword: "Forgot password?",
    sendReset: "Send reset link",
    backToLogin: "Back to sign in",
    updatePassword: "Update password",
    working: "Working…",
    loggedIn: "Signed in.",
    signedUp: "Account created. You’re signed in.",
    confirmationRequired:
      "If this address can be registered, check your email to confirm it before signing in.",
    resetRequested:
      "If an account exists for this email, you’ll receive a password reset link.",
    passwordUpdated: "Your password has been updated.",
    loginFailed: "The email address or password was not accepted.",
    signupFailed: "The signup request could not be completed. Check the fields and try again.",
    resetFailed: "The password reset request could not be completed. Try again.",
    updateFailed: "The password could not be updated. Try again from the link you received.",
    passwordInvalid: "The password must be at least 12 characters, with a lowercase letter, uppercase letter, number, and symbol.",
    passwordMismatch: "The two passwords do not match.",
    refreshSession: "Refresh session",
    sessionRefreshed: "Session refreshed.",
    profileUnavailable: "The account role is temporarily unavailable. Try refreshing the session.",
    role: "role",
    loading: "loading",
    unavailable: "unavailable",
    logOut: "Log out",
    signOutFailed: "Sign out could not be completed. Try again.",
    localOnly: "Local test help only",
    localAccounts: "accounts",
    localPassword: "shared password",
  },
} as const;

export function authCopy(locale: Locale) {
  return copy[locale];
}
