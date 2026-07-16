import type { DebateFixture } from "../types";
import type { Locale } from "../i18n";
import congestionPricing from "./congestion-pricing.json";
import smartphonesSchools from "./smartphones-schools.json";
import nuclearPower from "./nuclear-power.json";
import congestionPricingFr from "./fr/congestion-pricing.json";
import smartphonesSchoolsFr from "./fr/smartphones-schools.json";
import nuclearPowerFr from "./fr/nuclear-power.json";

const DEBATES_EN = [
  congestionPricing,
  smartphonesSchools,
  nuclearPower,
] as DebateFixture[];

const DEBATES_FR = [
  congestionPricingFr,
  smartphonesSchoolsFr,
  nuclearPowerFr,
] as DebateFixture[];

export const DEBATES = DEBATES_EN;

export function getDebates(locale: Locale): DebateFixture[] {
  return locale === "fr" ? DEBATES_FR : DEBATES_EN;
}

export function slugOf(debate: DebateFixture): string {
  return debate.topic.id.replace(/^topic_/, "").replace(/_/g, "-");
}

export function debateBySlug(
  slug: string,
  locale: Locale = "en",
): DebateFixture | undefined {
  return getDebates(locale).find((d) => slugOf(d) === slug);
}

export function debateByTopicId(
  topicId: string,
  locale: Locale = "en",
): DebateFixture | undefined {
  return getDebates(locale).find((d) => d.topic.id === topicId);
}

export const POSITION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const THEMES: Record<string, { en: string; fr: string }> = {
  topic_congestion_pricing: { en: "Urban mobility", fr: "Mobilité urbaine" },
  topic_smartphones_schools: { en: "Education", fr: "Éducation" },
  topic_nuclear_power: { en: "Energy & climate", fr: "Énergie & climat" },
};

export function themeOf(topicId: string, locale: Locale): string {
  const t = THEMES[topicId];
  return t ? t[locale] : "";
}

export function letterOf(debate: DebateFixture, positionId: string): string {
  const i = debate.positions.findIndex((p) => p.id === positionId);
  return i >= 0 ? POSITION_LETTERS[i] : "+";
}
