---
context_room:
  id: research.verification-engine.assurance-model
---

# Assurance model

## Summary

The engine must certify a scoped evidence dossier and the execution of a
declared protocol. It must not certify unqualified, universal truth. Its
strongest honest statement is conditional: given identified inputs, rules,
assumptions, versions, and a bounded domain, the recorded result follows and
can be checked.

This document defines the claim taxonomy, assurance dimensions, narrowly
defensible 100-percent guarantees, orthogonal result axes, abstention rules,
temporal lifecycle, and certificate contract. It is a research proposal, not
an accepted Parallax contract.

## Defines

The proposed epistemic contract for a standalone verification engine.

## Does not define

The storage topology, UI, staffing model, legal basis for a deployment, or an
approved implementation.

## The object being certified

The engine evaluates an object of the following form:

```text
Assurance(
  claim_version,
  scope,
  world_valid_time,
  system_record_time,
  evidence_corpus,
  assumptions,
  method_profile,
  decision_policy,
  component_versions
)
```

It never evaluates only `True(claim)`.

This distinction is necessary because provenance, source support, inference,
corpus coverage, and correspondence with the world can diverge. The C2PA
explainer explicitly says that a valid, untampered Content Credential does not
establish that the represented content is true or factual
([C2PA goals and non-goals](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html#_goals_and_non_goals)).
W3C PROV similarly supplies an interoperable representation of entities,
activities, agents, and derivation; it is a provenance vocabulary, not an
epistemic adjudicator
([PROV-O Recommendation](https://www.w3.org/TR/prov-o/)).

## What can be guaranteed at 100 percent

“100 percent” is reserved for a property that is completely specified and
checked inside a declared trust boundary. It must always name the object,
conditions, and trusted computing base.

| Property | Defensible guarantee after receipt validation | What remains outside the guarantee |
| --- | --- | --- |
| Schema and invariant validation | Validated receipts show that every declared machine-checkable constraint passed for this exact object under the named checker and policy versions. | The schema or policy may omit an important real-world requirement. |
| Content identity | A validated digest receipt binds the retained bytes to the declared digest and algorithm. | The bytes may be false, misleading, or wrongly attributed. |
| Signature validation | A validation receipt shows that a signature passed under a named algorithm, key, trust policy, and validation time. | The key holder may lie; keys, identity binding, or trust anchors may be compromised. |
| Deterministic replay | A replay receipt shows that the declared inputs and environment reproduced the same deterministic output. | The inputs may incompletely represent the world. |
| Proof checking | A checker receipt shows that a named proof checker accepted a derivation from declared axioms. | Axioms, formalization, checker, compiler, and hardware remain assumptions. Formally verified systems such as seL4 likewise publish explicit proof assumptions ([seL4 assumptions](https://sel4.systems/Verification/assumptions.html)). |
| Closed-snapshot query | Acquisition and query receipts show that the result is exhaustive within the named snapshot and locally closed predicate. | The completeness assertion, identity rules, issuing authority, or source snapshot may be wrong. |
| Procedure execution | Validated stage receipts show that every instrumented mandatory step ran over the recorded inputs. | The protocol itself may be inadequate, and uninstrumented action remains possible. |
| Log inclusion and consistency | Validated inclusion and consistency receipts hold under the specified log design. | A statement may have been omitted before submission; a lone log can equivocate without independent witnesses. RFC 9943 scopes its guarantee to authenticity, registration, transparency, and replayable log structure ([SCITT architecture](https://www.rfc-editor.org/rfc/rfc9943.html)). |

In a product result, certificate, badge, report, API or user-facing rendering,
the word `100%` is permitted only in the mechanically testable form: “100% of
the checks jointly required by exact `MethodProfile`, `PolicyBundle`,
`TransverseMinima`, `OutcomeRegistry`, trust snapshot, rights/safety policy,
and diagnostic-map versions have valid receipts for object digest `D`.” Every
version/digest must be rendered or losslessly resolved through one signed
manifest digest. A receipt is valid only if its schema, input and output
digests, checker identity and version, policy version, authority, time basis,
and signature or replay proof all validate. A missing, malformed, untrusted,
expired, or semantically inapplicable receipt is not a partial pass; it is
`unknown` or `fail` under the profile and blocks issue.

Internal preregistered evaluation and control specifications may separately
use an exact 100-percent pass threshold for a finite named denominator, such as
all injected lifecycle triggers or every supported transform. Those are test
acceptance criteria, not certificate language or evidence that a world claim is
true. Their report must state numerator, denominator, scope and failures; they
may not be rendered as “100% confidence,” “100% verified,” or a product badge.

The system must distinguish two proof classes:

- a **machine observation receipt** attests what a deterministic checker
  observed and can itself be replayed or validated; and
- a **judgment attestation** proves that a named, qualified, non-disqualified
  person recorded a judgment over exact inputs under a declared rubric.

The engine may say that every required judgment attestation is present and
valid. It may not convert that procedural fact into a guarantee that the
judgments correspond to the world. Public language must therefore say “all
declared checks have validated receipts” rather than “this is 100 percent
true.”

## Open world by default

Public information lives in an open world: failure to find a fact does not make
its negation true. The W3C OWL primer explains the open-world assumption under
which missing information may simply be unknown
([OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)).

A local closed-world conclusion is allowed only when the certificate records:

- the finite domain or bounded predicate;
- the authoritative source and exact snapshot;
- an explicit completeness assertion and its issuer;
- identity, alias, and deduplication rules;
- successful acquisition of every declared constituent;
- deterministic query semantics;
- validity and expiry times; and
- an explanation of what the closure does not cover.

Consequently:

- “no matching record exists in complete register `R` at snapshot `S`” may be
  demonstrated under that closure;
- “no matching entity exists in the world” remains unknown; and
- “the bounded search protocol found no matching evidence” is a search result,
  not proof of absence.

SHACL can validate a graph against declared shapes, but successful validation
does not prove that the graph contains every real-world fact
([SHACL Recommendation](https://www.w3.org/TR/shacl/)).

## Claim compiler

No claim enters evaluation as an undifferentiated sentence. A versioned claim
abstract syntax tree must capture at least:

- subject, predicate, object or outcome;
- quantifier and polarity;
- modality and causal versus associational force;
- population, geography, jurisdiction, and exclusions;
- time, observation window, and tense;
- units, threshold, denominator, and comparison class;
- declared definitions and ontology versions;
- original utterance, speaker, appearance, and surrounding context;
- decomposed subclaims and their logical relationship; and
- ambiguity, normative content, and unresolved presuppositions.

An ambiguous or compound claim is returned for clarification or decomposed; it
cannot receive a stronger status merely because a model produced an atomic-
looking paraphrase. This is a measurable risk: correcting automated claim
extractions changed downstream verification verdicts in 24.9 percent of cases
in the FactRBench/VeriFact study
([VeriFact paper](https://aclanthology.org/2025.emnlp-main.905/)).

## Claim families and assurance ceilings

The ceiling is a family-specific set of permitted outcome wordings after all
required controls pass. A “strongest” member exists only inside a versioned,
same-polarity strength track such as `strongly_supported > supported`; outcomes
on different semantic or polarity tracks are incomparable. A method profile may
narrow the permitted set; it may never silently expand it.

| Claim family | Example | World | Verification standard/minimum | Automatable portion | Mandatory human authority | Maximum honest epistemic outcome | Typical mandatory abstention cause | Revision/freshness floor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Formal theorem | “Formula `T` follows from axioms `A`.” | Closed formal system | Named axioms, formal statement, complete derivation, independently controlled proof check | Parsing, proof checking, replay, receipts | Approve formalization and the correspondence between natural-language claim and theorem | `demonstrated_in_system` | Ambiguous formalization, unavailable axiom/version, checker disagreement, or replay failure | Event-driven on axiom, checker, compiler, proof, or formalization change; no timeless carry-over to a changed system |
| Deterministic calculation | “Given dataset `D` and formula `F`, result is `R`.” | Closed over frozen inputs | Frozen data/code/environment/units plus independent reproduction and boundary tests | Calculation, environment replay, unit and invariant tests | Approve input meaning, exclusions, units, and intended calculation | `reproduced_on_inputs` | Missing input, unit ambiguity, non-determinism, independent mismatch, or overflow/precision failure | Event-driven on any input, formula, code, dependency, environment, or unit change |
| Bounded source or official-register lookup | “Entity `E` appears in register snapshot `S`.” | Locally closed only | Named predicate authority, exact snapshot, identity rules, independent acquisition/query validation; absence also requires explicit predicate-specific completeness | Acquisition receipts, identity/query execution, pagination and snapshot checks | Approve authority, predicate scope, completeness assertion, and identity collisions | `confirmed_in_bounded_source` or `absent_from_bounded_source` | Authority/snapshot unavailable, identity unresolved, pagination incomplete, closure unproven, or conflicting competent record | At source update/declared snapshot cadence and before the completeness assertion or authority expires |
| Documented attribution | “Speaker `P` said sentence `Q` in artifact `A`.” | Bounded artifact | Adequate origin, exact digest/version/locator, faithful quotation, surrounding context and transformation chain | Digest/locator validation, transcription alignment, version diff | Approve identity, origin, semantic quotation/context, and material omissions | `attribution_confirmed` | Origin, speaker identity, locator, context, translation, or retention right unresolved | On artifact correction/version change, identity challenge, transformation change, or profile TTL |
| Digital artifact authenticity | “These bytes validate under credential/key `K`.” | Partially closed | Exact bytes/digest, signature/provenance and revocation validation, transformation history, trust snapshot | Hash, signature, credential, manifest, and replay checks | Approve identity/trust-policy applicability and unresolved provenance conflicts | `integrity_or_provenance_validated` | Missing bytes, invalid/unknown trust chain, key compromise boundary, or unexplained transformation | On key/trust/revocation/provenance event, byte/version change, or trust-policy expiry |
| Measurement | “Quantity `X` was estimated as `v ± u`.” | Empirical and model-dependent | Protocol, calibration and metrological traceability, error/uncertainty model, population and validity envelope | Formula/unit checks, calibration-file validation, uncertainty propagation where specified | Approve protocol fitness, traceability, error model, exclusions, and applicability | `measured_or_estimated_with_uncertainty` | Calibration/traceability gap, invalid protocol, unavailable raw observation, or uncertainty outside profile | At calibration/protocol/instrument change and the shorter of source validity or profile TTL |
| Descriptive statistic | “Rate `r` was reproduced in dataset `D`.” | Closed over a dataset | Frozen population, exclusions, denominator, data and executable method; independent recomputation | Query/calculation/replay and deterministic sensitivity checks | Approve population, missingness, exclusions, denominator, and disclosure risk | `reproduced_on_dataset` | Dataset/version unavailable, population ambiguous, missingness unresolved, or recomputation mismatch | On dataset/method revision; otherwise at declared data-release cadence |
| Current mutable state | “Official value `X` was `v` at time `t`.” | Open and temporal | Recent competent observation, exact valid/capture time, identity resolution, TTL and watch source | Fetch/version checks, TTL and dependency monitoring | Approve authority, identity, scope, and action-sensitive freshness | `observed_at_time` | No sufficiently fresh observation, authority conflict, identity collision, or monitoring gap | Mandatory TTL set by source volatility and intended harm; immediately on authoritative delta |
| Historical event | “Event `E` occurred in place/time `P/T`.” | Open | Primary records, distinct origin clusters/methods, source criticism, alternative hypotheses, counter-research, leave-one-cluster-out | Retrieval ledger, lineage proposals, locators, deterministic thresholds | Adversarial source criticism, identity/time/scope judgment, material-counterevidence adjudication | `strongly_supported`, `supported`, `mixed`, or `contradicted` | Independence/coverage insufficient, material counterevidence unresolved, or scope/identity uncertain | At material new archive/correction/challenge; otherwise profile risk-based review interval |
| Scientific association or cause | “Exposure `X` changes outcome `Y` in population `P`.” | Open and underdetermined | Subtype/estimand-specific design predicates, risk-of-bias assessment, synthesis, heterogeneity, counter-research, sensitivity, certainty mapping and causal-warrant gate | Search/replay support, extraction validation, specified statistics and rule evaluation | Qualified domain reviewers independently assess bias, applicability, causal warrant, synthesis, certainty and dissent | `strongly_supported`, `supported`, `mixed`, or `contradicted`, always with `domain_certainty` | Unsigned subtype mapping, causal-design mismatch, synthesis boundary ambiguity, inaccessible material study, low certainty, or unresolved expert disagreement | At each living-review search cadence and immediately on correction/retraction, pivotal evidence, method, population or certainty-scale change |
| Legal text | “Official text `L` was in force in jurisdiction `J` at `t`.” | Jurisdictional and temporal | Official text/version, commencement, repeal, transition rules, hierarchy, subject and jurisdiction | Version/effective-date lookup, signature/digest and temporal rules | Qualified legal reviewer approves source hierarchy, jurisdiction, transition and wording boundary | `official_text_in_force_at_time` | Official version unavailable, commencement/repeal ambiguous, jurisdiction/subject unresolved, or conflicting competent text | Continuous official-source watch; immediate on amendment, repeal, decision or transition event |
| Legal interpretation | “Interpretation `I` is supported for facts `F`.” | Open and authority-dependent | Exact facts/assumptions, applicable text, authority hierarchy, precedents, counterarguments, conflict and jurisdiction/time | Retrieval, citation/version and hierarchy-rule checks | Qualified independent legal interpretation and conflict adjudication | `interpretation_supported` | Missing material fact, competent-authority conflict, unavailable expertise, pending decisive proceeding, or rights restriction | Short deployment-specific TTL and immediate review on authority, fact, jurisdiction or precedent change |
| Forecast | “Outcome `O` has forecast distribution `p` by horizon `h`.” | Future | Named outcome/horizon, reference class, model, calibration envelope, scoring rule, shift check and expiry | Model execution, calibration/score and drift checks | Approve outcome definition, reference class, action context, model limits and communication | `calibrated_forecast` | No valid calibration population, horizon/outcome mismatch, distribution shift, or stale model | At every forecast horizon/model/data change and according to predeclared recalibration cadence |
| Intention or private mental state | “Person `P` reports intending `I`.” | Usually inaccessible beyond authentic report | Authentic self-report or narrowly bounded attributed behavior; never infer private state as fact | Origin/identity/quotation checks | Approve attribution, consent/authority, context, safety and wording | `attributed` | No authentic report, evidence inaccessible, identity unresolved, or inference exceeds attribution | Very short context-sensitive TTL; immediate on withdrawal, correction, later report, or authority change |
| Norm, value, or preference | “Group `G` states value position `V`.” | Norm itself is not truth-apt | Compile a separate factual attribution with authentic source, represented constituency and context | Origin/quotation/locator checks | Approve that output is attribution rather than certification of the norm; assess representation | `position_documented` for the attribution only | `not_truth_apt`, representation unresolved, source inaccessible, or context materially incomplete | On statement/governance/context change and at an agreed stakeholder-review cadence |
| Contested definition or category boundary | “Term `T` means `D` for this policy.” | Open until operative definition/authority fixed | Rival definitions and provenance, intended use, affected groups, authority and outcome sensitivity | Versioning, comparison and sensitivity calculations | Authorized stakeholder/domain decision with dissent and affected-party review | `position_documented` for attributed definitions or an ordinary-family outcome under one named operative definition | Definition choice is outcome-determinative and unauthorized, material rival omitted, or scope unresolved | On authority/definition/use change and mandatory periodic affected-party review |
| Private or sensitive allegation about a person | “Person `P` committed act `A`.” | Open, high-harm, access-constrained | Verified authority/necessity, identity certainty, primary evidence, notice/response or documented exception, strict independence/counter-research, legal/safety review, narrow audience | Mechanical evidence integrity, lineage, receipts, access and expiry controls only | Independent domain, legal/safety, affected-party/process and final issue authorities; no sole-analyst approval | Applicable ordinary-family outcome set; public visibility forbidden by default | Policy refusal, rights/safety block, identity uncertainty, response-process failure, insufficient evidence, or material counterevidence | Shortest profile TTL; immediate on response, correction, legal/safety event, identity/evidence change or challenge |
| Open-world negative or universal | “No entity anywhere has property `P`.” | Open unless local closure proven | Preapproved multi-path counterexample search, aliases/languages/inaccessible classes; stronger absence only within a valid local closure | Query execution, coverage receipts and counterexample checks | Approve quantifier/scope, search design, counterexample materiality and any closure assertion | `no_counterexample_found` or `counterexample_found`; `absent_from_bounded_source` only inside closure | Coverage/identity/closure insufficient, material candidate unresolved, or inaccessible critical class | At each material corpus/source/index/language change and a short risk-based search refresh interval |

For measurements, uncertainty is part of the result rather than an optional
footnote, consistent with the metrology framework in the
[JCGM Guide to the Expression of Uncertainty in Measurement](https://www.bipm.org/en/committees/jc/jcgm/publications).

`Bounded source` is the canonical term. `Register`, `registry`, `official`, and
`authoritative` are not global quality labels: they mean only that a named
issuer has authority for a stated predicate, population, jurisdiction, valid
period, and snapshot. A closure is valid only when that issuer's explicit
completeness assertion covers those same bounds. Public availability, an
official-looking domain, or a search endpoint does not establish completeness.

## Assurance vector

Each published result exposes dimensions separately. A policy may derive a
plain-language summary, but it cannot replace or average away the vector.

| Dimension | Core question | Example evidence | Blocking reason when unmet |
| --- | --- | --- | --- |
| Claim specification | Is the proposition singular, scoped, and interpretable? | Claim AST and human-approved wording | `scope_unresolved` |
| Artifact integrity | Are the evaluated bytes preserved and unchanged? | Digest, capture manifest, validation report | `evidence_inaccessible` or `integrity_failed` |
| Attribution/authenticity | Is origin adequately established for this use? | Signature, publisher record, chain of custody | `origin_unresolved` |
| Citation fidelity | Does the exact passage say what is attributed to it? | Excerpt, locator, surrounding context | `citation_mismatch` |
| Scope relevance | Does the evidence concern the same population, time, definitions, and outcome? | Structured applicability comparison | `scope_mismatch` |
| Inferential warrant | Does the conclusion follow with the declared strength? | Argument graph, executable proof, reviewer rationale | `inference_unsupported` |
| Method quality | Is the evidence-generating method fit for this claim family? | Domain risk-of-bias profile | `method_below_profile` |
| Origin independence | How many distinct observations or datasets exist? | Origin and funding lineage graph | `dependence_unresolved` |
| Corpus coverage | Was a reproducible support and counterevidence search completed? | Search ledger, inclusion/exclusion decisions | `coverage_insufficient` |
| Counterevidence resolution | Was every material candidate independently admitted or rejected before outcome selection? | Materiality decisions, adversarial review, alternative hypotheses, signed adjudications | `material_counterevidence_unresolved` |
| Temporal validity | Is the result valid now and was it valid at the asserted time? | Valid-time interval, capture time, TTL, change monitor | `temporal_requirements_unmet` |
| Uncertainty/calibration | Is quantitative uncertainty meaningful for the target population? | Intervals, scoring history, reliability curves | `uncalibrated` or `out_of_distribution` |
| Review competence and independence | Did the right reviewers examine the right decisions without disqualifying conflicts? | Qualifications, disclosure, assignment and agreement record | `qualified_review_unavailable` |
| Reproducibility | Can an authorized auditor reconstruct the deterministic portion? | Replay package and environment manifest | `replay_failed` |
| Procedural conformance | Did the applicable profile and transition policy pass? | Kernel decision record | `protocol_failed` |

The number of sources is deliberately absent. Ten URLs copied from one press
release or dataset are one origin lineage until evidence shows otherwise.

Every dimension result uses the closed enum `pass | fail | unknown |
not_applicable`. `Unknown` always fails closed for issuance. `Not_applicable`
is valid only when the versioned method profile contains an applicability
predicate, that predicate deterministically evaluates false on the frozen
claim, and the kernel records the proof. A worker, reviewer, or administrator
cannot use `not_applicable` as a discretionary skip.

## Evidence and inference objects

The model must not collapse these objects:

1. **Artifact** — exact captured bytes or an access-controlled digest when
   retention is not lawful or licensed.
2. **Artifact version** — immutable identity, retrieval metadata, format, and
   declared rights.
3. **Evidence use** — a locator-bounded portion used for a particular claim and
   polarity.
4. **Observation origin** — the experiment, witness, measurement, registry
   entry, dataset, or event from which publications derive.
5. **Transformation** — transcription, translation, OCR, aggregation,
   statistical analysis, or model operation.
6. **Inference step** — premises, rule, assumptions, strength, author, and
   objections.
7. **Evaluation** — a reviewer or checker decision on one dimension.
8. **Certificate** — a signed snapshot of the result under a method and policy.

The `Entity`, `Activity`, and `Agent` primitives and derivation relationships in
PROV-O are suitable for export and interchange
([PROV-O starting-point terms](https://www.w3.org/TR/prov-o/#description-starting-point-terms)).
They do not replace the engine's domain-specific constraints.

## Rights, access, and evidence are separate predicates

A successful fetch, an HTTP `200`, public visibility, `robots.txt` permission,
source authority, evidentiary relevance, and lawful authorization are distinct
facts. None implies the others. For each artifact and transformation, the
rights gate records the asserted legal or contractual basis, jurisdiction,
source terms and licence version, copyright and database-right constraints,
privacy/consent basis where applicable, permitted acquisition, retention,
transformation, quotation, disclosure, and model-use purposes, expiry, and the
responsible decision authority. `robots.txt` and site terms are recorded as
separate acquisition controls; neither is described as a legal licence.

An unresolved right is `unknown` and blocks the affected operation or public
view. It does not lower an epistemic score, make evidence disappear, or justify
claiming absence. The engine records metadata-only or inaccessible-evidence
receipts when bytes cannot lawfully be retained. This is an engineering
contract for obtaining a documented decision, not legal advice or a claim that
one rule applies in every jurisdiction.

## Source independence

Independence is evaluated at several levels:

- separate URLs;
- separate publications;
- separate authors or institutions;
- separate datasets or witnesses;
- separate evidence-generating methods;
- separate funding, coordination, and editorial control; and
- plausible shared systematic bias.

The system records both declared and inferred lineage, along with confidence
and the evidence for the inference. It must preserve an `unknown` state rather
than assume independence. Multiple replications can still share the same bias,
so convergence by count alone is insufficient
([Jeong and Rothenhäusler, 2025](https://jmlr.org/papers/v26/23-0714.html)).

### Disqualifiers and countable clusters

The unit counted for corroboration is an `ObservationCluster`, not a URL,
publication, author, or model response. Two items are in the same cluster when
they ultimately reuse the same observation, dataset, witness, measurement,
registry row, press release, wire copy, or generated answer. Until lineage is
resolved, the cluster is `unknown` and contributes zero to an independence
minimum.

An origin is disqualified from an *independent* count when any of these
conditions applies to the relevant proposition:

- it is a mirror, translation, syndication, summary, citation, or transformation
  of another counted origin without a new observation;
- it shares the decisive dataset, witness, instrument run, registry row, or
  evidence-generating event;
- coordination, common editorial control, common funding with control over the
  result, or undisclosed collaboration can determine both outputs;
- one source was generated from, trained on for this case, or prompted with the
  other source's result; or
- the available provenance cannot rule out one of those dependencies.

Reviewer independence is assessed separately. A reviewer is disqualified for
the affected decision when they authored or approved the object under review,
participated in the original contested decision, have a material financial or
managerial interest, have an undisclosed close relationship or recent material
collaboration with a party, or cannot make the required conflict declaration.
Two personas, agents, or runs of the same model are never independent
reviewers.

### Non-lowerable default thresholds

Profiles may require more independence; they may not require less than the
following defaults:

| Requested outcome/family | Minimum countable independence | Leave-one-cluster-out rule |
| --- | --- | --- |
| `strongly_supported` for an empirical or historical claim | At least three non-disqualified observation clusters, spanning at least two evidence-generating methods or data-collection paths. | Removing any one cluster must leave `supported` or stronger; a reversal, `mixed`, or `unknown` blocks the requested outcome. |
| `supported` for an empirical or historical claim | At least two non-disqualified observation clusters. | Removing the most influential cluster must not produce `contradicted` or `counterexample_found`; if it leaves insufficient warrant, `supported` becomes ineligible and only a separately attested eligible same-track fallback or abstention is allowed. |
| Bounded-source lookup | One predicate-authoritative snapshot may establish presence or absence only inside its valid closure; independent acquisition plus deterministic query validation are still required. | Removing the authority eliminates the closure, so the result becomes ineligible rather than being presented as corroborated. |
| Attribution to an artifact | One adequately authenticated artifact may suffice; a reviewer independent of the claimant must validate origin, locator, quotation, and context. | Removing that artifact eliminates the outcome. No source-count language is permitted. |
| Deterministic calculation or formal proof | One frozen input set may suffice, but an independently implemented or separately controlled checker/reproducer is mandatory. | The result must survive each required checker path; disagreement blocks issue. |
| Public output in every family | At least one final approver independent of the dossier author and requester, plus any stricter domain or harm-tier quorum. | Removing every non-disqualified approval blocks public issue. |

The kernel computes a `leave_one_cluster_out` vector over exact cluster IDs and
stores every recomputed ceiling. “Independent consensus” is forbidden unless
these tests and the applicable profile threshold pass.

## Counterevidence protocol

Every result needs a reproducible attempt to defeat the requested outcome. A
versioned `SearchPlan` is frozen and approved by an adversarial reviewer before
the team opens or ranks newly retrieved results. Known sources supplied at
intake are sealed as seed inputs; they do not satisfy execution of the plan.
Any amendment is prospective, separately approved, and leaves the original
plan and already observed results intact. A plan written or backfilled after
results are seen is invalid.

The certificate records:

- databases, registries, sites, APIs, and archives searched;
- query text, translations, synonyms, dates, and filters;
- candidate-result identifiers and ranking position where available;
- inclusion and exclusion decision with reason;
- known inaccessible, paywalled, deleted, or unindexed sources;
- alternative hypotheses and predicted observations;
- explicit searches for refutations, corrections, retractions, adverse
  results, and null findings;
- coverage estimate and its method; and
- stopping rule, resource limit, and search completion time.

The following family minima are transverse floors. A method profile may add
sources, languages, tests, or reviewers, but cannot remove these paths:

| Claim family | Mandatory counter-research floor |
| --- | --- |
| Formal proof or deterministic calculation | Attempt a counterexample or proof failure; test boundary conditions, units, overflow/precision, input substitution, and environment dependence; run an independently controlled checker or reproduction path. |
| Bounded source, official register, or attribution | Search the exact version plus corrections, amendments, retractions, adjacent context, aliases, prior/current versions, pagination and completeness failures, and conflicting records from the same competent authority. |
| Digital artifact authenticity | Test alternative provenance, signature/revocation and key-compromise paths, transformations, metadata conflicts, and byte-level mismatch. |
| Measurement or descriptive statistic | Inspect exclusions, missingness, calibration and error, alternate specifications and denominators, data leakage, and an independent recomputation where lawful. |
| Current state, historical event, or legal text | Search conflicting primary records, corrections, version and effective-date changes, jurisdictional scope, identity collisions, and declared inaccessible archives. |
| Scientific association or causation | Search trial and study registries, retractions/corrections, null and adverse findings, cited and citing records, competing hypotheses, risk-of-bias signals, heterogeneity, and sensitivity to plausible analytical choices. |
| Forecast | Compare base rates and rival forecasts; inspect calibration history, horizon mismatch, outcome definition, and distribution shift. |
| Intention, mental state, norm, or preference | Search authentic counter-attributions and context. Do not infer inaccessible private state or convert a normative proposition into a factual outcome. |
| Open-world negative or universal | Search explicit counterexamples through at least two meaningfully different retrieval paths, identity aliases, relevant languages, corrections, and known inaccessible classes; absence stronger than `no_counterexample_found` additionally requires a valid local closure. |

A candidate is **material counterevidence** when, if admissible, it could change
the compiled scope, assurance dimension, ceiling, outcome, or publication
permission. Its discovery immediately sets the counterevidence dimension to
`unknown` and blocks issue. The researcher who found it cannot dismiss it
alone. An independent adjudicator must either admit it and recompute the
dossier, or reject it with a typed reason, exact evidence, and signed judgment.
Search budgets and deadlines never waive that blocker.

Counter-research is itself evaluated prospectively. Promotion of a search
configuration requires a preregistered hidden set containing material
counterevidence, including adversarial paraphrase, terminology drift, obscure
source classes, corrections, null results, and source-access failures. The
critical subset permits zero missed material blockers; general material-
counterevidence recall must meet a profile-owned lower confidence bound fixed
before the test. Test authors, search operators, and final graders are
separated, and fixtures remain hidden until the run is sealed. A miss forces
the affected profile or tier to remain manual, be narrowed, or be suspended.

The output may guarantee execution of this bounded protocol. It may not claim
exhaustiveness over the Web. Cochrane's current handbook likewise frames
searching as finding as many eligible studies as possible within practical
constraints and warns that unpublished or unreported results remain difficult
to detect
([Cochrane Handbook, searching](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04),
[reporting biases](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-13)).

## Quantitative confidence

There is no universal “truth percentage.” Quantitative outputs are admitted
only when a method profile defines their semantics and validation population.

- A likelihood ratio compares how expected evidence is under explicit rival
  hypotheses; it is not by itself the probability that a claim is true.
- Priors, likelihoods, posterior distributions, and decision thresholds remain
  separate and inspectable.
- Dependent evidence is not multiplied as if independent.
- Sensitivity analysis is required when plausible priors or model choices
  materially change the decision.
- Model self-reported confidence is never treated as calibration evidence.
- Calibration is measured over a defined population and period using proper
  scoring rules and reliability diagnostics.
- Any calibration expires on material model, policy, domain, or distribution
  change.

Selective prediction makes the central product trade-off explicit: reducing
risk generally requires reducing coverage through rejection or abstention
([El-Yaniv and Wiener, 2010](https://www.jmlr.org/papers/volume11/el-yaniv10a/el-yaniv10a.pdf)).
Post-hoc uncertainty can degrade under dataset shift, so in-distribution
calibration is not portable assurance
([Ovadia et al., 2019](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html)).

## Orthogonal machine result axes

No field may combine an evidence judgment, workflow result, and publication
state. The canonical machine contract uses three core result axes
(`epistemic_outcome`, `run_disposition`, `certificate_lifecycle`), two
independent presentation/governance axes (`visibility`, `challenge_status`),
and one optional domain modifier (`domain_certainty`):

| Axis | Closed values | Rule |
| --- | --- | --- |
| `epistemic_outcome` | The enum in the next table. | Immutable and non-null only on an issued `Certificate`; it never contains workflow or lifecycle states. |
| `run_disposition` | `certificate_issued`, `abstained`, `refused`, `failed`; null while the run is non-terminal. | Exactly one terminal value. It describes what happened to a run, not what is true. |
| `certificate_lifecycle` | `current`, `needs_review`, `stale`, `restricted`, `superseded`, `withdrawn`. | Exists only after issue finalization and is derived from immutable lifecycle events outside the signed certificate payload. Only `current` can occupy an active current pointer. |
| `visibility` | `private`, `restricted`, `public`. | Access policy, never evidence strength. `public` is allowed only when lifecycle and safety policy permit it. |
| `challenge_status` | `none`, `open`, `resolved_upheld`, `resolved_changed`, `dismissed`. | A challenge is displayed and routed independently. It does not itself rewrite the epistemic outcome. A material challenge triggers `needs_review`. |
| `domain_certainty` | Null for families without a signed certainty scale; otherwise one value from the exact domain scale/version bound by the method profile. | A separate modifier, never a cross-domain truth percentage. For scientific issue it is mandatory and must be compatible with both subtype and epistemic outcome. |

`Contested`, `verified`, `not_verifiable`, `stale`, and `withdrawn` are therefore
not epistemic outcomes. `Stale` and `withdrawn` belong only to lifecycle;
challenge belongs only to `challenge_status`; and inability to issue belongs to
`run_disposition` plus a typed receipt after run creation. A schema-valid
admission refusal before a run exists uses `PreRunRefusalReceipt`; a malformed
or integrity-invalid request envelope uses a boundary `FailureRecord`. Neither
has `run_disposition` or any epistemic meaning.

### Exhaustive run/result matrix

| Run condition | `run_disposition` | `epistemic_outcome` | `certificate_lifecycle` | Required terminal object |
| --- | --- | --- | --- | --- |
| A schema-valid request is prohibited by admission policy before a run exists | Not applicable; no run exists | null | null | Signed `PreRunRefusalReceipt`. |
| Work is not terminal | null | null | null | Append-only run attempts only. |
| All mandatory predicates pass and issue finalizes | `certificate_issued` | Exactly one permitted value | `current` at finalization | Immutable `Certificate`. |
| A truth-directed request cannot meet an applicable assurance predicate | `abstained` | null | null | `AbstentionAttestation`. |
| Policy rejects request, claimant authority, intended use, processing, or requested publication before issue finalization; this can occur before or after epistemic gates | `refused` | null; any reviewed candidate remains non-issued and non-authoritative | null | `RefusalReceipt` naming the prohibited operation and requested visibility. |
| The system cannot complete a trustworthy run because of a technical fault | `failed` | null | null | `FailureRecord`; retry does not imply absence. |

The matrix is exhaustive **once a `VerificationRun` exists**. Before run
creation, only the two boundary objects described above are valid, and neither
may create a claim, dossier, certificate, badge, or current pointer merely to
fill the matrix.

No other combination is valid. The pre-run row is not a run-disposition
exception: the axis is absent because no run was created. In particular, an
abstention is not a low-confidence certificate, a refusal is not a negative
outcome, and a failed run cannot emit a badge or current pointer.

A late publication refusal does not erase or reinterpret completed review. It
means the requested issuance or view is prohibited. The evaluated candidate can
remain inside the protected dossier for an authorized narrower workflow, but it
is not an `epistemic_outcome` until an allowed certificate issue finalizes.

### Epistemic outcome enum

Each value describes evidence state under an exact method, scope, corpus, and
time. It never denotes universal truth:

| `epistemic_outcome` | Qualified meaning |
| --- | --- |
| `demonstrated_in_system` | A checked derivation follows inside the named formal system and assumptions. |
| `reproduced_on_inputs` | The deterministic result was independently reproduced on the identified inputs and environment. |
| `confirmed_in_bounded_source` | A matching record is present in the named source snapshot under the stated predicate and identity rules. |
| `absent_from_bounded_source` | No matching record exists inside the named source snapshot under a valid predicate-specific completeness assertion. |
| `attribution_confirmed` | The identified artifact contains the scoped expression and its origin, locator, and context meet the profile. |
| `integrity_or_provenance_validated` | The named integrity or provenance properties validate; content truth is outside this outcome. |
| `measured_or_estimated_with_uncertainty` | A measurement or estimate meets the named method and reports its uncertainty and validity envelope. |
| `reproduced_on_dataset` | The statistic was independently reproduced on the identified dataset and executable method. |
| `observed_at_time` | The scoped state was observed through the named source at the stated time and freshness window. |
| `strongly_supported` | Evidence meets the stronger family-specific warrant, independence, counter-research, and sensitivity floors. |
| `supported` | Evidence favors the claim under the profile, with material limitations stated. |
| `mixed` | Admissible evidence supports materially competing conclusions after adjudication. |
| `contradicted` | Admissible evidence materially conflicts with the claim as scoped. |
| `counterexample_found` | An admissible counterexample defeats the scoped universal claim. |
| `no_counterexample_found` | The completed bounded search found none; it does not establish absence outside a valid closure. |
| `official_text_in_force_at_time` | The identified official text was in force for the stated jurisdiction and time; applicability to a person, facts, dispute, or case is not implied. |
| `interpretation_supported` | The stated interpretation is supported under the declared authority hierarchy and method, with conflicts visible. |
| `calibrated_forecast` | A forecast is issued with a named horizon, reference class, calibration envelope, and scoring rule. |
| `attributed` | A self-report or position is accurately attributed; the underlying private mental state is not inferred. |
| `position_documented` | A normative or preference position is documented as a position, not certified as factually true. |

### Qualified UX language

Every machine and human rendering must show the exact claim scope, method
profile and version, evidence cutoff, lifecycle, expiry, and material limits
next to the outcome. A compliant summary is:

> Outcome for the scoped claim: **supported under method profile M v3**. The
> admissible evidence searched through 12 August 2026 favors the claim within
> the stated population and time window. This is not a guarantee of universal
> truth. Counterevidence, uncertainty, lifecycle, and expiry are inspectable.

For `confirmed_in_bounded_source`, render “matching record found in source `S`,
snapshot `V`, for predicate `P`.” For `absent_from_bounded_source`, append “only
under completeness assertion `C`; this does not establish absence in the
world.” A badge may say “Supported under M · evidence through DATE,” never
“Verified,” “True,” “False,” or “Proven” alone. Color, iconography, ordering,
alt text, API defaults, notifications, and exports must preserve those
qualifiers; a green check cannot silently restore the forbidden wording.

## Abstention policy and attestation

Abstention is a successful controlled run disposition, not an epistemic
outcome. It is mandatory when any applicable condition holds:

- the claim cannot be unambiguously compiled;
- the proposition is not truth-apt for the requested method;
- required evidence exists in principle but is inaccessible to the lawful and
  authorized workflow;
- acquired evidence is insufficient for the requested profile;
- a required source, method, or closure assertion is unavailable;
- counter-research coverage, origin independence, or leave-one-cluster-out
  stability is insufficient;
- a material counterelement has not been independently adjudicated;
- decisive evidence conflicts and the profile cannot adjudicate it;
- the case is outside the calibration or competence envelope;
- required independent or expert review is absent;
- legal, privacy, safety, contractual, or licensing controls prohibit necessary
  processing;
- a dependency, source, method, key, or reviewer is invalidated;
- required evidence would expire before issue; or
- replay does not reproduce the claimed deterministic checks.

At minimum, the closed primary reason enum distinguishes
`scope_unresolved`, `not_truth_apt`, `evidence_inaccessible`,
`insufficient_evidence`, `closure_unproven`, `coverage_insufficient`,
`dependence_unresolved`, `material_counterevidence_unresolved`,
`outside_method_envelope`, `qualified_review_unavailable`,
`rights_or_safety_block`, `dependency_invalid`, `temporal_requirements_unmet`,
and `replay_failed`. These codes are not interchangeable:

- `not_truth_apt` means the proposition is normative, expressive, or otherwise
  not a factual proposition for this method;
- `evidence_inaccessible` means potentially relevant evidence is identified but
  cannot be acquired, retained, transformed, or disclosed under the available
  authority and access; and
- `insufficient_evidence` means admissible evidence was acquired and assessed
  but remains below a non-lowerable minimum.

An `AbstentionAttestation` is a separately named, separately schematized layered
object. Its unsigned canonical `AbstentionPayload` contains the attestation,
run and claim-revision IDs; frozen method/policy versions;
`authorized_terminal_intent: abstained`; primary and secondary reason codes;
every `fail` or `unknown` dimension; receipts for work actually completed;
search and integration cutoffs; inaccessible classes; responsible gate;
missing requirement; smallest safe next action; `prepared_at`; and the
terminal-intent sequence. It contains neither its own digest/signature nor a
predicted finalization time, run disposition, audit ID or outbox ID.

The complete attestation combines that payload with its algorithm-tagged digest
and external `SignatureEnvelope`, then an immutable database
`FinalizationEvent`, unsigned canonical `FinalizationReceiptPayload` bytes and
their detached `FinalizationSignatureEnvelope`. The complete signed receipt
assigns `run_disposition: abstained`, `finalized_at`, audit/outbox IDs and the
actual initial visibility without placing its own digest/signature or later
activation facts in those payload bytes. An `ActivationRecord` is additionally required before any
authorized external delivery. No layer contains an `epistemic_outcome`,
certificate ID, `certificate_lifecycle`, badge entitlement or current pointer.
Supplying the missing requirement starts a new run; it never mutates or
upgrades the attestation. Disclosure is private by default and, when activated,
must be labelled “No certificate issued.”

## Human, AI, and expert authority

| Actor | Permitted roles | Forbidden authority |
| --- | --- | --- |
| AI model | Suggest claim decomposition, queries, candidates, mappings, translations, objections, and draft rationales; run as an explicitly versioned tool. | Self-certify its output, grant assurance, manufacture missing provenance, or be counted as independent evidence. |
| Deterministic checker | Validate schemas, hashes, signatures, policy predicates, computations, and proof objects within its specification. | Decide whether the specification captures the world. |
| General reviewer | Confirm quotation, scope, documented procedure, and ordinary-source judgments after calibration. | Override a domain gate without recorded authority. |
| Domain expert | Judge specialist methods, evidence quality, uncertainty, and applicability. | Hide conflicts, evidence, assumptions, or dissent behind credentials. |
| Adversarial reviewer | Search for counterevidence, alternative hypotheses, and scope failures. | Change the claim or suppress contrary findings without trace. |
| Policy owner | Approve method profiles, harm tiers, ceilings, and transitions. | Rewrite an already issued historical record. |
| Appellant | Challenge wording, evidence, method, identity, rights, or result. | Directly mutate the certificate being appealed. |

Human review is not a magic safety layer. Cochrane requires duplicate work for
important review steps yet still documents extraction errors and unavoidable
judgment
([Cochrane data collection](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-05),
[risk-of-bias assessment](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08)).
Reviewer qualification, independence, workload, disagreement, and calibration
must therefore be recorded and evaluated.

## Lifecycle and bitemporality

The system separates at least:

- when a fact or source was valid in the world;
- when the system learned or recorded it;
- when an artifact was observed and captured;
- when an evaluation was performed;
- when a certificate was issued; and
- when it expires, is superseded, restricted, or withdrawn.

The certificate does not exist before successful issue finalization. Draft,
review, abstention, refusal, and failure are `VerificationRun` states or
dispositions, never certificate lifecycle values. This model owns the closed
lifecycle enum and semantic separation; the [verification
protocol](verification-protocol.md#certificate-lifecycle) owns the exhaustive
transition table, precedence, event authorities, and forbidden transitions.

A dependency change creates `needs_review`; it does not silently invert an
epistemic outcome. `restored` is an immutable transition event that returns an
unchanged certificate from `needs_review` to `current` only after independent
review proves the trigger false or immaterial under the original frozen
inputs, method, and policy. If any substantive input changes, a new certificate
must supersede the old one. `Disputed` is represented by `challenge_status`,
not lifecycle. Historical states remain reconstructible where lawful, while
visibility and artifact retention are governed separately.

Because conditions can coexist, the public lifecycle is a projection of
event-backed flags. Its normative precedence and clearing behavior exist only
in the protocol's transition contract; copying them into schemas or consumers
would create a competing source of truth.

### Critical-trigger fail-closed rule

An authenticated trigger is critical when it can invalidate a mandatory
receipt, completeness assertion, material evidence use, method profile,
reviewer quorum, trust key, rights/safety permission, or the current outcome.
Receipt of a critical trigger must atomically move the certificate from
`current` to `needs_review` or `restricted`, remove it from every active current
pointer, and enqueue badge/cache invalidation before reassessment begins.

Operations and the safety owner must ratify `T_critical_suspend` and
`T_critical_notify` before launch. The current research hypotheses are p99
within 60 seconds of authenticated trigger acceptance for the canonical
transition and p99 within five minutes for online consumer notification and
badge invalidation; they are not accepted SLOs or SLAs.

Offline or failing consumers are
reconciled until a signed delivery receipt exists; missing delivery is visible
as an incident, not treated as success.

Restoration is independent of the original dossier author and sole original
approver. It requires a signed trigger assessment by a non-disqualified
reviewer, a fresh deterministic kernel check against the original frozen
inputs, and a lifecycle event with its own receipts. The same certificate may
return to `current` only if the trigger was false or immaterial. New evidence,
policy, method, claim scope, or substantive judgment requires a replacement
certificate and `superseded`, never restoration in place.

## Verification certificate

The unsigned canonical `CertificatePayload` is the immutable at-issue snapshot
that is hashed and then carried in an external signature envelope. Its bytes
never contain their own digest, signature, timestamp token, or transparency
receipt, and they never cover fields that will later change. It contains:

1. stable certificate ID, schema version, issuer namespace, `prepared_at`,
   issue-intent sequence, expiry rule, initial requested visibility, and the
   identifiers needed to bind the later finalization receipt;
2. exact claim version and compiled structure;
3. exactly one `epistemic_outcome` and the full typed assurance vector;
4. method profile, policy version, harm tier, domain certainty and scale/version
   when applicable, each permitted-set input ID/digest, the eligible-set
   intersection and derivation receipt, and any binding ceiling-failure reasons;
5. world-valid, observed, captured and evaluated times, plus any predeclared
   absolute expiry upper bound; actual `issued_at` is bound later;
6. artifact manifests, hashes, locators, rights status, and allowed access;
7. evidence uses, polarity, applicability, and inferential role;
8. source-origin and dependency graph;
9. approved-before-results counterevidence `SearchPlan`, execution ledger,
   material-counterevidence adjudications, and coverage limitations;
10. transformations, model/tool versions, prompts or executable rules where
    disclosure is lawful and safe;
11. reviewer roles, competence basis, disclosures, decisions, and dissent;
12. uncertainty, calibration scope, and out-of-distribution checks;
13. validated machine observation receipts, judgment attestations,
    deterministic kernel decision, and replay manifest;
14. assumptions, unknowns, objections, and residual risks;
15. dependency watch set and invalidation triggers;
16. appeal route, disclosure-policy/version and immutable identifiers for the
    separately queried status feed.

The complete `Certificate` object is layered without self-reference:

1. canonical unsigned `CertificatePayload` bytes;
2. their algorithm-tagged payload digest;
3. a `COSE_Sign1` or approved detached `SignatureEnvelope` covering exactly
   those bytes and protected headers; and
4. an immutable database `FinalizationEvent` assigning authoritative
   `issued_at`, followed by unsigned canonical `FinalizationReceiptPayload`
   bytes and a detached `FinalizationSignatureEnvelope`; the complete receipt
   binds that event, terminal payload/signature digests and initial
   `certificate_lifecycle: current`, visibility and challenge facts before
   external serving without self-reference; and
5. zero or more later timestamp, transparency, witness or registration receipts
   that bind the payload/signature digest but remain outside both payload and
   signature envelope.

Later lifecycle, visibility, challenge, correction, supersession, withdrawal,
and restriction information lives outside those signed bytes. Every change is
an immutable, signed `CertificateEvent` with event ID, certificate ID and
payload digest, aggregate sequence, event type, previous and resulting stable
`CertificateState` digests, reason, authority, policy version, system-record
time, and the delivery policy/route IDs to notify. Delivery receipts are later
events bound to this event's digest; they are never predicted inside it.
`CertificateState` is the canonical serialization
of only durable state fields: certificate/payload IDs, aggregate sequence,
lifecycle, visibility, challenge status, supersession/correction pointers,
policy/status watermark and dependency watermark. It excludes its own digest,
event history, envelope, transport metadata, `served_at` and signature.

The `current_status_projection` is a rebuildable signed delivery envelope over
that ordered event stream and latest `CertificateState`; it may expose
`served_at` and receipt freshness without feeding either back into the stable
state digest. Consumers validate the immutable certificate, the event chain and
a fresh status projection or status receipt. Re-signing or rewriting the
certificate to update status is forbidden.

The certificate should support a compact JSON representation, a human report,
and a PROV-O/JSON-LD export. Schema.org `ClaimReview` can be an interoperability
adapter, but its rating-centered vocabulary is too weak to be the canonical
model; Google is also phasing it out as a Search appearance while retaining it
for Fact Check Explorer
([Google ClaimReview documentation](https://developers.google.com/search/docs/appearance/structured-data/factcheck)).

## Meta-verification

The engine itself is subject to the same discipline:

- version every method profile, policy, model, checker, and trust anchor;
- evaluate claim compilation, retrieval, citation alignment, inference,
  independence detection, abstention, and review separately;
- use hidden temporal and adversarial test sets;
- audit gold labels and preserve disagreement;
- require deterministic replay of the kernel path;
- run independent red-team and incident drills;
- publish model and reviewer calibration envelopes;
- monitor appeals, reversals, stale exposure, and missed counterevidence; and
- automatically reduce or suspend a tier when its validation condition fails.

Double review, adjudication, random audit, internal red-team, public challenge,
and a paid refutation incentive are not interchangeable. Double review reduces
single-reviewer error but shares institutional blind spots; adjudication makes
disagreement resolvable but concentrates authority; random audit measures
selection-independent quality; red-team creates controlled hostile tests;
public challenge expands discovery but is exposed to popularity, harassment,
brigading, and confidentiality limits.

A refutation bounty may be piloted only
for public low-harm cases with a fixed eligible defect, escrowed reward,
anti-Sybil/rate limits, independent adjudication, no payment for volume, source
protection, and publication-neutral outcomes. It is never evidence that an
unchallenged claim is true.

Promotion requires a randomized comparison against
ordinary appeal intake showing more material defects found per total harm and
cost, without targeted abuse or strategic low-quality flooding; otherwise the
bounty is removed.

No model may grade the final system solely with labels it generated. Multiple
models can reduce some idiosyncratic judge error, but agreement among model
families is not independent evidence of truth.

## Decisions and falsifiers

| Decision | Current recommendation | Confidence | Counter-hypothesis | Evidence or test that reverses it |
| --- | --- | --- | --- | --- |
| Product promise | Certify scoped dossiers and protocol conformance, never universal truth. | High | Users may need a simpler bounded presentation to obtain value. | A blinded comprehension and decision study may justify simpler profile-qualified wording when it is materially more useful and no more misleading; no study can authorize a universal-truth claim. |
| Default semantics | Open world with explicit local closure. | High | Most valuable use cases operate on complete registries. | A validated demand study and data audit show the initial market is dominated by authoritative complete datasets; this narrows the product but does not justify global closure. |
| Result shape | Multidimensional vector plus a policy-limited summary. | High | The vector overwhelms users without improving decisions. | Users cannot correctly act on it after two UI iterations, while a smaller profile preserves error detection and calibration. |
| Confidence | Domain-validated quantitative measures only; no universal truth score. | High | A learned score may predict one declared bounded event across selected domains. | Prospective temporal evaluation may justify that separately named reliability statistic if calibration, resolution, subgroup performance, and resistance to gaming hold in its declared population; it cannot become a probability that arbitrary claims are true. |
| AI authority | Proposal and triage, never final grant of assurance. | High for high-harm claims; medium for bounded low-risk automation. | A deterministic or AI-only pipeline can safely issue narrow certificates. | Prospective blinded trials meet predeclared false-positive and replay thresholds, with independent audits and no self-judging loop. |
| Initial domain | Attribution, versioned registers, and deterministic calculations. | Medium-high | A more open claim family has greater value at acceptable risk. | Discovery research plus a gold-standard benchmark shows a different family has stable adjudication, viable cost, safe abstention, and stronger demand. |
