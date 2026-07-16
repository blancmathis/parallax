/**
 * "Insight" content powers the interactive layer of a debate:
 * - the values quiz ("Where do you stand?")
 * - the steelman test (can you state the other side fairly?)
 *
 * It is authored editorial content, separate from the debate fixtures, but
 * references the same position_ids and value_ids.
 */

export interface TradeoffQuestion {
  id: string;
  prompt: string;
  a: { text: string; value_ids: string[] };
  b: { text: string; value_ids: string[] };
}

export interface SteelmanQuestion {
  id: string;
  position_id: string;
  prompt: string;
  options: { text: string; correct?: boolean }[];
  explain: string;
}

/**
 * A voice: a short first-person account of why a real person holds a
 * position. Values are often the visible trace of a story — this is the
 * story. Seed voices are realistic composites, marked as such in the UI.
 */
export interface Voice {
  id: string;
  position_id: string;
  name: string;
  detail: string;
  text: string;
}

export interface DebateInsight {
  topic_id: string;
  tradeoffs: TradeoffQuestion[];
  steelman: SteelmanQuestion[];
  voices: Voice[];
}

import type { Locale } from "../../i18n";
import congestionPricing from "./congestion-pricing";
import smartphonesSchools from "./smartphones-schools";
import nuclearPower from "./nuclear-power";
import congestionPricingFr from "./fr/congestion-pricing";
import smartphonesSchoolsFr from "./fr/smartphones-schools";
import nuclearPowerFr from "./fr/nuclear-power";

const REGISTRY: Record<Locale, DebateInsight[]> = {
  en: [congestionPricing, smartphonesSchools, nuclearPower],
  fr: [congestionPricingFr, smartphonesSchoolsFr, nuclearPowerFr],
};

export function insightFor(
  topicId: string,
  locale: Locale,
): DebateInsight | undefined {
  return REGISTRY[locale].find((i) => i.topic_id === topicId);
}
