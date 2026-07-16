# Sources & Evidence

How Parallax handles the single hardest problem of the project: different
people trust different sources, and any system that *declares* which sources
are reliable becomes the arbiter — and the moment it does, one camp rejects
everything else. This document specifies the source layer of the
[objectivity engine](07-engine.md). It feeds the same claim lifecycle defined
in [06-vision.md](06-vision.md#the-library-of-truths) and shares its
governance (bridging consensus, stewards, audit trail).

> **The reader does the trusting. Parallax does the disclosure — and audits
> its own disclosure.**

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
*source*". This is the core of the project's thesis: truth is manufactured in
the argumentative relation, not in a global reputation.

## 2. A source is a node in the same graph — its reliability is a claim

A source gets its own page, and the discussion there is **itself structured
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
3. **Domain rubric** — "methodologically weak" routes through recognised
   per-domain grids, not crowd intuition: e.g. **GRADE** (risk of bias,
   inconsistency, indirectness, imprecision, publication bias) and **Cochrane
   RoB 2** for trials. The rubric makes the judgment legible and comparable.

**Meta-moderation (Slashdot precedent):** the integrity *judgments
themselves* are rated, to surface raters who misuse the categories — a second
layer that audits acts of moderation, not just content.

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

Users, journalists, and adversaries *will* compress any vector into "Parallax
says this source is bad", and third parties will scrape the signals to build
their own score (Goodhart's law). The track record must therefore be
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

An integrity label, a merge, or a steelman-fairness call ships only when
raters who *usually disagree* converge. The deployed reference is X's
**Community Notes**; Parallax reimplements its core and its guardrails.

**Model — matrix factorization** over a sparse `rater × note` matrix
(`Helpful = 1.0`, `Somewhat = 0.5`, `Not = 0`):

```
r̂[u,n] = μ + i_u + i_n + f_u · f_n
```

- `i_n` (the *note intercept*) is the published helpfulness score: what
  remains useful **after** removing a rater's general leniency (`i_u`) and the
  camp agreement captured by `f_u · f_n`.
- `f_u` is a **latent disagreement factor**, *learned* from voting patterns —
  **never declared, never named, never shown**. Its sign has no political
  meaning; we speak of a latent factor, never "left/right".

**Operative thresholds (to reimplement faithfully):**

- a label is not even scored before ≥ 5 ratings;
- ships as *helpful* when `i_n ≥ 0.40` (captures < 10% of items) **and**
  `|f_n| < 0.50` (not too polarized);
- requires net support from **both signs** of the latent factor (e.g. ≥ 5
  positive-factor and ≥ 5 negative-factor raters endorsing).

**Guardrails that matter most for us** (plain matrix factorization is
manipulable):

- **anti-coordination / independence** — anomalously correlated raters are
  treated as one entity;
- **population-sample filter** — a representative sample can veto a label that
  only an active sub-crowd liked;
- **diligence / sourcing tags** — "sources do not support note", "unreliable
  sources" can block a label even when it is liked;
- **multi-model** (core + expansion + topic/group + language) to cover blind
  spots.

**Delegation of roles:** **Polis** for the *deliberative/explanatory* phase
(surface the dimensions of disagreement; produce cross-group consensus
wordings via Group-Informed Consensus — products of per-group agreement
probabilities, so a large group cannot steamroll a small one); a Community
Notes-style gate for the *publication* decision. As a **shadow metric** from
day one, compute the pairwise-disagreement / p-means **bridging** score (Blair
et al., *The Structure of Bridging*) — a negative `p` rewards labels endorsed
by usually-distant pairs and punishes one-camp approval without giving a
micro-group an absolute veto. Ship on the Community Notes gate; use the others
to audit false positives/negatives and clustering fragility.

**Coverage is low — by design.** Bridging publishes little: in Community Notes
< 10% of submitted notes ship (English fell from ~9.5% in 2023 to ~4.9% in
early 2025; > 90% never reach the public; Meta reported ~6%). For a source map
this means most sources stay **unbridged** — not a bug but the price of the red
line. An unbridged source therefore reads *"no cross-camp label established
yet"* (absence of verdict), **never** "unreliable"; the dossier (§2) shows
regardless; sort by marginal utility (high-stakes, frequently-cited,
near-threshold-but-missing-one-side); merge duplicate proposals into one
canonical sourcing claim; publish coverage as a health metric (§11).

**The latent factor is private, scoped, never named.** `f_u` is *learned* from
voting patterns, never declared — its sign carries no political meaning, so the
UI says "latent disagreement factor", never "left/right". Treat `rater_factor`
as **sensitive data**: private encrypted table, separate public vs scoring IDs,
only k-anonymised / DP aggregates published (never "2 raters on the negative
side" → say "insufficient cross-group coverage"). A single global axis breaks
across religion / geopolitics / science / gender (the Meta Oversight Board
flagged exactly this), so use **scoped factors `f_u(domain)`** — a rater can be
camp A on climate, camp B on foreign policy, neutral on health — judged by the
latent camps *relevant to the domain*, not a universal political identity.

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

A bad-faith camp can simply *never converge* — always demand "more context",
contest a definition, call the category biased. With bridging required, "no
consensus" then protects the bad source (the Wikipedia "no consensus → status
quo" stonewall, generalised).

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

Agents type sources, extract properties, trace primaries, check citation
fidelity, flag contradictions. They "only propose" — but *deciding what enters
the human field of view is already deciding*. Plus adversarial sources carry
**prompt injection** (OWASP LLM01) and agents **hallucinate** (documented even
in law).

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

The base source node is an **exact versioned artefact**, not a vague "source"
(Crossref/Crossmark and Retraction Watch exist precisely because status
changes). Relations are typed: `isVersionOf`, `cites`, `summarizes`,
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
evidence; forcing apparent symmetry is **false balance** (Boykoff & Boykoff).

Parallax separates the three explicitly:

- **Procedural neutrality** — identical rules of search, typing, contestation,
  appeal. *Guaranteed.*
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

Community Notes is the best *deployed* cross-camp gate but too slow and
low-coverage to be a source map alone; Wikipedia is the best *institutional*
model of sourcing memory and rules but has no formal cross-camp guarantee.
Parallax's strongest design is the **hybrid** — public sourcing rules +
adversarial evidence dossiers + bridging gate + rotating juries + public audit —
deliberately split into five layers:

1. **Public sourcing rules (the floor).** A rules-based anti-disinformation
   floor, readable *before any vote*, claim-scoped (domain, claim type, period,
   content genre, controversy, attribution need, correction/fabrication record,
   independence, expertise, conflicts, UGC/AI/sponsored). Strong rules act
   *without* bridging: unverified UGC is never a source for a controversial
   factual claim; no identifiable editorial accountability → negative
   presumption; opinion → attribution mandatory; health/law/finance/
   living-persons → higher bar. This is Wikipedia's strength (rules + context +
   archived consensus + revisable, with explicit exceptions). Replacing law
   with mood is the failure to avoid.
2. **Adversarial evidence dossier.** Agents assemble for/against (external
   citations, corrections, retractions, methodology vs documented errors,
   conflicts, UGC/AI) and dedupe; humans decide; every agent output is
   challengeable (§12).
3. **Bridging gate** (§8) — sensitive labels ship only cross-camp, never by
   simple majority.
4. **Rotating source juries** for the hard cases — sortition from a qualified
   pool (the OECD deliberative mini-public / citizens'-assembly model) — used
   when a source is heavily used, the label is hotly contested, bridging is
   long-blocked, the domain needs expertise, or a false label is socially
   costly. The jury gets the adversarial dossier, applies the published rules,
   and produces a *reasoned recommendation* that still ships only if it then
   survives bridging — otherwise it stays "jury recommendation, unbridged".
   Temporary and rotated, never a permanent caste (→ §17).
5. **Forecasting as a signal, not a verdict.** Prediction / replication markets
   (DARPA SCORE) answer empirical sub-questions — "corrected within 90 days?",
   "will an independent replication succeed?" — feeding the dossier. They never
   decide "reliable"; governance-by-speculators is manipulable and legally
   fraught.

**Four statuses — never a rating:**

| Status | Meaning |
| --- | --- |
| **Open dossier** | evidence collected, no label |
| **Procedural guidance** | non-controversial rules applied (UGC, opinion, primary, sponsored, AI, correction policy) — no bridging required |
| **Bridged label** | a scoped claim validated by cross-camp consensus |
| **Contested / unbridged** | evidence exists, cross-camp agreement not reached |

**Where bridging-*only* governance fails** (hence the floor + juries): too many
false negatives (the worst sources stay unlabelled if a camp blocks); strategic
veto / consensus-denial (→ §10); politics-vs-expertise confusion (on a medical
claim the relevant disagreement is method / conflict-of-interest / evidence
level, not left/right — judge by domain-relevant latent camps, §8–§9);
over-global labels ("S is reliable" is almost always false — always scope);
**infinite regress** (if "S is reliable" is a claim, so is the evidence judging
it — close it with *procedural primitives* that are not infinitely
re-debatable); privacy-vs-audit (prove bridging via aggregate evidence — code,
thresholds, k-anonymised distributions, independent audits — not by exposing
camps); legal/reputational risk (a published map reads as a rating agency —
phrase everything as *scoped guidance*, never an absolute verdict).

## 21. The canonical object is a sourcing claim, not a source fiche

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
4. **Bridging scorer** — Community Notes-like MF with cross-factor minimums +
   anti-coordination.
5. **Deliberation** — Polis-like consensus statements + disagreement maps.
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

Every red line holds: no winner, no ranking of people, no global source score,
no proclaimed neutrality, nothing deleted, AI in the audit trail, humans for
judgment, bridging for sensitive decisions.

## 22. The living source library (AI-first, community-vetted, reusable)

A verified source must not stay trapped in the debate that vetted it. The
compounding asset Parallax builds is a **living library of vetted sources** —
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

Once analyzed by enough people, a source becomes a **reusable library entry**
carrying its vetting with it: **verify once, cite everywhere.** Later debates
cite it without re-litigating it, and the assistant can **propose
already-vetted sources** from the library while a contributor builds an
argument — surfacing high-integrity evidence instead of leaving everyone to
start from a blank page.

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
