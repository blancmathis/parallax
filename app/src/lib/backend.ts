import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type {
  ClaimEvaluation,
  ClaimEvalState,
  Contribution,
  ContributionType,
  DebateFixture,
  EndorsementSelf,
  EvidenceLabel,
  PositionAggregate,
  ReviewerSelf,
  SignalPhase,
  SourceAssessment,
} from "../types";
import { debateBySlug, getDebates } from "../data";
import { fixtureAggregate } from "../data/signal-demo";
import type { Locale } from "../i18n";
import { requireSupabase, supabase, isSupabaseConfigured } from "./supabase";
import { safeHttpUrl } from "./url";
import { castSignal } from "./profile";
import {
  requireReviewRationale,
  withWorkflowContribution,
} from "../features/workflow/model";
import type {
  ContributorWorkflowState,
  DraftArgument,
  DraftClaim,
  DraftEvidenceLink,
  DraftPosition,
  DraftRevisionSnapshot,
  DraftSource,
  DraftSourceExcerpt,
  DraftTradeoff,
  DraftValue,
  WorkflowContribution,
  WorkflowReview,
  WorkflowReviewDecision,
  WorkflowRevision,
  WorkflowSeedPacket,
} from "../features/workflow/model";

const seedPacketSchema = z.object({
  question: z.string().trim().min(12).refine((value) => value.endsWith("?"), {
    message: "Question must end with a question mark.",
  }),
  initialPosition: z.string().trim().min(4),
  initialArguments: z.array(z.string().trim().min(4)).min(1).max(8),
  sources: z
    .array(
      z.object({
        url: z.string().trim().url(),
        note: z.string().trim().max(240).optional(),
      }),
    )
    .max(8),
});

export type SeedPacketInput = z.input<typeof seedPacketSchema>;

export type DebateSource = "supabase" | "fixtures";

export interface DebateLoadState {
  debates: DebateFixture[];
  source: DebateSource;
  originByTopicId: Record<string, DebateSource>;
  loading: boolean;
  error: string | null;
}

export type ReviewRevisionItem = WorkflowRevision;
export type SeedPacketItem = WorkflowSeedPacket;

export interface SupabaseReviewState {
  revisions: ReviewRevisionItem[];
  seedPackets: SeedPacketItem[];
  contributions: WorkflowContribution[];
}

const isKnownContributionType = (value: string): value is ContributionType =>
  [
    "new_claim",
    "new_source",
    "new_position",
    "challenge_evidence_label",
    "challenge_steelman",
    "value_tradeoff_correction",
  ].includes(value);

function fixtureFallback(locale: Locale): DebateLoadState {
  const debates = getDebates(locale);
  return {
    debates,
    source: "fixtures",
    originByTopicId: Object.fromEntries(
      debates.map((debate) => [debate.topic.id, "fixtures" as const]),
    ),
    loading: false,
    error: isSupabaseConfigured ? "Supabase data unavailable; showing fixture fallback." : null,
  };
}

async function loadSupabaseDebates(locale: Locale): Promise<DebateLoadState> {
  if (!supabase || locale !== "en") return fixtureFallback(locale);
  const { data, error } = await supabase
    .from("published_debate_fixtures")
    .select("debate")
    .order("topic_id");
  if (error || !data || data.length === 0) return fixtureFallback(locale);
  const loaded = data.map((row) => row.debate as DebateFixture);
  const loadedIds = new Set(loaded.map((debate) => debate.topic.id));
  const merged = [
    ...loaded,
    ...getDebates(locale).filter((debate) => !loadedIds.has(debate.topic.id)),
  ];
  return {
    debates: merged,
    source: "supabase",
    originByTopicId: Object.fromEntries(
      merged.map((debate) => [
        debate.topic.id,
        loadedIds.has(debate.topic.id) ? "supabase" : "fixtures",
      ]),
    ),
    loading: false,
    error: null,
  };
}

export function useDebates(locale: Locale): DebateLoadState {
  const [state, setState] = useState<DebateLoadState>(() => ({
    ...fixtureFallback(locale),
    loading: isSupabaseConfigured && locale === "en",
  }));

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setState({
          ...fixtureFallback(locale),
          loading: isSupabaseConfigured && locale === "en",
        });
      }
    });
    loadSupabaseDebates(locale)
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            ...fixtureFallback(locale),
            error: error instanceof Error ? error.message : "Supabase load failed.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return state;
}

