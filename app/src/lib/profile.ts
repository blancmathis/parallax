import { useSyncExternalStore } from "react";

/**
 * Local reader profile: values quiz results, steelman badges, perception
 * measures. Everything stays in this browser — there is no account system
 * yet, and that is a feature: the profile page says so explicitly.
 */

const KEY = "parallax.profile.v1";

export interface QuizResult {
  value_scores: Record<string, number>;
  match_position_id: string;
  completed_at: string;
}

export interface SteelmanResult {
  passed: boolean;
  correct: number;
  total: number;
  attempted_at: string;
}

export interface ProfileState {
  quiz: Record<string, QuizResult>;
  steelman: Record<string, Record<string, SteelmanResult>>;
  perception: Record<string, { before?: number; after?: number }>;
  // The reader's OWN position pick per phase (fixture-style id, null = undecided).
  // Stays in THIS browser, exactly like perception; only an anonymous increment
  // ever reaches the server (see lib/backend castPositionSignal).
  signal: Record<string, { before?: string | null; after?: string | null }>;
}

const EMPTY: ProfileState = {
  quiz: {},
  steelman: {},
  perception: {},
  signal: {},
};

let state: ProfileState = load();
const listeners = new Set<() => void>();

function load(): ProfileState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function persist(next: ProfileState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // in-memory fallback
  }
  listeners.forEach((l) => l());
}

export function useProfile(): ProfileState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function saveQuizResult(topicId: string, result: QuizResult): void {
  persist({ ...state, quiz: { ...state.quiz, [topicId]: result } });
}

export function saveSteelmanResult(
  topicId: string,
  positionId: string,
  result: SteelmanResult,
): void {
  const prev = state.steelman[topicId] ?? {};
  const existing = prev[positionId];
  // keep the best attempt
  const best =
    existing && existing.correct > result.correct && !result.passed
      ? existing
      : result;
  persist({
    ...state,
    steelman: {
      ...state.steelman,
      [topicId]: { ...prev, [positionId]: best },
    },
  });
}

export function setPerception(
  topicId: string,
  field: "before" | "after",
  value: number,
): void {
  const prev = state.perception[topicId] ?? {};
  // the first "before" is the baseline; don't overwrite it on quiz retakes
  if (field === "before" && prev.before !== undefined) return;
  persist({
    ...state,
    perception: {
      ...state.perception,
      [topicId]: { ...prev, [field]: value },
    },
  });
}

/** The reader's OWN pick per phase (fixture-style id, null = undecided). Stays
 *  in THIS browser, like perception. `before` is first-write-wins (entry
 *  baseline); `after` is last-write-wins (revisable). Never sent as-is — only an
 *  anonymous increment reaches the server. */
export function castSignal(
  topicId: string,
  phase: "before" | "after",
  positionId: string | null,
): void {
  const prev = state.signal[topicId] ?? {};
  if (phase === "before" && prev.before !== undefined) return; // baseline locked
  persist({
    ...state,
    signal: { ...state.signal, [topicId]: { ...prev, [phase]: positionId } },
  });
}

export function resetProfile(): void {
  persist(EMPTY);
}
