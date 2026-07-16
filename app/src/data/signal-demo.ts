import type {
  PositionAggregate,
  PositionShare,
  SignalPhase,
} from "../types";
import { getDebates, letterOf } from "./index";
import type { Locale } from "../i18n";

/**
 * Deterministic, plausible, BADGED demo distribution for the position signal —
 * shown when there is no Supabase backend (or under FR, which renders fixtures).
 * Keyed by topic_id; per-position cells keyed on the mode-stable letter so the
 * shape aligns whether ids are prefixed (cp_pos_a) or raw (pos_a). Round-ish
 * three-digit counts read as seed, not telemetry; the after-phase shows a small
 * softening (poles ease toward the qualified middle). Never empty, never throws.
 */
const DEMO: Record<string, Record<string, { before: number; after: number }>> =
  {
    topic_congestion_pricing: {
      A: { before: 312, after: 286 },
      B: { before: 268, after: 214 },
      C: { before: 154, after: 233 },
    },
    topic_smartphones_schools: {
      A: { before: 408, after: 351 },
      B: { before: 171, after: 196 },
      C: { before: 142, after: 168 },
    },
    topic_nuclear_power: {
      A: { before: 247, after: 231 },
      B: { before: 219, after: 188 },
      C: { before: 138, after: 181 },
    },
  };

const band = (n: number, total: number): { lo: number; hi: number } => {
  const pct = total > 0 ? (100 * n) / total : 0;
  const lo = Math.floor(pct / 5) * 5;
  return { lo, hi: lo + 5 };
};

export function fixtureAggregate(
  topicId: string,
  locale: Locale,
): PositionAggregate | null {
  const debate = getDebates(locale).find((d) => d.topic.id === topicId);
  const demo = DEMO[topicId];
  if (!debate || !demo) return null;
  const totBefore = Object.values(demo).reduce((a, x) => a + x.before, 0);
  const totAfter = Object.values(demo).reduce((a, x) => a + x.after, 0);
  const dist: PositionShare[] = [];
  for (const phase of ["before", "after"] as SignalPhase[]) {
    const tot = phase === "before" ? totBefore : totAfter;
    for (const p of debate.positions) {
      const letter = letterOf(debate, p.id); // "A" | "B" | "C" — mode-stable
      const cell = demo[letter];
      if (!cell) continue;
      const n = phase === "before" ? cell.before : cell.after;
      const b = band(n, tot);
      dist.push({
        position_id: `pos_${letter.toLowerCase()}`,
        phase,
        withheld: false,
        share_lo: b.lo,
        share_hi: b.hi,
      });
    }
  }
  return {
    topic_id: topicId,
    is_demo: true,
    released: true,
    totals: { before: totBefore, after: totAfter },
    confidence: "forming",
    distribution: dist,
    source: "fixtures",
  };
}