export function useDebateBySlug(slug: string | undefined, locale: Locale) {
  const state = useDebates(locale);
  const debate = useMemo(() => {
    if (!slug) return undefined;
    const loaded = state.debates.find((item) => item.topic.id.replace(/^topic_/, "").replace(/_/g, "-") === slug);
    return loaded ?? debateBySlug(slug, locale);
  }, [locale, slug, state.debates]);
  return {
    ...state,
    debate,
    provenance: debate ? state.originByTopicId[debate.topic.id] : undefined,
  };
}

export async function createSeedPacket(input: SeedPacketInput): Promise<string> {
  const parsed = seedPacketSchema.parse(input);
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_seed_packet", {
    p_question: parsed.question,
    p_initial_position: parsed.initialPosition,
    p_initial_arguments: parsed.initialArguments,
    p_sources: parsed.sources,
  });
  if (error) throw error;
  return data as string;
}

export async function analyzeSeedPacket(seedPacketId: string, provider: "mock" | "openrouter" = "mock") {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("analyze-seed", {
    body: { seed_packet_id: seedPacketId, provider },
  });
  if (error) throw error;
  return data as { revision_id: string; provider: string };
}

export async function submitSupabaseContribution(input: {
  topic_id: string;
  type: ContributionType;
  body: string;
  title?: string;
  url?: string;
  proposed_label?: EvidenceLabel;
  target_object_id?: string;
  created_by: string;
}): Promise<WorkflowContribution> {
  // Reject non-http(s) URLs at submit — defense-in-depth with the DB CHECK and the
  // render-time safeHttpUrl guard (blocks javascript:/data: contribution URLs).
  const url = input.url?.trim();
  if (url && !safeHttpUrl(url)) {
    throw new Error("A contribution URL must be an http(s) link.");
  }
  const client = requireSupabase();
  const { data, error } = await client
    .from("contributions")
    .insert({ ...input, url: url || undefined })
    .select("*")
    .single();
  if (error) throw error;
  return withWorkflowContribution(data as Contribution, "supabase");
}

/**
 * Accepted contributions for a single topic, as the current user is allowed to
 * see them. NOTE: RLS (`contributions_select_own_or_staff`) scopes this read to
 * the caller's own rows or reviewer/staff — there is intentionally no public
 * read path on the `contributions` table. Until `review_contribution` is
 * extended to merge accepted contributions into a fresh published revision
 * (see docs/backend gap), other readers will NOT see these; DebatePage falls
 * back to the local store for the demo/offline path.
 */
export async function loadAcceptedContributions(topicId: string): Promise<Contribution[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("topic_id", topicId)
    .eq("status", "accepted")
    // already-merged contributions now appear NATIVELY in the published revision
    .is("merged_revision_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data) throw new Error("Accepted contributions response was empty.");
  return data
    .filter((item) => isKnownContributionType(item.type))
    .map((item) => item as Contribution);
}

/** Merge an ACCEPTED contribution into a new published revision (clone the
 *  current published revision + apply the contribution, then review->publish).
 *  Admin-gated by the RPC; returns the new revision's slug for deep-linking. */
export async function mergeContribution(contributionId: string): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("merge_contribution", {
    p_contribution_id: contributionId,
  });
  if (error) throw error;
  return data as string;
}

/* ————— Position signal (D15) ————— */

/** Cast/revise the reader's position signal. The demo pick is client-only.
 *  With Supabase and a signed-in reader, the RPC stores a private actor-bound
 *  ballot so it can be revised; public reads expose only k-anonymized aggregate
 *  bands. Returns whether the server write landed so the UI never fabricates a
 *  revealed live aggregate. */
