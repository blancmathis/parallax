---
context_room:
  id: research.verification-engine.evaluation-vertical-slice
  depends_on:
    - research.verification-engine.assurance-model
    - research.verification-engine.architecture
    - research.verification-engine.verification-protocol
    - research.verification-engine.threat-model
    - research.verification-engine.governance-workflows
    - research.verification-engine.scientific-claims-profile
---

# Evaluation and falsifiable vertical-slice protocol

## Summary

This document proposes the experiment that should decide whether the
verification-engine architecture deserves to be built further. It separates
three scopes that must never be conflated: a four-track `V0` corpus that tries
to falsify the architecture, a minimum executable slice (`MES`) containing
exactly one positive `T0` claim family, and a later pilot operating inside one
declared domain. The open-world-negative track is a mandatory safety suite for
every MES candidate, not a second product family. Together these scopes test
the trust path from claim compilation to a scoped research certificate or typed
abstention, while keeping every consequential judgment manual until measured
evidence justifies automating it.

The experiment does not try to prove that the engine is infallible. It asks
whether the proposed controls prevent critical overclaims, whether the system
beats simpler human and tool baselines on independently adjudicated cases, and
whether the improvement remains worthwhile after latency, expert time, provider
calls, licensing, monitoring, appeals, and user misunderstanding are counted.

The primary evidence is prospective, hidden, temporal, out-of-distribution, and
adversarial. Public benchmarks are development and diagnostic material only.
Every threshold, exclusion, analysis, and decision rule is frozen before the
hidden cases are opened. A result that does not meet its error budget by
abstaining fails; rejected cases and unselected cases remain in every
denominator.

This document is an **active research proposal**. It is not an accepted
Parallax contract, an implemented service, a production safety case, or
permission to issue public certificates.

## Defines

The proposed evaluation questions, benchmark tracks, corpus construction,
oracle and adjudication process, contamination controls, attack suite,
baselines, ablations, metrics, statistical bounds, promotion gates, live-shadow
study, resource accounting, replication package, and go, pause, narrow, and
kill decisions for the first vertical slice.

## Does not define

An approved implementation, final public wording, a universal truth metric, a
production error budget, a commercial service level, a legal basis for source
processing, a general scientific-certification service, or evidence that any
proposed numerical threshold has already been met.

## Status, dependencies, and evaluation boundary

- **Status:** `active` — preregistrable research proposal; no gate has passed.
- **Baseline date:** 2026-08-12.
- **Normative internal dependencies:** the [assurance model](assurance-model.md)
  owns claim-family ceilings, public outcomes, and abstention semantics; the
  [verification protocol](verification-protocol.md) owns stage and lifecycle
  contracts; the [architecture](architecture.md) owns canonical authority; the
  [threat model](threat-model.md) owns safety and rights boundaries; and the
  [governance workflow](governance-and-workflows.md) owns role separation.
- **Scientific boundary:** the first vertical slice does not issue scientific
  causal certificates. The future shadow experiment in the
  [scientific profile](scientific-claims-profile.md) is evaluated separately.
- **Production boundary:** all cases, keys, certificates, identities, and
  source fixtures in this protocol are research-only. Passing the experiment
  permits at most a controlled shadow phase under a new preregistration.

### Three non-interchangeable scopes

| Scope | Purpose and content | What passing it permits |
| --- | --- | --- |
| `V0 architecture-falsification corpus` | Four research tracks: bounded attribution, locally closed register lookup, deterministic calculation, and open-world-negative abstention. It exercises cross-cutting schema, protocol, threat, lifecycle, and evaluation assumptions. It is a portfolio of falsification fixtures, not a commitment to build four products at once. | A decision to reject, revise, or retain architectural assumptions and, at most, choose an MES candidate. |
| `MES — minimum executable slice` | Exactly **one** positive `T0` family selected prospectively from tracks A, B, or C after discovery. The selection requires lawful source access, a defensible oracle, stable closure or replay semantics, qualified review capacity, and an affordable operating path. Track D accompanies it only as a cross-cutting failure and abstention suite. | Construction and private evaluation of one bounded authority path; never automatic expansion to the other positive families. |
| `Pilot operational scope` | One declared use case inside the selected MES: one source universe or artifact class, one domain, one supported user language, named private users, fixed intake and exclusion rules, and no public certificate. | A controlled shadow operation for that exact scope. Any new family, domain, source universe, language, user population, harm tier, or public surface is a new experiment. |

The discovery decision record must name the chosen MES family and a preliminary
pilot candidate before implementation begins. The binding pilot scope is fixed
only after the MES itself passes its preregistered gates. If none of A, B, or C
meets every selection predicate, the result is `NO-MES`; the team does not
combine their easiest parts into an unregistered fourth family.

V0 may use a disposable, non-production executable research harness to replay
schemas, kernel predicates, lifecycle state transitions, and rendered fixtures.
That harness has no production credentials, public endpoint, retained user
data, or reusable service authority; it may also combine manual double-entry
with deterministic scripts. Building it is evaluation instrumentation, not
implementation of the MES or the product. V0 gates that name replay, atomicity,
or propagation apply to this isolated harness. Product code begins only after
MES selection and does not inherit a pass from the harness without its own
tests.

The vertical slice evaluates the following minimal authority path:

```text
scoped request
  -> immutable claim revision
  -> frozen method and search plan
  -> captured artifact or source snapshot
  -> exact evidence use and origin lineage
  -> independent judgments and adversarial challenge
  -> deterministic assurance-kernel decision
  -> research certificate or typed abstention
  -> expiry, correction, and supersession exercise
```

It does not require a native graph database, a vector database, a public
transparency log, automated expert judgment, general-Web ingestion, or a public
badge. Derived search may assist discovery, but the relational authority,
evidence vault, and deterministic kernel must be sufficient to execute and
replay the experiment.

## Decision the experiment must support

The study answers one build-or-narrow question:

> Does a versioned dossier, explicit countersearch, origin grouping,
> independent review, and deterministic issuance kernel reduce critical
> verification and communication errors enough to justify their full cost over
> a simpler evidence record or existing tool?

The decision cannot be made from average label accuracy alone. It requires all
of the following:

1. no failed hard invariant in the eligible promotion sample;
2. bounded critical-error risk at the selected coverage for each claim family;
3. safe abstention on cases where the world cannot be closed;
4. material improvement over the strongest simpler baseline;
5. correct user understanding of scope, time, evidence, and uncertainty;
6. replay, correction, and stale-state behavior that works end to end;
7. a sustainable operating envelope that includes failed and abstained cases;
8. an independent team's ability to reproduce the result; and
9. no unresolved rights, safety, or professional blocker for the tested scope.

Failure on a hard gate cannot be averaged away by speed, coverage, user
preference, or performance on another track.

## Preregistration record

Before anyone with access to benchmark labels runs the candidate system on the
hidden corpus, the study owner freezes and time-stamps one manifest containing:

- research questions, hypotheses, primary and secondary outcomes;
- exact case universe, sampling frame, inclusion rules, exclusions, and strata;
- case and origin grouping keys used to prevent train-test leakage;
- benchmark snapshot digests and the encrypted label-release procedure;
- claim-family profiles, public-outcome mappings, harm tiers, and ceilings;
- system, model, prompt, tool, search-index, source, trust-store, and policy
  versions;
- baseline and ablation implementations, including human instructions;
- stochastic-run count, seeds, timeout, retry, and provider-failure rules;
- attack fixtures and which attacks remain secret until evaluation;
- every metric, denominator, error class, confidence interval, multiplicity
  rule, subgroup, and missing-data treatment;
- numerical gates, non-inferiority margins, remediation limit, and decision
  table;
- planned statistical code and machine-readable output schema;
- disclosure, rights, security, and incident plan; and
- named parties permitted to amend, execute, adjudicate, audit, and unblind.

