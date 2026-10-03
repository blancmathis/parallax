import type { Claim, DebateFixture } from "../types";

// Kept local so this pure state module can be exercised without importing the
// fixture registry (which eagerly loads every JSON debate).
const POSITION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Canonical epistemic-state derivation, shared by the debate page StateStrip
 * and the library cards' shape bar so the ledger never disagrees with its
 * cards. Previously duplicated verbatim in DebatePage.tsx and DebateCard.tsx.
 */
export type ClaimState =
  | "established"
  | "contested"
  | "provisional"
  | "values";

/** Fixture labels describe source alignment, never an established verdict.
 *  Without a human review record, truth-apt claims remain provisional. */
export function claimState(_debate: DebateFixture, claim: Claim): ClaimState {
  if (claim.claim_type.includes("normative")) return "values";
  if (claim.review_status === "unreviewed") return "provisional";
  if (
    claim.review_status === "contested" ||
    claim.review_status === "rejected"
  ) {
    return "contested";
  }
  return "provisional";
}

/** The four aggregate temperaments the corpus can show at a glance. */
export type Temperament =
  | "settled"
  | "contested"
  | "provisional"
  | "values";

/** Per-debate aggregate of claim states + the dominant temperament. */
export function debateShape(
  debate: DebateFixture,
): {
  established: number;
  contested: number;
  provisional: number;
  values: number;
  total: number;
  temperament: Temperament;
} {
  let established = 0;
  let contested = 0;
  let provisional = 0;
  let values = 0;
  for (const claim of debate.claims) {
    const s = claimState(debate, claim);
    if (s === "established") established += 1;
    else if (s === "contested") contested += 1;
    else if (s === "provisional") provisional += 1;
    else values += 1;
  }
  const total = established + contested + provisional + values;
  // A non-settled temperament appears only when that exclusive state is a real
  // share of the corpus (>= a quarter of its claims). Provisional is never
  // folded into contested: pending review and an actual challenge are
  // materially different signals.
  let temperament: Temperament = "settled";
  if (
    values >= contested &&
    values >= provisional &&
    values * 4 >= total &&
    values > 0
  ) {
    temperament = "values";
  } else if (
    contested >= provisional &&
    contested * 4 >= total &&
    contested > 0
  ) {
    temperament = "contested";
  } else if (provisional * 4 >= total && provisional > 0) {
    temperament = "provisional";
  }
  return {
    established,
    contested,
    provisional,
    values,
    total,
    temperament,
  };
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