export async function castPositionSignal(input: {
  topic_id: string;
  phase: SignalPhase;
  position_id: string | null; // fixture-style id ("pos_a") or null = undecided
  from_position?: string | null;
}): Promise<{ synced: boolean }> {
  if (!supabase) {
    // Demo / FR path: no server count exists — record the local pick and reveal
    // the badged demo distribution.
    castSignal(input.topic_id, input.phase, input.position_id);
    return { synced: false };
  }
  const { error } = await supabase.rpc("cast_position_signal", {
    p_topic_id: input.topic_id,
    p_phase: input.phase,
    p_position_id: input.position_id, // null OK -> RPC maps to __undecided__
    p_from_position: input.from_position ?? null,
  });
  // Only record the local pick (which drives the reveal) when the cast was
  // actually counted server-side. A signed-out cast errors → keep the ballot,
  // surface the sign-in gate, and survive reload (no phantom-revealed aggregate).
  if (!error) castSignal(input.topic_id, input.phase, input.position_id);
  return { synced: !error };
}

export interface PositionAggregateState {
  aggregate: PositionAggregate | null;
  loading: boolean;
  error: string | null;
}

async function loadAggregate(
  topicId: string,
  locale: Locale,
): Promise<PositionAggregateState> {
  const fallback = (error: string | null): PositionAggregateState => ({
    aggregate: fixtureAggregate(topicId, locale),
    loading: false,
    error,
  });
  // FR & no-Supabase: fixtures only (FR content is fixtures; keep it consistent
  // and badged). EN + Supabase: try live, fall back to the demo on any error.
  if (!supabase || locale !== "en") return fallback(null);
  const { data, error } = await supabase.rpc("get_position_signal", {
    p_topic_id: topicId,
  });
  if (error || !data)
    return fallback(
      isSupabaseConfigured ? "Aggregate unavailable; showing demo." : null,
    );
  const live = data as PositionAggregate;
  // Below the k-anonymity release floor the server returns released:false with an
  // empty distribution. Show the badged demo until enough signals accrue, rather
  // than an all-"withheld" landscape framed as a real result.
  if (live.released === false) return fallback(null);
  return {
    aggregate: { ...live, source: "supabase" },
    loading: false,
    error: null,
  };
}

export function usePositionAggregate(
  topicId: string | undefined,
  locale: Locale,
): PositionAggregateState {
  const [state, setState] = useState<PositionAggregateState>(() => ({
    aggregate: topicId ? fixtureAggregate(topicId, locale) : null,
    loading: Boolean(isSupabaseConfigured && locale === "en" && topicId),
    error: null,
  }));
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setState({
        aggregate: topicId ? fixtureAggregate(topicId, locale) : null,
        loading: Boolean(isSupabaseConfigured && locale === "en" && topicId),
        error: null,
      });
    });
    if (!topicId) {
      return () => {
        cancelled = true;
      };
    }
    loadAggregate(topicId, locale)
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            aggregate: fixtureAggregate(topicId, locale),
            loading: false,
            error: e instanceof Error ? e.message : "Aggregate load failed.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [topicId, locale]);
  return state;
}

/* ————— Claim evaluations (G2 — Library of Truths provenance) ————— */

export interface ClaimEvaluationsState {
  evaluations: Map<string, ClaimEvaluation>;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Load the audited claim evaluations for a topic (EN + Supabase only; FR / no
 *  backend resolve to an empty map and the page falls back to the heuristic —
 *  we never fabricate "reviewed" provenance). */
export function useClaimEvaluations(
  topicId: string | undefined,
  locale: Locale,
): ClaimEvaluationsState {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    evaluations: Map<string, ClaimEvaluation>;
    loading: boolean;
    error: string | null;
  }>(() => ({
    evaluations: new Map(),
    loading: Boolean(isSupabaseConfigured && locale === "en" && topicId),
    error: null,
  }));
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setState({
          evaluations: new Map(),
          loading: Boolean(supabase && topicId && locale === "en"),
          error: null,
        });
      }
    });
    if (!supabase || !topicId || locale !== "en") {
      return () => {
        cancelled = true;
      };
    }
    supabase
      .rpc("get_claim_evaluations", { p_topic_id: topicId })
      .then(
        ({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setState({
              evaluations: new Map(),
              loading: false,
              error: error.message || "Claim evaluations could not be loaded.",
            });
            return;
          }
          const map = new Map<string, ClaimEvaluation>();
          if (Array.isArray(data)) {
            for (const e of data as ClaimEvaluation[]) map.set(e.claim_id, e);
          }
          setState({ evaluations: map, loading: false, error: null });
        },
        (error: unknown) => {
          if (cancelled) return;
          setState({
            evaluations: new Map(),
            loading: false,
            error: error instanceof Error ? error.message : "Claim evaluations could not be loaded.",
          });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [topicId, locale, version]);
  return {
    evaluations: state.evaluations,
    loading: state.loading,
    error: state.error,
    reload: () => setVersion((v) => v + 1),
  };
}

