# Product: MVP Scope and Decisions

This document owns the product decisions and the bounded MVP: *what* Parallax
is intended to do and *why*. It does not by itself prove that a decision is
implemented. [README.md](../README.md#current-status) owns the short runtime
orientation, [04-roadmap.md](04-roadmap.md) owns implementation status, and
[03-data-model.md](03-data-model.md) links the current mechanical contracts.

Decision status labels: `accepted` (use unless deliberately changed),
`tentative` (reasonable default, still discussable), `open` (do not implement
around this yet).

Implementation labels used in this document:

- **Current** — works in the published static site.
- **Mock** — demonstrates a flow using local or deterministic data.
- **Experimental** — optional Supabase code/contracts exist, without a
  repository-wide end-to-end proof.
- **Target** — accepted or tentative product behavior that remains to be
  implemented and validated.

The target output is a structured, source-grounded **provisional dossier**. It
must state scope, provenance, review state, uncertainty, and version; it is not
an oracle of truth.

## Product Thesis

Traditional debate products optimize for replies, votes, and attention.
Parallax optimizes for **orientation**:

- What are the real positions?
- What claims does each position depend on?
- Which sources support or weaken those claims?
- Which values are being prioritized?
- What trade-offs does each position accept?

The MVP must prove one thing: *a user understands a debate better because
arguments, sources, positions, values, and trade-offs are structured instead
of scattered.*

## Primary Users

| User | Core need |
| --- | --- |
| **Reader** | "Show me the strongest serious positions and why people hold them — faster and more fairly than articles or comment threads." |
| **Editor** | "Show me what the AI proposed, the evidence trail, and what changed — and let me decide." |
| **Reviewer (partisan)** | "Let me check that my side is stated fairly before it is published under my signature." (D18) |
| **Challenger** | "Let me flag one precise error and see the answer in public." No account (D19). |

## Decisions

### D1 — First product shape: structured debate workspace `accepted`

Not a public social network. The hard problem is not user acquisition; it is
whether a debate can be decomposed into positions, claims, evidence, values,
and trade-offs in a way users trust. First milestone: **one excellent debate
page**. No feed, followers, likes, or viral mechanics.

### D2 — First audience: readers and reviewers `tentative`

Contributors come second. They can submit a draft, see how it would change the
debate, and wait for review before it becomes canonical.

### D3 — First debate type: public policy with public sources `accepted`

Good first examples: congestion pricing, smartphone bans in schools, nuclear
power expansion. Bad first examples: personal disputes, live breaking news,
private allegations, medical/legal advice — anything whose primary evidence is
not publicly inspectable.

### D4 — Canonical debates with version history; forks later `tentative`

Every accepted change creates a new debate revision. Past revisions are
inspectable. Reverting or challenging a revision is a reviewer action. Forks
are useful for pluralism but create discovery and trust problems the prototype
doesn't need.

**Implementation boundary:** the default browser flow is a mock overlay stored
in `localStorage`. A persistent revision/merge path exists in the experimental
Supabase layer, but the complete lifecycle is not part of the default test.

### D5 — Verification = claim–source alignment, never truth `accepted`

Keep two namespaces separate:

- retrieval state records whether an artifact was accessible (`found`,
  `missing`, `blocked`, `failed`, or `partial`);
- evidence labels describe one source use against one claim:
  `supports_claim`, `partially_supports_claim`, `contradicts_claim`,
  `does_not_support_claim`, or `unclear`.

Rejected for MVP: `verified_true`. Truth requires synthesis across sources and
domain expertise; claim–source alignment is narrow, auditable, and useful.

### D6 — AI proposes structure; humans review it `accepted`

AI **can**: extract claims, classify claim types, summarize and steelman
positions, label source alignment, identify values and trade-offs, flag
weaknesses.

AI must **never silently**: delete a serious position, declare a debate
solved, decide a value is invalid, hide uncertainty, or publish contentious
updates without review.

**Implementation boundary:** the current executable analysis produces
deterministic mock artifacts. The live-provider request currently fails closed;
there is no provider connectivity or implementation of the target analysis
stages.

### D7 — Fairness model: the steelman check `revised by D18`

A position is treated fairly when a reasonable supporter would recognize it as
a strong version of their view. Each position carries a steelman-check field;
reviewers mark it fair, unfair, incomplete, or contested. A contested steelman
stays visible but flagged.

This is a **target** review contract. Current fixture types store a steelman and
general `review_status`; they do not implement a dedicated steelman-check field.

### D8 — Moderation: admin-reviewed contributions `accepted`

Public debate products fail fast when moderation is deferred. Allowed
contribution types: new claim, new source, challenge to an evidence label,
challenge to a steelman, proposed new position, value/trade-off correction.

### D9 — Audit log from day one `accepted`, revised by D17

Since 2026-10-03 the audit log of published content is the Git history of the
debate files. Fixture audit events are no longer displayed: their timestamps
and actors were illustrative.

Every meaningful transformation is inspectable. Events record actor type
(user, admin, AI, system), timestamp, input/output references, and a short
rationale. Minimum event types are listed in
[03-data-model.md](03-data-model.md#audit-event).

The fixtures and local mock flow expose audit events. Complete, durable audit
coverage across every experimental backend action remains a completion gate.

### D10 — Agent consensus: do not build yet `open`

The free-compute / random-agent consensus idea needs an abuse model first:
agent identity, Sybil resistance, honest-verification incentives, correlated
errors ("all agents agree for the wrong reason"), and primary-source access.
Possible later shape: agents submit analyses, disagreement creates review
tasks, reputation is earned through audited accuracy.

### D11 — Technical direction `revised by D17 and D20`

Reasonable defaults: TypeScript web app, Postgres-style relational model,
server-side AI pipeline, JSON outputs validated against schemas, persistent
audit log. Do **not** start with: graph databases, blockchain provenance,
decentralized moderation, multi-agent marketplaces, or a mobile app.

*Current implementation note:* the default prototype uses Vite + React +
TypeScript with JSON fixtures and a `localStorage` contribution/review mock.
The repository also contains an experimental Postgres/Supabase schema and Edge
Function. That function currently creates deterministic mock analysis output;
the unavailable live-provider request is rejected, and the function is not the
six-stage live pipeline below.

*Scope of this default:* "do not start with graph databases" is an
MVP-prototype constraint, not the target architecture. The long-term data model
adopts a property graph with RDF export — see the Global Claim Graph in
[03-data-model.md](03-data-model.md#the-global-claim-graph-cross-debate-model).

### D12 — Curated seeded demonstrations `accepted`

The current fixture-backed app contains three demonstrations: congestion
pricing, smartphones in schools, and nuclear power. Their evidence labels are
demonstration data and are not equivalent to reviewed factual conclusions.

Target demo success: the page is readable; every truth-apt claim traces to a
versioned source artifact and exact excerpt; values and trade-offs are
explicit; and a reviewer can challenge one provisional label and publish an
auditable revision.

### D13 — Positions are not capped `accepted`

A debate has no fixed limit on positions. Forcing a binary is the anti-mission:
Parallax exists to dissolve false "two camps" framing. In the **target**
system, the number of positions is emergent and kept readable by three
mechanisms: dedup/merge
collapses raw opinions into genuinely distinct positions; fractalization splits
sprawling topics into sub-debates, each with fewer positions; UI
folding/clustering shows the main positions along the axes of disagreement,
with the long tail folded. See [07-engine.md](07-engine.md) section 1. A
position is a `ClaimUse` with `role=main_position` in the graph
([03-data-model.md](03-data-model.md)).

### D14 — Debate de-duplication at creation `accepted`

Creating a debate runs the same dedup gate as creating a claim, at the debate
altitude. The anchor claim is resolved via embedding dedup, and the proposed
question is matched against existing `DebateView.question_text` as-you-type.
Scope (geography / period / population) is compared, not just text. Four
outcomes: exact duplicate → redirect to the existing debate; narrower → create
as a sub-debate (fractalization); broader → create as a parent/atlas node
linking existing debates; genuinely new → create with provenance. AI proposes,
humans confirm; nothing is deleted (duplicates are linked, never erased). See
[07-engine.md](07-engine.md) section 1 and the Global Claim Graph in
[03-data-model.md](03-data-model.md#the-global-claim-graph-cross-debate-model).

This is **target** behavior. The current proposal form can create a seed packet
in the experimental backend, but it does not implement the complete semantic
deduplication and graph-resolution contract.

### D15 — Aggregate position signal: where people stand, never a winner `superseded by D21`

*Superseded 2026-10-03.* A ballot per account ties a political opinion to a
person (GDPR art. 9), the sample is self-selected, and the demonstration
aggregate showed invented numbers. The text below is kept for the record.

Readers may register their own position on a debate; Parallax shows **only the
aggregate distribution**, never an individual's choice. This is explicitly **not**
the "winner mechanics" ruled out of scope below — four rules enforce the
distinction:

1. **Vote, then reveal.** The aggregate is hidden until the reader commits, to
   defeat the bandwagon effect and the spiral of silence.
2. **Distribution, not ranking.** The UI shows a *landscape* of where people
   stand. No most-voted highlight, no 1st/2nd, no "winning" position — the
   institutional red line ("never rank positions or people") holds.
3. **Priority, not fact.** The vote attaches to a position/priority (filter 3),
   never to a claim's truth (filter 1). You do not vote on whether the evidence
   supports a claim.
4. **Before → after.** The headline signal is the *shift*: among readers who
   read the full debate, how many moved or softened — the North Star (perception
   delta) at population scale.

Privacy: individual votes are never shown, never sold, and never stored
server-side beyond what aggregation requires (ideally the raw individual signal
stays client-side, like the perception-delta profile; only anonymous aggregates
persist). Abuse: a public aggregate is a brigading target — gate behind an
account, rate-limit, allow one revisable signal per reader per debate, and
display ranges / confidence rather than precise live counts. Data model in
[03-data-model.md](03-data-model.md#position-signal-aggregate-vote-then-reveal).

The browser exposes a demonstration aggregate and the experimental Supabase
layer contains a gated aggregate path. The privacy and abuse properties above
remain target requirements until validated across storage, RLS, API output,
and rendered behavior.

### D16 — First year: an edited publication with open challenges `accepted`

*2026-10-03.* Parallax ships an edited publication of 20 to 30 debates in
French, not an open platform. Anyone may challenge a precise object; nothing
is published without the editor and one declared supporter of the affected
position. The triggers that reopen open contribution are listed in
[04-roadmap.md](04-roadmap.md) (Deferred).

### D17 — Content lives in Git `accepted`

*2026-10-03.* A debate is a set of files in this repository. French is the
source; English is a translation of reviewed pages. Every change is a reviewed
commit, so history, diff, author, rollback, and licence come for free, and the
Git history is the public audit log (revises D9). The Supabase backend and the
verification-engine research are frozen under the tag
`archive/workspace-20260913`.

### D18 — Steelmen are signed by declared supporters `accepted`

*2026-10-03, revises D7.* Before a debate leaves draft, at least one declared
supporter per position signs three attestations: the steelman of their
position is faithful, incomplete, or unfaithful; the excerpts of the claims
that hurt their side are exact; the common ground is acceptable. Signatures
are public: name or function (the reviewer's choice), declared position,
conflicts of interest, date, reviewed commit. A position without a signature
shows "relecture incomplète". A reader-written steelman is an exercise, never
a moderation gate or a badge. Process: [relecture/README.md](relecture/README.md).

### D19 — Challenges without accounts `accepted` (target, phase 2)

*2026-10-03.* A challenge targets one object, has a type, a URL, and the exact
quote. A verified email and an anti-bot check are enough. It gets a public
identifier in the debate's public register and a reasoned answer within 14
days; an accepted challenge is credited in the revision. Readers have no
account in year one.

### D20 — Minimal backend, offline AI `accepted`

*2026-10-03, revises D11.* The site is static and fully prerendered; it stays
readable if any backend fails. When challenges open: a new Supabase project in
the Paris region, six tables (challenges, anonymous measures, subscribers,
reviewers, signatures, moderation log), and one server function (the anti-bot
check). No reader triggers a model. AI runs in an offline command-line
pipeline launched by the editor, which opens a pull request; every quote it
proposes must be an exact substring of the archived source copy, and a human
decides every label.

### D21 — No opinion tied to an account; anonymous measurement `accepted`

*2026-10-03, supersedes D15.* No ballot, camp, or position is stored per
account. The position signal and the values quiz are cut. The North Star
leaves the browser only as anonymous records under the
[pre-registered protocol](protocol/2026-10-03-measurement-preregistration.md),
after a legal review. A reviewer's position is a voluntary public declaration.

### D22 — Voices are real `accepted`

*2026-10-03.* A voice is a consented testimony of a real person or a published,
sourced quote. Never a composite portrait. No named third party in year one.

### D23 — Editorial responsibility `accepted`

*2026-10-03.* The founder is the responsible editor and the *directeur de la
publication* named in the legal notice. Editorial decisions are signed. Every
page states that AI tools helped prepare it and who reviewed it.

### D24 — Vocabulary `accepted`

*2026-10-03.* "Library of truths" / « bibliothèque de vérités » and "clear
answers" / « réponses claires » are dropped: they promise a verdict. Headline:
« Le dossier de chaque grand débat, relu par ceux qui ne sont pas d'accord. »
See [06-vision.md](06-vision.md).

### D25 — French first `accepted`

*2026-10-03.* French at `/`, English under `/en/`. Topics are French public
policy questions with public sources, no named person, usable in class.

## MVP Scope

### Current prototype

**Current:** a read-only static site in French and English. Three debates are
unreviewed drafts, marked as such, with a coverage line computed from their
files. Readers inspect positions, steelmen, claims, evidence labels, sources
with exact excerpts where they exist, values, and trade-offs, and can read the
Git history of each debate. Errors are reported through a GitHub issue
template. Legal notice and privacy pages exist.

**Archived:** accounts, contributions and review, revision publication,
position signals, claim evaluations, and source assessments on Supabase
(tag `archive/workspace-20260913`).

### Target MVP

**In scope:** create a topic; add an initial position, arguments, and versioned
sources; run reviewable analysis; display positions, arguments, claims, sources,
values, and trade-offs; link every truth-apt claim to evidence labels; draft contributions; audit
trail; reviewer accept/reject workflow.

**Out of scope:** public social feed; likes/karma/followers/winner mechanics
(the aggregate position signal in D15 is *not* this — it shows a distribution,
never a winner, vote-then-reveal); real-time comment threads; truth claims
without source-bound evidence;
anonymous large-scale moderation; agent-consensus marketplace; non-profit
governance tooling; mobile app.

## First End-to-End Flow

**Status: Target.** This is the acceptance flow, not a description of the
current default app.

Topic: *"Should cities implement congestion pricing for cars?"*

1. User creates the topic. Creation first runs a debate-dedup check (anchor
   claim + question similarity + scope) and offers the existing debate, a
   sub-debate, or a parent node before creating a duplicate (D14).
2. User submits one position, a few arguments, and sources.
3. AI extracts claims from the submission.
4. The system records the exact source version, retrieval result, content
   identity, and excerpt locator before proposing an assessment.
5. AI proposes a label for each evidence link (supports / partially supports / contradicts /
   does not support / unclear).
6. AI proposes other plausible positions.
7. AI writes a steelman for each position.
8. AI identifies values and trade-offs.
9. The debate page shows the structured map.
10. A user submits a challenge or new source.
11. The challenge is shown as pending until reviewed.

## AI Pipeline Contract

**Status: Target.** The target AI path produces structured, provisional artifacts, not only prose.
Every artifact remains unreviewed until a human decision. The current Edge
Function does not implement these six stages.

| Stage | Input | Output |
| --- | --- | --- |
| 1. Source processing | URLs, text, documents | title, author/publisher, date, excerpts, retrieval status |
| 2. Claim extraction | user text + source excerpts | atomic claims, claim type (factual / causal / predictive / normative / definitional), original span |
| 3. Evidence classification | one claim + one excerpt | evidence label, rationale, quoted span, confidence |
| 4. Position structuring | claims, arguments, contributions | position title, steelman, supporting/opposing claims, unresolved questions |
| 5. Value & trade-off mapping | positions and arguments | values prioritized / put at risk, explicit trade-offs |
| 6. Critic pass | generated structure | missing positions, weak evidence links, possible misrepresentations, safety concerns |

## Hard Product Questions

Answered by the decisions above where noted; the rest stay open:

1. Who can create or edit a topic in the first public version? → admin-curated
   first (D8, D12).
2. Canonical or forkable debates? → canonical with revisions (D4).
3. Does the platform rank positions? → no; it organizes only (D1, D6). The
   aggregate position signal (D15) shows *where people stand* as a distribution,
   never a ranking or a winner.
4. Who decides whether a steelman is fair? → reviewers, via the steelman check
   (D7).
5. How are bad-faith sources handled? → **policy target defined, implementation
   open**; integrity/relevance split, bridging gate, and governance are
   specified in [08-sources.md](08-sources.md), not implemented end to end.
6. How are emotionally loaded topics moderated? → **open**; out of MVP via D3.
7. What is the minimum trustworthy audit log? → D9 + data model.
8. General public debates, policy questions, or internal research workflows
   first? → public policy questions (D3).
