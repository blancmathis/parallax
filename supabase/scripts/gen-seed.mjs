#!/usr/bin/env node
// Regenerate the *published* 3-debate corpus inside supabase/seed.sql from the
// canonical EN fixtures in app/src/data/*.json — the single source of truth.
//
// Why a generator: the published corpus is ~150 exact rows across 11 tables;
// hand-translating them (with SQL escaping and per-table counts) is error-prone
// and drifts from the fixtures the UI is built on. This script makes the seed a
// pure projection of the fixtures, so `npm run gen:seed` after any fixture edit
// keeps Supabase and the client in lockstep.
//
// What it does NOT touch: the auth.users / identities / profiles preamble and
// the draft-demo + seed-packet postamble (both kept verbatim from the existing
// seed.sql, because the RLS matrix and mock-AI smoke depend on them). The script
// is idempotent: it splits the current seed at the first published-topic insert
// and at the draft-demo topic, regenerates the middle, and rewrites the file.
//
// Published rows preserve the fixtures' review_status. Publishing a revision
// is not evidence review: unreviewed seed objects must remain unreviewed in SQL.
// We do NOT call publish_revision() (it needs auth.uid() + admin role).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const dataDir = join(repo, "app", "src", "data");
const seedPath = join(repo, "supabase", "seed.sql");
const corpusPath = join(repo, "supabase", "seed.corpus.sql");

const ADMIN = "00000000-0000-0000-0000-000000000103"; // local admin profile id

// topic id -> stable id prefix for its sub-objects (fixtures reuse pos_a/c1/s1)
const PREFIX = {
  topic_congestion_pricing: "cp",
  topic_smartphones_schools: "sm",
  topic_nuclear_power: "nu",
};
const FIXTURES = ["congestion-pricing", "smartphones-schools", "nuclear-power"];

// ---- SQL emit helpers -------------------------------------------------------
const q = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const num = (n) => (n === null || n === undefined ? "null" : String(n));
const arr = (xs) =>
  !xs || xs.length === 0 ? `'{}'::text[]` : `array[${xs.map((x) => q(x)).join(", ")}]::text[]`;
const slugOf = (topicId) => topicId.replace(/^topic_/, "").replace(/_/g, "-");
const reviewStatus = (item) => q(item?.review_status ?? "unreviewed");

function revisionReviewStatus(fx) {
  const reviewables = [
    ...fx.positions,
    ...fx.arguments,
    ...fx.claims,
    ...fx.evidence_links,
    ...fx.tradeoffs,
  ];
  if (reviewables.some((item) => item.review_status === "rejected")) {
    return "rejected";
  }
  if (reviewables.some((item) => item.review_status === "contested")) {
    return "contested";
  }
  return reviewables.every((item) => item.review_status === "approved")
    ? "approved"
    : "unreviewed";
}

// Two emit modes. LOCAL keeps the exact bytes the RLS matrix depends on (admin
// uuid in created_by / published_by / human-audit actor_id). CLOUD is
// credential-free: every author is null and human audit actor_ids are dropped,
// so the published corpus can load onto the hosted DB WITHOUT seed.sql's
// auth.users / profiles preamble — i.e. without minting a known-password admin
// backdoor on cloud. created_by / published_by are nullable FKs; audit actor_id
// is plain text — and the published view masks all three regardless.
const LOCAL = { author: q(ADMIN), humanActor: () => q(ADMIN) };
const CLOUD = { author: "null", humanActor: () => "null" };

