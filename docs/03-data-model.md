# Data Model

This document owns the conceptual vocabulary and target contracts shared by
the UI, storage, review workflow, and analysis pipeline. It is not a final
database schema and must not override the executable contracts below.

## Current contracts and boundaries

| Layer | Status | Mechanical owner |
| --- | --- | --- |
| Fixture-backed browser model | **Current** | [`app/src/types.ts`](../app/src/types.ts) and [`app/src/data/`](../app/src/data/); the contract supports optional excerpts and content hashes, but coverage is incomplete. |
| Fixture integrity checks | **Current, structural** | [`app/scripts/check-fixtures.mjs`](../app/scripts/check-fixtures.mjs) validates IDs, references, and English/French structural parity; it does not validate label semantics, confidence, citation fidelity, or factual truth. |
| Supabase schema, RLS, and stored source excerpts | **Archived, frozen** | [`supabase/migrations/`](../supabase/migrations/) on `main` and the tag `archive/workspace-20260913`; the site does not use them. The phase-2 backend starts from a new six-table schema (D20 in [02-product.md](02-product.md)). |
| Disposable backend validation | **Archived** | The bootstrap script and SQL test matrices live under the tag `archive/workspace-20260913`. |
| Global claim graph, propagation, and full evaluation lifecycle | **Target** | The conceptual sections below; no end-to-end implementation claim. |

Important current differences from the target object tables below:

- `Position` uses one `argument_ids` array rather than separate supporting and
  opposing arrays;
- `Claim.claim_type` is an array and has no `source_input_id` in the browser
  fixture type;
- source excerpts, `source_excerpt_id`, and `content_hash` are optional in the
  browser contract. The current fixtures do not provide complete exact-excerpt
  or immutable-artifact coverage for every truth-apt claim;
- a fixture label is scoped demonstration data. `review_status: unreviewed`
  must not become a reviewed claim state merely because the label says
  `supports_claim`.

The target is an exact, structured, versioned **provisional dossier**, not an
oracle of truth. A public procedural status must point to review evidence and
remain scoped, dated, and revisable.

## Target rules

- Every object has a stable `id`.
- Every generated or reviewed object links back to its source input.
- Claims should be atomic enough to verify against evidence.
- AI-generated fields must be distinguishable from human-reviewed fields
  (`generated_by`, `review_status`).
- Published debate state is versioned; prefer superseding revisions over
  destructive edits.

## Target MVP objects

These tables define the intended normalized contract. They are not a claim
that the current fixtures or every experimental database path already expose
all fields.

### Topic

The debate question.

| Field | Notes |
| --- | --- |
| `id`, `title`, `question`, `summary` | |
| `status` | `draft` · `published` · `archived` |
| `current_revision_id` | |
| `created_at`, `created_by` | |

### Debate Revision

One published version of a topic.

| Field | Notes |
| --- | --- |
| `id`, `topic_id`, `revision_number` | |
| `status` | `draft` · `published` · `superseded` |
| `position_ids`, `claim_ids`, `source_ids`, `value_ids`, `tradeoff_ids` | |
| `published_at`, `published_by` | |

### Position

A coherent answer to the debate question.

| Field | Notes |
| --- | --- |
| `id`, `topic_id`, `title`, `short_summary`, `steelman` | |
| `status` | `draft` · `published` · `contested` · `archived` |
| `supporting_argument_ids`, `opposing_argument_ids` | |
| `value_ids`, `tradeoff_ids` | |
| `generated_by` | `human` · `ai` · `mixed` |
| `review_status` | `unreviewed` · `approved` · `contested` · `rejected` |

### Argument

Reasoning for or against a position.

| Field | Notes |
| --- | --- |
| `id`, `position_id`, `summary`, `claim_ids` | |
| `direction` | `supports` · `opposes` · `qualifies` |
| `generated_by`, `review_status` | |

### Claim

One assertion.

| Field | Notes |
| --- | --- |
| `id`, `text`, `topic_id`, `source_input_id`, `evidence_link_ids` | |
| `claim_type` | `factual` · `causal` · `predictive` · `normative` · `definitional` |
| `generated_by`, `review_status` | |

