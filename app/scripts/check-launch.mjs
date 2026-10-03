import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const placeholder =
  /TODO|PLACEHOLDER|example\.(?:com|org)|\.(?:invalid|test)\b|à renseigner avant publication|to be supplied before publication/i;
const routes = [
  ["mentions-legales.html", "fr", "Mentions légales"],
  ["confidentialite.html", "fr", "Confidentialité"],
  ["contact.html", "fr", "Contact"],
  ["en/legal.html", "en", "Legal notice"],
  ["en/privacy.html", "en", "Privacy"],
  ["en/contact.html", "en", "Contact"],
];

/** Pure checks also used by the launch-gate contract tests. */
export function launchErrors(identity, readPage) {
  const errors = [];
  function inspect(value, path) {
    if (typeof value === "string") {
      if (!value.trim() || placeholder.test(value)) {
        errors.push(`identity.${path} is a placeholder`);
      }
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        inspect(child, path ? `${path}.${key}` : key);
      }
    }
  }
  inspect(identity, "");
  for (const key of [
    "editor",
    "publicationDirector",
    "postalAddress",
    "contactEmail",
  ]) {
    if (typeof identity[key] !== "string" || !identity[key].trim()) {
      errors.push(`identity.${key} is missing`);
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.contactEmail ?? "")) {
    errors.push("identity.contactEmail must be a contact email address");
  }
  for (const [file, lang, title] of routes) {
    let html;
    try {
      html = readPage(file);
    } catch {
      errors.push(`legal route missing: ${file}`);
      continue;
    }
    if (
      !html.includes(`lang="${lang}"`) ||
      !new RegExp(`<h1\\b[^>]*>${title}</h1>`).test(html)
    ) {
      errors.push(`legal route is not prerendered in ${lang}: ${file}`);
    }
    if (placeholder.test(html)) errors.push(`placeholder rendered: ${file}`);
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const identity = JSON.parse(
    readFileSync(join(appRoot, "src/config/identity.json"), "utf8"),
  );
  const errors = launchErrors(identity, (file) =>
    readFileSync(join(appRoot, "dist", file), "utf8"),
  );
  for (const error of errors) console.error(`[check-launch] ${error}`);
  if (errors.length) {
    process.exitCode = 1;
  } else {
    console.log(
      "[check-launch] identity completed and all legal routes prerendered",
    );
  }
}
