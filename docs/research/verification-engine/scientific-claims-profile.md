---
context_room:
  id: research.verification-engine.scientific-claims-profile
  depends_on:
    - research.verification-engine.assurance-model
    - research.verification-engine.architecture
---

# Scientific claims assurance profile

## Summary

Scientific claims require a specialist assurance profile. No review method,
registration, risk-of-bias tool, replication, or statistical synthesis can
prove an open-world causal proposition true with 100-percent certainty. The
engine can prove bounded procedural properties and report how strongly a
versioned body of evidence supports a precisely specified scientific claim.

The proposed profile therefore evaluates one population, intervention or
exposure, comparator, outcome, time horizon, and estimand at a time. It retains
study-level limitations, missing-results risk, uncertainty, indirectness,
replication, corrections, reviewer disagreement, and freshness as separate
dimensions. It never reduces them to a universal truth score.

Broad scientific causal certification is excluded from the first public
product. A narrow, non-public shadow programme may test whether one fixed,
low-harm intervention question can meet pre-registered retrieval, extraction,
review, calibration, cost, monitoring, and user-comprehension gates.

This document is an **active research proposal**. It does not describe accepted
Parallax behavior or an implemented service.

## Defines

The proposed scientific claim subtypes, unit of analysis, assurance ceilings,
method stack, required data, review workflow, operating cost, living-update
rules, launch exclusion, shadow-mode experiment, promotion gates, falsifiers,
and professional licensing boundary.

## Does not define

A clinical guideline, medical advice, an approved implementation, a universal
evidence hierarchy, a production service level, reviewer credentials for a
specific specialty, or a legal and regulatory conclusion for a deployment.

## Relationship to the general assurance model

The [assurance model](assurance-model.md) owns the common certificate contract,
public outcomes, assurance dimensions, abstention semantics, and rule that
100-percent guarantees apply only to closed, fully specified properties. This
profile specializes that contract for scientific evidence. The
[architecture](architecture.md) owns canonical storage and issuance authority;
this profile supplies a proposed `MethodProfile` and the scientific gates the
assurance kernel would enforce.

The engine's strongest honest scientific statement is conditional:

> Under method profile `P`, over evidence corpus `C` searched through date `T`,
> the admissible evidence supports, contradicts, or does not resolve claim
> version `V` for the specified population, intervention or exposure,
> comparator, outcome, time horizon, and estimand, at the stated certainty
> level and with the recorded limitations.

It must never publish `scientifically true`, `scientifically false`, or a
percentage probability of truth unless a separate formal model explicitly
defines that probability and its assumptions.

## Scientific unit of analysis

### Claim specification

A scientific sentence is not evaluable until it is compiled into at least:

- **population:** eligibility, exclusions, baseline risk, setting, geography,
  and target population;
- **intervention or exposure:** dose, duration, timing, implementation, and
  relevant versions;
- **comparator:** counterfactual, control condition, reference category, or no
  comparator for a purely descriptive claim;
- **outcome:** construct, measurement instrument, threshold, direction,
  denominator, and whether it is benefit or harm;
- **time:** follow-up window, induction period, censoring rule, calendar period,
  and valid-as-of time;
- **estimand:** target quantity, treatment strategy, population summary,
  handling of intercurrent events, and effect scale;
- **design and inference force:** descriptive, associational, diagnostic,
  prognostic, mechanistic, or causal;
- **scope modifiers:** subgroup, language, setting, data availability,
  assumptions, and intended use; and
- **decision threshold:** when certainty is evaluated relative to a practical
  choice rather than only a null hypothesis.

An edit to causal force, population, exposure, comparator, outcome, time,
estimand, threshold, or effect direction creates a new claim identity. It is
not an editorial revision of the old claim.

The PICO structure is necessary for intervention questions but insufficient by
itself. Two reviews with the same headline PICO may target different estimands,
handle treatment switching differently, use different outcome definitions, or
apply to different baseline risks. Their conclusions must not be merged.

### Subtype-specific assurance ceilings

The table records the strongest **conceptual domain assessment**, not a second
public-outcome enum. In the current proposal every `body_of_evidence_*` and
other subtype-specific code below is shadow-only and non-issuable. Public issue
remains blocked until a signed, versioned mapping assigns each code and exact
`domain_certainty` value to one canonical `epistemic_outcome`, prerequisites,
incompatibilities, and conformance fixtures under the verification protocol.
Once that gate passes, public wording must lead with the canonical qualified
outcome and may expose the mapped domain assessment separately. `Supported`
always means supported under the recorded corpus, method, scope, and time; it
never means universal truth.

