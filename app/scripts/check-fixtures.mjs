import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const frDir = path.join(dataDir, "fr");
const fixtureFiles = [
  "congestion-pricing.json",
  "smartphones-schools.json",
  "nuclear-power.json",
];

const allowedTextDiffs = new Set([
  "topic.title",
  "topic.question",
  "topic.summary",
  "positions.*.title",
  "positions.*.short_summary",
  "positions.*.steelman",
  "arguments.*.summary",
  "claims.*.text",
  "sources.*.quality_notes",
  "evidence_links.*.rationale",
  "values.*.name",
  "values.*.description",
  "values.*.tension_with.*",
  "tradeoffs.*.gain",
  "tradeoffs.*.cost",
  "tradeoffs.*.risk",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizePath(parts) {
  return parts.map((part) => (typeof part === "number" ? "*" : part)).join(".");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ids(items, label, file) {
  const seen = new Set();
  for (const item of items) {
    assert(typeof item.id === "string" && item.id.length > 0, `${file}: ${label} item without id`);
    assert(!seen.has(item.id), `${file}: duplicate ${label} id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

function has(set, value, label, file) {
  assert(set.has(value), `${file}: missing ${label} reference ${value}`);
}

function checkReferences(fixture, file) {
  const topicId = fixture.topic.id;
  const revisionId = fixture.revision.id;
  const positionIds = ids(fixture.positions, "position", file);
  const argumentIds = ids(fixture.arguments, "argument", file);
  const claimIds = ids(fixture.claims, "claim", file);
  const sourceIds = ids(fixture.sources, "source", file);
  const evidenceIds = ids(fixture.evidence_links, "evidence_link", file);
  const valueIds = ids(fixture.values, "value", file);
  const tradeoffIds = ids(fixture.tradeoffs, "tradeoff", file);

  assert(fixture.topic.current_revision_id === revisionId, `${file}: topic current_revision_id mismatch`);
  assert(fixture.revision.topic_id === topicId, `${file}: revision topic_id mismatch`);

  for (const position of fixture.positions) {
    has(new Set([topicId]), position.topic_id, "position topic", file);
    for (const argumentId of position.argument_ids) has(argumentIds, argumentId, "position argument", file);
    for (const valueId of position.value_ids) has(valueIds, valueId, "position value", file);
    for (const tradeoffId of position.tradeoff_ids) has(tradeoffIds, tradeoffId, "position tradeoff", file);
  }

  for (const argument of fixture.arguments) {
    has(positionIds, argument.position_id, "argument position", file);
    for (const claimId of argument.claim_ids) has(claimIds, claimId, "argument claim", file);
  }

  for (const claim of fixture.claims) {
    has(new Set([topicId]), claim.topic_id, "claim topic", file);
    for (const evidenceId of claim.evidence_link_ids) has(evidenceIds, evidenceId, "claim evidence link", file);
  }

  for (const link of fixture.evidence_links) {
    has(claimIds, link.claim_id, "evidence claim", file);
    has(sourceIds, link.source_id, "evidence source", file);
  }

  for (const value of fixture.values) {
    has(new Set([topicId]), value.topic_id, "value topic", file);
    for (const positionId of value.position_ids) has(positionIds, positionId, "value position", file);
  }

  for (const tradeoff of fixture.tradeoffs) {
    has(new Set([topicId]), tradeoff.topic_id, "tradeoff topic", file);
    has(positionIds, tradeoff.position_id, "tradeoff position", file);
  }

}

function compareStructure(enValue, frValue, parts, file) {
  assert(Array.isArray(enValue) === Array.isArray(frValue), `${file}: array shape differs at ${parts.join(".")}`);

  if (Array.isArray(enValue)) {
    assert(enValue.length === frValue.length, `${file}: array length differs at ${parts.join(".")}`);
    enValue.forEach((item, index) => compareStructure(item, frValue[index], [...parts, index], file));
    return;
  }

  if (enValue && typeof enValue === "object") {
    assert(frValue && typeof frValue === "object", `${file}: object shape differs at ${parts.join(".")}`);
    const enKeys = Object.keys(enValue).sort();
    const frKeys = Object.keys(frValue).sort();
    assert(JSON.stringify(enKeys) === JSON.stringify(frKeys), `${file}: object keys differ at ${parts.join(".")}`);
    for (const key of enKeys) compareStructure(enValue[key], frValue[key], [...parts, key], file);
    return;
  }

  if (enValue !== frValue) {
    const normalized = normalizePath(parts);
    assert(allowedTextDiffs.has(normalized), `${file}: unexpected FR diff at ${parts.join(".")}`);
    assert(typeof enValue === "string" && typeof frValue === "string", `${file}: non-string diff at ${parts.join(".")}`);
  }
}

for (const file of fixtureFiles) {
  const en = readJson(path.join(dataDir, file));
  const fr = readJson(path.join(frDir, file));
  checkReferences(en, file);
  checkReferences(fr, `fr/${file}`);
  compareStructure(en, fr, [], file);
}

console.log(`Fixture checks passed for ${fixtureFiles.length} EN fixtures and ${fixtureFiles.length} FR mirrors.`);