/** Record/revise a reviewer's audited evaluation of a claim. Reviewer-gated by
 *  the RPC; non-reviewers get an error. */
export async function evaluateClaim(input: {
  topic_id: string;
  claim_id: string;
  state: Exclude<ClaimEvalState, "established">;
  rationale: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "no backend" };
  const { error } = await supabase.rpc("evaluate_claim", {
    p_topic_id: input.topic_id,
    p_claim_id: input.claim_id,
    p_state: input.state,
    p_rationale: requireReviewRationale(input.rationale),
  });
  return { ok: !error, error: error?.message };
}

/* ————— Bridging consensus (cross-camp gate) ————— */

/** Endorse a claim's state FROM the reviewer's locked camp (no camp argument —
 *  the server reads it). Counts only across distinct camps. */
export async function endorseClaim(input: {
  topic_id: string;
  claim_id: string;
  state: "established" | "contested";
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "no backend" };
  const { error } = await supabase.rpc("endorse_claim_state", {
    p_topic_id: input.topic_id,
    p_claim_id: input.claim_id,
    p_state: input.state,
  });
  return { ok: !error, error: error?.message };
}

/** Declare/revise the reviewer's one camp (stance) on a debate. position_id null
 *  = undecided (a non-camp). The server resolves the camp ordinally. */
export async function setReviewerCamp(input: {
  topic_id: string;
  position_id: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "no backend" };
  const { error } = await supabase.rpc("set_reviewer_camp", {
    p_topic_id: input.topic_id,
    p_position_id: input.position_id,
  });
  return { ok: !error, error: error?.message };
}

export interface ReviewerSelfState {
  self: ReviewerSelf | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** The VIEWING reviewer's own camp + endorsements (auth.uid()-scoped; never a
 *  roster). EN + Supabase + reviewer only; otherwise { self: null } and the page
 *  hides the reviewer controls (no fabrication). */
export function useReviewerSelf(
  topicId: string | undefined,
  locale: Locale,
  isReviewer: boolean,
): ReviewerSelfState {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    self: ReviewerSelf | null;
    loading: boolean;
    error: string | null;
  }>(() => ({
    self: null,
    loading: Boolean(
      isSupabaseConfigured && locale === "en" && topicId && isReviewer,
    ),
    error: null,
  }));
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setState({
          self: null,
          loading: Boolean(
            supabase && topicId && locale === "en" && isReviewer,
          ),
          error: null,
        });
      }
    });
    if (!supabase || !topicId || locale !== "en" || !isReviewer) {
      return () => {
        cancelled = true;
      };
    }
    Promise.all([
      supabase.rpc("get_my_reviewer_camp", { p_topic_id: topicId }),
      supabase.rpc("get_my_endorsements", { p_topic_id: topicId }),
    ]).then(([camp, ends]) => {
      if (cancelled) return;
      if (camp.error || ends.error) {
        setState({
          self: null,
          loading: false,
          error:
            camp.error?.message ||
            ends.error?.message ||
            "Reviewer state could not be loaded.",
        });
        return;
      }
      const m: EndorsementSelf = new Map();
      const obj =
        ends.data
          ? (ends.data as Record<string, "established" | "contested">)
          : {};
      for (const [k, v] of Object.entries(obj)) m.set(k, v);
      setState({
        self: {
          camp_id: camp.data as string | null,
          endorsements: m,
        },
        loading: false,
        error: null,
      });
    }).catch((error: unknown) => {
      if (cancelled) return;
      setState({
        self: null,
        loading: false,
        error: error instanceof Error ? error.message : "Reviewer state could not be loaded.",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [topicId, locale, isReviewer, version]);
  return {
    self: state.self,
    loading: state.loading,
    error: state.error,
    reload: () => setVersion((v) => v + 1),
  };
}

/* ————— Source integrity floor (v1) ————— */

export interface SourceAssessmentsState {
  assessments: Map<string, SourceAssessment>; // keyed by source_key
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Floor assessments for a topic (EN + Supabase only; FR / no backend → empty Map
 *  → NO integrity chip; never fabricated). The read RPC returns normalized keys
 *  and computes the verdict per-topic server-side (rules, not a vote). */
export function useSourceAssessments(
  topicId: string | undefined,
  locale: Locale,
): SourceAssessmentsState {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    assessments: Map<string, SourceAssessment>;
    loading: boolean;
    error: string | null;
  }>(() => ({
    assessments: new Map(),
    loading: Boolean(isSupabaseConfigured && locale === "en" && topicId),
    error: null,
  }));
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setState({
          assessments: new Map(),
          loading: Boolean(supabase && topicId && locale === "en"),
          error: null,
        });
      }
    });
    if (!supabase || !topicId || locale !== "en") {
      return () => {
        cancelled = true;
      };
    }
    supabase
      .rpc("get_source_floor", { p_topic_id: topicId })
      .then(
        ({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setState({
              assessments: new Map(),
              loading: false,
              error: error.message || "Source assessments could not be loaded.",
            });
            return;
          }
          const map = new Map<string, SourceAssessment>();
          if (Array.isArray(data))
            for (const a of data as SourceAssessment[]) map.set(a.source_key, a);
          setState({ assessments: map, loading: false, error: null });
        },
        (error: unknown) => {
          if (cancelled) return;
          setState({
            assessments: new Map(),
            loading: false,
            error: error instanceof Error ? error.message : "Source assessments could not be loaded.",
          });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [topicId, locale, version]);
  return {
    assessments: state.assessments,
    loading: state.loading,
    error: state.error,
    reload: () => setVersion((v) => v + 1),
  };
}