| Scientific subtype | Minimum specialist profile | Target domain-assessment label (shadow-only until mapped) | Hard boundary |
| --- | --- | --- | --- |
| Computational result with complete data, code, and environment | Frozen inputs, executable workflow, dependency and environment manifest, independent rerun | `exactly_reproduced_on_identified_inputs` or `approximately_reproduced_on_identified_inputs` | Reproduction does not validate measurements, assumptions, model choice, causal interpretation, or real-world truth. |
| Descriptive statistic or prevalence | Sampling frame, eligibility, measurement definition, missing-data assessment, weights, uncertainty, population and time | `estimated_for_population_and_period_with_uncertainty` | No causal inference; no generalization outside the sampled or modeled target population. |
| Scientific association | Temporality, measurement validity, selection and confounding assessment, adjusted and unadjusted estimates, sensitivity analyses | `association_supported_at_certainty_level` | Association never upgrades to causality because it is strong, repeated, or statistically significant. |
| One randomized-trial causal result | Trial protocol and registry, result-specific RoB 2, estimand, effect estimate and uncertainty, harms, applicability | `trial_result_supported_with_risk_of_bias` | One trial is not a body of evidence and does not establish transportability or a universal effect. |
| Intervention effect across randomized trials | Reproducible systematic review, report-to-study grouping, outcome-level RoB 2, synthesis, heterogeneity, missing-evidence assessment, GRADE | `body_of_evidence_supported_at_grade_level` | Corpus incompleteness, judgment, indirectness, future evidence, and target-population differences remain. |
| Causal effect from non-randomized intervention studies | Explicit target trial, time zero, strategies, assignment, estimand, confounder model, ROBINS-I, negative controls or sensitivity analyses where appropriate | `causal_interpretation_supported_under_declared_assumptions` | Unmeasured or misspecified confounding prevents a 100-percent causal guarantee. |
| Diagnostic accuracy | Index test, reference standard, threshold, patient spectrum, setting, sampling, blinding, two-by-two data and design-specific bias assessment | `diagnostic_performance_estimated_in_context` | Accuracy is not clinical utility, improved patient outcome, or transportability to a different prevalence or workflow. |
| Prognostic or predictive model | Target population, outcome horizon, development/validation separation, calibration, discrimination, missing data, optimism, external and temporal validation | `predictive_performance_observed_in_validation_context` | Performance may fail under shift; prediction does not by itself identify a causal intervention. |
| Mechanistic, laboratory, animal, or preclinical claim | Model system, assay validity, protocol, controls, dose, replication, data/code where applicable | `mechanism_supported_in_model_system` | It cannot be translated directly into clinical efficacy or population benefit. |
| Replication or generalization | New-data independence, preregistered success criteria, comparability, effect estimates, uncertainty, heterogeneity, multiple success metrics | `replicated_under_specified_criterion_and_context` | One success is not universal confirmation; one failure is not automatic refutation. |
| Guideline or recommendation | Evidence certainty separated from benefits, harms, values, resources, equity, acceptability, feasibility, conflicts, and decision process | `recommendation_issued_by_named_body_under_framework` | A recommendation is a decision under values and constraints, not a fact that can be marked true. |

The profile must abstain if the claim subtype cannot be identified or if a
profile validated for one subtype is being applied to another.

## The scientific method stack

PRISMA, Cochrane methods, risk-of-bias tools, and GRADE have different units and
responsibilities. Passing one never implies that another passed.

