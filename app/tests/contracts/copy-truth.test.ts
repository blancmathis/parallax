import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { fr } from "../../src/i18n/fr";

function stringCorpus(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringCorpus);
}

describe("product copy truth contract", () => {
  it("does not present target verification and AI capabilities as current", () => {
    const copy = [...stringCorpus(en), ...stringCorpus(fr)].join("\n");

    expect(copy).not.toMatch(/living base of verified/i);
    expect(copy).not.toMatch(/base vivante de réflexion vérifiée/i);
    expect(copy).not.toMatch(/validation method is proven/i);
    expect(copy).not.toMatch(/méthode de validation est prouvée/i);
    expect(copy).not.toMatch(/source vetted by many/i);
    expect(copy).not.toMatch(/source vérifiée par beaucoup/i);
    expect(copy).not.toMatch(/claim is verified once/i);
    expect(copy).not.toMatch(/vérifiée une fois, citée partout/i);
    expect(copy).not.toMatch(/AI, fully audited/i);
    expect(copy).not.toMatch(/IA, entièrement auditée/i);
    expect(copy).not.toMatch(/verified without an arbiter/i);
    expect(copy).not.toMatch(/vérifiées sans arbitre/i);
  });

  it("does not claim a legal non-profit status that does not exist", () => {
    expect(en.common.labels.nonProfit).toBe("Public-interest project");
    expect(fr.common.labels.nonProfit).toBe("Projet d'intérêt public");
    expect(en.chrome.projectItems).not.toContain("Non-profit");
    expect(fr.chrome.projectItems).not.toContain("Sans but lucratif");
    expect(en.meta.ogDescription).not.toMatch(/^A non-profit/i);
    expect(fr.meta.ogDescription).not.toMatch(/sans but lucratif/i);
    expect(en.landing.trust.cols[1].body).toMatch(/not a registered non-profit/i);
    expect(fr.landing.trust.cols[1].body).toMatch(/pas une association reconnue/i);
  });

  it("describes local and signed-in position ballots without false anonymity promises", () => {
    expect(en.positionSignal.privacyLocal).toMatch(/stays in this browser/i);
    expect(fr.positionSignal.privacyLocal).toMatch(/reste dans ce navigateur/i);
    expect(en.positionSignal.privacy).toMatch(/linked to your account/i);
    expect(fr.positionSignal.privacy).toMatch(/lié à votre compte/i);
    expect(en.positionSignal.privacy).toMatch(/k-anonymized aggregate bands/i);
    expect(fr.positionSignal.privacy).toMatch(/k-anonymisées/i);

    const copy = [...stringCorpus(en), ...stringCorpus(fr)].join("\n");
    expect(copy).not.toMatch(/Only the anonymous total is ever stored/i);
    expect(copy).not.toMatch(/Seul le total anonyme est conservé/i);
    expect(copy).not.toMatch(/never tied to you/i);
    expect(copy).not.toMatch(/jamais lié à vous/i);
    expect(copy).not.toMatch(/never sold/i);
    expect(copy).not.toMatch(/jamais vendues?/i);
  });
});
