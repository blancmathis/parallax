import {
  createClient,
  type SupabaseClient as SupabaseClientType,
} from "@supabase/supabase-js";
import {
  createDeadlineFetch,
  type DnsResolver,
  HttpError,
  LIMITS,
  withTimeout,
} from "../analyze-seed/core.ts";
import { captureProvidedSource } from "../analyze-seed/source-fetch.ts";
import {
  configuredOrigins,
  createCaptureSourceHandler,
  type StoreSourcePayload,
} from "./core.ts";

type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      reserve_source_capture: {
        Args: {
          p_actor_id: string;
          p_idempotency_key: string;
          p_requested_url: string;
        };
        Returns: unknown;
      };
      store_source_artifact: {
        Args: {
          p_actor_id: string;
          p_idempotency_key: string;
          p_payload: StoreSourcePayload;
        };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseClient = SupabaseClientType<Database>;

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

function runtimeHandler() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const allowedOrigins = configuredOrigins(
    supabaseUrl,
    Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "",
  );

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    const unavailable = () =>
      Promise.reject(new HttpError(500, "server_env_missing"));
    return createCaptureSourceHandler({
      authenticate: unavailable,
      reserve: unavailable,
      capture: unavailable,
      store: unavailable,
      allowedOrigins,
    });
  }

  const adminClient: SupabaseClient = createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      global: { fetch: createDeadlineFetch(LIMITS.databaseTimeoutMs) },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return createCaptureSourceHandler({
    allowedOrigins,
    authenticate: async (token) => {
      try {
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
        const result = await withTimeout(
          client.auth.getUser(token),
          LIMITS.authTimeoutMs,
          new HttpError(504, "auth_timeout"),
        );
        if (result.error || !result.data.user) return null;
        return { id: result.data.user.id };
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(503, "auth_unavailable");
      }
    },
    reserve: async ({ actorId, idempotencyKey, requestedUrl }) => {
      try {
        const result = await withTimeout(
          adminClient.rpc("reserve_source_capture", {
            p_actor_id: actorId,
            p_idempotency_key: idempotencyKey,
            p_requested_url: requestedUrl,
          }),
          LIMITS.databaseTimeoutMs,
          new HttpError(504, "database_timeout"),
        );
        if (result.error) {
          throw new HttpError(503, "capture_reservation_failed");
        }
        return result.data;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(503, "capture_reservation_failed");
      }
    },
    capture: (input) => captureProvidedSource(input, { resolveDns }),
    store: async ({ actorId, idempotencyKey, payload }) => {
      try {
        const result = await withTimeout(
          adminClient.rpc("store_source_artifact", {
            p_actor_id: actorId,
            p_idempotency_key: idempotencyKey,
            p_payload: payload,
          }),
          LIMITS.databaseTimeoutMs,
          new HttpError(504, "database_timeout"),
        );
        if (result.error) {
          throw new HttpError(503, "artifact_store_failed");
        }
        return result.data;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(503, "artifact_store_failed");
      }
    },
    onInternalError: (error, requestId) => {
      console.error("capture-source internal failure", {
        request_id: requestId,
        error_type: error instanceof Error ? error.name : "unknown",
      });
    },
  });
}

Deno.serve(runtimeHandler());
