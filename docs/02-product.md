# Product: MVP Scope and Decisions

This document merges the MVP specification and the product decision log. It is
the single reference for *what* we are building first and *why*.

Decision status labels: `accepted` (use unless deliberately changed),
`tentative` (reasonable default, still discussable), `open` (do not implement
around this yet).

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
| **Reviewer** | "Show me what the AI did, the evidence trail, and what changed — and let me correct it." |
| **Contributor** | "Let me improve the debate without starting a fight." (deliberately limited at first: draft → review → canonical) |

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

### D5 — Verification = claim–source alignment, never truth `accepted`

Accepted labels: `source_found`, `source_missing`, `source_relevant`,
`supports_claim`, `partially_supports_claim`, `contradicts_claim`,
`does_not_support_claim`, `unclear`.

Rejected for MVP: `verified_true`. Truth requires synthesis across sources and
domain expertise; claim–source alignment is narrow, auditable, and useful.

### D6 — AI proposes structure; humans review it `accepted`

AI **can**: extract claims, classify claim types, summarize and steelman
positions, label source alignment, identify values and trade-offs, flag
weaknesses.

AI must **never silently**: delete a serious position, declare a debate
solved, decide a value is invalid, hide uncertainty, or publish contentious
updates without review.

### D7 — Fairness model: the steelman check `tentative`

A position is treated fairly when a reasonable supporter would recognize it as
a strong version of their view. Each position carries a steelman-check field;
reviewers mark it fair, unfair, incomplete, or contested. A contested steelman
stays visible but flagged.

### D8 — Moderation: admin-reviewed contributions `accepted`

Public debate products fail fast when moderation is deferred. Allowed
contribution types: new claim, new source, challenge to an evidence label,
challenge to a steelman, proposed new position, value/trade-off correction.

### D9 — Audit log from day one `accepted`

Every meaningful transformation is inspectable. Events record actor type
(user, admin, AI, system), timestamp, input/output references, and a short
rationale. Minimum event types are listed in
[03-data-model.md](03-data-model.md#audit-event).

### D10 — Agent consensus: do not build yet `open`

The free-compute / random-agent consensus idea needs an abuse model first:
agent identity, Sybil resistance, honest-verification incentives, correlated
errors ("all agents agree for the wrong reason"), and primary-source access.
Possible later shape: agents submit analyses, disagreement creates review
tasks, reputation is earned through audited accuracy.

### D11 — Technical direction `tentative`

Reasonable defaults: TypeScript web app, Postgres-style relational model,
server-side AI pipeline, JSON outputs validated against schemas, persistent
audit log. Do **not** start with: graph databases, blockchain provenance,
decentralized moderation, multi-agent marketplaces, or a mobile app.

*Milestone 1 implementation note:* the static prototype uses Vite + React +
TypeScript rendering a JSON fixture — no server, no database. The server-side
pipeline arrives with Milestone 4.

*Scope of this default:* "do not start with graph databases" is an
MVP-prototype constraint, not the target architecture. The long-term data model
adopts a property graph with RDF export — see the Global Claim Graph in
[03-data-model.md](03-data-model.md#the-global-claim-graph-cross-debate-model).

### D12 — First demo: one curated seeded debate `accepted`

Demo success: the page is readable; every claim traces to a source label;
values and trade-offs are explicit; a reviewer can challenge one AI label and
publish a revised version.

### D13 — Positions are not capped `accepted`

A debate has no fixed limit on positions. Forcing a binary is the anti-mission:
Parallax exists to dissolve false "two camps" framing. The number of positions
is **emergent**, kept readable by three existing mechanisms: dedup/merge
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

### D15 — Aggregate position signal: where people stand, never a winner `accepted`

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

## MVP Scope

**In scope:** create a topic; add an initial position, arguments, and sources;
run AI analysis; display positions, arguments, claims, sources, values,
trade-offs; link every claim to evidence labels; draft contributions; audit
trail; reviewer accept/reject workflow.

**Out of scope:** public social feed; likes/karma/followers/winner mechanics
(the aggregate position signal in D15 is *not* this — it shows a distribution,
never a winner, vote-then-reveal); real-time comment threads; truth claims
without source-bound evidence;
anonymous large-scale moderation; agent-consensus marketplace; non-profit
governance tooling; mobile app.

## First End-to-End Flow

Topic: *"Should cities implement congestion pricing for cars?"*

1. User creates the topic. Creation first runs a debate-dedup check (anchor
   claim + question similarity + scope) and offers the existing debate, a
   sub-debate, or a parent node before creating a duplicate (D14).
2. User submits one position, a few arguments, and sources.
3. AI extracts claims from the submission.
4. AI checks whether each source is retrievable and relevant.
5. AI labels each evidence link (supports / partially supports / contradicts /
   does not support / unclear).
6. AI proposes other plausible positions.
7. AI writes a steelman for each position.
8. AI identifies values and trade-offs.
9. The debate page shows the structured map.
10. A user submits a challenge or new source.
11. The challenge is shown as pending until reviewed.

## AI Pipeline Contract

The AI produces structured artifacts, not only prose. Six stages:

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
5. How are bad-faith sources handled? → **resolved**; integrity/relevance
   split, bridging gate, and governance in [08-sources.md](08-sources.md).
6. How are emotionally loaded topics moderated? → **open**; out of MVP via D3.
7. What is the minimum trustworthy audit log? → D9 + data model.
8. General public debates, policy questions, or internal research workflows
   first? → public policy questions (D3).