Rules: a claim should be testable against sources when possible. Normative
claims can be analyzed for values but must not be forced into factual
verification labels.

### Source

A cited or uploaded reference.

| Field | Notes |
| --- | --- |
| `id`, `url`, `title`, `publisher`, `author` | |
| `published_at`, `retrieved_at`, `artifact_version` | exact edition, revision, release, or capture identity |
| `content_hash` | qualified digest of the exact retrieved artifact, for example `sha256:<hex>` |
| `retrieval_status` | `found` · `missing` · `blocked` · `failed` · `partial` |
| `source_type` | `article` · `paper` · `report` · `law` · `dataset` · `video` · `other` |
| `quality_notes` | e.g. "official operator source, not neutral for evaluation" |

### Source Excerpt

The exact evidence span used for a claim.

| Field | Notes |
| --- | --- |
| `id`, `source_id`, `text` | |
| `locator` | page, paragraph, timestamp, or URL fragment |
| `extracted_by` | `human` · `ai` · `system` |

### Evidence Link

The relationship between a claim and a source excerpt. **The label describes
the source–claim relationship, never global truth.**

| Field | Notes |
| --- | --- |
| `id`, `claim_id`, `source_id`, `source_excerpt_id` | |
| `label` | `supports_claim` · `partially_supports_claim` · `contradicts_claim` · `does_not_support_claim` · `unclear` |
| `rationale` | short, human-readable |
| `confidence` | 0–1 |
| `review_status`, `reviewer_notes` | |

### Value

A priority surfaced in the debate (fairness, individual freedom, public
health, economic efficiency, environmental protection, institutional trust…).

| Field | Notes |
| --- | --- |
| `id`, `topic_id`, `name`, `description`, `position_ids` | |

### Trade-Off

What a position gains, risks, or sacrifices.

| Field | Notes |
| --- | --- |
| `id`, `topic_id`, `position_id` | |
| `gain`, `cost`, `risk` | |
| `affected_value_ids`, `review_status` | |

### Contribution

A user-submitted proposed change.

| Field | Notes |
| --- | --- |
| `id`, `topic_id`, `body`, `source_ids`, `target_object_id` | |
| `type` | `new_claim` · `new_source` · `new_position` · `challenge_evidence_label` · `challenge_steelman` · `value_tradeoff_correction` |
| `status` | `draft` · `submitted` · `under_review` · `accepted` · `rejected` |
| `created_by`, `created_at` | |

### Review

A decision on a contribution or generated object.

| Field | Notes |
| --- | --- |
| `id`, `target_object_id`, `target_object_type` | |
| `decision` | `approve` · `reject` · `request_changes` · `mark_contested` |
| `rationale`, `reviewed_by`, `reviewed_at` | |

### Audit Event

A transparent system event.

| Field | Notes |
| --- | --- |
| `id`, `topic_id`, `revision_id` | |
| `actor_type` | `user` · `admin` · `ai` · `system` |
| `actor_id`, `event_type` | |
| `input_object_ids`, `output_object_ids` | |
| `summary`, `created_at` | |

Minimum event types: `topic_created`, `source_added`, `source_retrieved`,
`ai_analysis_started`, `ai_analysis_completed`, `claim_extracted`,
`evidence_labeled`, `position_generated`, `contribution_submitted`,
`review_completed`, `revision_published`.

## The Global Claim Graph (cross-debate model)

**Status: Target.** This graph is not the current storage model.

