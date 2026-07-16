import { useSyncExternalStore } from "react";
import type { AuditEvent, Contribution, Review } from "../types";

/**
 * Client-side persistence for the prototype. Contributions, reviews, and the
 * audit events they generate live in localStorage until the real backend
 * (Milestone 4+) exists. The published fixtures are never mutated.
 */

const KEY = "parallax.store.v1";

export interface StoreState {
  contributions: Contribution[];
  reviews: Review[];
  extra_audit: AuditEvent[];
  revision_bumps: Record<string, number>;
}

const EMPTY: StoreState = {
  contributions: [],
  reviews: [],
  extra_audit: [],
  revision_bumps: {},
};

let state: StoreState = load();
const listeners = new Set<() => void>();

function load(): StoreState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function persist(next: StoreState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private mode etc. — keep working in-memory
  }
  listeners.forEach((l) => l());
}

export function getState(): StoreState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getState);
}

function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function audit(
  topicId: string,
  eventType: string,
  actorType: AuditEvent["actor_type"],
  summary: string,
): AuditEvent {
  return {
    id: uid("ae"),
    topic_id: topicId,
    revision_id: "local",
    actor_type: actorType,
    actor_id: actorType === "admin" ? "reviewer_demo" : "visitor_demo",
    event_type: eventType,
    summary,
    created_at: new Date().toISOString(),
  };
}

const CONTRIBUTION_LABEL: Record<Contribution["type"], string> = {
  new_claim: "new claim",
  new_source: "new source",
  new_position: "new position",
  challenge_evidence_label: "evidence label challenge",
  challenge_steelman: "steelman challenge",
  value_tradeoff_correction: "value/tradeoff correction",
};

export function contributionLabel(type: Contribution["type"]): string {
  return CONTRIBUTION_LABEL[type];
}

export function submitContribution(
  input: Omit<Contribution, "id" | "status" | "created_by" | "created_at">,
): Contribution {
  const contribution: Contribution = {
    ...input,
    id: uid("ctb"),
    status: "submitted",
    created_by: "visitor_demo",
    created_at: new Date().toISOString(),
  };
  persist({
    ...state,
    contributions: [...state.contributions, contribution],
    extra_audit: [
      ...state.extra_audit,
      audit(
        input.topic_id,
        "contribution_submitted",
        "user",
        `Draft ${CONTRIBUTION_LABEL[input.type]} submitted: "${input.body.slice(0, 80)}${input.body.length > 80 ? "…" : ""}"`,
      ),
    ],
  });
  return contribution;
}

export function reviewContribution(
  contributionId: string,
  decision: "approve" | "reject",
  rationale: string,
): void {
  const contribution = state.contributions.find((c) => c.id === contributionId);
  if (!contribution || contribution.status !== "submitted") return;

  const review: Review = {
    id: uid("rev"),
    target_object_id: contributionId,
    target_object_type: "contribution",
    decision,
    rationale,
    reviewed_by: "reviewer_demo",
    reviewed_at: new Date().toISOString(),
  };

  const events = [
    audit(
      contribution.topic_id,
      "review_completed",
      "admin",
      `${decision === "approve" ? "Approved" : "Rejected"} ${CONTRIBUTION_LABEL[contribution.type]}: ${rationale || "no rationale given"}`,
    ),
  ];

  const bumps = { ...state.revision_bumps };
  if (decision === "approve") {
    bumps[contribution.topic_id] = (bumps[contribution.topic_id] ?? 0) + 1;
    events.push(
      audit(
        contribution.topic_id,
        "revision_published",
        "system",
        `Accepted contribution merged into the live view. Local revision +${bumps[contribution.topic_id]}.`,
      ),
    );
  }

  persist({
    ...state,
    contributions: state.contributions.map((c) =>
      c.id === contributionId
        ? { ...c, status: decision === "approve" ? "accepted" : "rejected" }
        : c,
    ),
    reviews: [...state.reviews, review],
    extra_audit: [...state.extra_audit, ...events],
    revision_bumps: bumps,
  });
}

export function resetDemoData(): void {
  persist(EMPTY);
}

export function pendingFor(s: StoreState, topicId?: string): Contribution[] {
  return s.contributions.filter(
    (c) => c.status === "submitted" && (!topicId || c.topic_id === topicId),
  );
}

export function acceptedFor(s: StoreState, topicId: string): Contribution[] {
  return s.contributions.filter(
    (c) => c.status === "accepted" && c.topic_id === topicId,
  );
}

export function reviewOf(s: StoreState, contributionId: string): Review | undefined {
  return s.reviews.find((r) => r.target_object_id === contributionId);
}
