import {
  createClient,
  type SupabaseClient as SupabaseClientType,
} from "@supabase/supabase-js";
import {
  aiFailureCodeFor,
  createDeadlineFetch,
  type DnsResolver,
  HttpError,
  isSafeObjectId,
  LIMITS,
  parseAiJobClaim,
  parseAllowedOrigins,
  parseAnalyzeRequest,
  parseSourceInputs,
  readBoundedJson,
  withTimeout,
} from "./core.ts";
import { fetchProvidedSource } from "./source-fetch.ts";

type Database = {
  public: {
    Tables: {
      seed_packets: {
        Row: {
          id: string;
          source_inputs: unknown;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_ai_job: {
        Args: {
          p_seed_packet_id: string;
          p_actor_id: string;
          p_claim_token: string;
          p_lease_seconds: number;
        };
        Returns: unknown;
      };
      complete_mock_ai_job: {
        Args: {
          p_seed_packet_id: string;
          p_actor_id: string;
          p_claim_token: string;
          p_retrievals: unknown;
          p_provider: "mock";
        };
        Returns: string;
      };
      record_ai_job_failure: {
        Args: {
          p_seed_packet_id: string;
          p_actor_id: string;
          p_claim_token: string;
          p_error_code:
            | "openrouter_unavailable"
            | "source_retrieval_failed"
            | "analysis_failed"
            | "invalid_analysis_result"
            | "timeout"
            | "interrupted"
            | "unknown";
        };
        Returns: {
          ok: boolean;
          status: "failed";
          error_code: string;
          already_recorded: boolean;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "600",
};

let allowedOrigins: Set<string> | undefined;

function configuredOrigins() {
  allowedOrigins ??= parseAllowedOrigins(
    Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "",
    Deno.env.get("SUPABASE_URL") ?? "",
  );
  return allowedOrigins;
}

function corsHeaders(request: Request) {
  const origins = configuredOrigins();
  const origin = request.headers.get("origin");
  if (!origin) return { ...baseCorsHeaders, Vary: "Origin" };
  if (!origins.has(origin)) return null;
  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function json(
  request: Request,
  status: number,
  body: Record<string, unknown>,
  requestId: string,
  extraHeaders: Record<string, string> = {},
) {
  const cors = corsHeaders(request) ?? { ...baseCorsHeaders, Vary: "Origin" };
  return new Response(JSON.stringify({ ...body, request_id: requestId }), {
    status,
    headers: {
      ...cors,
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function bearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.match(/^Bearer\s+([^\s]+)$/i)?.[1] ?? null;
}

const resolveDns: DnsResolver = async (hostname, recordType) => {
  try {
    return await withTimeout(
      Deno.resolveDns(hostname, recordType),
      LIMITS.dnsTimeoutMs,
      new HttpError(504, "dns_timeout"),
    );
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
};

type SupabaseClient = SupabaseClientType<Database>;

async function recordClaimFailure(
  client: SupabaseClient,
  seedPacketId: string,
  actorId: string,
  claimToken: string,
  error: unknown,
) {
  try {
    const result = await withTimeout(
      client.rpc("record_ai_job_failure", {
        p_seed_packet_id: seedPacketId,
        p_actor_id: actorId,
        p_claim_token: claimToken,
        p_error_code: aiFailureCodeFor(error),
      }),
      LIMITS.databaseTimeoutMs,
      new HttpError(504, "database_timeout"),
    );
    return !result.error && result.data?.ok === true &&
      result.data.status === "failed" &&
      typeof result.data.error_code === "string" &&
      typeof result.data.already_recorded === "boolean";
  } catch {
    // The original failure remains authoritative; this cleanup is best-effort.
    return false;
  }
}

async function readPacket(client: SupabaseClient, seedPacketId: string) {
  return await withTimeout(
    client
      .from("seed_packets")
      .select("id,source_inputs")
      .eq("id", seedPacketId)
      .maybeSingle(),
    LIMITS.databaseTimeoutMs,
    new HttpError(504, "database_timeout"),
  );
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  let cors: ReturnType<typeof corsHeaders>;
  try {
    cors = corsHeaders(request);
  } catch {
    console.error("analyze-seed CORS configuration rejected", {
      request_id: requestId,
    });
    return new Response(
      JSON.stringify({
        error: "server_cors_misconfigured",
        request_id: requestId,
      }),
      {
        status: 500,
        headers: {
          ...baseCorsHeaders,
          Vary: "Origin",
          "cache-control": "no-store",
          "content-type": "application/json; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }
  if (!cors) {
    return new Response(
      JSON.stringify({ error: "cors_origin_denied", request_id: requestId }),
      {
        status: 403,
        headers: {
          ...baseCorsHeaders,
          Vary: "Origin",
          "cache-control": "no-store",
          "content-type": "application/json; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json(request, 405, { error: "method_not_allowed" }, requestId);
  }

  let adminClient: SupabaseClient | undefined;
  let claimedSeedPacketId: string | undefined;
  let verifiedActorId: string | undefined;
  let activeClaimToken: string | undefined;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new HttpError(500, "server_env_missing");
    }

    const token = bearerToken(request);
    if (!token) throw new HttpError(401, "auth_required");
    const authorization = `Bearer ${token}`;
    const client = createClient<Database>(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
        fetch: createDeadlineFetch(LIMITS.authTimeoutMs),
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      global: { fetch: createDeadlineFetch(LIMITS.databaseTimeoutMs) },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const authResult = await withTimeout(
      client.auth.getUser(token),
      LIMITS.authTimeoutMs,
      new HttpError(504, "auth_timeout"),
    );
    const user = authResult.data.user;
    if (authResult.error || !user) throw new HttpError(401, "auth_required");
    verifiedActorId = user.id;

    const body = await readBoundedJson(request);
    const parsed = parseAnalyzeRequest(body);
    if (parsed.provider === "openrouter") {
      throw new HttpError(503, "live_provider_unavailable");
    }

    const packetResult = await readPacket(client, parsed.seedPacketId);
    if (packetResult.error) {
      throw new HttpError(503, "database_unavailable");
    }
    if (!packetResult.data) {
      throw new HttpError(404, "seed_packet_not_found");
    }
    const packet = packetResult.data;
    const sourceInputs = parseSourceInputs(packet.source_inputs);
    const claimToken = crypto.randomUUID();
    const claimResult = await withTimeout(
      adminClient.rpc("claim_ai_job", {
        p_seed_packet_id: parsed.seedPacketId,
        p_actor_id: user.id,
        p_claim_token: claimToken,
        p_lease_seconds: Math.ceil(LIMITS.analysisLeaseMs / 1_000),
      }),
      LIMITS.databaseTimeoutMs,
      new HttpError(504, "database_timeout"),
    );
    if (claimResult.error) throw new HttpError(503, "analysis_claim_failed");
    const claim = parseAiJobClaim(claimResult.data);
    if (claim.state === "completed") {
      return json(request, 200, {
        revision_id: claim.revisionId,
        provider: "mock",
        reused: true,
        retrievals: [],
      }, requestId);
    }
    if (claim.state === "in_progress") {
      throw new HttpError(409, "analysis_in_progress");
    }
    if (claim.state === "quota_exceeded") {
      return json(
        request,
        429,
        {
          error: "analysis_quota_exceeded",
          retry_after_seconds: claim.retryAfterSeconds,
        },
        requestId,
        { "Retry-After": String(claim.retryAfterSeconds) },
      );
    }
    if (claim.state === "failed") {
      throw new HttpError(409, "analysis_attempt_failed");
    }
    if (claim.claimToken !== claimToken) {
      throw new HttpError(503, "invalid_claim_result");
    }
    claimedSeedPacketId = parsed.seedPacketId;
    activeClaimToken = claimToken;

    let retrievals;
    try {
      retrievals = await Promise.all(
        sourceInputs.map((input) => fetchProvidedSource(input, { resolveDns })),
      );
    } catch {
      throw new HttpError(502, "source_retrieval_failed");
    }

    const rpcResult = await withTimeout(
      adminClient.rpc("complete_mock_ai_job", {
        p_seed_packet_id: parsed.seedPacketId,
        p_actor_id: user.id,
        p_claim_token: claimToken,
        p_retrievals: retrievals,
        p_provider: "mock",
      }),
      LIMITS.databaseTimeoutMs,
      new HttpError(504, "database_timeout"),
    );
    if (rpcResult.error) {
      throw new HttpError(503, "analysis_failed");
    }
    if (!isSafeObjectId(rpcResult.data)) {
      throw new HttpError(503, "invalid_analysis_result");
    }

    return json(request, 200, {
      revision_id: rpcResult.data,
      provider: "mock",
      reused: false,
      retrievals: retrievals.map((
        { url, status, title, publisher, locator },
      ) => ({
        url,
        status,
        title,
        publisher,
        locator,
      })),
    }, requestId);
  } catch (error) {
    if (
      adminClient && claimedSeedPacketId && verifiedActorId && activeClaimToken
    ) {
      const recorded = await recordClaimFailure(
        adminClient,
        claimedSeedPacketId,
        verifiedActorId,
        activeClaimToken,
        error,
      );
      if (!recorded) {
        console.warn("analyze-seed failure state not recorded", {
          request_id: requestId,
        });
      }
    }
    if (error instanceof HttpError) {
      return json(request, error.status, { error: error.code }, requestId);
    }
    console.error("analyze-seed internal failure", {
      request_id: requestId,
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return json(request, 500, { error: "internal_error" }, requestId);
  }
});
