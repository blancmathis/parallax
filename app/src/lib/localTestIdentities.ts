export type LocalTestIdentity = {
  label: "user" | "reviewer" | "admin";
  email: string;
};

function isLoopbackSupabase(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "localhost" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("127.");
  } catch {
    return false;
  }
}

const enabled = import.meta.env.DEV &&
  import.meta.env.VITE_LOCAL_TEST_IDENTITIES === "1" &&
  isLoopbackSupabase(import.meta.env.VITE_SUPABASE_URL);

/**
 * Local-only sign-in help. Vite replaces the flag at build time, so the false
 * branch can be removed from public assets; the production build script also
 * rejects the opt-in and scans the generated bundle for every seed credential.
 */
export const localTestIdentityHelp = enabled
  ? {
      identities: [
        { label: "user", email: "user@example.test" },
        { label: "reviewer", email: "reviewer@example.test" },
        { label: "admin", email: "admin@example.test" },
      ] satisfies LocalTestIdentity[],
      password: "Parallax123!",
    }
  : null;