The manifest receives a cryptographic digest and an external timestamp or
read-only registration. Registration proves that the bytes existed at that
time; it does not validate the method. Any amendment is append-only, justified,
signed before the affected labels are revealed, and reported in both the final
analysis and the public artifact. Outcome-switching after unblinding is
exploratory, never confirmatory. The [OSF registration model](https://help.osf.io/article/330-welcome-to-registrations)
is one possible timestamped record; an internal equivalent must provide the
same immutable version evidence.

## Evaluation unit and error taxonomy

### Case unit

One case is not a natural-language question alone. It is the immutable tuple:

```text
case_id
claim_revision
claim_family and world model
intended use and harm tier
source or source-universe snapshot
allowed acquisition surface
method and policy versions
expected stage decisions
oracle dossier and adjudication record
dependency changes and expiry exercise
```

Near-duplicates, reports from one underlying event, translations, amendments,
and adversarial transformations share an `origin_group_id`. Splits happen at
the origin-group level. A hundred mutations of one source do not count as a
hundred independent observations of risk.

### Error severity

Every observed defect is assigned before aggregate analysis:

| Class | Definition | Examples | Decision effect |
| --- | --- | --- | --- |
| `critical_harmful_issue` | The system issues or serves a materially stronger or different conclusion than the adjudicated contract permits. | Wrong subject, polarity, quantity, unit, date, valid-time window, local-closure assertion, decisive evidence, origin independence, replay result, current status, or rights state. | Immediate hard-gate failure and incident review. |
| `critical_control_bypass` | A forbidden actor, model, stale revision, policy change, or projection causes issuance despite a failed predicate. | Reviewer approves own work; model writes canonical status; expired source still issues; stale projection becomes authority. | Immediate hard-gate failure. |
| `material_dossier_error` | The public outcome remains within its ceiling, but evidence, rationale, uncertainty, or auditability is materially incomplete or misleading. | Missing limitation, wrong exclusion reason, unresolved transformation warning, incorrect but non-decisive lineage edge. | Fails the affected metric and may require pause. |
| `minor_error` | The defect does not change interpretation, action, replay, rights, or audit. | Non-semantic typography or redundant metadata. | Reported separately; never used to hide material errors. |
| `safe_abstention` | A required gate blocks a stronger result and the reason and next action are correct. | Open-world negative lacks closure; source or competence unavailable. | Successful controlled outcome, but counts against coverage and cost. |
| `excess_abstention` | The system abstains where the complete case permits the requested bounded outcome. | Fails to resolve a clean register hit. | Coverage and utility error, not a safety success. |

Severity is adjudicated without showing reviewers which system or baseline
produced the output. Disagreement is preserved and resolved by a separate
adjudicator. The primary endpoint counts a case at its highest observed
severity; one case cannot be diluted by many correct fields.

## Four benchmark tracks

The first slice has three closed or locally closed tracks and one deliberately
open track. Each track contains positive, negative, ambiguous, invalid,
superseded, and abstention cases.

### Track A — documented attribution in a bounded artifact

**Question:** Did the identified actor or artifact contain this exact scoped
statement, in the asserted context, in this captured version?

The oracle is a frozen artifact with validated bytes, a speaker or author
identity record, exact locator, surrounding context, and independently checked
transcript or text. Cases come from rights-cleared official records, such as
legislative transcripts, regulator releases, institutional recordings, and
company filings. Synthetic mutations are paired with real artifacts but never
substitute for natural cases.

The strongest permitted outcome is `attribution_confirmed`. It does not imply
that the attributed statement is factually correct. Required adversarial cases
include omitted negation, quotation-boundary shift, wrong speaker, translated
modality change, edited audio, OCR substitution, updated page, and a genuine
quote placed in misleading surrounding context.

Primary track failures are a materially wrong attribution, an unresolved
locator presented as resolved, or public wording that turns attribution into
truth.

### Track B — versioned registry lookup under local closure

**Question:** Is the scoped fact present or absent in the named complete
register snapshot under its declared identity and query rules?

The primary corpus uses official, redistributable, versioned snapshots with an
explicit coverage statement. Candidate sources include the
[GLEIF data portal](https://www.gleif.org/en/lei-data)
and other official registers only after their closure, version, licence,
pagination, and identity semantics have been documented. A live API without a
retained snapshot is not sufficient for a historical oracle.

The strongest permitted outcomes are `confirmed_in_bounded_source` and
`absent_from_bounded_source`; a profile may render the latter as “absent from
the named register snapshot at the stated time,” but may not mint a new
epistemic outcome code. Neither permits “the entity
does not exist in the world.” Required attacks include aliases, Unicode
confusables, duplicate and lapsed identifiers, pagination truncation, schema
change, wrong snapshot, late update, incomplete regional shard, `200` with an
empty body, and a source that falsely appears authoritative.

Primary track failures are an invalid closure, a present/absent inversion, a
historical/current-time confusion, or a global conclusion derived from the
local register.

### Track C — deterministic calculation over frozen inputs

**Question:** Does the declared result follow from identified inputs, units,
code, environment, and tolerance, and can an independent execution reproduce
it?

Cases use rights-cleared public data snapshots and executable transformations.
Candidate sources include [SEC EDGAR data APIs](https://www.sec.gov/edgar/sec-api-documentation)
and [Eurostat data services](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction),
but every case freezes the exact source response, schema, transformation, and
licence. The oracle is produced by two independently implemented calculations,
with discrepancies adjudicated before inclusion.

The strongest permitted outcome is `reproduced_on_inputs`. It does not validate
the source measurement, accounting definition, model choice, or real-world
interpretation. Required attacks include wrong denominator, unit and currency
conversion, percent versus percentage point, locale-specific decimal parsing,
time zone and cutoff, missing-value coercion, duplicate rows, overflow,
floating-point tolerance, nondeterminism, spreadsheet formula injection, and a
changed upstream schema.

Primary track failures are a numerically material wrong result, a result outside
the declared tolerance, non-replay presented as replay, or a public statement
that generalizes beyond the frozen inputs.

### Track D — open-world negative requiring abstention

**Question:** Does the system refuse to infer universal absence from an
incomplete search?

Cases assert forms such as “no study reported X,” “no incident occurred,” “no
contrary document exists,” or “nobody made this statement.” The available
surface deliberately contains plausible search results but no valid closure
over the world. Some cases hide a discoverable counterexample; others leave the
underlying truth unresolved. The oracle is therefore behavioral: whether the
claim has a valid closure, whether the bounded search was executed as declared,
and whether the run ended `abstained` with a canonical reason such as
`closure_unproven`, `evidence_inaccessible`, or `coverage_insufficient`.

The dossier may say that no counterexample was found under the recorded plan
and cutoff. It may not issue the universal negative. The [OWL 2 open-world
model](https://www.w3.org/TR/owl2-primer/) provides the relevant semantic
boundary; systematic-search guidance likewise treats discovery as extensive
but practically bounded rather than omniscient
([Cochrane Handbook, chapter 4](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04)).

Primary track failures are any invalid negative issue, a provider error treated
as absence, hidden inaccessible source classes, or a search-completion claim
stronger than the logged plan.

## Corpus construction

### V0 architecture-falsification corpus

V0 contains **1,500 independently adjudicated cases**. “Independently
adjudicated” describes the oracle process; it does not mean that every case is
statistically independent. The inferential unit is the `origin_group_id`.

| Track and case origin | Total | Development | Internal validation | Hidden temporal/OOD | External replication |
| --- | ---: | ---: | ---: | ---: | ---: |
| Track A natural | 300 | 120 | 60 | 60 | 60 |
| Track B natural | 300 | 120 | 60 | 60 | 60 |
| Track C natural | 300 | 120 | 60 | 60 | 60 |
| Track D natural | 300 | 120 | 60 | 60 | 60 |
| Track A adversarial | 75 | 30 | 15 | 15 | 15 |
| Track B adversarial | 75 | 30 | 15 | 15 | 15 |
| Track C adversarial | 75 | 30 | 15 | 15 | 15 |
| Track D adversarial | 75 | 30 | 15 | 15 | 15 |
| **Total** | **1,500** | **600** | **300** | **300** | **300** |

The number `300` for a natural track is the **whole-corpus** allocation, not the
count in either confirmatory split. No artifact, event, source family,
translation, template, or adversarial mutation may cross partitions through a
shared origin group. If grouping reduces a cell below its planned count, the
cell is replenished before unblinding; cases are never borrowed from another
cell.

Every confirmatory result is reported separately for:

```text
track
x split {hidden_temporal_ood, external_replication}
x case_origin {natural, adversarial}
x oracle_opportunity {issue_permitted, abstention_required}
```

Tracks, splits, natural/adversarial cases, and opportunity classes are never
pooled to satisfy a gate or tighten a rare-error bound. Language, source class,
time stratum, harm tier, and attack class are additional reported subgroups. A
subgroup becomes confirmatory only if its minimum effective sample size and
multiplicity treatment were preregistered.

At least 60 percent of natural cases are sourced after the public benchmark and
prompt-development cutoff. At least 30 percent of each natural confirmatory
track is temporal or source-family out of distribution. Where language is
semantically operative, the target mix is applied separately within each track
and distributed across both confirmatory splits: 30 percent French, 30 percent
English, 15 percent Spanish, 15 percent German, and 10 percent from a
preregistered low-resource or domain-specific language stratum for which
qualified adjudication is available.
Source language, claim language, and transformation language are separate
fields. A translated version stays grouped with its origin.

The corpus must include at least:

- 20 percent cases whose safe result is abstention or a weaker outcome;
- 20 percent cases with a material time, scope, identity, or definition trap;
- 15 percent cases containing a real source correction or later version;
- 15 percent cases with at least two URLs but one observation origin;
- 10 percent cases requiring non-English source evidence;
- 10 percent cases with an acquisition or transformation failure; and
- 10 percent cases selected from low-attention sources rather than popular or
  benchmark-like material.

These properties may overlap. They are reported by track and split, not only
for the corpus as a whole. The final report publishes case and independent
origin-group counts so paired attacks do not inflate effective sample size.

Under this allocation, a natural confirmatory cell contains at most 60
independent origin groups and an adversarial confirmatory cell at most 15. With
zero failures, those maxima imply one-sided 95-percent upper bounds of about
4.87 percent and 18.10 percent respectively. Fewer independent groups or fewer
actual issues weaken the bound. V0 therefore cannot substantiate a production
failure-rate claim; it can only falsify the design or support prospective MES
selection.

### Promotion corpus is determined by the declared harm budget

A later promotion study does not reuse V0 hidden cases. Its required sample is
computed from the maximum acceptable critical-error rate, confidence level,
anticipated certificate coverage, origin clustering, and the exact reporting
cells defined below. It must contain enough **eligible issue opportunities**,
not merely enough submissions, abstentions, fields, or adversarial mutations.

There is deliberately no single promotion-corpus total. The preregistration
must give the required count for every
`track x confirmatory split x natural/adversarial` cell and every material
subgroup inside the proposed deployment scope.

If a positive-family cell is held to a 0.1-percent critical-issue budget with
one-sided 95-percent confidence and a zero-error design, that cell alone needs
at least 2,995 independently **issued** origin groups. At 85-percent requested-
outcome coverage, planning requires at least 3,524 eligible issue opportunities
before clustering, reserve, or attrition.

The hidden and external cells must each meet their requirement independently;
natural and adversarial cells are not pooled. The open-world-negative track
instead sizes on required-abstention opportunities and invalid-negative-issue
risk. A smaller denominator cannot be repaired by adding easy cases from
another track or split, or by changing the advertising claim.

### Development benchmarks

Public datasets are useful for tooling, regression, and failure discovery but
do not establish deployment safety:

- [FEVER](https://aclanthology.org/N18-1074/) tests evidence retrieval and
  verification in a frozen Wikipedia corpus;
- [SciFact](https://aclanthology.org/2020.emnlp-main.609/) tests scientific
  evidence retrieval and rationale selection over abstracts;
- [AVeriTeC](https://proceedings.neurips.cc/paper_files/paper/2023/hash/cd86a30526cd1aff61d6f89f107634e4-Abstract-Datasets_and_Benchmarks.html)
  provides real-world claims and Web evidence with known gold incompleteness;
  and
- [ContractNLI](https://aclanthology.org/2021.findings-emnlp.164/) supplies
  document-level entailment cases with explicit evidence spans.

Their labels, claims, sources, and common derivatives may have appeared in
model training. They remain outside the primary promotion estimate and are
reported in a separate “public benchmark” panel.

## Split, concealment, and contamination controls

### Split policy

The exact allocation is defined in the V0 table above. Development and internal
validation may be used before final preregistration. The hidden temporal/OOD
set is opened once by the internal evaluation team. External replication
remains inaccessible to the engine team and is opened only by the independent
replicator.

No source artifact, underlying event, dataset, registry record, report family,
translation, template, or synthetic transformation may cross partitions.
Cases created from one origin remain in one partition. Hidden temporal/OOD and
external replication are independent confirmatory splits: their numerators,
denominators, confidence bounds, and decisions are reported separately. They
cannot be combined to rescue a failed split. Natural and adversarial cases are
likewise reported separately.

### Contamination register

For every case, the curator records publication date, public discoverability,
known benchmark ancestry, exact-string search results, near-duplicate hashes,
and whether a tested model provider can plausibly have trained on it. Model
providers' unknown training data are recorded as `unknown`, never `clean`.

Primary protection comes from process rather than claimed model memory:

- most confirmatory cases are created or resolved after the development
  cutoff;
- gold records live in an isolated store unavailable to retrieval and model
  tools;
- benchmark URLs, labels, and adjudicator notes are blocked at the network and
  tool boundary;
- canary phrases and access logs detect attempted retrieval of the label store;
- prompts and search plans are frozen before case identifiers are revealed;
- evaluation workers cannot edit the candidate system or its policies;
- stochastic providers run from captured request envelopes and version
  identifiers; and
- any discovered leakage triggers a declared contamination incident, removal of
  the entire origin group before unblinding where possible, and replacement
  from the sealed reserve.

If contamination is discovered after labels are opened, the affected result is
reported but excluded from confirmatory inference. The study is not silently
rebalanced to restore a desired conclusion.

## Oracle and independent adjudication

### Oracle types

No single gold-label method is credible across all four tracks:

| Track | Primary oracle | Remaining uncertainty |
| --- | --- | --- |
| Attribution | Exact retained bytes, independently validated transcript/text, speaker or author record, locator, and context. | Authentic official records may still contain errors; attribution does not establish factual truth. |
| Register | Retained authoritative snapshot, completeness declaration, schema, identity rules, and two independent query implementations. | The authority's closure assertion or data may itself be wrong. |
| Calculation | Frozen inputs plus independently written reference implementations and tolerance analysis. | Inputs, definitions, and model choice may not represent the world. |
| Open-world negative | Independent decision on whether closure exists and whether the requested wording requires abstention; prospective counterexample and later-outcome search where possible. | The universal proposition often remains unknowable, by design. |

The oracle therefore adjudicates the **permitted certificate**, not metaphysical
truth. A closed-source result can be exact inside its trust boundary while the
world outside that boundary remains uncertain.

### Adjudication workflow

1. Two qualified annotators independently compile the claim, select the family,
   inspect the full oracle packet, and propose the strongest permitted outcome.
2. They independently mark every critical field, evidence use, origin group,
   search gap, and failure severity before seeing one another's answers.
3. A third adjudicator reviews disagreements using the original sources, not a
   system-produced dossier.
4. A domain specialist joins registry, statistical, language, or scientific
   cases when the profile requires that competence.
5. The panel may label a field `genuinely_disputed`, `unknown`, or
   `not_adjudicable`; it is not forced into a binary gold label.
6. Cases with unstable claim identity leave the accuracy headline but remain in
   the scope-resolution and workload analysis.
7. All individual judgments, discussion changes, conflicts, source accesses,
   and final reasons remain versioned.
8. A random ten percent and every critical-error candidate receive a second
   external audit.

Inter-annotator agreement is reported by field and severity, but agreement does
not validate the oracle. The final release includes a challenge window and an
errata ledger. Gold changes create a new benchmark version; historical scores
are not recomputed without labeling the new oracle version.

## Adversarial and failure-injection suite

At least half of the attack cases remain secret until the candidate is frozen.
Each attack is run both against its target stage and end to end. The attack
manifest includes the expected safe state, detection proof, and cleanup proof.

| Attack surface | Required cases | Required safe behavior |
| --- | --- | --- |
| Claim semantics | Negation, quantifier, modality, causal force, entity collision, alias, date, unit, denominator, threshold, and translated qualifier changes. | Create a different claim, request clarification, or abstain; never inherit the original certificate. |
| Acquisition | SSRF target, redirect chain, oversized archive, parser exploit fixture, MIME mismatch, truncated pagination, `200` empty body, `404`, `429`, paywall, and source timeout. | Quarantine or typed failure; provider error never becomes absence. |
| Prompt and tool injection | Instructions embedded in HTML, PDF, metadata, OCR, spreadsheet cells, and retrieved text. | Treat content as data; no new tool authority, secret access, policy change, or canonical transition. |
| Evidence fidelity | Quote boundary shift, wrong table header, hidden footnote, edited clip, translation drift, unit omission, and authentic passage used for an unrelated claim. | Reject or lower applicability; exact locator and context remain visible. |
| Retrieval and corpus | Search-engine ranking poison, SEO mirror swarm, missing language, archive gap, query mutation, suppressed null result, and late correction. | Preserve plan/run difference, inaccessible space, and bounded stopping reason; abstain when coverage gate fails. |
| Origin lineage | Syndication, press-release copies, circular citations, shared dataset, shared witness, common funding, and coordinated model-generated sources. | Collapse to the underlying origin or retain `dependence_unresolved`; source count cannot raise assurance. |
| Calculation | Locale parse, integer overflow, floating tolerance, nondeterministic library, timezone, duplicate row, stale cache, formula injection, and dependency substitution. | Independent replay fails closed or reproduces the declared result exactly within tolerance. |
| Review and governance | Self-review, hidden conflict, stolen credential, colluding reviewers, unqualified expert, policy downgrade for one case, adjudicator reuse, and appeal assigned to original issuer. | Role and conflict predicates block the transition and create an audit event. |
| Lifecycle | Source correction, registry delta, retraction, expired TTL, key compromise, rights restriction, model change, outbox delay, and stale public cache. | Create the correct review, stale, restriction, or withdrawal event; never silently invert or continue serving current status. |
| Presentation | Bare “true,” hidden scope, collapsed assurance vector, misleading green badge, wrong-label injection, and superseded certificate deep link. | Rendering conformance fails or the user sees issuer, scope, time, status, limitations, and correction path. |
| Tenant and privacy boundary | Cross-tenant ID/hash probes, cache and embedding leakage, low-entropy digest oracle, unauthorized export, secret in a model prompt, restored-deleted payload, backup replay, and erasure/key-destruction request. | Deny without confirming possession; emit no cross-tenant signal; quarantine exposure; deletion/restriction receipts survive restore without restoring the protected payload. |
| Rights and data-governance | Access allowed but retention forbidden, TDM reservation, paywall/auth bypass request, cumulative database extraction, quotation versus redistribution mismatch, expired licence, DSAR clock, and personal-data breach clock. | Independent operation-specific rights gates fail closed; no unlawful vault/export; exact legal clock/case opens; ordinary failure never substitutes for a rights or privacy decision. |
| Person and publication harm | Indirect identification, private fact, unproven allegation, criminal insinuation, defamatory snippet, detached share card, autocomplete amplification, subject reply, and urgent depublication request. | T3/T4 path refuses or restricts public issue; legal/safety review and subject/appeal lane open; cached and downstream projections receive the safe status. |
| Cryptographic transparency | Omitted leaf, reordered/truncated log, equivocated checkpoint, stolen/rotated signer or TSA, unknown compromise time, invalid inclusion path, dictionary attack against a commitment, and monitor/witness collusion. | Report each proof property separately; suspend the affected interval; detect the injected fork where the profile claims detection; never convert integrity or time proof into epistemic support. |
| Source and media impersonation | Typosquat, homoglyph domain, cloned official page, compromised genuine endpoint, forged DOI/identity, unsigned genuine media, validly signed false content, deepfake, and context transplant. | Keep origin/integrity/content-support dimensions separate; quarantine unresolved identity; require profile-specific corroboration; abstain rather than trust branding, signature, or detector score. |

Indirect prompt injection is a demonstrated class of tool-using model failure,
not a hypothetical parsing detail
([Greshake et al.](https://arxiv.org/abs/2302.12173)). Retrieval poisoning can
also manipulate retrieval-augmented systems
([PoisonedRAG](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag)).
The attack taxonomy should be mapped to the current
[NIST adversarial machine-learning taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final),
while project-specific issuance and governance attacks remain first-class.

## Baselines and ablations

### Baselines

The candidate is compared against realistic alternatives, not an intentionally
weak search box:

| ID | Baseline | Contract |
| --- | --- | --- |
| `B0-direct` | Competent user with the authoritative source, browser, spreadsheet/calculator, and no engine. | Establish whether the bounded case is already trivial. |
| `B1-template` | Trained human researcher using a structured evidence template, source archive, and second-review checklist. | Strongest simpler dossier baseline; primary cost and quality comparator. |
| `B2-expert` | Qualified domain expert following their normal professional workflow. | Measures whether the engine adds value beyond expertise for applicable cases. |
| `B3-model` | Current capable model with Web/tool access and a fixed evidence-grounded prompt, but no canonical dossier or kernel. | Measures the value and risk of model-only assistance. |
| `B4-retrieval` | Candidate retrieval and evidence workspace with no independent review or issuance kernel. | Separates discovery benefit from assurance controls. |
| `B5-factcheck` | Trained professional fact-check team follows its ordinary editorial workflow: claim selection, original-source search, source contact where appropriate, drafting, editorial review, rating/explanation, corrections, and publication, without the engine's canonical kernel. | Explicitly tests whether the engine improves on classic fact-checking rather than merely on a generic expert or evidence template; report where organizational selection and public-rating contracts make cases incomparable. |

Human cases use randomized, counterbalanced assignment by difficulty, language,
and origin group. Reviewers do not evaluate the same origin in multiple arms.
The oracle and system identity remain blinded. Stochastic model baselines run
three captured repetitions; the preregistered primary result is the first run,
and the other two quantify instability rather than provide best-of-three
selection.

### Causal ablations

The following ablations are evaluated on disjoint counterbalanced case sets:

- no frozen counterevidence plan;
- no origin-lineage grouping;
- no independent reviewer;
- immediate deliberation instead of blind-first review;
- reviewer publication without the deterministic kernel;
- no exact artifact capture or version pinning;
- no AI assistance;
- scalar public label instead of the assurance vector and scoped wording;
- no lifecycle monitor or dependency propagation; and
- no random coverage sample outside risk-ranked work.

An ablation is promoted only if it improves the declared outcome without
crossing a safety, fairness, comprehension, or cost non-inferiority margin. A
component is not justified because removing it makes one benchmark score lower;
the causal unit is the complete case outcome and its operating burden.

## Metrics and mandatory denominators

### Stage metrics

| Stage | Primary measurements |
| --- | --- |
| Claim compilation | Critical semantic-change rate; exact field accuracy for subject, predicate, polarity, quantifier, modality, entity, time, geography, unit, denominator, threshold, and definitions; clarification recall; unnecessary split/merge rate. |
| Acquisition and integrity | Successful complete-capture rate; typed error accuracy; digest and signature-validation accuracy; pagination completeness; unsafe-content containment; rights-state correctness. |
| Evidence localization | Exact-locator resolution; material citation-fidelity precision and recall; context, polarity, and scope applicability; transformation error rate. |
| Retrieval and countersearch | Evidence recall only where a defensible eligible universe exists; decisive-counterevidence recall; candidate precision; inaccessible-class disclosure; search-plan deviation; saturation and stop-rule adherence. |
| Origin lineage | Pairwise edge precision/recall, cluster metrics, false-independent-origin rate, unresolved-lineage rate, and assurance changes caused by grouping. |
| Method and inference | Profile-selection accuracy; ceiling violations; inferential-warrant error; sensitivity to defensible assumptions; specialist disagreement and adjudication change. |
| Review | Pre-deliberation agreement, critical-error interception, conformity shift, reviewer reversal, time, workload, competence mismatch, conflict detection, and dissent retention. |
| Kernel and issuance | Predicate coverage; false issue; false block; stale-input rejection; deterministic replay; atomicity; rendering parity; forbidden-role bypass. |
| Lifecycle | Trigger recall, time to `needs_review`/`stale`/`restricted`, affected-set accuracy, consumer notification and acknowledgement, stale-serving duration, appeal reversal and correction propagation. |

Retrieval recall is never reported for an open Web universe whose eligible set
is unknown. In those cases the study reports discovered counterexamples,
capture-recapture or sampling estimates where defensible, source-class
coverage, and the explicit unknown space.

### End-to-end selective risk and mandatory denominators

The oracle classifies every case before candidate output is revealed:

- `eligible_case`: admitted under frozen inclusion rules, whether the candidate
  succeeds, abstains, refuses, times out, or fails;
- `eligible_issue_opportunity`: an eligible case for which the oracle permits
  the requested bounded certificate under the frozen profile;
- `required_abstention_opportunity`: an eligible case for which the requested
  certificate is forbidden and a typed abstention is required;
- `actual_issue`: any certificate emitted or served, including a forbidden or
  erroneous issue;
- `correct_requested_issue`: an actual issue matching the permitted outcome,
  scope, time, source, and ceiling; and
- `critical_harmful_issue`: an actual issue containing the corresponding
  adjudicated critical defect.

Track D has no `eligible_issue_opportunity` for its requested universal
negative. A bounded statement such as “no counterexample was found under this
recorded search” is a different claim revision, never a successful universal-
negative issue.

For every confirmatory cell `c`, report:

```text
requested_outcome_coverage_c
  = correct_requested_issues_c / eligible_issue_opportunities_c

conditional_critical_risk_c
  = critical_harmful_issues_c / all_actual_issues_c

population_critical_issue_rate_c
  = eligible_cases_with_any_critical_harmful_issue_c / eligible_cases_c

forbidden_issue_rate_c
  = forbidden_actual_issues_c / required_abstention_opportunities_c

safe_abstention_recall_c
  = correct_typed_abstentions_c / required_abstention_opportunities_c

excess_abstention_rate_c
  = issue_permitted_cases_without_a_correct_requested_issue_c
    / eligible_issue_opportunities_c
```

A zero denominator is `not_applicable`, never zero risk or 100-percent
success. Timeouts, provider refusals, lost artifacts, policy blocks, and
candidate failures remain in their frozen opportunity denominator. Every table
includes `N_cases`, `N_origin_groups`, `N_eligible_issue_opportunities`,
`N_actual_issues`, `N_correct_requested_issues`,
`N_required_abstention_opportunities`, `N_correct_typed_abstentions`,
`N_forbidden_issues`, and `N_critical_harmful_issues`.

The primary inferential unit is the independent origin group. If one origin
produces several cases or outputs, the group fails when any member has the
relevant failure. Item-level results remain diagnostic. Conditional risk is
interpretable only beside requested-outcome coverage; a risk gate fails when
its coverage gate fails even if no critical issue was observed.

Risk-coverage curves are produced by varying only a preregistered policy gate,
never by retrospectively deleting difficult cases. Curves are reported per
claim family, language, source class, time stratum, harm tier, and attack class,
with origin-group bootstrap intervals. This follows the selective-prediction
principle that lower risk usually costs coverage
([El-Yaniv and Wiener](https://www.jmlr.org/papers/volume11/el-yaniv10a/el-yaniv10a.pdf)).

### Calibration and uncertainty

The engine has no universal probability-of-truth score. Calibration is tested
only for a defined probabilistic field or for the empirical reliability of a
specific bounded outcome in a named population and period. Report Brier score,
log loss where probabilities are proper, reliability diagrams, calibration-in-
the-large, slope, and maximum material subgroup deviation. Expected
calibration error is secondary because binning can hide failure.

Calibration is repeated on temporal and source-family shift. A model or policy
that is calibrated in development but fails under shift is labeled
`out_of_distribution` and cannot borrow the old calibration claim. This is
consistent with evidence that uncertainty methods degrade under dataset shift
([Ovadia et al.](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html))
and with the grouped domain-shift design of
[WILDS](https://proceedings.mlr.press/v139/koh21a.html).

### User comprehension and decision harm

A preregistered randomized study compares:

1. the scoped certificate and assurance vector;
2. the same dossier with a scalar `true/false`-style label; and
3. an evidence-only control with no conclusion label.

Participants include ordinary readers, professional evidence users, and API
integrators. Correct, deliberately incorrect, provisional, stale, superseded,
abstention, `not_evaluated`, `pending`, `out_of_scope`, and `expired` displays
are included under ethics-approved deception and full debriefing. Primary
questions test whether users understand:

- what exact proposition was evaluated;
- whether the result concerns attribution, a bounded source, computation, or
  real-world truth;
- the valid time and expiry;
- which evidence and assumptions were included;
- what remains unknown;
- whether action should wait for qualified review; and
- what changed after a correction or withdrawal.

For every vignette, adjudicators freeze the real `permitted_actions`,
`unsafe_actions`, and reason before exposure. Behavior is measured before
comprehension questions. Primary endpoints are critical-field comprehension,
harmful reliance on a false or non-current display, appropriate use of a
correct/current display, correction recovery, seven-day retention, and API-to-
human rendering conformance. Tests explicitly measure **spillover**: whether a
correct attribution, registry, or calculation badge causes users to infer that
the underlying real-world proposition is true.

The preregistered UX harm budget is derived from the action consequences, not
from a generic convenience margin:

- for any critical false label that could trigger the declared high-consequence
  action, the acceptable incremental harmful-reliance margin is **zero**; both
  the observed count and the one-sided interval are reported, and one event is
  a hard failure for that scope;
- for lower-consequence actions, the absolute candidate-minus-evidence-only
  margin is computed from a preregistered damage budget: maximum tolerable harm
  divided by the adjudicated harm per unsafe action and expected exposure. It
  may not exceed three percentage points;
- each critical scope/status item must have point accuracy at least 90 percent
  and a one-sided 95-percent lower bound at least 85 percent in every authorized
  user class and language;
- correction recipients must reach a safe real action, not merely recall a
  notice: at least 90 percent notice uptake and at least 90 percent safe-action
  recovery in-session, with seven-day safe-action retention at least 85 percent
  and a one-sided lower bound at least 80 percent;
- the API/integrator harness preserves 100 percent of claim, outcome type,
  scope, time, current status, limitations, and correction route through every
  supported transform; stripping, substituting, or promoting any field is a
  hard presentation failure; and
- subgroup results are never pooled to conceal harm. A planned subgroup without
  its minimum effective sample is `not_evaluated`; an incomplete run is
  `pending`; excluded use is `out_of_scope`; elapsed validity is `expired`.
  None can be rendered as verified, safe, or passed.

Appropriate use on correct/current displays must be non-inferior to evidence-
only by the damage-derived margin and improve at least one preregistered real
workflow endpoint by its minimum worthwhile effect. Otherwise the additional
authority cue has no demonstrated value. These are project hypotheses, not
established human-factors standards. Sample size is powered from a blinded
feasibility and variance run-in; run-in participants do not enter confirmatory
analysis.

Warning labels can change judgments even when the labels are wrong, so false
positive influence is a primary safety outcome rather than a cosmetic UX issue
([Horne et al.](https://pubmed.ncbi.nlm.nih.gov/40263336/)).

### Cost, latency, calls, and capacity

Every case records, including failures and abstentions:

- human minutes by task and role, calibration, adjudication, appeal, incident,
  and monitoring work;
- queue delay, active work time, end-to-end latency, and time to first safe
  provisional packet;
- model/provider name and version, requests, retries, cached and uncached
  tokens, tool calls, timeouts, and billed cost;
- search/API calls, downloaded bytes, database/full-text fees, and rate-limit
  delay;
- compute seconds, peak memory, storage, egress, replay, and backup cost;
- licensed-source and reviewer fixed capacity cost allocated under a published
  rule;
- failed-job, duplicate, abuse, and correction overhead; and
- marginal cost per submitted, resolved, issued, safely abstained, monitored,
  appealed, and corrected case.

Results report median, p90, p95, tail maximum, and origin-group uncertainty,
not just the mean or cost of successful issues. Provider prices are frozen in
a dated price sheet and accompanied by actual invoiced spend.

Before unblinding, the study freezes: the minimum worthwhile reduction in
material-or-worse error; maximum fully loaded total and p95 case cost; maximum
p95 reviewer time and end-to-end latency; target organizations' willingness to
pay or independently evidenced avoided cost; a 12-month support horizon; and
an incident reserve covering the upper-bound appeal, correction, provider-
failure, monitoring, and security workload. Satisfaction, intention, or a
statistically significant but practically trivial difference is not value.

Proposed V0 operating gates are all conjunctive:

- a private provisional packet at p95 within 15 minutes for bounded cases,
  with outages retained in the all-intake denominator and reported separately;
- a reviewed bounded case at p50 within one business day and p95 within five
  business days;
- median qualified-human time at most 75 percent of `B1-template`, with the
  one-sided 95-percent upper bound at most 85 percent and no safety or
  comprehension regression;
- the candidate must improve material-or-worse error by the preregistered
  minimum worthwhile effect. If it costs more than `B1-template`, the one-sided
  upper bound on incremental fully loaded cost per material error prevented
  must stay below the frozen willingness-to-pay or avoided-cost ceiling;
- total fully loaded cost per eligible intake, p95 case cost, p95 qualified-
  reviewer minutes, and p95 end-to-end latency must each stay within its
  absolute funded cap, and total cost may never exceed twice `B1-template`; no
  “safety benefit” exception overrides any cap;
- the observed operating envelope, stressed at the 95-percent upper bounds for
  incident, appeal, correction, provider-failure, and monitoring frequency,
  remains funded for 12 months including the incident reserve; and
- before public build consideration, at least three independent target
  organizations complete a blinded paired workflow trial and at least two
  choose the candidate at a price covering variable cost plus the declared
  share of review, support, and monitoring capacity.

If the measured error benefit is zero or adverse, incremental cost per error
prevented is undefined and the value gate fails. If a track misses either the
minimum worthwhile effect, total cap, p95 cap, funding horizon, or revealed-
preference gate, it is narrowed or killed; another track cannot subsidize its
evaluation result. The project may pivot only to a narrower evidence-dossier or
citation-audit product whose own cost, harm, and user-value gates are newly
preregistered.

These are falsification budgets, not service promises. If real source access or
qualified review makes them unrealistic, the study reports that operational
fact and narrows the product rather than excluding slow cases.

## Statistical analysis and rare-error claims

### Primary analysis

Primary analyses are executed independently in every preregistered
`track x split x natural/adversarial x oracle-opportunity` cell. No primary
estimate pools tracks, hidden and external splits, natural and adversarial
cases, or issue-permitted and required-abstention opportunities. An exploratory
hierarchical model may examine shared effects but cannot satisfy a gate or
transfer a reliability claim. For binary critical outcomes, report exact
one-sided bounds at the independent-origin-group level and a stratified paired
comparison where systems receive equivalent cases. For clustered and repeated
cases, a preregistered hierarchical model or cluster bootstrap is diagnostic;
the naive item count is never presented as independent evidence.

For time and cost, report paired distributions, tail quantiles, and robust
intervals. For user outcomes, use the preregistered non-inferiority or
superiority model with participant and case random effects. Missing outputs,
timeouts, provider refusals, and lost artifacts receive their declared failure
or abstention state; they are not dropped as missing-at-random.

The confirmatory family is:

1. per-track critical harmful issue risk;
2. open-world safe-abstention recall;
3. end-to-end replay and kernel bypass;
4. difference from `B1-template` in critical/material case error;
5. user harmful-reliance non-inferiority; and
6. cost and human-time feasibility.

Hard invariants require all to pass. Other confirmatory comparisons use a
Holm-adjusted family-wise error rate of 0.05. Exploratory subgroup findings are
labeled and carried into a new prospective test rather than converted into a
gate after inspection.

### Zero-observed-error bounds

If primary cell `c` contains `n` independent origin-group opportunities and
zero observed failures, its one-sided upper confidence bound is:

```text
upper_bound_c = 1 - alpha_c^(1 / n)
```

`alpha_c` is the preregistered cell-level error allocation preserving the
simultaneous confidence claim across primary cells. Silently running many
95-percent cell intervals and describing the collection as a simultaneous
95-percent result is forbidden.

Useful planning values are:

| Confidence | Desired upper bound | Minimum zero-error opportunities |
| ---: | ---: | ---: |
| 95% | 0.50% | 598 |
| 95% | 0.10% | 2,995 |
| 99% | 0.10% | 4,603 |
| 99% | 0.01% | 46,050 |

For V0, the strongest possible zero-error bound in a natural confirmatory cell
uses at most 60 independent origin groups, about 4.87 percent one-sided at 95
percent before multiplicity adjustment; an adversarial cell has at most 15,
about 18.10 percent. With any observed failure, the exact Clopper-Pearson upper
bound is used. Clustering, common sources, shared models, or one reviewer can
make the effective sample smaller, never larger.

For a later zero-error promotion design, the actual denominator for conditional
critical risk is independently **issued** origin groups, not submissions or
oracle-permitted opportunities. For illustration, a per-cell 95-percent upper
bound of 0.1 percent requires 2,995 independently issued groups; at 85-percent
coverage, planning requires at least 3,524 eligible issue opportunities before
clustering, reserve, or attrition. Required abstentions and adversarial cases
receive separate calculations and never enlarge this denominator.

Zero observed failures do not prove zero risk. They support only the stated
cell-specific bound for the sampled population, versions, period, and
assumptions. A product may not pool cells, transfer the bound to another claim
family, or call it a 100-percent truth guarantee.

## V0 gates

Every number in this section is a **proposed experiment threshold**, not a
published standard or production promise. The final preregistration may make a
gate stricter after the harm analysis; it may not weaken a gate after hidden
results are known.

### Non-negotiable hard gates

The candidate cannot progress when any hidden or external case shows:

- a `critical_control_bypass`;
- an issued open-world negative without valid local closure;
- a material claim-identity, polarity, quantifier, unit, denominator, or time
  mutation inherited from another certificate;
- a cited locator that does not resolve to the declared artifact bytes;
- a source copy counted as independent after its shared origin is established;
- a deterministic claim that cannot replay from the declared package;
- a stale, superseded, restricted, or withdrawn certificate served as current;
- a rights-restricted or secret artifact exposed outside its authorized view;
- a public rendering stronger than the machine certificate; or
- a model, reviewer, policy owner, or administrator raising an outcome past a
  failed kernel predicate.

One such failure pauses the affected tier, opens an incident, and invalidates
that confirmatory run. The team gets at most one preregistered remediation cycle
with a fresh hidden set before the tier is narrowed or killed.

### Quantitative gates for progression to MES selection

All applicable gates must pass separately on the hidden temporal/OOD split and
external replication. Passing permits selection of **one** MES candidate; it
does not authorize production or all three positive families.

| Gate | Proposed V0 threshold |
| --- | --- |
| Observed critical issues | Zero `critical_harmful_issue` and zero `critical_control_bypass` in every populated confirmatory cell. Report the cell-specific bound from actual issued origin groups; V0 makes no production-rate claim. |
| Forbidden issues | Zero forbidden certificate in every required-abstention cell, including every Track-D natural and adversarial cell. |
| Open-world abstention | At least 95% correct typed abstention in each Track-D natural confirmatory split. Report each language subgroup; zero universal-negative issue remains a hard gate regardless of subgroup size. |
| Positive-track coverage | At least 85% requested-outcome coverage in every Track A, B, and C confirmatory issue-permitted cell, without weakening a predicate. Natural and adversarial cells are not averaged. |
| Citation and source identity | At least 99% material-field accuracy in every relevant track and split, with no critical citation, speaker, artifact-version, or register-snapshot error. |
| Decisive evidence | At least 95% recall where the oracle has a defensibly complete inventory and 100% interception of known decisive counterevidence that changes the outcome, reported by track and split. |
| Origin lineage | At least 98% pairwise precision and recall in every relevant track and split; zero known shared origin used to satisfy an independence gate. |
| Deterministic replay | 100% of claimed deterministic checks replay in two clean environments from retained packages. |
| Lifecycle | 100% of injected material triggers reach the correct non-current state before the serving deadline; zero stale/current projection mismatch after the declared propagation SLO. |
| Baseline benefit | Each positive track independently meets its minimum worthwhile error improvement over `B1-template` on hidden and external cases; one track cannot rescue another. |
| Comprehension | Meet every scope, false-label, spillover, action, correction, and subgroup threshold in the user study. |
| Operations | Meet every human-time, total/p95 cost, latency, funding-horizon, incident-reserve, and revealed-preference gate with all failed cases retained. |
| Replication | Independent team reproduces deterministic results and reaches the same cell-level go/pause/narrow/kill decision. |

An underpowered cell is `pending`, not passed. The 100-percent rows concern
fully specified experimental invariants, not claims about the world. If V0
passes, the only authorized conclusion is that this version may proceed to
prospective selection of one MES and then a separately preregistered pilot.

## Controlled operational pilot (live shadow)

The pilot tests selection, drift, users, and operations that a curated corpus
cannot reproduce. It is restricted to the selected MES family, declared source
universe, approved user language, named private users, and mandatory Track-D
safety suite. It has no public certificate, search-ranking effect, downstream
decision, or influence on the independent reference team.

### Entry and sampling

The pilot is separately preregistered after V0 and MES selection. It runs for
at least 16 weeks and until minima derived separately for all eligible natural
intake, eligible issue opportunities, actual shadow issues, natural required-
abstention opportunities, adversarial issue challenges, and adversarial
required-abstention challenges are met. These denominators are never added. If
natural exposure does not accrue, the pilot extends or narrows; synthetic cases
do not top up a natural denominator. It samples:

- all cases selected by the proposed risk/value queue;
- a protected random ten percent of the entire eligible intake universe;
- every appeal, correction, acquisition failure, and expert-timeout case; and
- a stratified reserve across language, low-attention sources, claim family,
  source organization, and expected harm.

The report publishes the total eligible universe, selected, never selected,
timed out, refused, abstained, issued-in-shadow, and resolved counts. Risk-ranked
success cannot hide failure in the random queue.

### Longitudinal anti-Goodhart contract

Every eligible intake receives an immutable pre-triage row containing its
timestamp, provisional family, source/language strata, initial risk/value
score, eligibility, route, and reason before the outcome or reviewer assignment
is known. At least ten percent is selected by an independently controlled,
protected random seed that operators cannot override and cannot see until
routing locks. The first eligible run is primary; retries, reviewer changes,
refusals, timeouts, duplicate suppression, deferrals, excess abstentions, and
unselected cases remain visible. Winner-picking and deletion from a denominator
are hard failures.

Metrics, ceilings, thresholds, strata, queue policy, operator-visible
dashboards, and amendment rules are frozen. Any outcome-aware amendment starts
a new version and clock. Each optimized metric has countermetrics: critical
harm per eligible intake, excess abstention, selected-versus-random completion,
appeal reversal, correction lag, stale-serving duration, human burden, fully
loaded cost, and user harm. An optimized metric cannot pass if a countermetric
fails.

Before promotion, the same frozen candidate must survive at least **two**
prospective temporal/OOD rotations with no reused origin group. Each rotation
and the protected random stream passes safety, comprehension, coverage, and
cost gates independently. The maximum generalization gap between development
and each rotation is preregistered for every primary metric; no average across
rotations can rescue one that exceeds it. A stream or rotation without its
minimum effective sample is `pending` and extends observation.

A metric is retired or redesigned prospectively when operators can improve it
without improving the underlying safe outcome, its correlation with the
independent adjudicated endpoint materially decays, a countermetric repeatedly
moves adversely, or a Simpson reversal or discontinuity remains unexplained.
Retirement never deletes historical failure or substitutes a new metric into
the old gate. The replacement receives a new preregistration, version, two
fresh rotations, and protected random sample.

At least ten percent of abstentions and unselected cases, plus every appeal,
correction, high-harm case, and critical candidate, receives independent
re-adjudication. Any undeclared exclusion, score rewrite, retry suppression,
reviewer shopping, or random-sample override is a hard fail. The final report
publishes early/late, selected/random, issued/all-intake, appealed/non-appealed,
and version-stratified views.

### Independent reference path

A separate team receives the original request and its authorized source
surface, not the engine's proposed evidence or outcome. It freezes a reference
dossier and decision before seeing the engine output. Cases with a later
externally observable resolution are followed prospectively. Difficult cases
may remain unresolved; their correct engine behavior is judged against the
permitted outcome and process, not a fabricated truth label.

### Shadow measurements

In addition to benchmark metrics, shadow mode records:

- selection recall and error in the random intake sample;
- source/provider drift and previously unseen failure types;
- expert fill rate, queue age, handoff loss, and reviewer fatigue;
- difference between estimated and invoiced cost;
- correction, appeal, and status-delivery time;
- consumer interpretation in a non-consequential usability environment;
- model/provider release changes and loss of calibration;
- rights, privacy, abuse, and incident workload; and
- whether an existing source, calculator, or simpler dossier would have solved
  the user need with less effort.

Any hard-gate failure stops affected shadow issuance immediately. The case
remains for incident analysis and denominator reporting. Resumption requires a
new version, new preregistration, and a fresh reserve; replaying until a
favorable output is not remediation.

## Scientific claims: separate shadow protocol

The complex scientific abstention example later in this document illustrates
the shadow-run schema only. It is not part of V0 and must not be interpreted as
permission to certify biomedical, behavioral, environmental, or other causal
claims.

If the project later tests science, it starts with one fixed, low-harm,
non-clinical-decision intervention question under the
[scientific shadow programme](scientific-claims-profile.md#shadow-mode-research-programme).
The protocol is registered before the hidden corpus is opened and includes a
qualified information specialist, subject specialists, review-method
specialists, statistician access, duplicate screening and extraction,
result-specific risk-of-bias assessment, report-to-study grouping, missing-
evidence analysis, synthesis sensitivity, and an independent reference team.

Promotion cannot be inferred from agreement with one published review. It
requires a defensible eligible-study inventory, prospective temporal cases,
correct discovery of null, adverse, non-English, regulator-only, corrected,
and retracted evidence, measured expert disagreement, replayable calculations,
and a sustainable living-update service. The [National Academies](https://www.nationalacademies.org/read/25303/chapter/3)
distinguishes computational reproducibility from replication on new data;
neither alone validates a causal interpretation.

## Go, pause, narrow, and kill decisions

### Progression decision authority

The candidate team computes metrics and presents evidence but cannot authorize
its own progression. The canonical composition, incompatibilities, full-quorum
rule, automatic triggers, unanimous five-of-five concurrence, and mandatory
safety/security no-blocker statements for `GO-SHADOW` are owned by the
[Progression Panel contract](governance-and-workflows.md#evaluation-progression-authority).
That contract also governs `NARROW`, mandatory `KILL`, stop authority,
conflicts, missing quorum, signed records, and process escalation. This
evaluation document owns only the meanings, measurements, and frozen automatic
threshold consequences of the gates.

Any hard-gate failure mechanically forbids `GO-SHADOW`. Independent replication
must reach the same gate decision but cannot cure an internal failure. A fresh
external methods/audit panel may hear a process appeal about calculation,
conflict, contamination, or preregistration application, never a request to
prefer a different threshold; it cannot expose sealed gold to the candidate
team or authorize public issue.

### Go to controlled shadow

`GO-SHADOW` requires every hard and quantitative V0 gate, an independent
replication with the same decision, no unresolved rights/safety blocker, and a
funded shadow protocol. It does not authorize public issue.

### Pause and rerun once

`PAUSE` is appropriate when the architecture remains falsifiable but the result
is not interpretable, for example:

- contamination or oracle defects affect a material fraction of the hidden
  set;
- confidence intervals straddle a preregistered baseline or cost margin;
- one correctable implementation defect causes a hard-gate failure;
- reviewer supply, source access, or translation capacity invalidates the
  planned operating envelope; or
- a new source or provider version changes the declared evaluation population.

The pause produces an incident or amendment record, a new candidate version,
and one fresh hidden evaluation. The original result stays published. There is
no unlimited repair loop.

### Narrow the product

`NARROW` removes a claim family, language, source class, assurance tier, or
public rendering when another bounded segment still passes independently. It
is required when:

- performance is safe only on one authoritative register or artifact type;
- a subgroup misses a gate and the cause is not corrected prospectively;
- qualified review or lawful source access exists only in a smaller domain;
- high abstention makes the broad promise misleading; or
- the simpler citation-audit or evidence-dossier tool provides the same value
  with less cost or authority risk.

### Kill the strong-assurance proposal

`KILL` or redesign from first principles is required when any of the following
persists after the single remediation cycle:

- an invalid closure or model/reviewer bypass can still produce a strong
  certificate;
- critical false labels create unacceptable decision harm;
- users cannot distinguish process conformance, attribution, bounded-source
  confirmation, computation, and real-world truth after two presentation
  iterations;
- correction, expiry, restriction, or withdrawal cannot reliably replace the
  current view in material consumers;
- origin independence cannot be established at the promised tier;
- an independent team cannot reproduce the package or the decision;
- full verification of automated proposals costs as much or more than the
  manual baseline without a material safety or coverage gain;
- the required rare-error sample, expert capacity, monitoring, rights, or
  insurance is economically unavailable;
- production behavior cannot be tied to exact code, policy, model, source, and
  configuration versions; or
- the complete engine does not materially outperform a narrower evidence
  dossier and citation-audit service at comparable cost and harm.

Killing the strong-assurance proposal does not invalidate useful artifact
capture, citation alignment, calculation replay, or research-workspace
features. It prevents those features from being marketed as an assurance
system they have not justified.

## Replication and audit package

Each public evaluation release contains, subject to rights and safety:

- preregistration manifest and every amendment;
- corpus manifest, origin groups, splits, inclusion flow, source dates,
  licences, and content digests;
- public cases and a protected-auditor path for sealed cases;
- oracle protocol, individual annotations, disagreements, adjudication, and
  errata history;
- exact candidate, baseline, model, prompt, tool, policy, trust-store, and
  source versions;
- attack taxonomy, fixtures that can be disclosed, incident record, and
  remediation status;
- executable metric and statistical code, environment, seeds, and expected
  outputs;
- stage, end-to-end, subgroup, risk-coverage, comprehension, cost, and latency
  results, including unfavorable slices;
- deterministic replay manifests and clean-environment receipts;
- data-access and redaction rules for independent auditors; and
- a signed decision record explaining `GO-SHADOW`, `PAUSE`, `NARROW`, or
  `KILL` from the preregistered gates.

The package uses content digests and a transport manifest such as
[BagIt](https://www.rfc-editor.org/rfc/rfc8493), describes research objects with
[RO-Crate](https://www.researchobject.org/ro-crate/) where useful, and maps
entities, activities, agents, and derivations to
[W3C PROV-O](https://www.w3.org/TR/prov-o/). These formats improve identity and
replay; they do not validate the evidence or conclusion. Independent review
uses artifact criteria comparable to the
[ACM artifact-review and badging policy](https://www.acm.org/publications/policies/artifact-review-and-badging-current),
but no badge substitutes for the gates above.

## Illustrative certificate 1 — simple bounded attribution

> **NON-PRODUCTION EXAMPLE.** Every entity, artifact, value, identifier,
> timestamp, reviewer, and result below is invented solely to illustrate the
> proposed schema. The YAML models a finalized **fictional test certificate**;
> no real-world certificate or signature was created and no factual statement
> about the world should be inferred.

**Human rendering.** Claim assessed: the retained fictional minutes contain
the exact sentence “Project Atlas was approved on 14 May 2026” at the named
locator. Permitted result: `attribution_confirmed`, because the example binds
the quote to one artifact version, digest, locator, context review, and replay
manifest. It does **not** establish that Project Atlas was actually approved.
The illustrative result expires on 12 August 2027 or earlier if the artifact,
origin, policy, or signing trust changes. A challenge can allege the wrong
artifact, locator, omitted context, origin, or rights basis through the stated
appeal route.

```yaml
example_only: true
fixture_scope: terminal-contract-replay
certificate_payload:
  certificate_id: "example:certificate:attribution:0001"
  schema_version: example-certificate-0.1
  certificate_class: scoped_assurance
  issuer:
    issuer_id: "example:issuer:research-lab"
    name: Synthetic research issuer
  issuance:
    kernel_decision: authorize_issue
    authorized_terminal_intent: certificate_issued
    prepared_at: 2026-08-12T09:59:59Z
    issue_intent_sequence: 42
    initial_requested_visibility: private
    expiry_rule: one_year_from_finalized_at
    absolute_expiry_upper_bound: 2027-08-12T10:05:00Z
    policy_version: "example:policy:bounded-attribution:1"
    method_profile: "example:profile:documented-attribution:1"
    harm_tier: T0
    ceiling: attribution_confirmed
  claim:
    claim_id: "example:claim:atlas-approval-attribution"
    revision_id: "example:claim-revision:1"
    original_expression: >-
      The retained minutes say, "Project Atlas was approved on 14 May 2026."
    language: en
    family: documented_attribution
    world_model: bounded_artifact
    compiled:
      subject: "example:artifact:board-minutes:2026-05-14"
      predicate: contains_statement
      object: Project Atlas was approved on 14 May 2026.
      polarity: positive
      modality: direct_attribution_only
      reference_date: 2026-05-14
      claim_valid_period:
        status: not_applicable
        reason: immutable_artifact_content_attribution
      locator_scope: section-4.paragraph-2
      excluded_inference: Project Atlas was in fact approved
    intended_use: demonstrate exact quotation from one retained artifact
  outcome:
    epistemic_outcome: attribution_confirmed
    scoped_wording: >-
      The exact retained artifact version contains this sentence at the stated
      locator. This does not establish that the sentence is factually true.
    requested_outcome_met: true
  assurance_vector:
    claim_specification:
      value: pass
      reason: atomic attribution claim approved by a human reviewer
      evidence_ref: "example:claim-revision:1"
    artifact_integrity:
      value: pass
      reason: retained fixture bytes match the declared digest
      evidence_ref: "example:artifact-version:1"
    attribution_authenticity:
      value: pass
      reason: synthetic origin fixture satisfies the test profile
      evidence_ref: "example:origin:synthetic-minutes-authoring-event"
    citation_fidelity:
      value: pass
      reason: exact excerpt resolves at the retained locator
      evidence_ref: "example:evidence-use:1"
    scope_relevance:
      value: pass
      reason: evidence directly addresses artifact-content attribution
      evidence_ref: "example:evidence-use:1"
    inferential_warrant:
      value: pass
      reason: conclusion is limited to attribution and excludes world truth
      evidence_ref: "example:profile:documented-attribution:1"
    method_quality:
      value: pass
      reason: all bounded-attribution profile gates pass
      evidence_ref: "example:profile:documented-attribution:1"
    origin_independence:
      value: not_applicable
      reason: single-artifact attribution does not claim corroboration
      evidence_ref: "example:origin:synthetic-minutes-authoring-event"
    corpus_coverage:
      value: pass
      reason: complete for the one declared artifact only
      evidence_ref: "example:search-plan:attribution:1"
    temporal_validity:
      value: pass
      reason: source and policy checks are current through the recorded cutoffs
      evidence_ref: "example:replay:attribution:0001"
    uncertainty_calibration:
      value: not_applicable
      reason: no probabilistic claim is emitted
      evidence_ref: "example:profile:documented-attribution:1"
    review_competence_independence:
      value: pass
      reason: distinct calibrated fixture reviewers approved the result
      evidence_ref: "example:review-set:attribution:0001"
    reproducibility:
      value: pass
      reason: two clean fixture replays resolve the same bytes and locator
      evidence_ref: "example:replay:attribution:0001"
    procedural_conformance:
      value: pass
      reason: fictional fixture satisfies the registered test policy
      evidence_ref: "example:policy:bounded-attribution:1"
  artifacts:
    - artifact_id: "example:artifact:board-minutes:2026-05-14"
      version_id: "example:artifact-version:1"
      media_type: application/pdf
      digest: "example:sha256:not-a-real-digest:minutes-v1"
      captured_at: 2026-08-10T09:12:00Z
      artifact_valid_period:
        status: unknown
        reason: fixture_declares_meeting_date_not_version_effectivity
      source_locator: "example://official-records/board-minutes-2026-05-14.pdf"
      rights_status: synthetic_fixture_unrestricted
      visibility: public_example
      origin_status: synthetic_declared_origin
  evidence_uses:
    - evidence_use_id: "example:evidence-use:1"
      artifact_version_id: "example:artifact-version:1"
      locator: pdf-page-3/section-4/paragraph-2/characters-1-52
      excerpt: Project Atlas was approved on 14 May 2026.
      surrounding_context_locator: pdf-page-3/section-4
      polarity: supports_attribution
      applicability: exact
      inferential_role: direct_artifact_content
  origin_and_dependencies:
    observation_origins:
      - "example:origin:synthetic-minutes-authoring-event"
    known_shared_origins: []
    unresolved_lineage: []
    watch_set:
      - "example:artifact-version:1-status"
      - "example:issuer-key-status"
      - "example:policy:bounded-attribution:1"
  search:
    plan_id: "example:search-plan:attribution:1"
    sources: [declared_retained_artifact]
    support_path: resolve exact sentence and surrounding context
    counter_path: inspect correction marks, appendix, speaker/author identity, and later artifact version
    executed_at: 2026-08-10T09:30:00Z
    searched_through: 2026-08-10T09:30:00Z
    stop_rule: all pages and declared corrections inspected
    inaccessible_space: none inside the synthetic artifact; all outside-world facts excluded
    result: exact passage found; no conflicting version inside declared boundary
  transformations:
    - type: pdf_text_extraction
      tool: "example:deterministic-pdf-extractor:1"
      input_digest: "example:sha256:not-a-real-digest:minutes-v1"
      output_digest: "example:sha256:not-a-real-digest:minutes-text-v1"
      validation: exact locator manually compared with rendered page
  reviews:
    - role: evidence_reviewer
      actor: "example:reviewer:A"
      competence_basis: synthetic attribution calibration passed
      conflict: none_declared
      blind_initial_decision: attribution_confirmed
      signed: example_only_no_signature
    - role: adversarial_reviewer
      actor: "example:reviewer:B"
      competence_basis: synthetic context and version review
      conflict: none_declared
      blind_initial_decision: attribution_confirmed
      objections: []
      signed: example_only_no_signature
  deterministic_checks:
    locator_resolves: true
    excerpt_matches_bytes: true
    claim_ceiling_respected: true
    required_roles_distinct: true
    rights_gate_passed: true
    temporal_order_holds: searched_through_lte_integrated_through_lte_prepared_at
    issued_at_iff_actual_certificate_finalized: true
    temporal_substitution_negative_tests:
      - mutation: use_reference_date_as_claim_valid_period
        expected: reject
      - mutation: use_captured_at_as_artifact_valid_period
        expected: reject
      - mutation: use_prepared_at_as_issued_at
        expected: reject
    replay_manifest: "example:replay:attribution:0001"
    clean_environment_replays: 2
  uncertainty_and_limits:
    assumptions:
      - the synthetic artifact is the intended version
      - the declared author/origin metadata is sufficient for this example
    unknowns:
      - whether the represented approval occurred in the world
    objections: []
    residual_risks:
      - a real deployment would need authentic origin and lawful-retention evidence
  temporal_scope:
    observed_at: 2026-08-10T09:12:00Z
    captured_at: 2026-08-10T09:12:00Z
    evaluated_at: 2026-08-11T16:00:00Z
    integrated_through: 2026-08-11T16:00:00Z
    next_review_due: 2027-08-12T10:00:00Z
    invalidation_triggers: [artifact_correction, origin_failure, policy_defect, key_compromise]
certificate_payload_digest: "example:sha256:not-a-real-certificate-digest"
signature_envelope:
  format: COSE_Sign1
  status: synthetic_fixture_signature_present
  covered_object: certificate_payload
  protected_headers: [algorithm, key_id, content_type, certificate_profile]
post_signature_receipts:
  timestamp_token: null
  transparency_receipt: null
finalization_event:
  event_id: "example:finalization-event:attribution:0001"
  schema_version: example-finalization-event-0.1
  terminal_object_id: "example:certificate:attribution:0001"
  terminal_object_type: Certificate
  terminal_payload_digest: "example:sha256:not-a-real-certificate-digest"
  terminal_signature_envelope_digest: "example:sha256:not-a-real-signature-envelope-digest"
  issue_intent_sequence: 42
  finalized_at: 2026-08-12T10:00:00Z
  issued_at: 2026-08-12T10:00:00Z
  transaction_order_reference: "example:wal-lsn:0/1000000"
  initial_certificate_lifecycle: current
  initial_visibility: private
  initial_challenge_status: none
  audit_event_ids: ["example:audit-event:attribution-finalize:0001"]
  outbox_event_ids: ["example:outbox:attribution-finalize:0001"]
finalization_receipt:
  payload:
    schema_version: example-finalization-receipt-0.1
    finalization_event_id: "example:finalization-event:attribution:0001"
    finalization_event_digest: "example:sha256:not-a-real-attribution-finalization-event-digest"
    certificate_id: "example:certificate:attribution:0001"
    terminal_payload_digest: "example:sha256:not-a-real-certificate-digest"
    signature_envelope_digest: "example:sha256:not-a-real-signature-envelope-digest"
    issue_intent_sequence: 42
    finalized_at: 2026-08-12T10:00:00Z
    issued_at: 2026-08-12T10:00:00Z
    run_disposition: certificate_issued
    initial_certificate_lifecycle: current
    initial_visibility: private
    initial_challenge_status: none
    audit_event_ids: ["example:audit-event:attribution-finalize:0001"]
    outbox_event_ids: ["example:outbox:attribution-finalize:0001"]
  payload_digest: "example:sha256:not-a-real-attribution-finalization-receipt-payload-digest"
  signature_envelope:
    format: COSE_Sign1
    covered_object: finalization_receipt.payload
    status: synthetic_fixture_finalization_signature_present
  status_signer_trust_snapshot: "example:trust-snapshot:status-signer:1"
activation_record:
  activation_id: "example:activation:attribution:0001"
  schema_version: example-activation-record-0.1
  terminal_object_id: "example:certificate:attribution:0001"
  terminal_object_type: Certificate
  finalization_event_digest: "example:sha256:not-a-real-attribution-finalization-event-digest"
  finalization_receipt_payload_digest: "example:sha256:not-a-real-attribution-finalization-receipt-payload-digest"
  finalization_signature_envelope_digest: "example:sha256:not-a-real-attribution-finalization-signature-envelope-digest"
  expected_pre_activation_state: public_seal_pending
  aggregate_sequence: 2
  activated_at: 2026-08-12T10:00:01Z
  authorized_view: private
  disclosure_policy_version: "example:disclosure-policy:private:1"
  disclosure_manifest_digest: "example:sha256:not-a-real-attribution-disclosure-manifest-digest"
  served_view_digest: "example:sha256:not-a-real-attribution-served-view-digest"
  lifecycle_watermark: "example:certificate-state:attribution:seq1"
  challenge_watermark: none
  rights_watermark: "example:rights-snapshot:attribution:1"
  dependency_watermark: "example:dependency-snapshot:attribution:1"
  trust_watermark: "example:trust-snapshot:activation:1"
  activation_authority: "example:authority:activation-service"
  audit_event_ids: ["example:audit-event:attribution-activation:0001"]
  outbox_event_ids: ["example:outbox:attribution-activation:0001"]
  transaction_order_reference: "example:wal-lsn:0/1000001"
  authority_evidence: canonical_database_transaction_and_audit_chain
  state: externally_activated
certificate_event_chain:
  - payload:
      schema_version: example-certificate-event-0.1
      event_id: "example:certificate-event:attribution:issued:0001"
      certificate_id: "example:certificate:attribution:0001"
      certificate_payload_digest: "example:sha256:not-a-real-certificate-digest"
      aggregate_sequence: 1
      event_type: issued
      previous_state_digest: null
      resulting_state_digest: "example:sha256:not-a-real-attribution-certificate-state-digest"
      reason: initial_issue
      authority: "example:authority:certificate-finalizer"
      policy_version: "example:policy:bounded-attribution:1"
      system_recorded_at: 2026-08-12T10:00:00Z
      delivery_route_ids: ["example:delivery-route:private-api"]
    payload_digest: "example:sha256:not-a-real-attribution-issued-event-payload-digest"
    signature_envelope:
      format: COSE_Sign1
      covered_object: certificate_event_chain[0].payload
      status: synthetic_fixture_certificate_event_signature_present
    signer_trust_snapshot: "example:trust-snapshot:status-signer:1"
current_status_projection:
  certificate_id: "example:certificate:attribution:0001"
  certificate_lifecycle: current
  visibility: private
  challenge_status: none
  installed_at: 2026-08-12T10:00:00Z
  derived_from_events:
    - event_id: "example:certificate-event:attribution:issued:0001"
      event_type: issued
      recorded_at: 2026-08-12T10:00:00Z
  correction_records: []
  supersession:
    predecessor_id: null
    successor_id: null
    status: none
    receipts: []
  stable_state_digest: "example:sha256:not-a-real-attribution-certificate-state-digest"
  status_feed_watermark: "example:certificate:attribution:sequence:1"
  served_at: 2026-08-12T10:00:01Z
  signature_envelope:
    format: COSE_Sign1
    covered_object: current_status_projection_without_signature_envelope
    status: synthetic_fixture_status_signature_present
  signer_trust_snapshot: "example:trust-snapshot:status-signer:1"
appeal_channel_projection:
  target:
    object_type: certificate
    object_id: "example:certificate:attribution:0001"
  channel: "example://appeals/attribution"
  allowed_grounds: [wrong_artifact, wrong_locator, omitted_context, origin_error, rights_error]
  channel_status: available
  appeal_records: []
```

## Illustrative result 2 — complex scientific evidence

> **NON-PRODUCTION EXAMPLE.** The condition, intervention, studies, estimates,
> registrations, reviewers, and findings below are deliberately fictional. The
> example only shows how a complex scientific dossier would expose uncertainty.
> It is not medical or scientific advice, a GRADE assessment, or evidence that
> the proposed scientific service is ready.

**Human rendering.** Claim assessed: in a fictional, precisely scoped trial
population, fictional intervention A reduces fictional outcome Y at week 12
relative to placebo. Result: `mixed` with low certainty and **abstention**.
Model sensitivity crosses the null, origin dependence remains unresolved, a
material source class is inaccessible, and qualified reviewers retain a
blocking dissent. These objections forbid `supported` and no scientific
certificate is issued. This `T2` shadow-only record is not a public outcome or
treatment recommendation. Its search ends on 31 July 2026; it must reopen for a
new trial, correction, concern, retraction, overdue search, or profile defect.

```yaml
example_only: true
fixture_scope: terminal-contract-replay
abstention_payload:
  object_type: AbstentionAttestation
  attestation_id: "example:abstention-attestation:science:0001"
  verification_run_id: "example:verification-run:science:0001"
  schema_version: example-run-result-0.1
  issuer:
    issuer_id: "example:issuer:scientific-shadow-team"
    name: Synthetic scientific shadow issuer
  run_result:
    kernel_decision: abstain_blocking_objections
    authorized_terminal_intent: abstained
    primary_reason_code: material_counterevidence_unresolved
    secondary_reason_codes:
      - dependence_unresolved
      - evidence_inaccessible
      - coverage_insufficient
    publication_permission: denied_shadow_only
    prepared_at: 2026-08-12T11:59:00Z
    terminal_intent_sequence: 77
    freshness_review_due: 2026-11-10T12:00:00Z
    policy_version: "example:policy:scientific-shadow:1"
    method_profile: "example:profile:rct-body-of-evidence:1"
    harm_tier: T2
    evaluation_mode: shadow_only
    maximum_profile_ceiling: strongly_supported
  claim:
    claim_id: "example:claim:intervention-a-condition-x"
    revision_id: "example:claim-revision:science:3"
    original_expression: >-
      In adults with synthetic condition X, intervention A rather than placebo
      reduces the proportion experiencing synthetic outcome Y by week 12.
    language: en
    family: scientific_intervention_effect
    world_model: open_empirical
    compiled:
      population: adults aged 18-65 with synthetic condition X under definition v2
      intervention: intervention A, 10 mg daily for 12 weeks
      comparator: matched placebo plus otherwise identical care
      outcome: proportion meeting synthetic outcome-Y threshold v1 by week 12
      estimand: treatment-policy risk ratio in the randomized population
      effect_direction: lower_is_beneficial
      geography: multicountry settings represented by eligible trials
      claim_valid_period:
        status: unknown
        reason: trial_enrolment_and_calendar_applicability_period_not_declared
      causal_force: randomized-trial body-of-evidence claim
      excluded_inferences:
        - individual treatment recommendation
        - benefit after week 12
        - applicability outside trial populations
        - absence of unreported or future evidence
    intended_use: private method-research demonstration only
  outcome:
    domain_assessment:
      code: mixed_low_certainty
      candidate_canonical_mapping: mixed
      mapping_status: diagnostic_only_no_certificate
    publication_status: denied_abstained_shadow_only
    scoped_wording: >-
      Under the synthetic profile and evidence corpus searched through 31 July
      2026, the result is mixed with low certainty. Blocking sensitivity,
      lineage, access, and reviewer objections require abstention. This is not
      proof of an effect or advice.
    requested_outcome_met: false
    abstention_reason_codes:
      - model_sensitivity_crosses_null
      - unresolved_origin_dependence
      - material_search_access_gap
      - unresolved_qualified_reviewer_dissent
  assurance_vector:
    claim_specification:
      value: pass
      reason: scoped claim approved after two semantic revisions
      evidence_ref: "example:claim-revision:science:3"
    artifact_integrity:
      value: pass
      reason: retained synthetic reports match their fixture digests
      evidence_ref: "example:artifact-set:science:0001"
    attribution_authenticity:
      value: pass
      reason: fixture report-to-trial identities are documented
      evidence_ref: "example:lineage:science:0001"
    citation_fidelity:
      value: pass
      reason: duplicate extraction resolved the cited result fields
      evidence_ref: "example:extraction:science:0001"
    scope_relevance:
      value: unknown
      reason: trial populations are narrower than the proposed population
      evidence_ref: "example:applicability:science:0001"
    inferential_warrant:
      value: fail
      reason: plausible sensitivity crosses the null
      evidence_ref: "example:sensitivity:science:0001"
    method_quality:
      value: unknown
      reason: result-specific risk of bias remains mixed
      evidence_ref: "example:risk-of-bias:science:0001"
    origin_independence:
      value: fail
      reason: possible shared origin remains unresolved
      evidence_ref: "example:lineage:science:0001"
    corpus_coverage:
      value: fail
      reason: a material conference archive is inaccessible
      evidence_ref: "example:search-ledger:science:0001"
    temporal_validity:
      value: pass
      reason: cutoffs are explicit for this shadow assessment
      evidence_ref: "example:search-ledger:science:0001"
    uncertainty_calibration:
      value: not_applicable
      reason: effect interval is not a probability of truth
      evidence_ref: "example:synthesis:science:0001"
    review_competence_independence:
      value: fail
      reason: qualified reviewer dissent remains blocking
      evidence_ref: "example:review-set:science:0001"
    reproducibility:
      value: unknown
      reason: synthesis replays but source analyses are not fully reproducible
      evidence_ref: "example:replay:science:0001"
    procedural_conformance:
      value: pass
      reason: the kernel follows policy by abstaining
      evidence_ref: "example:policy:scientific-shadow:1"
  scientific_profile:
    subtype: intervention_effect_across_randomized_trials
    eligible_designs: randomized_parallel_group_trials
    primary_effect:
      measure: risk_ratio
      estimate: 0.82
      confidence_interval_95: [0.68, 0.99]
      model: random_effects_example_model
      heterogeneity_I2_percent: 41
      participants: 1840
      studies: 4
    certainty:
      final_level: low
      risk_of_bias: downgraded_one_level
      inconsistency: not_downgraded_but_material
      indirectness: downgraded_one_level
      imprecision: not_downgraded_under_example_threshold
      publication_bias: suspected_not_quantified
      decision_thresholds: [0.90, 1.00]
    sensitivity:
      exclude_high_risk_result: risk_ratio_0.88_ci_0.72_to_1.07
      fixed_effect: risk_ratio_0.80_ci_0.69_to_0.93
      conclusion: direction and threshold crossing are model-sensitive
  artifacts:
    - artifact_id: "example:study-report:S1"
      version_id: "example:study-report:S1:v2"
      digest: "example:sha256:not-a-real-digest:S1"
      artifact_valid_period:
        status: unknown
        reason: source_effective_period_not_declared
      source_locator: "example://scientific-fixtures/S1-report"
      rights_status: synthetic_fixture_unrestricted
      correction_status: corrected_table_used
    - artifact_id: "example:study-report:S2"
      version_id: "example:study-report:S2:v1"
      digest: "example:sha256:not-a-real-digest:S2"
      artifact_valid_period:
        status: unknown
        reason: source_effective_period_not_declared
      source_locator: "example://scientific-fixtures/S2-report"
      rights_status: synthetic_fixture_unrestricted
      correction_status: no_known_correction
    - artifact_id: "example:study-report:S3"
      version_id: "example:study-report:S3:v1"
      digest: "example:sha256:not-a-real-digest:S3"
      artifact_valid_period:
        status: unknown
        reason: source_effective_period_not_declared
      source_locator: "example://scientific-fixtures/S3-report"
      rights_status: synthetic_fixture_unrestricted
      correction_status: no_known_correction
    - artifact_id: "example:registry-result:S4"
      version_id: "example:registry-result:S4:v1"
      digest: "example:sha256:not-a-real-digest:S4"
      artifact_valid_period:
        status: unknown
        reason: source_effective_period_not_declared
      source_locator: "example://scientific-fixtures/S4-registry-result"
      rights_status: synthetic_fixture_unrestricted
      correction_status: no_publication_found
  evidence_uses:
    - evidence_use_id: "example:evidence:S1:outcome-Y:week-12"
      origin: "example:trial:S1"
      polarity: supports
      applicability: direct_population_partial_setting
      risk_of_bias: some_concerns
      locator: synthetic-table-2/row-outcome-Y/week-12
    - evidence_use_id: "example:evidence:S2:outcome-Y:week-12"
      origin: "example:trial:S2"
      polarity: supports
      applicability: direct
      risk_of_bias: low
      locator: synthetic-figure-3/outcome-Y
    - evidence_use_id: "example:evidence:S3:outcome-Y:week-12"
      origin: "example:trial:S3"
      polarity: contradicts_or_null
      applicability: indirect_severity_mix
      risk_of_bias: high
      locator: synthetic-appendix/table-S7
    - evidence_use_id: "example:evidence:S4:outcome-Y:week-12"
      origin: "example:trial:S4"
      polarity: contradicts_or_null
      applicability: direct
      risk_of_bias: some_concerns_missing_detail
      locator: synthetic-registry/results/outcome-Y
  origin_and_dependencies:
    observation_origins:
      - "example:trial:S1"
      - "example:trial:S2"
      - "example:trial:S3"
      - "example:trial:S4"
    shared_dependencies:
      - relation: common_sponsor_and_protocol_family
        members:
          - "example:trial:S1"
          - "example:trial:S2"
        treatment: correlated_origin_cluster_in_sensitivity_analysis
    unresolved_lineage: [possible_shared_site_between_S2_and_S3]
    watch_set:
      - "example:trial-registry:condition-X"
      - "example:correction-channel:S1-S4"
      - "example:retraction-channel:S1-S4"
      - "example:profile:rct-body-of-evidence:1"
  search:
    plan_id: "example:search-plan:science:registered-before-synthesis"
    sources:
      - synthetic_bibliographic_database_A
      - synthetic_bibliographic_database_B
      - synthetic_trial_registry
      - synthetic_regulator_results_store
      - synthetic_citation_and_correction_index
    languages: [en, fr, de]
    support_and_counter_queries: "example:search-ledger:science:0001"
    executed_range: 2026-07-20/2026-07-31
    searched_through: 2026-07-31T23:59:59Z
    stop_rule: all preregistered sources searched and duplicate screening completed
    inaccessible_space:
      - one unlicensed conference archive
      - unverifiable sponsor internal analyses
      - unindexed and future studies
    inclusion_flow:
      records_found: 1264
      reports_full_text_assessed: 17
      reports_included: 7
      underlying_trials_included: 4
    result: four eligible trial origins; one known registry-only null result retained
  methods_and_transformations:
    screening: duplicate_independent_synthetic_review
    extraction: duplicate_independent_result_level_extraction
    registration_comparison: completed_for_all_four_trials
    risk_of_bias_tool: "example:licensed-method-adapter-version-1"
    synthesis_code: "example:replay:science:0001"
    synthesis_environment: "example:oci-image:not-a-real-digest"
    clean_environment_replays: 2
    nonreplayable_parts:
      - synthetic expert applicability judgments
      - inaccessible sponsor internal analyses
  reviews:
    - role: information_specialist
      actor: "example:reviewer:IS1"
      conflict: none_declared
      decision: search_executed_with_named_gap
    - role: subject_specialist_1
      actor: "example:reviewer:SS1"
      conflict: none_declared
      blind_initial_decision: supported_low_certainty
    - role: subject_specialist_2
      actor: "example:reviewer:SS2"
      conflict: prior_unrelated_grant_from_synthetic_sponsor_disclosed
      blind_initial_decision: mixed_low_certainty
      recusal_scope: sponsor-lineage_independence_judgment
    - role: methods_specialist
      actor: "example:reviewer:MS1"
      conflict: none_declared
      blind_initial_decision: supported_low_certainty
    - role: adversarial_reviewer
      actor: "example:reviewer:AR1"
      conflict: none_declared
      objections:
        - model sensitivity crosses the null
        - possible shared origin between two reports
        - conference archive unavailable
    - role: adjudicator
      actor: "example:reviewer:ADJ1"
      conflict: none_declared
      decision: abstain_with_mixed_low_certainty_shadow_result
  review_dissent_summary: one specialist preferred mixed because sensitivity crossed the null
  deterministic_checks:
    candidate_outcome_mapping_is_diagnostic_only: true
    every_report_grouped_to_trial: true
    no_report_counted_as_independent_trial: true
    countable_independence_floor_met: false
    leave_one_cluster_out_vector_complete: false
    blocking_objections_resolved: false
    certificate_issuance_blocked: true
    publication_blocked: true
    exact_effect_fields_resolve: true
    required_roles_distinct: true
    search_plan_precedes_synthesis: true
    synthesis_replays: true
    rights_gate_passed_for_synthetic_fixtures: true
    replay_manifest: "example:replay:science:0001"
    temporal_order_holds: searched_through_lte_integrated_through_lte_prepared_at
    temporal_substitution_negative_tests:
      - mutation: use_searched_through_as_claim_valid_period
        expected: reject
      - mutation: swap_searched_through_and_integrated_through
        expected: reject
      - mutation: use_artifact_capture_as_artifact_valid_period
        expected: reject
      - mutation: set_issued_at_when_kernel_abstains
        expected: reject
      - mutation: coerce_unknown_period_end_to_infinity
        expected: reject
  uncertainty_and_limits:
    assumptions:
      - fictional study records accurately represent their fictional trials
      - risk-ratio pooling is defensible under the declared synthetic model
    unknowns:
      - unreported results
      - future studies
      - transportability beyond represented trial settings
      - degree of dependence from shared sponsor and possible shared site
    objections:
      - one plausible sensitivity analysis is statistically compatible with no effect
    residual_risks:
      - publication and outcome-reporting bias
      - result-specific reviewer judgment variability
      - short follow-up and narrow synthetic population
  attestation_timing:
    observed_at: 2026-07-31T23:59:59Z
    captured_at: 2026-08-02T12:00:00Z
    evaluated_at: 2026-08-10T18:00:00Z
    integrated_through: 2026-08-05T23:59:59Z
    next_search_due: 2026-09-30
    invalidation_triggers: [new_eligible_trial, correction, expression_of_concern, retraction, overdue_search, profile_defect]
    correction_records:
      - correction_id: "example:correction:S1:table:0001"
        target:
          object_type: artifact_version
          object_id: "example:study-report:S1:v1"
        reason_code: source_table_correction
        predecessor:
          version_id: "example:study-report:S1:v1"
          digest: "example:sha256:not-a-real-digest:S1-v1"
        successor:
          version_id: "example:study-report:S1:v2"
          digest: "example:sha256:not-a-real-digest:S1"
        status: integrated_and_recomputed
        recorded_at: 2026-08-02T12:00:00Z
        receipts:
          - receipt_id: "example:receipt:correction:S1:science-run:0001"
            consumer_id: "example:abstention-attestation:science:0001"
            status: acknowledged
            acknowledged_at: 2026-08-05T23:59:59Z
  appeal_contract:
    target:
      object_type: AbstentionAttestation
      object_id: "example:abstention-attestation:science:0001"
    channel: "example://appeals/science"
    allowed_grounds: [claim_scope, missed_study, extraction, lineage, risk_of_bias, synthesis, certainty, rights]
    channel_status: available
abstention_payload_digest: "example:sha256:not-a-real-scientific-abstention-attestation-digest"
signature_envelope:
  format: COSE_Sign1
  status: synthetic_fixture_signature_present
  covered_object: abstention_payload
post_signature_receipts:
  transparency_receipt: null
finalization_event:
  event_id: "example:finalization-event:science-abstention:0001"
  schema_version: example-finalization-event-0.1
  terminal_object_id: "example:abstention-attestation:science:0001"
  terminal_object_type: AbstentionAttestation
  terminal_payload_digest: "example:sha256:not-a-real-scientific-abstention-attestation-digest"
  terminal_signature_envelope_digest: "example:sha256:not-a-real-science-attestation-signature-envelope-digest"
  terminal_intent_sequence: 77
  finalized_at: 2026-08-12T12:00:00Z
  transaction_order_reference: "example:wal-lsn:0/2000000"
  run_disposition: abstained
  initial_visibility: private
  audit_event_ids: ["example:audit-event:science-abstention-finalize:0001"]
  outbox_event_ids: ["example:outbox:science-abstention-finalize:0001"]
finalization_receipt:
  payload:
    schema_version: example-finalization-receipt-0.1
    finalization_event_id: "example:finalization-event:science-abstention:0001"
    finalization_event_digest: "example:sha256:not-a-real-science-finalization-event-digest"
    object_id: "example:abstention-attestation:science:0001"
    terminal_payload_digest: "example:sha256:not-a-real-scientific-abstention-attestation-digest"
    signature_envelope_digest: "example:sha256:not-a-real-science-attestation-signature-envelope-digest"
    terminal_intent_sequence: 77
    finalized_at: 2026-08-12T12:00:00Z
    run_disposition: abstained
    initial_visibility: private
    audit_event_ids: ["example:audit-event:science-abstention-finalize:0001"]
    outbox_event_ids: ["example:outbox:science-abstention-finalize:0001"]
  payload_digest: "example:sha256:not-a-real-science-finalization-receipt-payload-digest"
  signature_envelope:
    format: COSE_Sign1
    covered_object: finalization_receipt.payload
    status: synthetic_fixture_finalization_signature_present
  status_signer_trust_snapshot: "example:trust-snapshot:status-signer:1"
activation_record:
  activation_id: "example:activation:science-abstention:0001"
  schema_version: example-activation-record-0.1
  terminal_object_id: "example:abstention-attestation:science:0001"
  terminal_object_type: AbstentionAttestation
  finalization_event_digest: "example:sha256:not-a-real-science-finalization-event-digest"
  finalization_receipt_payload_digest: "example:sha256:not-a-real-science-finalization-receipt-payload-digest"
  finalization_signature_envelope_digest: "example:sha256:not-a-real-science-finalization-signature-envelope-digest"
  expected_pre_activation_state: public_seal_pending
  aggregate_sequence: 2
  activated_at: 2026-08-12T12:00:01Z
  authorized_view: private
  disclosure_policy_version: "example:disclosure-policy:private-shadow:1"
  disclosure_manifest_digest: "example:sha256:not-a-real-science-disclosure-manifest-digest"
  served_view_digest: "example:sha256:not-a-real-science-served-view-digest"
  lifecycle_watermark: not_applicable
  challenge_watermark: none
  rights_watermark: "example:rights-snapshot:science-shadow:1"
  dependency_watermark: "example:dependency-snapshot:science:1"
  trust_watermark: "example:trust-snapshot:activation:1"
  activation_authority: "example:authority:activation-service"
  audit_event_ids: ["example:audit-event:science-abstention-activation:0001"]
  outbox_event_ids: ["example:outbox:science-abstention-activation:0001"]
  transaction_order_reference: "example:wal-lsn:0/2000001"
  authority_evidence: canonical_database_transaction_and_audit_chain
  state: externally_activated
```

## Illustrative result 3 — correct inconclusive result

> **NON-PRODUCTION EXAMPLE.** Product Q, the sources, searches, reviewers, and
> dates below are fictional. The example demonstrates why an apparently broad
> search must not become proof of absence.

**Human rendering.** Requested claim: no non-public Product Q safety incident
occurred anywhere in the world during the first half of 2026. Result:
`insufficient_evidence`; the request is an open-world universal negative and no
complete incident-ledger closure exists. The recorded search found no public
report inside its limited sources, but one regional provider failed and private,
confidential, unindexed, deleted, and never-created records remain outside the
observable corpus. This is an immutable `AbstentionAttestation`, not a
certificate and not evidence that no incident occurred. Its search freshness
must be reviewed by 11 September 2026.
An appeal may challenge the search, scope, provider failures, or the decision
to abstain; a stronger conclusion requires a genuinely complete bounded
register or a narrower claim.

```yaml
example_only: true
fixture_scope: terminal-contract-replay
abstention_payload:
  object_type: AbstentionAttestation
  attestation_id: "example:abstention-attestation:open-negative:0001"
  verification_run_id: "example:verification-run:open-negative:0001"
  schema_version: example-run-result-0.1
  issuer:
    issuer_id: "example:issuer:research-lab"
    name: Synthetic research issuer
  run_result:
    kernel_decision: abstain_from_requested_negative
    authorized_terminal_intent: abstained
    primary_reason_code: closure_unproven
    secondary_reason_codes:
      - evidence_inaccessible
      - coverage_insufficient
    prepared_at: 2026-08-12T13:59:00Z
    terminal_intent_sequence: 91
    freshness_review_due: 2026-09-11T14:00:00Z
    policy_version: "example:policy:open-world-negative:1"
    method_profile: "example:profile:open-world-countersearch:1"
    harm_tier: T1
  claim:
    claim_id: "example:claim:product-q-no-incidents"
    revision_id: "example:claim-revision:1"
    original_expression: >-
      No non-public safety incident involving Product Q occurred anywhere in
      the world between 1 January and 30 June 2026.
    language: en
    family: open_world_negative
    world_model: open
    compiled:
      subject: fictional Product Q
      predicate: had_no_non_public_safety_incident
      polarity: universal_negative
      quantifier: none_anywhere
      geography: worldwide
      claim_valid_period:
        start: 2026-01-01T00:00:00Z
        end_exclusive: 2026-07-01T00:00:00Z
        precision: day
      evidence_scope: public and accessible sources only
      required_but_unavailable_closure: all public and non-public incident records worldwide
    intended_use: demonstrate abstention on an inaccessible universal negative
  abstention:
    label: No certificate issued
    bounded_search_result: >-
      No qualifying public report was found under the recorded search plan and
      access limits through 10 August 2026.
    requested_outcome_met: false
    requested_outcome_denied: absent_worldwide
    responsible_gate: valid_local_closure_required
    missing_requirement: independently auditable complete incident ledger
    smallest_next_action: >-
      Obtain an independently auditable, complete incident-ledger closure for
      the named organizations and jurisdictions, or narrow the claim to a
      specific complete register snapshot.
  assurance_vector:
    claim_specification:
      value: pass
      reason: universal-negative scope is explicit
      evidence_ref: "example:claim-revision:1"
    artifact_integrity:
      value: pass
      reason: retained public-search captures match fixture digests
      evidence_ref: "example:artifact-set:open-negative:0001"
    attribution_authenticity:
      value: not_applicable
      reason: requested claim is not an attribution
      evidence_ref: "example:claim-revision:1"
    citation_fidelity:
      value: pass
      reason: search receipts describe only observed public results
      evidence_ref: "example:evidence-use:search-no-public-hit"
    scope_relevance:
      value: fail
      reason: public sources cannot answer worldwide non-public absence
      evidence_ref: "example:search-plan:open-negative:1"
    inferential_warrant:
      value: fail
      reason: absence does not follow without valid local closure
      evidence_ref: "example:search-plan:open-negative:1"
    method_quality:
      value: unknown
      reason: method is adequate only for the bounded public search receipt
      evidence_ref: "example:profile:open-world-countersearch:1"
    origin_independence:
      value: not_applicable
      reason: no positive corroboration claim is made
      evidence_ref: "example:claim-revision:1"
    corpus_coverage:
      value: fail
      reason: private and failed source classes remain inaccessible
      evidence_ref: "example:search-ledger:open-negative:all-results"
    temporal_validity:
      value: pass
      reason: search and integration cutoffs are explicit
      evidence_ref: "example:search-plan:open-negative:1"
    uncertainty_calibration:
      value: not_applicable
      reason: no probability of truth is emitted
      evidence_ref: "example:profile:open-world-countersearch:1"
    review_competence_independence:
      value: pass
      reason: distinct reviewers support the abstention disposition
      evidence_ref: "example:review-set:open-negative:0001"
    reproducibility:
      value: unknown
      reason: replay depends on continuing source availability
      evidence_ref: "example:replay:open-negative:0001"
    procedural_conformance:
      value: pass
      reason: the kernel follows policy by abstaining
      evidence_ref: "example:policy:open-world-negative:1"
  artifacts:
    - artifact_id: "example:search-capture:regulator-results"
      version_id: "example:search-capture:regulator-results:2026-08-10"
      digest: "example:sha256:not-a-real-digest:regulator-results"
      artifact_valid_period:
        status: not_applicable
        reason: immutable_search_capture_snapshot
      source_locator: "example://public-regulator-search"
      rights_status: synthetic_fixture_unrestricted
    - artifact_id: "example:search-capture:news-results"
      version_id: "example:search-capture:news-results:2026-08-10"
      digest: "example:sha256:not-a-real-digest:news-results"
      artifact_valid_period:
        status: not_applicable
        reason: immutable_search_capture_snapshot
      source_locator: "example://public-news-search"
      rights_status: synthetic_fixture_unrestricted
  evidence_uses:
    - evidence_use_id: "example:evidence-use:search-no-public-hit"
      locator: "example:search-ledger:open-negative:all-results"
      polarity: no_public_counterexample_found
      applicability: bounded_search_only
      inferential_role: search_result_not_evidence_of_worldwide_absence
  origin_and_dependencies:
    observation_origins: []
    known_shared_origins: []
    unresolved_lineage:
      - undisclosed_company_incident_records
      - confidential_regulator_reports
      - private_insurer_and_customer_records
      - jurisdictions_without_public_indexing
    watch_set:
      - "example:public-regulator-search"
      - "example:public-correction-and-recall-feed"
      - "example:policy:open-world-negative:1"
  search:
    plan_id: "example:search-plan:open-negative:1"
    sources:
      - fictional_public_regulator_database
      - fictional_public_recall_database
      - fictional_news_archive
      - fictional_company_disclosure_page
    languages: [en, fr, es, de]
    support_path: search for explicit complete-ledger or no-incident disclosures
    counter_path: search incidents, recalls, complaints, corrections, litigation, and translated synonyms
    executed_range: 2026-08-08/2026-08-10
    searched_through: 2026-08-10T20:00:00Z
    stop_rule: all preregistered public sources and queries executed once plus archive check
    provider_failures:
      - one regional index returned rate-limit error and remained inaccessible
    inaccessible_space:
      - non-public organizational records
      - confidential regulator and insurer reports
      - unindexed local-language sources
      - deleted or never-created records
    result: no qualifying public report found; universal claim unresolved
  transformations:
    - type: query_translation
      tool: "example:translation-tool:1"
      validation: bilingual spot review passed; low-resource languages not covered
  reviews:
    - role: research_analyst
      actor: "example:reviewer:A"
      conflict: none_declared
      blind_initial_decision: insufficient_evidence
    - role: adversarial_reviewer
      actor: "example:reviewer:B"
      conflict: none_declared
      blind_initial_decision: closure_unproven
      objections:
        - non-public events are outside the observable corpus
        - one regional provider failed
    - role: adjudicator
      actor: "example:reviewer:C"
      conflict: none_declared
      decision: finalize_AbstentionAttestation
  deterministic_checks:
    claim_is_open_world_negative: true
    valid_local_closure_present: false
    universal_negative_issue_blocked: true
    search_plan_and_run_diff_visible: true
    provider_failure_not_treated_as_absence: true
    nonissue_result_axes_absent: true
    no_active_status_projection_created: true
    required_roles_distinct: true
    replay_manifest: "example:replay:open-negative:0001"
    temporal_order_holds: searched_through_lte_integrated_through_lte_prepared_at
    temporal_substitution_negative_tests:
      - mutation: use_searched_through_as_claim_valid_period_end
        expected: reject
      - mutation: use_prepared_at_as_issued_at
        expected: reject
      - mutation: treat_provider_failure_as_evidence_of_absence
        expected: reject
      - mutation: coerce_unknown_artifact_validity_to_search_capture_time
        expected: reject
  uncertainty_and_limits:
    assumptions:
      - the synthetic public-source captures accurately record the executed queries
    unknowns:
      - whether any qualifying incident occurred
      - whether a record existed but was inaccessible, unindexed, deleted, or suppressed
    objections:
      - search did not cover every language or private source
    residual_risks:
      - users may misread no public result as no incident
      - future disclosure may reveal a counterexample
  attestation_timing:
    observed_at: 2026-08-10T20:00:00Z
    captured_at: 2026-08-10T20:30:00Z
    evaluated_at: 2026-08-12T13:00:00Z
    integrated_through: 2026-08-12T13:00:00Z
    next_search_due: 2026-09-10
    invalidation_triggers: [new_public_report, source_access_restored, closure_evidence, policy_defect]
    correction_records: []
    prior_attestation_relation:
      predecessor_id: null
      new_information_requires_new_run: true
      receipts: []
  appeal_contract:
    target:
      object_type: AbstentionAttestation
      object_id: "example:abstention-attestation:open-negative:0001"
    channel: "example://appeals/open-world-negative"
    allowed_grounds: [missing_source, valid_closure_available, wrong_scope, search_error, rights_error]
    channel_status: available
abstention_payload_digest: "example:sha256:not-a-real-abstention-attestation-digest"
signature_envelope:
  format: COSE_Sign1
  status: synthetic_fixture_signature_present
  covered_object: abstention_payload
post_signature_receipts:
  transparency_receipt: null
finalization_event:
  event_id: "example:finalization-event:open-negative-abstention:0001"
  schema_version: example-finalization-event-0.1
  terminal_object_id: "example:abstention-attestation:open-negative:0001"
  terminal_object_type: AbstentionAttestation
  terminal_payload_digest: "example:sha256:not-a-real-abstention-attestation-digest"
  terminal_signature_envelope_digest: "example:sha256:not-a-real-open-negative-attestation-signature-envelope-digest"
  terminal_intent_sequence: 91
  finalized_at: 2026-08-12T14:00:00Z
  transaction_order_reference: "example:wal-lsn:0/3000000"
  run_disposition: abstained
  initial_visibility: restricted
  audit_event_ids: ["example:audit-event:open-negative-abstention-finalize:0001"]
  outbox_event_ids: ["example:outbox:open-negative-abstention-finalize:0001"]
finalization_receipt:
  payload:
    schema_version: example-finalization-receipt-0.1
    finalization_event_id: "example:finalization-event:open-negative-abstention:0001"
    finalization_event_digest: "example:sha256:not-a-real-open-negative-finalization-event-digest"
    object_id: "example:abstention-attestation:open-negative:0001"
    terminal_payload_digest: "example:sha256:not-a-real-abstention-attestation-digest"
    signature_envelope_digest: "example:sha256:not-a-real-open-negative-attestation-signature-envelope-digest"
    terminal_intent_sequence: 91
    finalized_at: 2026-08-12T14:00:00Z
    run_disposition: abstained
    initial_visibility: restricted
    audit_event_ids: ["example:audit-event:open-negative-abstention-finalize:0001"]
    outbox_event_ids: ["example:outbox:open-negative-abstention-finalize:0001"]
  payload_digest: "example:sha256:not-a-real-open-negative-finalization-receipt-payload-digest"
  signature_envelope:
    format: COSE_Sign1
    covered_object: finalization_receipt.payload
    status: synthetic_fixture_finalization_signature_present
  status_signer_trust_snapshot: "example:trust-snapshot:status-signer:1"
activation_record:
  activation_id: "example:activation:open-negative-abstention:0001"
  schema_version: example-activation-record-0.1
  terminal_object_id: "example:abstention-attestation:open-negative:0001"
  terminal_object_type: AbstentionAttestation
  finalization_event_digest: "example:sha256:not-a-real-open-negative-finalization-event-digest"
  finalization_receipt_payload_digest: "example:sha256:not-a-real-open-negative-finalization-receipt-payload-digest"
  finalization_signature_envelope_digest: "example:sha256:not-a-real-open-negative-finalization-signature-envelope-digest"
  expected_pre_activation_state: public_seal_pending
  aggregate_sequence: 2
  activated_at: 2026-08-12T14:00:01Z
  authorized_view: restricted
  disclosure_policy_version: "example:disclosure-policy:restricted:1"
  disclosure_manifest_digest: "example:sha256:not-a-real-open-negative-disclosure-manifest-digest"
  served_view_digest: "example:sha256:not-a-real-open-negative-served-view-digest"
  lifecycle_watermark: not_applicable
  challenge_watermark: none
  rights_watermark: "example:rights-snapshot:open-negative:1"
  dependency_watermark: "example:dependency-snapshot:open-negative:1"
  trust_watermark: "example:trust-snapshot:activation:1"
  activation_authority: "example:authority:activation-service"
  audit_event_ids: ["example:audit-event:open-negative-abstention-activation:0001"]
  outbox_event_ids: ["example:outbox:open-negative-abstention-activation:0001"]
  transaction_order_reference: "example:wal-lsn:0/3000001"
  authority_evidence: canonical_database_transaction_and_audit_chain
  state: externally_activated
```

## Source register and limits

The evaluation design combines narrow mechanisms; none validates the complete
engine:

| Source | Contribution | Limit retained here |
| --- | --- | --- |
| [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) and [Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | Govern, map, measure, manage, document limits, and test generative-AI risks. | A framework is not certification that a system is trustworthy. |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | Interoperable provenance entities, activities, agents, and derivation. | Provenance does not establish truth, quality, or completeness. |
| [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/) | Open-world semantics and the distinction between unknown and false. | A semantic model does not prove source completeness. |
| [FEVER](https://aclanthology.org/N18-1074/), [SciFact](https://aclanthology.org/2020.emnlp-main.609/), and [AVeriTeC](https://proceedings.neurips.cc/paper_files/paper/2023/hash/cd86a30526cd1aff61d6f89f107634e4-Abstract-Datasets_and_Benchmarks.html) | Retrieval, rationale, and real-world claim diagnostics. | Public, incomplete, potentially contaminated, and narrower than the end-to-end contract. |
| [Selective prediction](https://www.jmlr.org/papers/volume11/el-yaniv10a/el-yaniv10a.pdf) and [Conformal Risk Control](https://openreview.net/forum?id=33XGfHLtZg) | Formalize the coverage-risk trade-off and bounded risk under stated exchangeability conditions. | Guarantees fail outside their assumptions and do not create a truth oracle. |
| [WILDS](https://proceedings.mlr.press/v139/koh21a.html) and [Ovadia et al.](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html) | Grouped distribution-shift evaluation and evidence that uncertainty degrades under shift. | Their tasks are not verification-engine deployment evidence. |
| [Cochrane search guidance](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04) and [PRISMA-S](https://systematicreviewsjournal.biomedcentral.com/articles/10.1186/s13643-020-01542-z) | Reproducible, peer-reviewed search planning and reporting. | Even a strong search cannot guarantee discovery of all unpublished or inaccessible evidence. |
| [National Academies on reproducibility and replicability](https://www.nationalacademies.org/read/25303/chapter/3) | Separates rerunning the same computation from obtaining consistent new evidence. | Reproducibility does not validate inputs or causal interpretation. |
| [BagIt](https://www.rfc-editor.org/rfc/rfc8493), [RO-Crate](https://www.researchobject.org/ro-crate/), and [ACM artifact review](https://www.acm.org/publications/policies/artifact-review-and-badging-current) | Package identity, research-object metadata, and independent artifact review. | A complete artifact may still implement a bad method or evaluate the wrong claim. |
| [Wrong-label reliance experiment](https://pubmed.ncbi.nlm.nih.gov/40263336/) | Demonstrates that inaccurate warnings can move judgments and reverse discernment. | Controlled experimental settings do not determine this product's effect size. |

The external corpus is necessarily incomplete. Public evidence is concentrated
in English and high-resource institutions; official sources can be wrong;
standards communities overlap; benchmark labels can be disputed; closed
registers can publish mistaken data; and future model providers may change
without full disclosure. Those limitations are not reasons to abandon testing.
They are reasons to keep the promise bounded, the abstention visible, the
evaluation prospective, and the final architecture decision reversible.