function debateBlock(fx, mode = LOCAL) {
  const t = fx.topic;
  const prefix = PREFIX[t.id];
  if (!prefix) throw new Error(`no prefix for ${t.id}`);
  const pid = (id) => `${prefix}_${id}`;
  const rev = pid(fx.revision.id);
  // already-quoted SQL literal (mode.author / mode.humanActor return SQL text)
  const auditActorSql = (e) =>
    e.actor_type === "admin" || e.actor_type === "user"
      ? mode.humanActor(e)
      : q(e.actor_id);

  const out = [];
  out.push(`-- =====================================================================`);
  out.push(`-- ${t.title} (${slugOf(t.id)}) — generated from ${slugOf(t.id)}.json`);
  out.push(`-- =====================================================================`);

  // 1. topic (draft first; published_revision_id flipped at the end)
  out.push(`insert into public.topics (id, slug, title, question, summary, status, created_by, created_at) values`);
  out.push(`  (${q(t.id)}, ${q(slugOf(t.id))}, ${q(t.title)}, ${q(t.question)}, ${q(t.summary)}, 'draft', ${mode.author}, ${q(t.created_at)});`);

  // 2. revision (draft)
  out.push(`insert into public.debate_revisions (id, topic_id, revision_number, status, review_status, generated_by, created_by, created_at) values`);
  out.push(`  (${q(rev)}, ${q(t.id)}, ${num(fx.revision.revision_number)}, 'draft', ${q(revisionReviewStatus(fx))}, 'human', ${mode.author}, ${q(t.created_at)});`);

  // 3. positions
  out.push(`insert into public.positions (id, revision_id, topic_id, title, short_summary, steelman, status, generated_by, review_status, sort_order) values`);
  out.push(
    fx.positions
      .map((p, i) => `  (${q(pid(p.id))}, ${q(rev)}, ${q(t.id)}, ${q(p.title)}, ${q(p.short_summary)}, ${q(p.steelman)}, 'published', ${q(p.generated_by)}, ${reviewStatus(p)}, ${i + 1})`)
      .join(",\n") + ";"
  );

  // 4. claims
  out.push(`insert into public.claims (id, revision_id, topic_id, text, claim_type, generated_by, review_status, sort_order) values`);
  out.push(
    fx.claims
      .map((c, i) => `  (${q(pid(c.id))}, ${q(rev)}, ${q(t.id)}, ${q(c.text)}, ${arr(c.claim_type)}, ${q(c.generated_by)}, ${reviewStatus(c)}, ${i + 1})`)
      .join(",\n") + ";"
  );

  // 5. arguments (claim_ids is text[], prefix each)
  out.push(`insert into public.debate_arguments (id, revision_id, position_id, direction, summary, claim_ids, generated_by, review_status, sort_order) values`);
  out.push(
    fx.arguments
      .map((a, i) => `  (${q(pid(a.id))}, ${q(rev)}, ${q(pid(a.position_id))}, ${q(a.direction)}, ${q(a.summary)}, ${arr((a.claim_ids || []).map(pid))}, ${q(a.generated_by)}, ${reviewStatus(a)}, ${i + 1})`)
      .join(",\n") + ";"
  );

  // 6. sources
  out.push(`insert into public.sources (id, revision_id, topic_id, url, title, publisher, source_type, retrieval_status, retrieved_at, quality_notes, content_hash, sort_order) values`);
  out.push(
    fx.sources
      .map((s, i) => `  (${q(pid(s.id))}, ${q(rev)}, ${q(t.id)}, ${q(s.url)}, ${q(s.title)}, ${q(s.publisher)}, ${q(s.source_type)}, ${q(s.retrieval_status)}, ${q(s.retrieved_at)}, ${q(s.quality_notes)}, ${q(s.content_hash)}, ${i + 1})`)
      .join(",\n") + ";"
  );

  // 7. exact source excerpts (optional, but deterministic when present)
  const excerpts = fx.source_excerpts || [];
  const excerptsById = new Map();
  if (excerpts.length > 0) {
    const sourceIds = new Set(fx.sources.map((source) => source.id));
    for (const excerpt of excerpts) {
      if (excerptsById.has(excerpt.id)) throw new Error(`duplicate source excerpt ${excerpt.id}`);
      if (!sourceIds.has(excerpt.source_id)) throw new Error(`missing source ${excerpt.source_id} for excerpt ${excerpt.id}`);
      excerptsById.set(excerpt.id, excerpt);
    }
    out.push(`insert into public.source_excerpts (id, revision_id, source_id, text, locator, extracted_by) values`);
    out.push(
      excerpts
        .map((excerpt) => `  (${q(pid(excerpt.id))}, ${q(rev)}, ${q(pid(excerpt.source_id))}, ${q(excerpt.text)}, ${q(excerpt.locator)}, ${q(excerpt.extracted_by)})`)
        .join(",\n") + ";"
    );
  }

  for (const link of fx.evidence_links) {
    if (!link.source_excerpt_id) continue;
    const excerpt = excerptsById.get(link.source_excerpt_id);
    if (!excerpt) throw new Error(`missing excerpt ${link.source_excerpt_id} for evidence ${link.id}`);
    if (excerpt.source_id !== link.source_id) {
      throw new Error(`source mismatch for excerpt ${excerpt.id} and evidence ${link.id}`);
    }
  }

  // 8. evidence_links (claim/source/excerpt ids are FKs; preserve labels exactly)
  out.push(`insert into public.evidence_links (id, revision_id, claim_id, source_id, source_excerpt_id, label, rationale, confidence, review_status, sort_order) values`);
  out.push(
    fx.evidence_links
      .map((e, i) => `  (${q(pid(e.id))}, ${q(rev)}, ${q(pid(e.claim_id))}, ${q(pid(e.source_id))}, ${e.source_excerpt_id ? q(pid(e.source_excerpt_id)) : "null"}, ${q(e.label)}, ${q(e.rationale)}, ${num(e.confidence)}, ${reviewStatus(e)}, ${i + 1})`)
      .join(",\n") + ";"
  );

  // 9. debate_values
  out.push(`insert into public.debate_values (id, revision_id, topic_id, name, description, tension_with, sort_order) values`);
  out.push(
    fx.values
      .map((v, i) => `  (${q(pid(v.id))}, ${q(rev)}, ${q(t.id)}, ${q(v.name)}, ${q(v.description)}, ${arr(v.tension_with)}, ${i + 1})`)
      .join(",\n") + ";"
  );

  // 10. value_positions (one row per value/position pair)
  const vp = fx.values.flatMap((v) => (v.position_ids || []).map((p) => `  (${q(pid(v.id))}, ${q(pid(p))})`));
  out.push(`insert into public.value_positions (value_id, position_id) values`);
  out.push(vp.join(",\n") + ";");

  // 11. tradeoffs
  out.push(`insert into public.tradeoffs (id, revision_id, topic_id, position_id, gain, cost, risk, review_status) values`);
  out.push(
    fx.tradeoffs
      .map((tr) => `  (${q(pid(tr.id))}, ${q(rev)}, ${q(t.id)}, ${q(pid(tr.position_id))}, ${q(tr.gain)}, ${q(tr.cost)}, ${q(tr.risk)}, ${reviewStatus(tr)})`)
      .join(",\n") + ";"
  );

  // 12. audit_events (id defaults to uuid; revision_id must equal published rev)
  out.push(`insert into public.audit_events (topic_id, revision_id, actor_type, actor_id, event_type, input_object_ids, output_object_ids, summary, created_at) values`);
  out.push(
    fx.audit_events
      .map((e) => `  (${q(t.id)}, ${q(rev)}, ${q(e.actor_type)}, ${auditActorSql(e)}, ${q(e.event_type)}, '{}', '{}', ${q(e.summary)}, ${q(e.created_at)})`)
      .join(",\n") + ";"
  );

  // two-phase publish flip (no publish_revision(): no auth.uid() in seed)
  out.push(`update public.debate_revisions set status = 'published', published_at = ${q(fx.revision.published_at)}, published_by = ${mode.author} where id = ${q(rev)};`);
  out.push(`update public.topics set status = 'published', published_revision_id = ${q(rev)} where id = ${q(t.id)};`);

  return out.join("\n");
}