| Mechanism | Unit and proper role | What a conforming engine may certify | What it must not infer |
| --- | --- | --- | --- |
| [PRISMA 2020](https://www.prisma-statement.org/prisma-2020) | Reporting of a systematic review through a 27-item checklist and flow diagram | Required information is `reported`, `verified`, `not_reported`, or `not_applicable`; recorded flow arithmetic is coherent | That the review was well conducted, complete, unbiased, or correct merely because its report is PRISMA-compliant. The [PRISMA publication](https://www.bmj.com/content/372/bmj.n71.long) explicitly distinguishes reporting from conduct and appraisal. |
| [Cochrane Handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current) | End-to-end conduct of intervention reviews: protocol, search, selection, extraction, study grouping, bias assessment, synthesis, applicability, and update | The declared, versioned workflow was followed and its artifacts are inspectable | That all studies exist or were found, that source data are authentic, or that reviewer judgments are correct. |
| [RoB 2](https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2) | Risk of bias in one specific randomized-trial result for an outcome, comparison, and estimand | Signalling answers, algorithmic proposal, overrides, individual judgments, evidence, disagreement, and adjudication are preserved | A global study-quality score or a truth verdict. The general version is dated 22 August 2019; cluster and crossover variants must be version-pinned separately. |
| [ROBINS-I 2016](https://www.riskofbias.info/welcome/home/original-2016-version-of-robins-i) and [draft V2](https://www.riskofbias.info/welcome/robins-i-v2) | Bias in a specific result from a non-randomized intervention study relative to a target trial | Target trial, confounders, signalling answers, result-level judgments, and unresolved information are inspectable | Removal of residual confounding or direct transfer of evidence about the 2016 tool to draft V2. As of the research cutoff, V2 revised 20 November 2025 remains a draft. |
| [GRADE](https://book.gradepro.org/) | Certainty of a body of evidence for one precise question and outcome, relative to explicit ranges or decision thresholds | Domain judgments and reasons for risk of bias, inconsistency, indirectness, imprecision, and publication bias are exposed as `high`, `moderate`, `low`, or `very_low` certainty | A probability that a claim is true, a quality score for one study, or the strength of a recommendation. |

RoB 2 and ROBINS-I require expertise and calibration. In one RoB 2 study,
overall Fleiss' kappa was 0.16 across 70 trial results and evaluation averaged
28 minutes per result
([Minozzi et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32562833/)). A small
follow-up found that roughly 40 hours of calibration and a topic-specific guide
improved agreement, but agreement remained imperfect and the sample covered
only 16 trials in one clinical area
([Minozzi et al., 2022](https://pubmed.ncbi.nlm.nih.gov/34537386/)). For
ROBINS-I, five raters assessing 31 studies produced an overall kappa of 0.06
([Minozzi et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30981833/)). These are
limited studies, not universal performance rates, but they invalidate the
assumption that a form or language model makes judgment objective.

Every result-level assessment therefore requires independent reviewers,
preserved pre-consensus judgments, a domain implementation guide written
before results are inspected, and recorded adjudication. AI may prefill fields
and locate passages; it cannot sign the assessment.

## Preregistration and Registered Reports

An [OSF registration](https://help.osf.io/article/330-welcome-to-registrations)
can establish that specified bytes were stored in a time-stamped, read-only
record. A [Registered Report](https://www.cos.io/initiatives/registered-reports)
adds peer review before outcome knowledge and in-principle acceptance that is
not revoked solely because of the result, subject to compliance and quality
checks.

The deterministic guarantees are narrow:

- a protocol with a specific hash existed at a recorded time;
- it contained or omitted named fields;
- amendments created new versions;
- a publication matches or differs from the registered fields that can be
  compared; and
- a Registered Report had available Stage 1 and acceptance artifacts before
  Stage 2.

Registration does not prove that researchers had never accessed the data, that
the plan was complete or scientifically good, that data are authentic, that
the plan was followed, or that deviations were harmful. The profile records:

```text
registration_integrity
prospective_timing: verified | declared | failed | unknown
plan_specificity
plan_completeness
amendments[]
adherence
deviation_disclosure
outcome_reporting_completeness
registered_report_stage_1
```

The `preregistered` badge is never an assurance multiplier. In a small audit of
27 early preregistered studies, only two had no deviations and many deviations
were not fully disclosed
([Claesen et al., 2021](https://doi.org/10.1098/rsos.211037)); the sample is too
small and early to estimate current prevalence. Registered Reports show a much
lower proportion of positive conclusions than conventional papers in one
non-randomized comparison, 44 percent versus 96 percent
([Scheel et al., 2021](https://doi.org/10.1177/25152459211007467)); this is
consistent with reduced result-dependent publication but does not prove the
format caused the difference.

A justified deviation is not automatically a defect. The audit must record
whether it occurred before or after outcome knowledge, whether it was disclosed
and justified, and whether the original analysis is also reported.

## Reproducibility, robustness, replication, and generalization

The [US National Academies](https://www.nationalacademies.org/read/25303/chapter/3)
distinguishes:

- **reproducibility:** consistent computation using the same input data,
  methods, code, and conditions;
- **replicability:** consistent evidence from new data addressing the same
  scientific question; and
- **generalizability:** validity across other populations, contexts, or
  conditions.

The engine keeps at least these states separate:

```text
data_available
code_available
environment_reconstructible
execution_completed
exactly_reproduced
approximately_reproduced
analytic_robustness
independent_replication
external_or_temporal_validation
```

A repository link proves availability only. Exact reproduction requires frozen
inputs, executable code, pinned dependencies and environment, declared
tolerances, output comparison, and an independent execution receipt. Analytic
robustness requires prespecified defensible alternatives or a transparent
multiverse; it is not inferred from rerunning one script.

Replication is stored as a new evidence object, never a vote. It includes
original and replication estimates and intervals, protocol similarity,
independence of data and teams, power, population and context differences,
preregistration, deviations, and every prespecified success criterion.

The Open Science Collaboration reproduced 100 psychology studies: 97 percent
of original results and 36 percent of replications were statistically
significant, 47 percent of original effect sizes fell inside the replication
confidence interval, and approximately 39 percent were judged replicated under
another criterion
([Open Science Collaboration, 2015](https://doi.org/10.1126/science.aac4716)).
The three-journal psychology sample is not a universal replication rate. Its
main architectural lesson is that reasonable success criteria disagree, so a
binary `replicated` field loses material information.

## Missing results and publication bias

The profile separates two failure layers:

1. **selective result reporting inside a known study**, assessed through the
   registry, protocol, statistical analysis plan, regulatory reports, trial
   report, and publication; and
2. **whole studies or results missing from the synthesis**, assessed separately
   through searches, registries, regulatory data, grey literature, author
   contact, and a tool such as
   [ROB-ME](https://www.riskofbias.info/welcome/rob-me-tool).

The corpus must group every protocol, registry entry, conference abstract,
dataset, report, correction, and publication by underlying `Study` or
`ObservationOrigin`. Counting reports as independent studies is a critical
error.

Empirical evidence shows why a publication-only corpus has a low ceiling:

- in a Cochrane review following 165,135 trials, an estimated 53 percent were
  published and positive results were more likely and faster to appear
  ([Showell et al., 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11600493/));
  cohorts and definitions were highly heterogeneous, so this is not a
  probability for a particular trial;
- in a direct protocol-publication comparison, 62 percent of trials had at
  least one primary outcome changed, introduced, or omitted
  ([Chan et al., 2004](https://jamanetwork.com/journals/jama/fullarticle/198809));
  the cohort is old and mainly pharmaceutical; and
- among 74 antidepressant trials known to the US Food and Drug Administration,
  31 percent were unpublished; the published literature appeared 94 percent
  positive while the FDA analysis found 51 percent positive
  ([Turner et al., 2008](https://pubmed.ncbi.nlm.nih.gov/18199864/)). This is a
  strong sector-specific example, not a universal estimate.

Funnel plots, asymmetry tests, trim-and-fill methods, and selection models are
diagnostics or sensitivity analyses. They do not prove absence of bias. Tests
are generally underpowered with small numbers of studies, asymmetry has several
causes, and selection mechanisms are not identifiable from published results
alone. The [Cochrane reporting-bias chapter](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-13)
owns the applicable cautions.

The only permitted absence language is:

> No eligible result was found under the recorded search protocol and access
> limits through date `T`.

It is not evidence that no study or contrary result exists.

## Living evidence and freshness

A living systematic review continuously monitors a question and incorporates
new evidence through successive versions. It is justified only when the claim
is important, the current evidence is uncertain, and new evidence is likely to
change the conclusion. See the
[Cochrane living-review chapter](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-22),
the foundational proposal
([Elliott et al., 2014](https://journals.plos.org/plosmedicine/article?id=10.1371%2Fjournal.pmed.1001603)),
and [PRISMA-LSR](https://www.bmj.com/content/387/bmj-2024-079183).

Search cadence and synthesis/publication cadence are separate. One
`updated_at` timestamp is forbidden. The dossier records:

```text
searched_through
evidence_pending_since
integrated_through
published_at
next_search_due
monitoring_gap
living_status: active | overdue | suspended | retired | transferred
```

The living protocol specifies sources, automation, duplicate screening,
integration trigger, maximum publication delay, methods review, annual
continuation decision, handover, suspension, and retirement. When a deadline
passes, `monitoring_gap` is recorded as a detected condition and reason, while
the certificate lifecycle transitions to canonical `stale`. A monitoring gap
is never itself a lifecycle value, and the certificate cannot remain `current`
merely because a scheduled job exists.

Cochrane pilot guidance estimated only the information-specialist search work
at roughly 30 minutes to six hours each month, excluding duplicate screening,
extraction, risk-of-bias review, synthesis, peer review, and publication
([Cochrane living-review guidance](https://resources.cochrane.org/sites/default/files/uploads/inline-files/Transform/201912_LSR_Revised_Guidance.pdf)).
In a study of 76 living reviews, mainly clinical and COVID-era, the median was
two versions and 66 days between versions; among the subset that announced a
cadence and updated, 42 percent were more than three times overdue
([Akl et al., 2023](https://doi.org/10.1016/j.jclinepi.2023.02.005)). The sample
limits generalization but demonstrates that declaring a review living does not
make it current.

## Corrections, expressions of concern, and retractions

[Crossmark](https://www.crossref.org/documentation/crossmark/) exposes publisher
status and update metadata when publishers participate and deposit it. Its
presence is not a guarantee, participation and backfile coverage are optional,
and deposits can lag. The engine therefore combines at least:

- publisher and Crossmark metadata;
- Crossref's public
  [Retraction Watch data](https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/);
- PubMed/NLM links and the
  [NLM errata and retraction policy](https://www.nlm.nih.gov/bsd/policy/errata.html);
- specialist registries and regulator notices where applicable; and
- manual reports, appeals, and author or institution notices.

Each event is typed as correction, expression of concern, partial retraction,
full retraction, withdrawal, replacement, or new version. It records issuer,
reason, affected artifact/result, effective and recorded times, confidence,
provenance, and dependency impact.

A retracted paper is not automatically equivalent to every dependent claim
being false. The event creates `needs_review`, restricts unsupported public
use, and re-runs the synthesis without silently rewriting history. A conforming
engine can guarantee only that all events received from named channels through
time `T` were processed. It cannot guarantee that no undisclosed correction or
retraction exists. The [COPE Retraction Guidelines](https://publicationethics.org/sites/default/files/retraction-guidelines-cope.pdf)
provide the editorial categories but do not make publisher propagation
complete.

## Required canonical data

The scientific profile requires the general certificate data plus the
following objects. Exact schemas remain an implementation responsibility.

| Object | Required scientific content |
| --- | --- |
| `ScientificClaimProfile` | Subtype, PICO or equivalent fields, estimand, outcome definition, time, setting, intended use, harm tier, ceiling, required tools and reviewers |
| `Study` | Stable underlying-study identity, designs, sites, enrolment, dates, population, interventions/exposures, comparators, outcomes, funding, conflicts, registrations and origin links |
| `StudyReport` | Exact artifact/version, report type, DOI/registry IDs, dates, authors, relation to study, rights and availability |
| `ProtocolVersion` | Registry, hash, timestamp, access-to-data timing, fields, amendments, SAP and Registered Report stage |
| `OutcomeResult` | Outcome/time/estimand identity, analysis population, effect measure, estimate, uncertainty, missingness, multiplicity, raw or reconstructed data provenance |
| `RiskOfBiasAssessment` | Tool/version/variant, signalling answers, excerpts, algorithmic proposal, override, reviewer, pre-consensus decision, disagreement and adjudication |
| `RegistrationComparison` | Planned versus reported outcome, analysis, sample, exclusion, stopping and timing; deviation and justification |
| `Synthesis` | Eligibility set, excluded studies, dependency groups, model, heterogeneity, assumptions, transformations, sensitivity analyses, meta-analysis or narrative rationale |
| `CertaintyAssessment` | Exact claim/outcome, decision thresholds, GRADE domains, reasons, reviewers, disagreements, final category and profile ceiling |
| `ReplicationRelation` | Original and replication claim mapping, independence, protocol similarity, success criteria, estimates, context and conclusion per criterion |
| `MissingEvidenceAssessment` | Registry and grey-literature search, inaccessible studies, ROB-ME or equivalent judgments, funnel diagnostics and sensitivity results |
| `ScientificStatusEvent` | Correction, concern, retraction, new study, new synthesis, method change, expiry, monitoring gap and dependency actions |

Every field may be `unknown`, `not_reported`, `not_applicable`, or `not_checked`.
Those states are not interchangeable. Missing values never default to low risk.

## Proposed workflow and cost

### Workflow

1. Compile and human-approve the atomic scientific claim and its intended use.
2. Select the subtype, harm tier, profile version, assurance ceiling, reviewer
   qualifications, languages, sources, budget, stop rule, and update plan.
3. Register the verification protocol before the engine observes synthesis
   results or public-status candidates.
4. Search bibliographic databases, registries, regulators, protocols, grey
   literature, corrections, retractions, and explicit counterevidence routes;
   retain exact queries, dates, snapshots, result sets, and access gaps.
5. Deduplicate publications and map every report to the underlying study,
   dataset, and observation origins.
6. Perform duplicate independent title/abstract screening and full-text
   selection; preserve pre-consensus decisions and exclusion reasons.
7. Extract study, outcome, estimate, harms, registration, lineage, and conflict
   data independently; resolve differences without replacing the originals.
8. Compare registry, protocol, amendments, SAP, reports, datasets, and
   publication; flag outcome and analysis switching.
9. Apply the design- and result-specific risk-of-bias tool with a calibrated
   domain guide and independent reviewers.
10. Reproduce eligible calculations where artifacts permit, assess analytical
    robustness, and link independent replications without binary voting.
11. Synthesize only clinically or scientifically compatible results; expose
    heterogeneity and justify any decision not to pool.
12. Assess missing evidence and publication bias separately from within-study
    reporting bias.
13. Apply GRADE or the subtype-specific certainty method independently for each
    outcome and decision threshold.
14. Run correction, expression-of-concern, and retraction checks across every
    included and excluded dependent artifact.
15. Obtain specialist, adversarial, and adjudication review required by the
    harm tier; retain qualifications, conflicts, disagreement, and workload.
16. Let the deterministic assurance kernel check completeness, ceiling,
    independence, expiry, rights, and replay invariants before issue or typed
    abstention.
17. Publish the immutable dossier version and begin the declared monitoring,
    appeal, correction, retirement, and supersession lifecycle.

Automation may prioritize, deduplicate, extract, compare documents, execute
code, and draft judgments. Every automated result resolves to exact inputs and
tool versions. Model agreement is not independent evidence, and no model may
grant the certificate it helped construct.

### Resource model

Scientific assurance is a professional service operation, not a near-zero-cost
inference call.

| Work | Empirical or operational signal | Planning implication |
| --- | --- | --- |
| Complete systematic review | 195 registered medical reviews averaged 67.3 weeks from registration to publication and five authors ([Borah et al., 2017](https://bmjopen.bmj.com/content/7/2/e012545)) | Treat as scale evidence from one dated biomedical sample, not a universal quote. Budget months, multiple roles, database access, screening, adjudication, synthesis, and project management. |
| RoB 2 | Approximately 28 minutes per result in one study; calibration materially changed time and agreement | Cost multiplies by study, outcome, comparison, estimand, and reviewer count. A study-level checkbox severely understates work. |
| ROBINS-I | Approximately 28 minutes per assessment in one small reliability study; other real-world reports vary from under an hour to several hours | Non-randomized causality requires more domain work than the form completion time reveals, especially target-trial and confounder specification. |
| Living search | Roughly 30 minutes to six hours per month for search-specialist work alone in Cochrane pilots | Add continuous duplicate screening, extraction, review, synthesis, publication, incident, and handover capacity. |
| Professional infrastructure | Specialist databases, lawful full text, registries, statistical software, secure data, archiving, reviewers, appeals, monitoring, and legal/licensing review | Price and service levels must reflect standing capacity, not only cases that reach publication. Backlog and unavailable expertise produce explicit abstention. |

The pilot must measure person-minutes by stage, reviewer agreement before
consensus, database and full-text cost, model and compute cost, queue delay,
appeal/reversal rate, monitoring burden, and cost per safely issued or abstained
dossier. Throughput is never reported only over successful certificates.

## Why broad causal science is excluded from v1

Broad causal claims combine all of the hardest open-world problems:

- the claim cannot be evaluated before PICO, estimand, outcome, time,
  intercurrent events, causal force, and target population are resolved;
- relevant evidence spans bibliographic databases, trial registries,
  regulators, protocols, SAPs, grey literature, datasets, and reports that may
  be paywalled, unindexed, inaccessible, selectively reported, or unpublished;
- risk-of-bias and certainty judgments are result-specific, specialist,
  time-consuming, and empirically variable between reviewers;
- there is no permanent gold truth for model validation, especially under
  residual confounding, transportability assumptions, and changing evidence;
- publication bias, dependence, fraud, corrections, and retractions make a
  completed review provisional;
- different disciplines and designs require different tools rather than one
  evidence ladder;
- living status requires a funded team, not a scheduled crawler; and
- medical, legal, policy, and safety uses create high harm and professional or
  regulatory obligations beyond technical correctness.

The first public product should therefore remain within bounded attribution,
versioned-register, citation-alignment, provenance, and deterministic-
calculation certificates described by the general dossier. Scientific
association and causal claims remain `T2` or `T3`, require qualified review,
and receive no autonomous public issue.

## Shadow-mode research programme

### Initial scope

The narrowest credible experiment is one fixed, low-harm intervention topic
with:

- a predeclared PICO, estimand, outcome set, time horizon, and decision
  thresholds;
- randomized trials only for the first evaluation;
- prospective registries and protocols available for most eligible trials;
- lawful access to the required bibliographic databases and full texts;
- no treatment recommendation, diagnosis, patient-level use, or public truth
  badge;
- two independent subject specialists, two review-method specialists, an
  information specialist, statistician access, and independent adjudication;
  and
- retrospective development cases separated from a hidden temporal
  prospective evaluation set.

The engine prepares a dossier in parallel with a human reference team but does
not influence publication, care, policy, or the reference team's decisions.
The engine's own protocol, queries, extraction rules, success criteria,
abstention rules, and analysis plan are registered before the hidden set is
opened.

### Promotion gates

Numerical thresholds below are experiment proposals, not scientific standards.
They must be finalized from the harm analysis and frozen before evaluation.

| Gate | Required evidence before any public scientific tier |
| --- | --- |
| Claim identity | No material PICO, estimand, outcome, time, polarity, or causal-force error reaches issuance in the prospective set; all disagreements are audited. |
| Retrieval | On a benchmark with a defensible closed eligible-study inventory, the one-sided 95-percent lower confidence bound for study recall exceeds the pre-registered target; performance is also reported by database, year, language, null/positive result, and difficult-to-find class. Open-world cases remain coverage estimates, not recall claims. |
| Report-to-study lineage | No duplicate report is counted as an independent study and no known shared dataset is counted as independent in the prospective set. |
| Extraction | Material outcome, effect, uncertainty, sample, timing, and direction errors remain under the pre-registered harm budget after independent verification; exact-field and semantic errors are reported separately. |
| Risk-of-bias and certainty | Independent specialists can use the implementation guide with measured agreement and adjudication workload inside the service budget; the engine never presents its own prefill as consensus or ground truth. |
| Reproducibility | Every claimed deterministic result replays from the retained package in a clean environment; non-replayable licensed inputs are visibly excluded from that guarantee. |
| Calibration and abstention | Outcome language is prospectively calibrated against independent adjudication; selective-risk curves show the declared error budget is met by abstaining rather than hiding rejected cases. |
| Missing evidence | Registry/protocol/regulator comparison and adversarial search find no material omitted study that would have changed an issued level in the prospective audit; every inaccessible source is visible. |
| Freshness | Injected new-study, correction, expression-of-concern, retraction, and overdue-search events create the correct `needs_review`, `restricted`, or `stale` state within the declared service level, without automatically reversing a conclusion. |
| User comprehension | Blinded users correctly distinguish process conformance, evidence support, GRADE certainty, reproduction, and truth at the pre-registered threshold; a false or stale label does not create unacceptable excess reliance. |
| Operations | Reviewer supply, queue age, cost per case, appeal response, monitoring, and incident recovery remain inside a funded service model including abstentions and failed dossiers. |
| Independence | An external team reproduces the audit and challenge set without relying on labels, prompts, or evidence selected solely by the engine team. |
| Rights and professional readiness | Counsel, database licensors, tool owners, domain governance, privacy/safety review, insurance and accountable professional leadership approve the precise service scope. |

Promotion remains subtype- and topic-specific. Success for one PICO and RCT
profile does not validate observational causal inference, another discipline,
another language, or medical recommendations.

### Falsifiers and stop conditions

The scientific tier should be narrowed, suspended, or abandoned if any of the
following persists after one predefined remediation cycle:

- the reference team cannot agree on claim identity or eligibility often
  enough to create a stable evaluation target;
- material eligible studies are repeatedly missed, especially null, adverse,
  non-English, old, retracted, or regulator-only evidence;
- origin grouping or report deduplication creates false independent
  corroboration;
- reviewer agreement remains too low or adjudication workload makes the
  service uneconomic;
- automation saves less work than verification of its proposals consumes;
- a high-assurance result changes materially under ordinary defensible
  analytical choices without that instability being surfaced;
- users continue to interpret a scoped evidence certificate as proof of truth
  after two presentation iterations;
- correction and living-review commitments cannot be staffed or met;
- a database, full-text, instrument, translation, or redistribution licence
  prevents reproducible and lawful operation; or
- the narrow evidence-dossier service delivers the same user value with lower
  cost, harm, and governance burden.

No volume, revenue, model benchmark, or reviewer consensus can waive a failed
safety or epistemic gate.

## Professional, legal, and licensing boundary

The scientific profile requires more than software licences:

- named accountable scientific and review-method leadership;
- qualification and continuing-calibration rules by specialty and claim type;
- conflict-of-interest disclosure, independent assignment, recusal,
  adjudication, appeal, and whistleblowing routes;
- licensed access to databases, full texts, registries, taxonomies, and any
  redistributable excerpts required by the service;
- legal review of text-and-data mining, database rights, copyright, privacy,
  confidential data, cross-border processing, retention, and public export;
- safety, regulatory, and professional-practice review before any medical,
  diagnostic, treatment, public-health, or patient-specific use;
- appropriate professional liability and cyber insurance; and
- an operational budget for monitoring, corrections, expert absence,
  incidents, and orderly retirement.

The official RoB 2, ROBINS-I, ROBINS-E, and ROB-ME pages state a
CC BY-NC-ND 4.0 licence. A commercial product must not translate, adapt, embed,
or distribute a derivative instrument until the rights holder or deployment
counsel confirms that use. The engine can model generic concepts and retain
licensed external assessments, but a method-compatible adapter is not
automatically permission to reproduce the tool.

Database access and the right to read an article do not automatically grant
retention, model-processing, quotation, or redistribution rights. Those
permissions remain independent fields on every artifact, as required by the
[threat and rights model](threat-model.md#copyright-database-access-and-redistribution).

## Source register and limitations

The sources below establish method definitions or bounded empirical findings;
none validates the complete proposed engine.

| Source | Evidence used | Important limitation |
| --- | --- | --- |
| [PRISMA 2020](https://www.prisma-statement.org/prisma-2020) and [BMJ statement](https://www.bmj.com/content/372/bmj.n71.long) | Official reporting checklist and author description of intended use | Reporting completeness is not review quality or truth. |
| [Cochrane Handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current) | Official review-conduct guidance for health interventions and related evidence | Domain-specific, judgment-dependent, and incapable of guaranteeing discovery of unpublished evidence. |
| [GRADE Book](https://book.gradepro.org/) | Current official GRADE guidance for outcome-level certainty and decision thresholds | Certainty is conditional and does not equal probability of truth or recommendation strength. |
| [RoB 2](https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2), [ROBINS-I 2016](https://www.riskofbias.info/welcome/home/original-2016-version-of-robins-i), [draft ROBINS-I V2](https://www.riskofbias.info/welcome/robins-i-v2), and [ROB-ME](https://www.riskofbias.info/welcome/rob-me-tool) | Official instruments, versions, intended units, and licence notices | Instrument ownership does not validate an engine's judgments; V2 remains draft at the cutoff. |
| [OSF registrations](https://help.osf.io/article/330-welcome-to-registrations) and [Registered Reports](https://www.cos.io/initiatives/registered-reports) | Official artifact and editorial workflow definitions | Registration can prove an artifact existed, not that it was prospective to every data exposure, complete, followed, or scientifically sound. |
| [National Academies, 2019](https://www.nationalacademies.org/read/25303/chapter/3) | Definitions and limits of reproducibility and replicability | Consensus synthesis, not a measurement of replication rates in every field. |
| [Open Science Collaboration, 2015](https://doi.org/10.1126/science.aac4716) | Original multi-study psychology replication project | Three-journal psychology sample and several non-equivalent success criteria. |
| [Showell et al., 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11600493/), [Chan et al., 2004](https://jamanetwork.com/journals/jama/fullarticle/198809), and [Turner et al., 2008](https://pubmed.ncbi.nlm.nih.gov/18199864/) | Original or systematic evidence of non-publication and selective reporting | Different periods and medical sectors; no value is a universal prevalence estimate. |
| [Cochrane living-review chapter](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-22), [Elliott et al., 2014](https://journals.plos.org/plosmedicine/article?id=10.1371%2Fjournal.pmed.1001603), and [PRISMA-LSR](https://www.bmj.com/content/387/bmj-2024-079183) | Official and original definitions, operation, and reporting of living reviews | A living label does not prove searches or integrations occurred on time. |
| [Crossmark](https://www.crossref.org/documentation/crossmark/), [Crossref Retraction Watch](https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/), [NLM policy](https://www.nlm.nih.gov/bsd/policy/errata.html), and [COPE guidelines](https://publicationethics.org/sites/default/files/retraction-guidelines-cope.pdf) | Status channels and editorial correction/retraction categories | Participation, coverage, deposit speed, identifiers, and downstream propagation remain incomplete. |
| [Borah et al., 2017](https://bmjopen.bmj.com/content/7/2/e012545) and the RoB reliability studies above | Original workload and inter-rater evidence | Small or dated biomedical samples; useful for scale and design risk, not universal staffing estimates. |

This research did not systematically cover every scientific discipline,
non-English evidence system, regulator, proprietary database, statistical
method, professional regime, or jurisdiction. Source relationships are not
independent: several methods and studies come from overlapping evidence-
synthesis communities. All recommendations therefore remain hypotheses to be
tested prospectively rather than validation of the proposed product.
