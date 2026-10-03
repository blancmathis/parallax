# Sources & Evidence

This document owns the **target** policy and architecture for source artifacts,
claim-source use, source assessment, and their governance. Different people
trust different sources, and any system that declares a source reliable in the
abstract becomes an arbiter. Unless a paragraph is explicitly labelled Current
or Experimental, the mechanisms below are requirements—not current behavior.
The target extends the [objectivity engine](07-engine.md) and claim lifecycle in
[06-vision.md](06-vision.md#the-library-of-truths).

> **The reader does the trusting. Parallax does the disclosure — and audits
> its own disclosure.**

## Current implementation boundary

| Layer | Status |
| --- | --- |
| Fixture source cards, claim-scoped evidence labels, and optional exact excerpts | **Current demonstration data** — selected excerpts exist, but coverage and immutable artifact identity are incomplete; no factual-verification claim |
| Stored source excerpts, locators, content-hash fields, source-access results, source-floor assessments, and a simple two-camp claim gate | **Experimental Supabase contracts** |
| Four-level integrity analysis, citation-fidelity proof, source-version graph, matrix-factorization bridging, anti-coordination, dossiers, coverage ledger, juries, and reusable source library | **Target** |

The target output is an exact, structured, source-grounded **provisional
dossier**, not an oracle of truth or a global rating service. A procedural
status is scoped to one claim, source artifact, use, version, and review date.

## Source evidence required for target implementation

Before a truth-apt claim-source assessment can be reviewed for publication, the
record must identify:

- canonical URL or repository identifier and publisher/author when available;
- publication date and exact edition, revision, dataset release, or captured
  artifact version;
- retrieval date, access outcome, and content digest;
- exact quoted excerpt with page, paragraph, timestamp, table/cell, or other
  reproducible locator;
- claim scope and intended use;
- who or what extracted the material, which model/parser version was used, and
  the human review decision;
- correction, retraction, supersession, and refresh behavior.

No label silently carries to a changed artifact. If an external method,
formula, threshold, rubric, or policy informs implementation, the decision must
pin its primary URL, retrieval date, applicable version or commit, and local
rationale. A moving webpage is a research reference, not an executable spec.
External references linked below were consulted on 2026-08-30. They are design
inputs only; adopting any of them requires a version-pinned local decision and
evaluation against Parallax's own threat model.

## 0. Where the arbiter actually hides

Parallax never publishes a global reliability score. But it can still become
the arbiter through *less visible* choices, and that is where every attack
will land:

- the **vocabulary of integrity reasons** (what counts as "weak method");
- the **order and salience of displayed metadata** ("funded by X");
- the **bridging thresholds** and the **definition of "camps"**;
- the **sort rules** of an evidence list;
- the **treatment of the "uncurated" state**.

Every mechanism below is designed so that these hidden levers are themselves
explicit, rule-based, contestable, and auditable — not editorial reflexes.

## 1. The unit of trust is not the source — it is the (source → claim → use)

A source is **never** "reliable" or "weak" in the abstract. A qualitative
study is weak for estimating a national prevalence but strong for
establishing that a witness stated X. A partisan outlet is poor for proving a
policy works but is the *primary* source for "this camp officially holds Y".

Integrity is therefore stored at **four separate levels**, never collapsed:

| Level | Question |
| --- | --- |
| **Artefact** | Does the document exist, is it authentic, corrected, retracted, versioned? |
| **Citation fidelity** | Does it actually say what the claim attributes to it? |
| **Inferential warrant** | Does its method support *this type* of conclusion? |
| **Corpus weight** | How does it stand against the other relevant sources? |

The visible label is always **"weak *use* for this claim"**, never "weak
*source*". Support is evaluated in the scoped relation between artifact, claim,
and use—not inferred from a global reputation.

## 2. A source is a node in the same graph — its reliability is a claim

In the target system, a source gets its own page, and the discussion there is **itself structured
as claims** with the same lifecycle (`proposed → contested → established →
refuted`):

- "funded by X" — *established*
- "methodology has flaw Y" — *contested*
- "corrected on date Z" — *established*

So the reliability of a source reduces to the *same engine* as everything
else — the parallax method applied recursively to sources. No new governance
machinery is invented. Sources, claims, and debates are one typed graph at
three zoom levels (see [03-data-model.md](03-data-model.md)).

## 3. Two axes that a naïve vote fatally conflates

Community curation is the goal, but a raw community vote on a source is a
popularity contest = majority capture = brigading. On a 70/30 topic the
majority camp downvotes the out-group's sources and "remove bad sources"
becomes "remove out-group sources" — which destroys the entire premise.

The cause: a vote conflates two distinct questions. The data model keeps them
apart and **the UI forces the rater to pick which one they mean**:

| Axis | Question | Who decides | Status |
| --- | --- | --- | --- |
| **Integrity** | fabricated? misquoted? retracted? conflict of interest? method? | **cross-camp bridging** | the only "trust" signal |
| **Relevance** | does it support my position? is it convincing? | legitimately partisan | kept, but **never** counted as quality |

A rater who disagrees with a conclusion expresses it on the *relevance* axis;
it never touches the integrity signal.

## 4. Integrity reasons must be atomic, falsifiable, and symmetry-tested

The most dangerous attack is **disagreement disguised as a methodological
audit**: a camp never votes "I disagree", it always picks a defensible reason
("conflict of interest", "weak method", "n too small", "not peer-reviewed")
and applies it *asymmetrically* — an enemy-funded study is "captured", a
friend-funded one is "expertise"; an unfavourable n=1,200 poll is "weak
method", a favourable n=700 one is "indicative".

So a generic reason code is forbidden. An integrity vote must be an **atomic,
falsifiable, normed claim**, e.g.:

> "Funder X funded study Y; authors did not disclose it; journal Z's policy
> required disclosure; this defect affects the use of this source for claim C
> at level N."

Three locks before it can stand:

1. **Causal-relevance test** — the defect must explain *why this specific
   claim* is poorly supported, not just smear the source.
2. **Counterfactual-symmetry test** — would the same defect have demoted a
   source supporting the *opposite* camp? Raters must affirm this, and it is
   auditable.
3. **Domain rubric** — "methodologically weak" routes through a selected,
   versioned per-domain grid, not crowd intuition. Research examples include the
   GRADE Working Group's [GRADE Book](https://book.gradepro.org/about) and
   Cochrane's [RoB 2 tool](https://www.riskofbias.info/welcome/rob-2-0-tool).
   A rubric makes the judgment legible and comparable only after its scope and
   version are recorded.

**Target meta-moderation hypothesis:** integrity *judgments themselves* are
reviewed to surface misuse of the categories—a second layer that audits acts of
moderation, not just content. No external precedent by itself validates this
mechanism for Parallax.

## 5. Metadata is shown only behind a bridged relevance claim

"Funded by X" is factual, but **factuality does not settle salience**. A
metadata chip is a compact ad hominem; and camps will fight over *which*
metadata rises above the fold — so Parallax would silently become the arbiter
of salience instead of reliability. (The conflict-of-interest disclosure
literature even shows disclosure can backfire — Cain, Loewenstein & Moore.)

**Hard rule:** no reputational metadata rises into a claim's evidence list
without a *separate, bridged relevance claim* establishing a mechanism:

> "Funder X had a direct material interest in conclusion C; authors had
> non-independent control over D; the disclosure was absent/incomplete; this
> affects the inference used *here*."

The full source page may carry all metadata. The claim-level UI shows a chip
only when that bridged mechanism exists — and always alongside **symmetric
counter-metadata** (open data, pre-registration, independent replication,
peer review, correction status, funder role, protocol access). Without
symmetry, "transparency" is just ammunition.

## 6. The source's standing is a vector, never a scalar — and never a global one

No single number. Displayed side by side:

- **bridged integrity label** (cross-camp agreed properties) — the trust signal;
- **per-camp usefulness** (how much each camp leans on it — shows the parallax);
- **conditional track record** (see below);
- **structured discussion thread**.

Users, journalists, and adversaries may compress any vector into "Parallax says
this source is bad", and third parties may scrape the signals into their own
score. The track record must therefore be
**conditional, never global**:

- by domain, by claim type, by period, by *exact use* of the source;
- denominator = **claims reviewed**, not claims existing;
- carries a selection-bias warning;
- is **never the primary sort key**.

Display:

> "Among reviewed Parallax claims where this source supported a causal
> inference in public health, 12 uses were refuted and 3 established. This
> sample is not representative of the source's whole output."

Less elegant, far less capturable.

## 7. "Rise / sink" = visibility, and nothing is ever deleted

What moves is **visibility inside a claim's evidence list**, sorted by
*bridged integrity + traceability*, not raw votes. A low-integrity source is
**demoted, labelled with the agreed defect, and folded** ("3 low-integrity
sources hidden — show") — but kept on record, with history, always.

An uncurated source must **never** rise high merely because an agent
auto-extracted clean properties — that would make the agent a hidden arbiter
(see §12).

## 8. The bridging mechanism (how a sensitive label actually ships)

An integrity label, a merge, or a steelman-fairness call should publish only
after review spans materially different perspectives and the documented
procedure's other safeguards pass. Cross-group agreement is a procedural
signal—not proof that the conclusion is true.

X's Community Notes is a design reference because it publishes notes only
after scoring across people who have disagreed in prior ratings. Its official
[ranking guide](https://communitynotes.x.com/guide/en/under-the-hood/ranking-notes)
was consulted on 2026-08-30. The guide and implementation evolve, so this
document deliberately does not copy numerical constants as Parallax truth.

**Experimental boundary:** the current database gate counts qualifying
endorsements across two declared camps. It has no learned disagreement model,
representative-sample check, demonstrated anti-coordination layer, or accepted
production threshold. It may exercise UI states; it must not be presented as
the target bridging mechanism.

**Target requirements before selecting an algorithm:**

- version-pinned primary references and a local decision record;
- a threat model for coordination, Sybil identities, strategic non-participation,
  sampling bias, language/domain imbalance, and privacy leakage;
- offline evaluation against adversarial and ordinary cases;
- published minimum coverage and uncertainty rules;
- reproducible versioned scorer inputs and outputs;
- human appeal and rollback paths;
- a public explanation that exposes procedure and limitations without exposing
  individual inferred affiliations.

Deliberation, disagreement mapping, and publication scoring may use different
tools. Any future Polis-, Community Notes-, or research-derived component must
be evaluated and versioned independently; naming a precedent does not accept
its thresholds or make it suitable for Parallax.

Coverage will be incomplete. An unbridged source use therefore reads *"no
cross-group label established yet"*—an absence of verdict, never "unreliable".
The target coverage ledger (§11) must disclose how much of the relevant source
set remains unreviewed or blocked.

Any learned disagreement factor is sensitive, scoped, and never named as a
political identity. The target must use privacy-preserving aggregates and avoid
a universal left/right axis; exact storage, anonymity floors, and publication
rules require a separate reviewed security design.

## 9. "Camp" is multi-axis — bridging can be choreographed

Two organised groups can look opposed on a visible axis yet share a *local*
hostility to one source (e.g. anti-corporate left + anti-elite right both
attack a medical journal). That yields *sociological* bridging, not truth.

So bridging is **never defined on a single camp axis**. Diversity is measured
across several independent partitions:

- prior disagreement history in the Parallax graph;
- self-described political/philosophical lens;
- domain expertise; affected parties; language/region;
- type of trusted institution; prior behaviour on analogous claims.

For each label, publish the **diversity profile of the agreement** — not
people's names or scores: "agreed across clusters that usually diverge on X,
Y, Z; insufficient diversity on A." This audits bridging quality without
ranking people.

## 10. Refusal to bridge must not become a veto

A bad-faith camp can simply *never converge*—always demand "more context",
contest a definition, or call the category biased. If bridging has no
non-convergence state, refusal can preserve the status quo indefinitely.

Introduce an explicit **procedural** state — *"unresolved disagreement after
full procedure"* — distinct from any integrity verdict. Rules:

- a refusal counts **only** if it states a *falsifiable, claim-linked*
  objection with a counter-source or a precise clarification request;
- repeated objections are merged;
- objections that never answer clarifications **expire**;
- non-participation is a **pass**, not a veto;
- the UI shows: "integrity label not established; remaining objections: A, B;
  objections rejected as irrelevant: C, D."

This never says "camp X is wrong" — it says "the procedure produced no
bridging, and here is exactly why."

## 11. The "uncurated" state must split, with a public coverage ledger

At scale, a single "uncurated" bucket is catastrophic: an adversary floods new
blogs, preprints, screenshots, AI-generated sites; serious-but-new sources
also sit uncurated and look suspect. Participation is ~90-9-1, so the backlog
is the *normal* state, not a transient.

Replace one bucket with distinct states:

- **Not reviewed** — no human evaluation.
- **Auto-extracted only** — agent properties, unvalidated.
- **In active review** — important enough to examine.
- **Review blocked** — bridging not reached (→ §10).
- **Beyond current capacity** — not enough competent/language/domain raters.
- **Low priority** — little impact on visible claims.

Per topic, publish a **coverage ledger** at the top of the page (not a
footnote): sources cited, % reviewed, median review age, disagreement rate,
languages covered, camps represented, share auto-extracted only. A 7%-coverage
map must say, up top: *"This map is very incomplete."*

Allow **non-normative intermediate statuses** beyond the curation states —
"open dossier", "contradictory evidence", "needs raters from the opposite
latent factor", "claim too broad — rescope required" — none of which read as a
reliability verdict.

## 12. Agents do volume — but volume is already a form of editorial power

**Status: Target.** The experimental path can store bounded excerpts and
content hashes. It does not yet prove document sandboxing, deterministic
metadata extraction, random audit, or the complete proof-attachment contract
below.

Agents type sources, extract properties, trace primaries, check citation
fidelity, and flag contradictions. They "only propose"—but *deciding what
enters the human field of view is already deciding*. Adversarial documents also
create prompt-injection risk; the current reference is OWASP's
[LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).
Model error must be treated as an ordinary failure mode requiring attached
proof, not as an exceptional edge case.

No agent output is stored as a source property without **attached proof**:

- **quote-only extraction** — every property points to an exact passage;
- critical metadata via **deterministic parsers** where possible;
- **document sandboxing** + neutralisation of instructions inside sources;
- a **hash** of the analysed artefact;
- a **random audit queue**, not only audit-on-challenge;
- a higher bar for high-impact outputs (retraction, fabrication, deepfake,
  conflict of interest, corpus contradiction).

In the UI, **"auto-extracted" is visually subordinate to "validated"** — not
merely worded differently.

## 13. "Contradicted by N studies" needs an equivalence model

A bare counter ("contradicted by 12 studies") is a pseudo-meta-analysis: the
12 may differ in population, horizon, intervention, level of evidence — or
they bound/contextualise rather than contradict. The counter appears **only
after** equivalence is classified: same question? same population? same
measure? same period? same design? same inferential level? direct
contradiction vs limitation vs non-replication vs mixed result?

## 14. Versioned artefacts, explicit propagation

**Status: Experimental fields / Target lifecycle.** The Supabase schema has
content-hash and excerpt fields; exact artifact identity, refresh detection,
typed version relations, and propagation rules are not implemented end to end.

The base source node is an **exact versioned artefact**, not a vague "source".
Crossref's
[Crossmark documentation](https://www.crossref.org/documentation/crossmark/participating-in-crossmark/)
is one concrete research-output example where corrections, retractions,
withdrawals, and new versions change an item's status. Relations are typed:
`isVersionOf`, `cites`, `summarizes`,
`isRetractedBy`, `isCorrectionOf`, `translationOf`, `mirrorOf`,
`sameDatasetAs`. Labels propagate **only by explicit rule**: a retraction may
affect dependent versions; a citation dispute in a hostile secondary must
**not** contaminate the primary it cites.

## 15. Retention ≠ visibility

"Nothing is deleted" is right for audit but dangerous for diffusion: a refuted
rumour kept on record is screenshot-able out of context (repetition raises
perceived accuracy; the continued-influence effect). Separate **evidentiary
retention** from **public discoverability**:

- `noindex` on low-integrity records;
- snippets that show the **refutation first**, not the rumour;
- friction click for fabricated / doxxing-adjacent / personal-accusation
  content;
- public export always carries the claim's status;
- platform-generated shareable cards with **non-detachable context**;
- minimal public tombstone + full record reachable in an audit mode.

We do not delete. We control re-exposure.

## 16. The hard floor is rule-based, not a vote

**Status: Experimental v1 / Target governance.** A reviewer-only source-floor
assessment and rule-derived display path exist in the Supabase migrations. The
complete jurisdiction policy, proof requirements, appeal, rollback, and public
governance described below remain target work.

The only true hard removal is a **published, rule-based** policy with appeal —
never crowd mood, because this is where arbitration re-appears and where legal
risk concentrates. Make each category as mechanical as possible:

- **illegality** — reference to jurisdiction, law, order, or published policy;
- **malware** — technical signature or reproducible analysis;
- **doxxing** — predefined categories of personal data + public-interest test;
- **deepfake / fabrication** — *never* remove on a detector score alone
  (detectors generalise poorly); require external proof, provenance, admission,
  cryptographic inconsistency, primary source, or adversarial forensics.

Default when unmet: **"authenticity contested / restricted visibility"**, not
hard removal.

## 17. Stewards are a function, not a caste

The steelman gate (a moderator must state every position fairly) risks a
hidden aristocracy of people who master the platform's argumentative codes.
So stewardship is a **local, temporary, revocable, audited function**:

- per debate or domain, not a permanent class; with rotation;
- partial sortition among qualified contributors;
- blind multi-camp evaluation of steelman ability;
- **separation of facilitation from label validation**;
- public appeals; an action log, with **no global personal score**.

Audits the function; never ranks the person (red line of
[06-vision.md](06-vision.md#red-lines-institutional)).

## 18. Per-source discussion has a procedural economy

A structured per-source debate can be turned into an argumentative
denial-of-service (a graph-shaped Gish gallop): 40 weak sub-objections create
a scandal smell, so a robust source looks "very controversial" while an
unattacked mediocre one looks clean. Therefore:

- an **objection budget** per source per period;
- automatic merge of duplicates;
- an **impact requirement** ("if established, which visible claim changes?");
- priority to objections affecting many claims;
- display **"open objections"** and **"established relevant objections"**
  separately.

## 19. Procedural neutrality, not symmetric conclusions

Evidence is not evenly distributed across camps. Honest typing makes some maps
*lean*, and the disadvantaged camp will read an accurate map as bias — while
one of our North-Star signals is *perceived* neutrality. You cannot
simultaneously optimise process neutrality, apparent symmetry, and weight of
evidence; forcing apparent symmetry can create **false balance**. One domain-
specific empirical reference is Boykoff and Boykoff's 2004
[study of US climate coverage](https://doi.org/10.1016/j.gloenvcha.2003.10.001);
it motivates the risk but is not universal proof for every Parallax topic.

Parallax separates the three explicitly:

- **Procedural neutrality** — identical rules of search, typing, contestation,
  and appeal. *Target invariant; must be continuously audited.*
- **Evidential asymmetry** — results may lean. *Allowed.*
- **Perceived neutrality** — a diagnostic metric, **never an optimisation
  target.**

The UI states it bluntly:

> *« Parallax garantit la symétrie de la procédure, pas la symétrie du poids
> des preuves. »*
> "Parallax guarantees symmetry of process, not symmetry of the weight of
> evidence."

Add a **search-parity** metric (not result parity): how much effort went into
finding each position's best sources — who was invited, which databases,
which keywords, which languages, which camp-proposed sources were examined.

## 20. Governance: a separation of powers, not a source rating

Among the design references considered here, Community Notes contributes a
deployed cross-group publication gate, while Wikipedia's
[reliable-sources guideline](https://en.wikipedia.org/wiki/Wikipedia:Reliable_sources)
and [consensus policy](https://en.wikipedia.org/wiki/Wikipedia:Consensus)
contribute examples of explicit, revisable sourcing and governance rules
without a formal cross-group guarantee. These are design hypotheses, not a
benchmark result. The target design is a **hybrid**—public sourcing rules,
adversarial evidence dossiers, a bridging gate, rotating juries, and public
audit—deliberately split into five layers:

1. **Public sourcing rules (the floor).** A rules-based anti-disinformation
   floor, readable *before any vote*, claim-scoped (domain, claim type, period,
   content genre, controversy, attribution need, correction/fabrication record,
   independence, expertise, conflicts, UGC/AI/sponsored). Strong rules act
   *without* bridging: unverified UGC is never a source for a controversial
   factual claim; no identifiable editorial accountability → negative
   presumption; opinion → attribution mandatory; health/law/finance/
   living-persons → higher bar. The relevant design hypothesis is rules plus
   context, archived decisions, revision, and explicit exceptions; it must be
   evaluated rather than imported wholesale.
2. **Adversarial evidence dossier.** Agents assemble for/against (external
   citations, corrections, retractions, methodology vs documented errors,
   conflicts, UGC/AI) and dedupe; humans decide; every agent output is
   challengeable (§12).
3. **Bridging gate** (§8) — sensitive labels ship only cross-camp, never by
   simple majority.
4. **Rotating source juries** for the hard cases—sortition from a qualified
   pool, informed by the OECD's documented
   [representative deliberative-process models](https://www.oecd.org/en/publications/innovative-citizen-participation-and-new-democratic-institutions_339306da-en.html)—used
   when a source is heavily used, the label is hotly contested, bridging is
   long-blocked, the domain needs expertise, or a false label is socially
   costly. The jury gets the adversarial dossier, applies the published rules,
   and produces a *reasoned recommendation* that still ships only if it then
   survives bridging — otherwise it stays "jury recommendation, unbridged".
   Temporary and rotated, never a permanent caste (→ §17).
5. **Forecasting as a signal, not a verdict.** Programs such as DARPA's completed
   [SCORE program](https://www.darpa.mil/research/programs/systematizing-confidence-in-open-research-and-evidence)
   motivate testing calibrated confidence on reproducibility questions. Any
   prediction or replication signal would feed the dossier; it would never
   decide "reliable" or substitute for review.

**Four statuses — never a rating:**

| Status | Meaning |
| --- | --- |
| **Open dossier** | evidence collected, no label |
| **Procedural guidance** | non-controversial rules applied (UGC, opinion, primary, sponsored, AI, correction policy) — no bridging required |
| **Bridged label** | a scoped claim validated by cross-camp consensus |
| **Contested / unbridged** | evidence exists, cross-camp agreement not reached |

**Where bridging-only governance fails** (hence the target floor and juries):

- false negatives when a group blocks a label;
- strategic veto or consensus denial (→ §10);
- confusion between political disagreement and domain expertise;
- over-global labels such as "S is reliable" without scope;
- infinite regress when every procedural primitive is reopened recursively;
- privacy loss when auditability exposes inferred groups or identities;
- legal and reputational risk when a scoped map is read as a rating agency.

Public language must therefore remain scoped guidance, never an absolute
verdict.

## 21. The canonical object is a sourcing claim, not a source fiche

**Status: Target.** The current browser and experimental backend do not expose
this seven-stage sourcing-claim lifecycle end to end.

The unit is never a fiche ("NYT = 92/100", "Fox = unreliable"). It is a
**scoped sourcing claim** running the standard lifecycle:

> "Source S is usable as a reliable secondary source for factual claims of type
> C, in domain D, for period T, with/without attribution, except exceptions E."

`proposed → open dossier → contested → bridged-established → refuted/rescoped →
value_dependent`.

**Minimum viable architecture (one pipeline, not many):**

1. **Claim generator** — agents propose / dedupe / rescope sourcing claims.
2. **Evidence dossier** — agents collect for/against; humans contest.
3. **Rater matrix** — Helpful / Somewhat / Not + rationale.
4. **Bridging scorer** — a versioned, evaluated cross-group model with explicit
   coverage and anti-coordination requirements.
5. **Deliberation** — a disagreement map; [Polis](https://pol.is/home) is a
   research reference, not an accepted implementation.
6. **Governance** — public rules + rotating juries + appeals + audits.
7. **Public display** — no global score; only scoped statuses, dossiers,
   uncertainty, coverage.

**The product sentence a reader actually sees:**

> *« Label établi par consensus inter-camps : cette source est généralement
> utilisable pour des faits économiques publiés par son desk reporting depuis
> 2021, avec attribution recommandée pour les analyses/opinions. Ce label ne
> couvre pas les tribunes, contenus sponsorisés, live blogs, ni les claims
> médicaux. Dernier audit : X. Couverture : suffisante des deux côtés latents.
> Appel possible. »*

Every target red line must hold: no winner, no ranking of people, no global source score,
no proclaimed neutrality, nothing deleted, AI in the audit trail, humans for
judgment, bridging for sensitive decisions.

## 22. The living source library (AI-first, community-vetted, reusable)

**Status: Target.** No reusable reviewed-source library currently exists.

A reviewed source use should not stay trapped in the debate that evaluated it.
The target compounding asset is a **living library of reviewed source
artifacts and scoped uses** —
the source-side twin of the global claim library
([03-data-model.md](03-data-model.md#the-global-claim-graph-cross-debate-model)).
A two-stage flow feeds it:

1. **LLM first pass.** On intake, an agent traces the source to its primary,
   checks citation fidelity, flags retractions / conflicts / funding, dedups
   against the library, and drafts a neutral source card — every output an
   auditable proposal (§12).
2. **Community analysis.** Readers across camps weigh its integrity and leave
   structured notes; a verdict stands only by cross-camp agreement (§8), never
   a show of hands.

After sufficient review, an exact artifact and scoped use may become a
**reusable library entry** carrying its evidence and limitations with it:
**evaluate one version under one scope, reuse without losing either.** A later
debate must still check semantic fit, scope fit, freshness, corrections, and
retractions. The assistant may propose previously reviewed entries; humans
confirm their applicability to the new claim.

This is a network effect, not a feature: the longer Parallax runs, the deeper
the commons of vetted evidence gets — analyzed by thousands, owned by no one.
It belongs to the open-commons corpus, never a private moat
([06-vision.md](06-vision.md#funding-model--the-commons-and-its-services)).
The guards carry over: a library entry is **scoped** (usable for *which*
claims / domain / period, §1), its integrity label is **bridged** not majority
(§8), nothing is deleted (§15), and AI proposals enter the same review pipeline
as any contribution — the assistant *suggests*, humans *confirm* (§12).

## 23. The three fatal risks (must be solved, not mitigated)

1. **Veto-by-refusal × cold-start.** If "no bridging" only yields "uncurated",
   strategic actors block labels indefinitely and the corpus stays a sparsely
   annotated archive, not a library of truths. → §10 + §11 are not optional.
2. **Capture of integrity reasons and metadata.** "Conflict of interest",
   "weak method", "funded by X" are exactly where political conflict migrates;
   without the relevance + symmetry tests, the integrity axis *becomes* the
   partisan axis in a lab coat. → §4 + §5.
3. **Perceived neutrality vs evidential asymmetry.** Optimising for every camp
   to *feel* the platform is neutral tempts false balance; refusing false
   balance gets you called biased. The only clean exit is to **declare**
   symmetric *process*, not symmetric *conclusions*. → §19.

## Backend implications (extends [07-engine.md](07-engine.md#backend-milestones-this-implies))

1. Source = **versioned artefact node** + typed relation graph (§14); sources
   are nodes in the global claim graph ([03-data-model.md](03-data-model.md)).
2. Integrity stored at four levels per (source → claim → use) triple (§1).
3. Integrity votes as **atomic falsifiable claims** with relevance/symmetry
   flags + domain-rubric routing (§4); meta-moderation layer.
4. Bridging service: matrix-factorization gate + guardrails, multi-axis camp
   inference, shadow bridging metric (§8–§9).
5. Procedural states incl. *unresolved disagreement* + objection economy
   (§10, §18).
6. **Coverage ledger** per topic + split curation states (§11).
7. Agent proof-attachment, sandboxing, hash, random-audit queue (§12).
8. Retention/visibility split: noindex, refutation-first snippets, contextual
   share cards (§15).
9. Rule-based hard-floor policy engine with appeal (§16).
10. **Governance engine:** rules-as-floor + four statuses + rotating source
    juries (sortition) + appeals; forecasting signals feed dossiers only (§20).
11. **Sourcing claims** as the canonical scoped object + the 7-stage MVP
    pipeline (§21); scoped latent factors `f_u(domain)`, `rater_factor` stored
    as sensitive data (§8).