// ---- splice into the existing seed, preserving preamble + postamble ----------
const seed = readFileSync(seedPath, "utf8");
// Cut BEFORE the first generated debate header if one is already present (so a
// re-run replaces it rather than duplicating it); fall back to the first topic
// insert on a never-generated seed. This keeps `npm run gen:seed` idempotent.
const headerRe = /-- ={10,}\n-- .+ — generated from .+\.json\n-- ={10,}/;
const headerMatch = seed.match(headerRe);
const corpusStart = headerMatch
  ? headerMatch.index
  : seed.indexOf("insert into public.topics (");
const preamble = seed.slice(0, corpusStart);
const draftMarker = seed.indexOf("'topic_draft_demo'");
if (draftMarker === -1) throw new Error("could not find draft-demo postamble anchor in seed.sql");
const postamble = seed.slice(seed.lastIndexOf("insert into public.topics (", draftMarker));

const fixtures = FIXTURES.map((name) =>
  JSON.parse(readFileSync(join(dataDir, `${name}.json`), "utf8")),
);

// ---- 1) local seed.sql: splice into the existing file (preamble + postamble) -
const blocks = fixtures.map((fx) => debateBlock(fx, LOCAL));

const next =
  preamble.replace(/\s+$/, "") +
  "\n\n" +
  blocks.join("\n\n") +
  "\n\n-- ---------------------------------------------------------------------------\n" +
  "-- Draft demos + seed packet (kept verbatim; used by the RLS matrix and the\n" +
  "-- seed-packet / mock-AI smoke). Not published.\n" +
  "-- ---------------------------------------------------------------------------\n" +
  postamble.replace(/^\s+/, "");

writeFileSync(seedPath, next.endsWith("\n") ? next : next + "\n");
console.log(`seed.sql rewritten: ${FIXTURES.length} published debates from fixtures.`);

// ---- 2) seed.corpus.sql: credential-free, corpus-only, cloud-safe -----------
// Just the published debates, authored as null. NO auth.users / identities /
// profiles, NO draft-demo, NO seed_packets. This is the ONLY seed that may touch
// the hosted DB; seed.sql carries known-password local accounts and must never
// run on cloud (see docs/deployment/deploy-runbook.md).
const corpusHeader =
  "-- ===========================================================================\n" +
  "-- CLOUD-SAFE published corpus — GENERATED by supabase/scripts/gen-seed.mjs.\n" +
  "-- Do not edit by hand; run `npm run gen:seed` after any fixture change.\n" +
  "--\n" +
  "-- Credential-free: contains ONLY the published 3-debate corpus, authored as\n" +
  "-- null (no auth.users / profiles, no draft demos, no seed packets). Safe to\n" +
  "-- load on the hosted DB. NEVER load supabase/seed.sql on cloud — it mints\n" +
  "-- known-password local accounts (an admin backdoor). Provision the real admin\n" +
  "-- by hand (Supabase Auth + a profiles row with role='admin').\n" +
  "-- ===========================================================================\n";
const corpusBlocks = fixtures.map((fx) => debateBlock(fx, CLOUD));
writeFileSync(corpusPath, corpusHeader + "\n" + corpusBlocks.join("\n\n") + "\n");
console.log(
  `seed.corpus.sql written: ${FIXTURES.length} published debates, credential-free (cloud-safe).`,
);
