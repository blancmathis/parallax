import { describe, expect, it } from "vitest";
import { launchErrors } from "../../scripts/check-launch.mjs";
import identity from "../../src/config/identity.json";

function legalHtml(file: string): string {
  const lang = file.startsWith("en/") ? "en" : "fr";
  const title = file.includes("mentions-legales")
    ? "Mentions légales"
    : file.includes("legal")
      ? "Legal notice"
      : file.includes("confidentialite")
        ? "Confidentialité"
        : file.includes("privacy")
          ? "Privacy"
          : "Contact";
  return `<html lang="${lang}"><body><h1>${title}</h1></body></html>`;
}

describe("launch gate", () => {
  it("blocks the checked-in identity placeholders", () => {
    expect(launchErrors(identity, legalHtml)).toContain(
      "identity.postalAddress is a placeholder",
    );
    expect(launchErrors(identity, legalHtml)).toContain(
      "identity.phone is a placeholder",
    );
    expect(launchErrors(identity, legalHtml)).toContain(
      "identity.contactEmail is a placeholder",
    );
  });

  it("accepts completed identity but blocks stale rendered placeholders", () => {
    // Synthetic checker inputs only; the site identity is left untouched.
    const completed = {
      ...identity,
      postalAddress: "Postal address supplied by the editor",
      phone: "+33 1 00 00 00 00",
      contactEmail: "contact@parallax.org",
    };
    expect(launchErrors(completed, legalHtml)).toEqual([]);
    expect(
      launchErrors(completed, (file: string) =>
        legalHtml(file).replace(
          "</body>",
          "Contact email to be supplied before publication.</body>",
        ),
      ),
    ).toContain("placeholder rendered: en/contact.html");
  });

  it("blocks a missing or wrong-language legal route", () => {
    const errors = launchErrors(identity, (file: string) => {
      if (file === "en/privacy.html") throw new Error("missing");
      return file === "mentions-legales.html"
        ? '<html lang="en"><h1>Legal notice</h1></html>'
        : legalHtml(file);
    });
    expect(errors).toContain("legal route missing: en/privacy.html");
    expect(errors).toContain(
      "legal route is not prerendered in fr: mentions-legales.html",
    );
  });
});
