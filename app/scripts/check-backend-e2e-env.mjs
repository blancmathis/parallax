const required = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "PLAYWRIGHT_SUPABASE_URL",
  "PLAYWRIGHT_SUPABASE_ANON_KEY",
  "PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`[backend-e2e] Missing required environment variable: ${key}`);
  }
}

const viteUrl = new URL(process.env.VITE_SUPABASE_URL);
const playwrightUrl = new URL(process.env.PLAYWRIGHT_SUPABASE_URL);
const loopback = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

if (!loopback.has(viteUrl.hostname) || !loopback.has(playwrightUrl.hostname)) {
  throw new Error("[backend-e2e] Refusing to run against a non-loopback Supabase URL.");
}
if (viteUrl.href !== playwrightUrl.href) {
  throw new Error("[backend-e2e] Browser and test harness must target the same Supabase stack.");
}
if (
  process.env.PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY ===
  process.env.VITE_SUPABASE_ANON_KEY
) {
  throw new Error("[backend-e2e] Service and browser-safe keys must be distinct.");
}

console.log(`[backend-e2e] validated disposable Supabase target ${viteUrl.origin}`);
