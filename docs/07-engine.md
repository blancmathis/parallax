# The Objectivity Engine

How a topic advances. This is the product mechanism Parallax is implementing:
maximum objectivity, spam-resistance, completeness, and navigability — on
topics that can be huge, emotional, and adversarial. The claim lifecycle it
feeds is defined in [06-vision.md](06-vision.md#the-library-of-truths).

## 1. A contribution is a diff, not a post

The atomic unit is the **claim**. Every incoming contribution is first
matched against the existing map (semantic deduplication: AI proposes,
humans confirm — the `normalized_key` and `DUPLICATES` relation in
[03-data-model.md](03-data-model.md)):

- Duplicate → merged: the contributor is shown *"this point already exists
  as C14 — here is its status. Do you bring a new source, or a new
  distinction?"* Nothing is deleted; everything is merged. Repetition and
  spam die at this gate, without censorship.
- New → enters review with provenance attached.

A topic with 10,000 comments collapses into ~80 claims, ~12 arguments,
~5 positions. The ~5 is illustrative, not a cap: there is **no fixed limit**
on the number of positions — it is emergent, kept readable by dedup,
fractalization, and UI folding (see [02-product.md](02-product.md) D13).
**UI status: implemented** — the contribution form runs a
similarity check against existing claims as you type and offers the
existing claim instead.

**The same gate applies at the debate altitude.** A debate is a diff, not a
post: creating a topic first resolves its **anchor claim** through the
existing embedding dedup, then matches the proposed question against existing
`DebateView.question_text` by similarity (surfaced as-you-type, like the claim
form), and compares **scope** — geography, period, population — not just text.
Four outcomes:

- Exact duplicate → redirect to the existing debate.
- Narrower scope → create as a sub-debate (fractalization, linked under the
  parent).
- Broader scope → create as a parent/atlas node linking the existing debates.
- Genuinely new → create with provenance.

AI proposes, humans confirm — a debate merge is a sensitive judgment, bridged
like claim merges (section 2). Nothing is deleted: a duplicate is merged via a
`(DebateView)-[:DUPLICATES]->(DebateView)` relation, never erased
([03-data-model.md](03-data-model.md)). This guardrail is tracked for topic
creation in [04-roadmap.md](04-roadmap.md) Milestone 6.

## 2. Bridging consensus, not majority

Sensitive judgments (evidence labels, steelman fairness, dedup merges) are
validated by **agreement across camps**, not by majority — the mechanism
proven by X/Twitter's Community Notes: a judgment ships only when raters
who usually disagree both endorse it.

- An evidence label is confirmed when reviewers from opposing positions
  converge on it.
- A steelman is "fair" when supporters of that position recognize
  themselves in it.
- Majorities can brigade; bridges cannot.

**UI status: shown** — the review queue explains the bridge requirement;
the single-reviewer mode of the prototype is explicitly labeled as such.

## 3. Moderation rights are earned by understanding

To become a **steward** of a debate you must pass the steelman test on
*every* position of that debate — the Ideological Turing Test as a
moderation gate. You may only moderate what you have proven you can state
fairly.

- Steward eligibility is per-debate, revocable, and public.
- Stewards handle merges, contested labels, and structure changes
  (new/merged positions) through a public RFC window.

**UI status: implemented** — steward progress (badges per position) is
tracked on the profile page and surfaced on each debate.

## 4. Big topics fractalize

"Immigration" is not a page — it is an atlas of sub-questions, each its own
debate page, sharing one **global claim library**: a claim is verified once
and cited everywhere. Each page opens with the **state of the debate**:

- what is *established* (survived adversarial review),
- what is *contested* (and exactly where it blocks),
- what is *values-dependent* (legitimate plurality).

**UI status: implemented** — every debate page derives and displays its
three-bucket state; the atlas hierarchy arrives with general topic
creation (Milestone 6). Sub-debates are promoted as `DebateView` nodes in
the graph ([03-data-model.md](03-data-model.md)); each shares the global
claim library and its sources ([08-sources.md](08-sources.md)).

### Staying navigable when a topic explodes

The common case is a topic with **many positions**, each resting on **many
contested sub-points**, recursively. The recursion is the model; the rule that
keeps it usable: **the reader never faces the whole graph — only one altitude at
a time, and chooses to descend.**

- **One altitude per page, depth-1 by default.** A page shows its own level plus
  the *next* level folded: referenced claims and sub-debates appear as folded
  chips carrying their state ("contested — its own debate ↘"), never the
  transitive closure.
- **State-of-debate is the compass at every level** — topic, sub-debate, and
  micro-debate each open with the three-bucket state, so a reader can tell
  whether a branch is settled or hot *before* descending.
- **Positions are mapped, not listed.** With many positions, lay them along the
  axes of disagreement (the values matrix) so they cluster into families; show
  the distinct ones, fold the long tail.
- **Surface the cruxes.** Rank sub-points by `dependency_strength`
  ([03-data-model.md](03-data-model.md)) and foreground the few load-bearing
  contested ones that would actually change a position; fold the minor tail. A
  crux shared by two positions is shown as the real fault line.
- **Shared nodes, no duplication** — a recurring sub-debate is one node cited in
  many places (verify once, cite everywhere), which contains the explosion.
- **AI compresses each subtree** into a reviewed state summary, so a 60-claim
  branch is graspable in a paragraph without descending.
- **Three zooms of one graph:** atlas (zoom out — the topic tree, colored by
  state), breadcrumb (where am I), local page (read). Readers stay high
  (positions + steelmen + state); contributors descend into the micro-debates.

### Conditional answers — the "depends on who" axis

Recursion handles *depth* and scope handles the *boundary*; a third axis is
**conditionality** — within one question, the right answer depends on *who is
asking* or the situation. Health advice good for a healthy adult can be wrong
for a child, a diabetic, or an elderly person; a policy answer can hinge on
local cost of living, grid mix, or city size. Same question, different answers
per segment.

Handle it by **conditioning the claims, not forking the debate** (forking per
age × condition × goal explodes combinatorially):

- The `DebateView` declares its **condition dimensions** (e.g. age band, key
  conditions, goal; or locale / scale for policy).
- Each claim/position carries an **applicability map** — for which segments it
  holds, with a per-segment state ("established for healthy adults,
  contraindicated for diabetics, unknown for children").
- The reader sets a **context lens** ("I'm 70, hypertensive") and the page
  re-renders *for them*: relevant claims foregrounded, irrelevant demoted,
  **contraindications flagged hard** — but nothing hidden (other profiles stay
  visible). With no lens, the page surfaces "this depends on: age / condition /
  goal" up front, so a segment-specific answer is never mistaken for universal.
- Fork to a separate, linked debate (`SPECIALIZES_OF`) only when a segment is
  genuinely a large different question (e.g. "pediatric depression treatment").

Conditionality is the empirical-domain form of the values/priorities residue —
"what is right *for your situation*", made first-class and safety-aware; in
safety-critical domains the contraindication flags are non-negotiable. It
composes with recursion and scope; the data model is in
[03-data-model.md](03-data-model.md).

## 5. AI does the mass work, humans do the judgment

| AI (auditable, challengeable) | Humans (bridging) |
| --- | --- |
| semantic dedup matching | confirm/deny merges |
| claim extraction, typing | validate extraction |
| source retrieval, excerpting | quality notes |
| first-pass evidence labels | label confirmation across camps |
| state-of-debate summaries | steelman fairness |
| translation FR/EN | values/trade-off curation |

Every AI action lands in the audit trail and can be challenged like any
other contribution (Decision 6, [02-product.md](02-product.md)). Agent
guardrails for sourcing work are specified in [08-sources.md](08-sources.md)
(section 12).

### AI contribution at scale — a membrane, three anchors

As models improve, AI proposals can grow the corpus 100×. The risk is not "AI
is bad" — it is that AI is fluent *and* scalable, so its errors and its
homogenization scale too: echo-chamber / model-collapse (AI vets AI vets AI),
humans rubber-stamping an exploding queue, plausible-but-wrong at volume, and a
bland "reasonable centre" flattening real plurality.

The defense is a **membrane** between an unlimited AI-proposal layer and a
human-anchored trusted layer, plus three anchors:

- **Proposals are provisional.** AI contributions enter as visible candidates
  ("AI-proposed, unverified") and never silently join the established corpus
  (the `auto-extracted` curation state, [08-sources.md](08-sources.md) §11).
- **Anchor 1 — graduation needs real cross-camp humans.** Reaching `established`
  requires bridging among people who usually disagree (§2). AI may propose
  infinitely; only human cross-camp agreement makes a thing true.
- **Anchor 2 — every claim traces to a NON-AI primary.** An AI claim must be
  backed by a human-world primary source, verified for citation fidelity; AI
  output is never itself a primary. This breaks the AI-citing-AI loop and keeps
  the corpus tethered to reality. **No argument — human or AI — enters without a
  source.**
- **Anchor 3 — plurality is validated by actual supporters.** An AI-drafted
  steelman is "fair" only when real supporters of that position recognize
  themselves in it, so AI cannot flatten genuine positions into a centre.

Scale guards: **dedup is the volume valve** (§1 — 10k AI claims collapse into
~80 genuinely new candidates); AI accrues a **track record** (proposals survived
vs refuted) and is down-weighted / rate-limited when poor; use **diverse,
adversarial models** (one proposes, another refutes) to avoid a single model's
monoculture; AI **flags, never sets state** ([03-data-model.md](03-data-model.md)),
so an AI error's blast radius is contained.

The line to hold as models improve: AI scales *proposing* and *first-pass
triage* without limit; the cross-camp human anchor on *established* truth is
permanent — that anchor is what distinguishes Parallax from simply asking an
LLM. AI is the tireless librarian; humans across camps are the jury.

## 6. Reputation rewards understanding, not winning

- **Steelman badges** — pass the test per position (implemented).
- **Bridge score** — are your formulations endorsed by the *other* camp?
- **Acceptance rate** — contributions that survive review.
- No karma for volume, dunks, or pile-ons. Anti-brigading: rate limits,
  account maturity, camp-diversity requirements in rater pools.

## 7. Titles, scope, and evolution

A debate's title does three jobs that must not be conflated: a readable **name**,
the **scope** that defines what the debate *is* (the "small wording change that
changes everything"), and a **framing** that can bias. So a debate's identity is
**not its title string** — it is a stable id + a canonical question + an explicit
`scope` ([03-data-model.md](03-data-model.md)); the title is a versioned, readable
*rendering* of that, and the scope lives in visible chips (geography / period /
population / threshold), not buried in the prose. You can then reword a title
freely without touching what the debate covers.

Three kinds of edit, governed differently:

- **Clarify** (same scope, same neutrality) — wording, grammar → light review.
- **Neutralize** (same scope, loaded → neutral framing) → **bridged**: opposing
  camps must agree the new wording is fairer, since a title is a high-leverage
  bias lever.
- **Rescope** (the boundary changes) — *not* an edit: it spawns a **linked**
  debate (narrower → sub-debate `SPECIALIZES_OF`; broader → parent/atlas;
  different → analogous, cross-linked), so a scope change never silently
  invalidates existing positions and claims.

De-duplication at creation is therefore **scope-aware disambiguation, not
auto-merge**: the system surfaces the closest existing debate *with its scope*
and asks "same / narrower / broader / different?" (AI proposes, humans confirm; a
"same" merge is bridged). Retitle and rescope run through the per-debate steward
RFC (§3); the id is stable, so URLs and citations never break (the old slug
redirects), and merged-in titles plus common phrasings become **aliases** that
improve future matching. Nothing is deleted.

## Spam and abuse model (summary)

| Threat | Defense |
| --- | --- |
| Repetition / flooding | dedup gate (merge, never multiply) |
| Brigading a label | bridging consensus across camps |
| Bad-faith sources | source quality notes + retrieval status + challenge flow |
| Moderator capture | steward gate (steelman both sides) + public, revocable rights |
| Sybil raters | rater-pool diversity requirements, account maturity, rate limits |
| AI flooding | AI contributions enter the same dedup + review pipeline |

## Backend milestones this implies

1. Claim store with lifecycle states + global claim library.
2. Embedding-based dedup service (AI propose, human confirm).
3. Bridging-consensus rater pools (camp inference from quiz/profile,
   privacy-preserving).
4. Steward roles + RFC flow.
5. Corpus export pipeline (open license) + enterprise feeds/benchmarks
   ([06-vision.md](06-vision.md#funding-model--the-commons-and-its-services)).