/** Declare a source's mechanical attributes; the SERVER derives the verdict at
 *  read-time (rules, not a vote). Reviewer-gated. `{ ok:false }` with no backend. */
export async function assessSource(input: {
  topic_id: string;
  url: string;
  content_genre: string;
  editorial_accountability: string;
  correction_policy: string;
  fabrication_record: string;
  independence: string;
  expertise_basis: string;
  identity_basis: string;
  sensitive_domain: string;
  proof_ref?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "no backend" };
  const { error } = await supabase.rpc("assess_source_floor", {
    p_topic_id: input.topic_id,
    p_url: input.url,
    p_content_genre: input.content_genre,
    p_editorial_accountability: input.editorial_accountability,
    p_correction_policy: input.correction_policy,
    p_fabrication_record: input.fabrication_record,
    p_independence: input.independence,
    p_expertise_basis: input.expertise_basis,
    p_identity_basis: input.identity_basis,
    p_sensitive_domain: input.sensitive_domain,
    p_proof_ref: input.proof_ref ?? "",
  });
  return { ok: !error, error: error?.message };
}

function isWorkflowReviewDecision(value: string): value is WorkflowReviewDecision {
  return ["approve", "reject", "request_changes", "mark_contested"].includes(value);
}

function reviewMap(
  rows: {
    target_object_id: string;
    target_object_type: string;
    decision: string;
    rationale: string;
    reviewed_at: string;
  }[],
): Map<string, WorkflowReview> {
  const map = new Map<string, WorkflowReview>();
  for (const row of rows) {
    if (!isWorkflowReviewDecision(row.decision)) continue;
    const key = `${row.target_object_type}:${row.target_object_id}`;
    if (map.has(key)) continue;
    map.set(key, {
      decision: row.decision,
      rationale: row.rationale,
      reviewed_at: row.reviewed_at,
      provenance: "supabase",
    });
  }
  return map;
}