The target objects above describe a normalized **v1, per-topic surface**. The
current browser fixtures implement a smaller shape documented in
[Current contracts and boundaries](#current-contracts-and-boundaries). The
graph in this section is a later architecture: it is not the current storage
model.

The graph is intended to let an argument inside one debate become *the subject
of another debate* and *a premise of dozens more*. A scoped claim can be
evaluated under recorded evidence and reused without losing that scope, while
disagreement remains a first-class, contestable object. This is the storage
model the [objectivity engine](07-engine.md#4-big-topics-fractalize) and the
[source layer](08-sources.md) ultimately require.

**Core principle** (where this differs from a naïve "everything is a node"):

> **Everything important is claimable and contestable — but not everything is
> a `Claim`.** The spine is `Claim` (global) + `ClaimUse` (local) +
> `DebateView` + `ArgumentStep` + `RelationAssertion`, with `EvidenceUse`,
> `Evaluation`, `StateEvent`, and `Alert`.

A `Claim` has **one global state, but only under its canonical scope.** The
moment a debate uses a broader, narrower, metaphorical, or
locally-thresholded variant, that is represented in `ClaimUse` (or a
specialized claim is created). We do **not** collapse claim and debate into
one object: a `Claim` is the *folded* proposition; a `DebateView` is the
*unfolded* page around it.

### How the v1 objects map onto the graph

| v1 object | Graph model |
| --- | --- |
| Topic + Debate Revision | `DebateView` (a view/composition, not a silo) |
| Position | `ClaimUse` with `role = main_position` |
| Argument | `ArgumentStep` (n-ary: premises + warrant + exceptions → conclusion) |
| Claim (`topic_id`-scoped) | global `Claim` + a local `ClaimUse` pointing to it |
| Source | `Source` (a resource, **never** a `Claim`) |
| Source Excerpt + Evidence Link | `EvidenceUse` |
| `review_status` / `contested` flags | `Evaluation` + `Claim.lifecycle_state` |
| Audit Event | retained, complemented by `StateEvent` |

Source *reliability* is not a `Source` field — it is a `Claim` of
`type = source_reliability` about that source (see
[08-sources.md §2](08-sources.md)).

### Node types

**`Claim`** — a canonical, scoped, addressable proposition (not a sentence).

| Field | Notes |
| --- | --- |
| `id`, `canonical_text`, `normalized_key` | `normalized_key` = semantic hash / embedding key for dedup |
| `type` | `descriptive`·`causal`·`predictive`·`normative`·`definitional`·`value_claim`·`source_reliability`·`mixed` |
| `scope` | `{geography, time_period, population, metric, threshold, assumptions[], domain}` — **a global claim must have a minimal scope** |
| `lifecycle_state` | `proposed`·`contested`·`established`·`refuted`·`value_dependent`·`superseded` |
| `current_evaluation_id`, `state_version` | state always points to an auditable `Evaluation` |
| `steward_ids`, `aliases`, `created_*` | |

**`DebateView`** — the unfolded page around a claim or question.

| Field | Notes |
| --- | --- |
| `id`, `anchor_claim_id`, `question_text` | |
| `debate_type` | `truth`·`policy`·`value_tradeoff`·`definition`·`source_reliability` |
| `scope`, `promoted_from_use_id?` | set when a contested `ClaimUse` was promoted into its own debate |
| `view_policy` | `{max_default_depth: 1, show_transitive_closure: false}` |

**`ClaimUse`** — the local use of a global claim inside one debate. *The most
important node for the cross-debate problem.*

| Field | Notes |
| --- | --- |
| `id`, `claim_id`, `debate_id`, `local_text` | |
| `role` | `main_position`·`premise`·`warrant`·`backing`·`exception`·`rebuttal`·`contextual_note`·`value_premise`·`source_reliability_premise` |
| `semantic_fit` | `exact_equivalent`·`narrower_than_claim`·`broader_than_claim`·`analogous`·`contested_mapping` |
| `scope_override?`, `local_threshold?` | |
| `dependency_strength` | `necessary`·`sufficient`·`major_contributory`·`minor_contributory`·`illustrative`·`background` |
| `local_review_state` | `clean`·`stale`·`under_review`·`dismissed`·`resolved` |
| `imports_global_state` | only `true` when `semantic_fit ∈ {exact_equivalent, narrower_than_claim}` |

The same `Claim` can be a `necessary` premise in one debate and a
`minor_contributory` one in another — one global state, two local uses.

**`ArgumentStep`** — an n-ary inference (Toulmin/Carneades-shaped), a node not
an edge.

| Field | Notes |
| --- | --- |
| `id`, `scheme` | `deductive`·`causal_inference`·`statistical_generalization`·`expert_opinion`·`analogy`·`cost_benefit`·`moral_principle`·`legal_precedent`·`policy_tradeoff` |
| `proof_standard` | `plausible`·`preponderance`·`robust_consensus`·`expert_consensus`·`beyond_reasonable_doubt`·`local_custom` |
| `burden_holder`, `review_state`, `local_strength?` | |

**`RelationAssertion`** — a contestable relation between objects ("C refutes
D", "C is a necessary premise of D", "C and D are duplicates" are themselves
claims). Start as property-edges; **promote to a `RelationAssertion` the
moment a relation receives sources, votes, objections, or a status.**

| Field | Notes |
| --- | --- |
| `id`, `relation_type` | `supports`·`refutes`·`undercuts`·`rebuts`·`presupposes`·`duplicates`·`specializes`·`generalizes`·`contextualizes`·`cites`·`about_source` |
| `subject_id`, `object_id`, `scope?`, `rationale` | |
| `lifecycle_state`, `current_evaluation_id?` | |

**`EvidenceUse`** — a source's exact span supporting/refuting a target
(generalizes v1 Source Excerpt + Evidence Link).

| Field | Notes |
| --- | --- |
| `id`, `source_id`, `target_id` | target = `Claim`·`ClaimUse`·`ArgumentStep`·`RelationAssertion` |
| `polarity` | `supports`·`refutes`·`contextualizes` |
| `locator` | `{page, quote_range, table, timestamp}` |
| `extraction_text?`, `quality_notes?` | |

**`Evaluation` / `StateEvent` / `Alert`** — public state is never a silently
mutated field; it is the output of an auditable evaluation.

| `Evaluation` | `{id, target_type, target_id, resulting_state, standard, decision_rule, consensus_summary{bridging_score, supporting_clusters, opposing_clusters, dissent_summary}, rationale, evidence_snapshot_ids, created_*}` |
| --- | --- |
| `StateEvent` | `{id, target_id, target_type, old_state, new_state, evaluation_id, created_at}` |
| `Alert` | `{id, trigger_event_id, affected_target_id, affected_target_type, severity, reason, status, assigned_steward_id?, dedup_key, created_at}` |

`decision_rule` includes `cross_camp_consensus` — the
[bridging gate](08-sources.md#8-the-bridging-mechanism-how-a-sensitive-label-actually-ships)
is a *legitimacy condition on sensitive judgments*, not a weighted majority.

### Edges

```text
(DebateView)-[:ABOUT]->(Claim)
(DebateView)-[:DUPLICATES|SPECIALIZES_OF]->(DebateView)
(DebateView)-[:HAS_USE]->(ClaimUse)
(ClaimUse)-[:OF_CLAIM {semantic_fit, scope_fit}]->(Claim)
(ClaimUse)-[:PREMISE_OF {premise_type, dependency_strength, polarity}]->(ArgumentStep)
(ClaimUse)-[:WARRANT_FOR]->(ArgumentStep)
(ClaimUse)-[:EXCEPTION_TO]->(ArgumentStep)
(ArgumentStep)-[:CONCLUDES]->(ClaimUse)
(EvidenceUse)-[:CITES]->(Source)
(EvidenceUse)-[:EVIDENCES {polarity}]->(Claim | ClaimUse | ArgumentStep | RelationAssertion)
(Claim)-[:DUPLICATES|SPECIALIZES|GENERALIZES|CONTRADICTS]->(Claim)
(Evaluation)-[:EVALUATES]->(Claim | ClaimUse | ArgumentStep | RelationAssertion)
(StateEvent)-[:CHANGED]->(target) ; (StateEvent)-[:TRIGGERS]->(Alert)
(Alert)-[:AFFECTS]->(ClaimUse | ArgumentStep | DebateView)
```

### State propagation (the rule that keeps the library honest)

> **A premise's state change never auto-changes the state of dependent
> conclusions. It marks the local uses and arguments that depended on it as
> `stale` and raises review `Alert`s.** Never `C refuted → conclusion
> refuted`. Even if *every* known premise is refuted, the conclusion shows
> "current support stale / to rebuild", not "refuted".

- **Depth-1 by default.** Propagate to direct `ClaimUse`s → their
  `ArgumentStep`s → their `DebateView`s. Transitive closure is available *on
  demand* (impact analysis), never in normal notifications.
- **Computed severity**, not binary:
  `f(old→new state, role, dependency_strength, semantic_fit, scope_fit, local
  conclusion's public status, audience, staleness, existence of independent
  alternatives)`. `established→refuted` on a `necessary`, `exact_equivalent`
  premise under an established conclusion = `critical`; a `minor_contributory`
  shift on an old low-visibility use = `low`.
- **Dependency types drive propagation** (Carneades-style): `necessary` →
  argument must be revised; `minor_contributory`/`illustrative`/`background` →
  digested or no critical alert; an *exception* becoming established can
  *undercut* an argument, while a refuted exception can *strengthen* it.
- **Anti-avalanche guardrails (from day one):** dedup per debate (one grouped
  alert, not 14); dedup per cyclic component; materiality threshold (no alert
  for reformulations/added sources); temporal debounce (24–72 h except
  critical); alerts only on *active* uses; durable steward acknowledge with
  justification; only the *touched support* goes `stale` when a conclusion has
  several independent supports.

### Cycles (allowed, detected, never counted as proof)

Do not force a DAG — real debates contain mutual refutations, circular
definitions, reciprocal source/method trust.

```text
Cycles allowed. Cycles detected (strongly-connected components).
Cycles shown locally as a "dependency loop".
Cycles NEVER counted as independent support.
```

- Compute **SCCs** on the dependency sub-graph; the condensation is a DAG of
  components. Propagation **inside** a component = one grouped alert;
  **between** components = depth-1.
- **Mutual refutation** is not force-resolved: `C1: contested`, `C2:
  contested`, while the relations `C1 refutes C2` and `C2 refutes C1` can both
  be `established` — i.e. "these are established to be incompatible", not "we
  know which is true".
- **Invariant:** an argument may not count a claim as *independent* support if
  that claim depends, directly or transitively, on the conclusion it supports.
  It may still be displayed, cited, and discussed — just not counted as an
  anchor.

### Readability vs. integrity

The target UI shows only the **local neighborhood** (anchor → positions → direct
arguments/premises/objections/sources; referenced claims appear as folded
chips with global state + local role + last evaluation + alerts). Integrity
must come from **validated backend invariants**, not exhaustive display:

1. Every `Claim` has an explicit canonical `scope`.
2. Every `ClaimUse` points to a `Claim` (no floating premises).
3. Every public state points to an `Evaluation` (no `established` without an
   auditable decision).
4. Every editorially-important relation is contestable.
5. A global state imports locally **only** if `semantic_fit` is compatible.
6. **No verdict propagation** — only `stale` / `review_requested` /
   `support_under_review`.
7. Cycles allowed but marked; never independent proof.
8. Nothing deleted — add `superseded`/`refuted`/`merged_into`/`deprecated`;
   IDs stay citable.
9. Value claims kept separate from factual claims (a policy debate can have
   established factual premises and a `value_dependent` conclusion).
10. A page is a view, not a silo — local creation must try to resolve to an
    existing global claim before creating a new one. The same gate applies at
    the debate altitude: a new `DebateView` must resolve its anchor `Claim`
    first; if that `Claim` already has an inbound `:ABOUT` edge from a
    `DebateView`, surface the existing debate instead of creating a duplicate.

### Debate de-duplication

A target `DebateView` is de-duplicated by the *same* gate as a `Claim`, one
altitude up. Creation resolves its anchor `Claim`, compares question-text
similarity, and compares geography, period, and population scope.

The target outcomes are:

- `exact_equivalent` → redirect to the existing debate;
- `narrower_than_claim` → create a sub-debate linked under the parent;
- `broader_than_claim` → create a parent/atlas node;
- no compatible match → create with provenance.

A related-but-distinct debate (`analogous`) is
created new and cross-linked, not merged. Nothing is deleted — an exact
duplicate is merged via `(DebateView)-[:DUPLICATES]->(DebateView)`, never
erased; AI proposes and humans confirm. Prose home:
[07-engine.md](07-engine.md).

### Titles, scope & identity

A `DebateView`'s identity is a **stable id**, not its title string. The id never
changes; the URL is `id + slug`, so retitling 301-redirects the old slug and
never breaks links or citations. The displayed **title** is a *versioned
rendering* of the canonical `question_text`; the **scope** (geography / period /
population / threshold / domain — already on `DebateView`) is shown as explicit
chips, so the boundary stays legible and stable even as the title's prose
improves.

- **Edit types** (new `Contribution` types): `retitle_clarify` (same scope →
  light review), `retitle_neutralize` (same scope, fix loaded framing → bridged),
  `rescope` (boundary change → creates a *linked* `DebateView`, never edits this
  one). Governance in [07-engine.md](07-engine.md) §7.
- **Aliases:** `DebateView.aliases` accumulates merged-in titles and common
  phrasings; the de-dup matcher checks them, and readers find the debate in their
  own words.
- **Merge** (same scope): one `DebateView` becomes canonical, the other a
  `(DebateView)-[:DUPLICATES]->(DebateView)` redirect with contributions
  migrated — nothing deleted, history preserved.

### Conditional applicability (the "depends on who" axis)

A third structural axis beyond recursion (depth) and scope (boundary):
**conditionality** — one question whose answer varies by the asker's profile or
situation. Modeled by conditioning claims, not forking debates:

- `DebateView.condition_dimensions` — the axes a debate's answers depend on
  (e.g. age band, key conditions, goal; or locale / scale for policy).
- `Claim` / `ClaimUse` gains an `applicability` map: `segment -> state` (e.g.
  `healthy_adult: established`, `diabetic: contraindicated`, `child: unknown`) —
  richer than a single global lifecycle state.
- A reader **context lens** is a view-time filter (like the per-trust lens in
  [08-sources.md](08-sources.md)): it re-orders and flags for the reader's
  segment without hiding the rest; with no lens, the debate shows its condition
  dimensions up front.
- Genuinely large segments fork to a linked `DebateView` via `SPECIALIZES_OF`;
  everything else stays one debate with conditioned claims (avoiding the
  age × condition × goal combinatorial explosion).

### Position signal (aggregate, vote-then-reveal)

**Cut 2026-10-03 (D21).** No ballot or camp is stored per account. Kept for
the record only.

Readers can register their own position; the product surfaces only the
**aggregate distribution** (product rules in [02-product.md](02-product.md), D15).
The model is deliberately minimal and privacy-first.

- `PositionVote` (client-first): `debate_view_id`, `position_id` (or an on-axis
  coordinate for finer placement), `phase ∈ {before, after}`, `created_at`. **No
  user id is stored with the vote** server-side; the raw individual signal
  ideally lives only in the reader's browser — the same posture as the
  perception-delta profile, which never leaves the client.
- `PositionAggregate` (the only thing persisted and served): per
  `(debate_view_id, position_id, phase)` a **count** plus enough to show a
  confidence interval — served as a *distribution*, never a single winner.
- **Before/after is first-class.** `phase=before` is captured at entry (or quiz
  start), `phase=after` at the exit card, so the population-level shift (the
  North Star at scale) is computable without ever linking the two phases to a
  person.
- **Conditioned by segment, optionally.** Where a debate has
  `condition_dimensions` (the "depends on who" axis above), an aggregate may be
  sliced by *coarse* segment — never fine enough to re-identify anyone.
- **Values cross-tab, not identity.** The pedagogically valuable cut is
  position-distribution × values map ("readers who prioritize fairness lean
  here"), which teaches the values layer rather than tallying a score.

Integrity — a public aggregate is a brigading target: account-gated voting,
rate limits, **one current revisable signal per reader per debate** (last-write),
robust aggregation (trimmed / range display rather than precise live counts),
and audit of anomalous spikes. Aggregates are anonymous and may enter the open
corpus; **individual votes are never published and never sold** (institutional
red line).

### Framework choices (and where they differ from the default answer)

| Use | Framework | Role here |
| --- | --- | --- |
| Local evaluation semantics | **Carneades** | proof standards, premise/assumption/exception types, dialogical status — the engine of human-in-the-loop, no-auto-recompute |
| Conflict & cycle diagnosis | **Dung AAF** (grounded/preferred/stable) | *analysis language only* — surface the uncontested core / competing coherent families / unresolved loops; **never displayed as a winner** |
| Page grammar / UI | **IBIS** | `Issue → Position → pro/contra` reading order |
| Contribution form | **Toulmin** | claim / grounds / warrant / backing / qualifier / rebuttal → roles + `scope_override` + `proof_standard` |
| Ontology / export | **AIF** (I-nodes/S-nodes) | inspiration for `Claim` + `ArgumentStep` + `RelationAssertion`; too low-level to expose directly |
| Qualified statements, refs, stable IDs | **Wikibase** | steal the *form* (statement + qualifiers + references + rank); not enough, since our relations must be contestable |
| Operational store | **property graph** | typed nodes/relations with relation properties — natural for traversals, dependencies, alerts |
| Interop / provenance / validation | **RDF + JSON-LD + PROV-O + SHACL** | stable IRIs, named graphs, provenance, shape constraints for the open corpus export |

The deliberate divergences: not "nodes = claims" (we need `ClaimUse`,
`RelationAssertion`, `ArgumentStep`, `EvidenceUse`, `Evaluation`); not "claim
= debate" (folded vs unfolded); **no uncontrolled state propagation**; Dung is
a diagnostic, not the truth engine; not a Wikidata clone; no forced DAG.

### Target implementation sequence

If this architecture is accepted for implementation, start with a **property
graph + append-only event log**, with RDF/JSON-LD export
later. Minimal nodes: `Claim`, `DebateView`, `ClaimUse`, `ArgumentStep`,
`Source`, `EvidenceUse`, `Evaluation`, `StateEvent`, `Alert`. Minimal edges:
the `ABOUT` / `HAS_USE` / `OF_CLAIM` / `PREMISE_OF` / `CONCLUDES` / `CITES` /
`EVIDENCES` / `EVALUATES` / `CHANGED` / `TRIGGERS` / `AFFECTS` set above.

First product flow:

1. User proposes an argument in a debate.
2. AI extracts candidate claims and proposes global matches.
3. Human confirms: new `Claim`, or `ClaimUse` pointing to an existing one.
4. If the local claim becomes contested, create/link a dedicated `DebateView`.
5. `Evaluation`s change a `Claim`'s state — never the dependent conclusions
   directly.
6. State changes create grouped, prioritized `Alert`s.
7. UI shows the local neighborhood; the global graph stays auditable.

> **Founding invariant:** a `Claim` says *what is evaluated*; a `ClaimUse`
> says *how it is used here*; a `DebateView` says *how it is unfolded*; an
> `ArgumentStep` says *why it supports or attacks something*; an `Evaluation`
> says *who validated what, under which rule.*

## Seed Debate Packet

The current browser input contract is validated by `seedPacketSchema` in
[`app/src/lib/backend.ts`](../app/src/lib/backend.ts). It is an input to a
provisional analysis job, not proof that the source contents were verified.

```json
{
  "question": "Should cities implement congestion pricing for cars?",
  "initialPosition": "Yes, cities should implement congestion pricing.",
  "initialArguments": [
    "Congestion pricing can reduce traffic in dense urban areas.",
    "Revenue can fund public transit.",
    "The policy may be unfair to lower-income drivers unless exemptions exist."
  ],
  "sources": [{ "url": "https://…", "note": "…" }]
}
```
