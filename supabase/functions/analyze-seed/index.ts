import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SourceInput = {
  url?: string;
  note?: string;
};

type Retrieval = {
  url: string;
  status: "found" | "missing" | "blocked" | "failed" | "partial";
  title: string;
  publisher: string;
  excerpt: string;
  note: string;
  locator: string;
  hash: string;
};

const FETCH_TIMEOUT_MS = 4500;
const MAX_SOURCE_BYTES = 128_000;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "metadata.google.internal" ||
    host === "169.254.169.254" ||
    host === "::1" ||
    host.startsWith("[::1]") ||
    isPrivateIpv4(host)
  );
}

async function hashText(text: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function extractTitle(text: string, fallback: string) {
  const match = text.match(/<title[^>]*>([^<]{1,160})<\/title>/i);
  return (match?.[1] ?? fallback).replace(/\s+/g, " ").trim().slice(0, 160);
}

function textExcerpt(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

async function rejectPrivateDns(hostname: string) {
  if (isBlockedHost(hostname)) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return isPrivateIpv4(hostname);
  try {
    const records = await Deno.resolveDns(hostname, "A");
    return records.some(isPrivateIpv4);
  } catch {
    return true;
  }
}

async function fetchProvidedSource(input: SourceInput): Promise<Retrieval> {
  const rawUrl = (input.url ?? "").trim();
  const note = (input.note ?? "").trim();
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      url: rawUrl || "invalid-url",
      status: "blocked",
      title: "Invalid provided URL",
      publisher: "Provided source",
      excerpt: "",
      note: note || "URL parsing failed before fetch.",
      locator: "blocked-before-fetch",
      hash: "",
    };
  }

  if (!["http:", "https:"].includes(url.protocol) || await rejectPrivateDns(url.hostname)) {
    return {
      url: url.toString(),
      status: "blocked",
      title: "Blocked provided URL",
      publisher: url.hostname,
      excerpt: "",
      note: note || "Blocked by SSRF guard before fetch.",
      locator: "blocked-before-fetch",
      hash: "",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "accept": "text/html,text/plain,application/xhtml+xml,application/json;q=0.8,*/*;q=0.2",
        "user-agent": "ParallaxSourceFetcher/0.1",
      },
    });

    if (!response.ok) {
      return {
        url: url.toString(),
        status: response.status === 404 ? "missing" : "failed",
        title: `HTTP ${response.status}`,
        publisher: url.hostname,
        excerpt: "",
        note: note || "HTTP response did not return a usable source body.",
        locator: "http-status",
        hash: "",
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        url: url.toString(),
        status: "failed",
        title: "Empty response",
        publisher: url.hostname,
        excerpt: "",
        note: note || "The response body was empty.",
        locator: "empty-body",
        hash: "",
      };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    let partial = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_SOURCE_BYTES) {
          partial = true;
          chunks.push(value.slice(0, Math.max(0, value.byteLength - (total - MAX_SOURCE_BYTES))));
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }

    const raw = new TextDecoder("utf-8", { fatal: false }).decode(
      chunks.reduce((acc, chunk) => {
        const next = new Uint8Array(acc.length + chunk.length);
        next.set(acc);
        next.set(chunk, acc.length);
        return next;
      }, new Uint8Array()),
    );
    const excerpt = textExcerpt(raw);
    return {
      url: url.toString(),
      status: partial ? "partial" : "found",
      title: extractTitle(raw, url.hostname),
      publisher: url.hostname,
      excerpt,
      note: note || "Fetched text is untrusted and stored only as a bounded excerpt.",
      locator: partial ? "first 128KB" : "bounded fetch excerpt",
      hash: await hashText(raw.slice(0, MAX_SOURCE_BYTES)),
    };
  } catch (error) {
    return {
      url: url.toString(),
      status: error instanceof DOMException && error.name === "AbortError" ? "failed" : "failed",
      title: "Fetch failed",
      publisher: url.hostname,
      excerpt: "",
      note: note || "Fetch failed or timed out before a safe excerpt could be stored.",
      locator: "fetch-error",
      hash: "",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function envNumber(name: string, fallback: number) {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function assertOpenRouterBudget() {
  const liveEnabled = Deno.env.get("AI_LIVE_ENABLED") === "true";
  const key = Deno.env.get("OPENROUTER_API_KEY");
  const maxCalls = envNumber("AI_LIVE_TEST_MAX_CALLS", 10);
  const hardBudget = envNumber("AI_HARD_BUDGET_USD", 5);
  if (!liveEnabled) throw new Error("OpenRouter live smoke is disabled");
  if (!key) throw new Error("OpenRouter key is not configured server-side");
  if (maxCalls < 1) throw new Error("OpenRouter live call cap is zero");
  if (hardBudget > 5) throw new Error("OpenRouter hard budget exceeds goal cap");

  const response = await fetch("https://openrouter.ai/api/v1/key", {
    headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(3500),
  });
  if (!response.ok) throw new Error("OpenRouter budget check failed");
  const body = await response.json();
  const usage = Number(body?.data?.usage ?? body?.usage ?? 0);
  const limit = Number(body?.data?.limit ?? body?.limit ?? hardBudget);
  if (Number.isFinite(usage) && Number.isFinite(limit) && usage >= limit) {
    throw new Error("OpenRouter budget exhausted");
  }
}

async function smallOpenRouterSmoke() {
  await assertOpenRouterBudget();
  const key = Deno.env.get("OPENROUTER_API_KEY")!;
  const model = Deno.env.get("OPENROUTER_MODEL") ?? "deepseek/deepseek-v4-flash";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Return a terse JSON readiness ping." },
        { role: "user", content: "Respond with {\"ok\":true} only." },
      ],
      max_tokens: 24,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("OpenRouter smoke request failed");
  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "server_env_missing" });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: "auth_required" });
  const authed = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await authed.auth.getUser(token);
  if (userError || !user) return json(401, { error: "auth_required" });

  const body = await req.json().catch(() => ({}));
  const seedPacketId = String(body.seed_packet_id ?? "");
  const requestedProvider = body.provider === "openrouter" ? "openrouter" : "mock";
  if (!/^[0-9a-f-]{36}$/i.test(seedPacketId)) {
    return json(400, { error: "invalid_seed_packet_id" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: packet, error: packetError } = await admin
    .from("seed_packets")
    .select("id, created_by, source_inputs")
    .eq("id", seedPacketId)
    .single();

  if (packetError || !packet) return json(404, { error: "seed_packet_not_found" });
  if (packet.created_by !== user.id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!["reviewer", "admin"].includes(profile?.role ?? "")) {
      return json(403, { error: "not_allowed" });
    }
  }

  if (requestedProvider === "openrouter") {
    try {
      await smallOpenRouterSmoke();
    } catch (error) {
      return json(402, {
        error: "openrouter_smoke_skipped",
        message: error instanceof Error ? error.message : "OpenRouter smoke failed",
      });
    }
  }

  const inputs = Array.isArray(packet.source_inputs)
    ? packet.source_inputs as SourceInput[]
    : [];
  const retrievals = await Promise.all(
    inputs.slice(0, 8).map((input) => fetchProvidedSource(input)),
  );

  const { data: revisionId, error: rpcError } = await admin.rpc("complete_mock_ai_job", {
    p_seed_packet_id: seedPacketId,
    p_actor_id: user.id,
    p_retrievals: retrievals,
    p_provider: requestedProvider,
  });

  if (rpcError) {
    return json(500, { error: "analysis_failed", message: rpcError.message });
  }

  return json(200, {
    revision_id: revisionId,
    provider: requestedProvider,
    retrievals: retrievals.map(({ url, status, title, publisher, locator }) => ({
      url,
      status,
      title,
      publisher,
      locator,
    })),
  });
});