export async function loadSupabaseReviewState(): Promise<SupabaseReviewState> {
  const client = requireSupabase();
  const [
    { data: topics, error: topicError },
    { data: revisions, error: revError },
    { data: packets, error: packetError },
    { data: contributions, error: contributionError },
    { data: reviews, error: reviewError },
  ] = await Promise.all([
    client.from("topics").select("id,title,question,slug"),
    client
      .from("debate_revisions")
      .select("id,topic_id,revision_number,review_status,status,created_at")
      .eq("status", "draft")
      .order("created_at", { ascending: false }),
    client
      .from("seed_packets")
      .select(
        "id,topic_id,topic_question,initial_position,initial_arguments,status,generated_revision_id,error_message,created_at,updated_at,source_inputs",
      )
      .order("created_at", { ascending: false }),
    client
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false }),
    client
      .from("reviews")
      .select(
        "target_object_id,target_object_type,decision,rationale,reviewed_at",
      )
      .order("reviewed_at", { ascending: false }),
  ]);
  if (topicError) throw topicError;
  if (revError) throw revError;
  if (packetError) throw packetError;
  if (contributionError) throw contributionError;
  if (reviewError) throw reviewError;

  const topicMap = new Map(
    (topics ?? []).map((topic) => [
      topic.id,
      topic as { id: string; title: string; question: string; slug: string },
    ]),
  );
  const reviewsByTarget = reviewMap(reviews ?? []);
  return {
    revisions: (revisions ?? []).map((revision) => {
      const topic = topicMap.get(revision.topic_id);
      return {
        ...revision,
        topic_title: topic?.title ?? revision.topic_id,
        topic_question: topic?.question ?? revision.topic_id,
        slug: topic?.slug ?? "",
        provenance: "supabase",
        review: reviewsByTarget.get(`revision:${revision.id}`) ?? null,
      };
    }) as ReviewRevisionItem[],
    seedPackets: (packets ?? []).map((packet) => ({
      ...packet,
      provenance: "supabase" as const,
    })) as SeedPacketItem[],
    contributions: (contributions ?? [])
      .filter((item) => isKnownContributionType(item.type))
      .map((item) => {
        const contribution = item as Contribution;
        const review = reviewsByTarget.get(`contribution:${item.id}`) ?? null;
        const topic = topicMap.get(item.topic_id);
        return {
          ...withWorkflowContribution(
            contribution,
            "supabase",
            review,
            review ? "visible" : "not_reviewed",
          ),
          topic_title: topic?.title,
          topic_question: topic?.question,
          topic_slug: topic?.slug,
        };
      }),
  };
}

export async function loadMySupabaseWorkflow(
  userId: string,
): Promise<ContributorWorkflowState> {
  if (!userId.trim()) throw new Error("A signed-in user is required.");
  const client = requireSupabase();
  const [
    { data: topics, error: topicError },
    { data: contributions, error: contributionError },
    { data: packets, error: packetError },
  ] = await Promise.all([
    client.from("topics").select("id,title,question,slug"),
    client
      .from("contributions")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false }),
    client
      .from("seed_packets")
      .select(
        "id,topic_id,topic_question,initial_position,initial_arguments,status,generated_revision_id,error_message,created_at,updated_at,source_inputs",
      )
      .eq("created_by", userId)
      .order("created_at", { ascending: false }),
  ]);
  if (topicError) throw topicError;
  if (contributionError) throw contributionError;
  if (packetError) throw packetError;

  const topicMap = new Map(
    (topics ?? []).map((topic) => [
      topic.id,
      topic as { id: string; title: string; question: string; slug: string },
    ]),
  );
  return {
    contributions: (contributions ?? [])
      .filter((item) => isKnownContributionType(item.type))
      .map((item) => {
        const topic = topicMap.get(item.topic_id);
        return {
          ...withWorkflowContribution(
            item as Contribution,
            "supabase",
            null,
            item.status === "submitted" ? "not_reviewed" : "restricted",
          ),
          topic_title: topic?.title,
          topic_question: topic?.question,
          topic_slug: topic?.slug,
        };
      }),
    seedPackets: (packets ?? []).map((packet) => ({
      ...packet,
      provenance: "supabase" as const,
    })) as WorkflowSeedPacket[],
  };
}

function withSupabaseProvenance<T>(rows: unknown[] | null): T[] {
  return (rows ?? []).map((row) => ({
    ...(row as Record<string, unknown>),
    provenance: "supabase",
  })) as T[];
}

