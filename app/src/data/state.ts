import type { Claim, DebateFixture } from "../types";
import { POSITION_LETTERS } from "./index";

/**
 * Canonical epistemic-state derivation, shared by the debate page StateStrip
 * and the library cards' shape bar so the ledger never disagrees with its
 * cards. Previously duplicated verbatim in DebatePage.tsx and DebateCard.tsx.
 */
export type ClaimState = "established" | "contested" | "values";

/** The single source of truth for a claim's derived epistemic state. A stored,
 *  reviewer-authored evaluation (G2), when present, is authoritative over the
 *  heuristic — the Library-of-Truths record wins. */
export function claimState(
  debate: DebateFixture,
  claim: Claim,
  evaluations?: Map<string, ClaimState>,
): ClaimState {
  const stored = evaluations?.get(claim.id);
  if (stored) return stored;
  if (claim.claim_type.includes("normative")) return "values";
  const links = debate.evidence_links.filter((l) => l.claim_id === claim.id);
  if (
    claim.review_status === "contested" ||
    links.some(
      (l) => l.label === "contradicts_claim" || l.label === "unclear",
    )
  )
    return "contested";
  // "Established" must be earned by positive evidence — an unsupported claim is
  // not established by default; it stays contested until a source backs it.
  const supported = links.some(
    (l) =>
      l.label === "supports_claim" || l.label === "partially_supports_claim",
  );
  return supported ? "established" : "contested";
}

/** The three epistemic temperaments the corpus can show at a glance. */
export type Temperament = "settled" | "contested" | "values";

/** Per-debate aggregate of claim states + the dominant temperament. */
export function debateShape(
  debate: DebateFixture,
  evaluations?: Map<string, ClaimState>,
): {
  established: number;
  contested: number;
  values: number;
  total: number;
  temperament: Temperament;
} {
  let established = 0;
  let contested = 0;
  let values = 0;
  for (const claim of debate.claims) {
    const s = claimState(debate, claim, evaluations);
    if (s === "established") established += 1;
    else if (s === "contested") contested += 1;
    else values += 1;
  }
  const total = established + contested + values;
  // A debate is "values-dependent" or "contested" only when that signal is a
  // real share of the corpus (>= a quarter of its claims), otherwise it reads
  // as a settled / evidence-backed dossier with a minor caveat.
  let temperament: Temperament = "settled";
  if (values >= contested && values * 4 >= total && values > 0) {
    temperament = "values";
  } else if (contested > 0 && contested * 4 >= total) {
    temperament = "contested";
  }
  return { established, contested, values, total, temperament };
}

/** Letters of every position whose arguments reference a given claim id. */
export function claimSharedBy(debate: DebateFixture): Map<string, string[]> {
  const byClaim = new Map<string, Set<string>>();
  for (const arg of debate.arguments) {
    const idx = debate.positions.findIndex((p) => p.id === arg.position_id);
    if (idx < 0) continue;
    for (const claimId of arg.claim_ids) {
      const set = byClaim.get(claimId) ?? new Set<string>();
      set.add(POSITION_LETTERS[idx]);
      byClaim.set(claimId, set);
    }
  }
  const out = new Map<string, string[]>();
  for (const [claimId, set] of byClaim) {
    if (set.size > 1) out.set(claimId, [...set].sort());
  }
  return out;
}