export async function loadReviewRevisionDraft(
  revisionId: string,
): Promise<DraftRevisionSnapshot> {
  if (!revisionId.trim()) throw new Error("A revision ID is required.");
  const client = requireSupabase();
  const [positionsResult, argumentsResult, claimsResult, sourcesResult, excerptsResult, linksResult, valuesResult, tradeoffsResult] =
    await Promise.all([
      client
        .from("positions")
        .select("id,title,short_summary,steelman,status,generated_by,review_status")
        .eq("revision_id", revisionId)
        .order("sort_order"),
      client
        .from("debate_arguments")
        .select("id,position_id,direction,summary,claim_ids,generated_by,review_status")
        .eq("revision_id", revisionId)
        .order("sort_order"),
      client
        .from("claims")
        .select("id,text,claim_type,generated_by,review_status")
        .eq("revision_id", revisionId)
        .order("sort_order"),
      client
        .from("sources")
        .select("id,url,title,publisher,source_type,retrieval_status,retrieved_at,quality_notes")
        .eq("revision_id", revisionId)
        .order("sort_order"),
      client
        .from("source_excerpts")
        .select("id,source_id,text,locator,extracted_by")
        .eq("revision_id", revisionId)
        .order("created_at"),
      client
        .from("evidence_links")
        .select("id,claim_id,source_id,source_excerpt_id,label,rationale,confidence,review_status")
        .eq("revision_id", revisionId)
        .order("sort_order"),
      client
        .from("debate_values")
        .select("id,name,description,tension_with")
        .eq("revision_id", revisionId)
        .order("sort_order"),
      client
        .from("tradeoffs")
        .select("id,position_id,gain,cost,risk,review_status")
        .eq("revision_id", revisionId)
        .order("id"),
    ]);

  for (const result of [
    positionsResult,
    argumentsResult,
    claimsResult,
    sourcesResult,
    excerptsResult,
    linksResult,
    valuesResult,
    tradeoffsResult,
  ]) {
    if (result.error) throw result.error;
  }

  const rawValues = valuesResult.data ?? [];
  const valuePositionResult = rawValues.length
    ? await client
        .from("value_positions")
        .select("value_id,position_id")
        .in(
          "value_id",
          rawValues.map((value) => value.id),
        )
    : { data: [], error: null };
  if (valuePositionResult.error) throw valuePositionResult.error;
  const valuePositions = new Map<string, string[]>();
  for (const row of valuePositionResult.data ?? []) {
    const current = valuePositions.get(row.value_id) ?? [];
    current.push(row.position_id);
    valuePositions.set(row.value_id, current);
  }

  return {
    revision_id: revisionId,
    positions: withSupabaseProvenance<DraftPosition>(positionsResult.data),
    arguments: withSupabaseProvenance<DraftArgument>(argumentsResult.data),
    claims: withSupabaseProvenance<DraftClaim>(claimsResult.data),
    sources: withSupabaseProvenance<DraftSource>(sourcesResult.data),
    excerpts: withSupabaseProvenance<DraftSourceExcerpt>(excerptsResult.data),
    evidenceLinks: withSupabaseProvenance<DraftEvidenceLink>(linksResult.data),
    values: (rawValues as Omit<DraftValue, "position_ids" | "provenance">[]).map(
      (value) => ({
        ...value,
        position_ids: valuePositions.get(value.id) ?? [],
        provenance: "supabase",
      }),
    ),
    tradeoffs: withSupabaseProvenance<DraftTradeoff>(tradeoffsResult.data),
  };
}

export async function reviewRevision(
  revisionId: string,
  decision: WorkflowReviewDecision,
  rationale: string,
) {
  const client = requireSupabase();
  const { error } = await client.rpc("review_revision", {
    p_revision_id: revisionId,
    p_decision: decision,
    p_rationale: requireReviewRationale(rationale),
  });
  if (error) throw error;
}

export async function publishRevision(revisionId: string): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("publish_revision", {
    p_revision_id: revisionId,
  });
  if (error) throw error;
  return data as string;
}

export async function reviewSupabaseContribution(
  contributionId: string,
  decision: "approve" | "reject",
  rationale: string,
) {
  const client = requireSupabase();
  const { error } = await client.rpc("review_contribution", {
    p_contribution_id: contributionId,
    p_decision: decision,
    p_rationale: requireReviewRationale(rationale),
  });
  if (error) throw error;
}
