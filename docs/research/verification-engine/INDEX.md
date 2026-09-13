---
context_room:
  id: research.verification-engine
  depends_on:
    - research.verification-engine.ai-subsystem
    - research.verification-engine.architecture
    - research.verification-engine.assurance-model
    - research.verification-engine.evaluation-vertical-slice
    - research.verification-engine.evidence-base
    - research.verification-engine.governance-workflows
    - research.verification-engine.operations-cost
    - research.verification-engine.provenance-cryptographic-trust
    - research.verification-engine.roadmap-decisions
    - research.verification-engine.scientific-claims-profile
    - research.verification-engine.source-register
    - research.verification-engine.source-usage-manifest
    - research.verification-engine.threat-model
    - research.verification-engine.verification-protocol
---

# Verification engine architecture research

## Summary

This dossier is a research proposal for a standalone, maximum-assurance
information-verification engine. It is derived from Parallax's claim and source
work, but it is not an accepted Parallax target and does not describe an
implemented system.

The observed repository juxtaposes an implemented debate-orientation prototype
with canonical long-term intentions for a much larger claim-assurance system.
The hypothesis tested here is that the latter has a different correctness
standard, threat model, data lifecycle, user set, and operational burden. The
current recommendation is to design it as a logically independent bounded
context with Parallax as an initial consumer. Creating a separate repository or
product is deferred until external demand, governance, portability, and
operating-cost gates pass.

## Defines

The observed Parallax baseline, the initial separation hypothesis, and the
questions the architecture research must resolve.

## Does not define

Accepted Parallax behavior, an approved verification-engine architecture, a
final legal interpretation, or an implementation plan.

## Research status

- **Status:** architecture-research dossier and final internal audit complete;
  active proposal with empirical and professional gates open. No recommendation
  is accepted and no production implementation is authorized.
- **Baseline date:** 2026-08-12.
- **Parallax commit inspected:**
  `df6f316e989d5d420003c47b39035a084c6a1c0a` on `main`.
- **Working tree note:** the two GPT research prompts were untracked at the
  start of the research. No existing code or canonical Parallax document has
  been changed for this dossier.
- **Context Room note:** deterministic corpus discovery returned zero accepted
  documents. Repository files and Git are therefore the current local evidence
  surface; this dossier must not be mistaken for accepted Context Room truth.

### Baseline inspection record

The repository baseline was inspected locally before the external research and
architecture synthesis. The recorded evidence surface was:

- `README.md` and Git state on `main` at the commit above;
- canonical Parallax documents `docs/02-product.md`, `docs/03-data-model.md`,
  `docs/06-vision.md`, `docs/07-engine.md`, and `docs/08-sources.md`;
- the relevant prototype paths cited below in `app/src/data/state.ts` and
  `supabase/functions/analyze-seed/index.ts`;
- the [pre-build feasibility prompt](../../gpt-prompts/01-prebuild-feasibility-audit.md)
  as research context; and
- the [maximum-assurance prompt](../../gpt-prompts/02-max-assurance-verification-engine.md)
  as the detailed research contract.

This record proves document consultation, not agreement with every statement in
those documents. External source use and its limitations are separately owned by
the [evidence base](evidence-base.md) and
[source register](source-register.md).

### Research assertion taxonomy

The dossier uses six labels so an architectural recommendation is not mistaken
for repository reality:

| Label | Meaning in this dossier |
| --- | --- |
| **Observation** | Directly evidenced repository, source, standard, study, or measured result, with provenance and scope. |
| **Intention** | A target or promise stated by Parallax or another source but not established as implemented behavior. |
| **Hypothesis** | A falsifiable proposition awaiting discovery, benchmark, legal review, or operational evidence. |
| **Contradiction** | Two claims, contracts, observations, or incentives that cannot safely remain unresolved. |
| **Decision** | A proposed choice recorded with owner, alternatives, confidence, and reversal evidence; it remains noncanonical until accepted. |
| **Recommendation** | The current lowest-regret direction derived from the evidence, explicitly subject to its gates and falsifiers. |

Tables named “observed baseline” and evidence claims use **observation**;
Parallax target-language is **intention**; open questions and assumptions are
**hypotheses**; the conflict register uses **contradiction**; the roadmap's
decision register uses **decision**; and normative architecture language uses
**recommendation**. When a paragraph combines categories, it must name the
transition rather than presenting inference as observation.

## Executive verdict

The proposal is a **conditional go for a non-production feasibility program**
and a **no-go for coding or launching the production engine today**.

The defensible product is not a universal truth oracle. It is an assurance and
evidence-dossier engine that can say:

> Under method profile P, using the identified evidence corpus and versions,
> at cutoff T, the recorded checks and reviews justify outcome O within scope
> S. The limits, counterevidence, uncertainty, replay material, expiry, and
> appeal route are part of the result.

It may describe those closed, named properties—schema conformance, byte
identity, signature validation under a stated trust policy, deterministic
replay, proof-checker acceptance, a query over a demonstrably complete snapshot,
or execution of all instrumented protocol steps—only through the exact
versioned receipt-coverage form defined by the assurance model. Finite internal
test gates may require all named fixtures to pass with their denominator shown.
Neither form may become “the open-world claim is 100 percent true.”

The first falsifiable product candidate is restricted to `T0` public,
low-harm, bounded claims:

1. what an exact document version says;
2. what a declared complete registry snapshot records; and
3. what a deterministic calculation produces from frozen inputs.

An open-world-negative track is equally important: it must prove that the
engine abstains rather than treating “not found” as “false.” Scientific causal,
medical, legal-advice, financial-action, electoral, criminal, private-person,
and other high-harm conclusions are excluded from autonomous public issuance.

The recommended technical architecture is a relational authority in
PostgreSQL, a private content-addressed evidence vault, transactional audit and
outbox events, and disposable search, vector, graph, or RDF projections.
Cryptographic receipts prove integrity, attribution, time, inclusion, or log
consistency only; they never grant epistemic status. A small deterministic
assurance kernel is the sole component allowed to authorize certificate issue.

The complete go/no-go posture, including the evidence required before coding,
is owned by the [roadmap and decision register](roadmap-and-decisions.md).

## Dossier map

Read the first four documents for the core decision; use the rest as specialist
contracts and proof material.

| Document | Canonical research responsibility | Read when deciding |
| --- | --- | --- |
| [Assurance model](assurance-model.md) | What is being certified, claim families and ceilings, assurance vector, outcomes, abstention, certificate, and meta-verification. | Whether the product promise is epistemically honest. |
| [Recommended architecture](architecture.md) | Compared storage/execution options, trust boundaries, canonical data, logical responsibility and API contract, projections, and recovery. | What the system would be made of and how Parallax would integrate if the proposal is accepted. |
| [Verification protocol](verification-protocol.md) | Request contract, stage-by-stage controls, assurance kernel, lifecycles, propagation, two service speeds, and retry behavior. | How one request reaches a typed terminal object and, only when issued, a monitored certificate. |
| [Roadmap and decision register](roadmap-and-decisions.md) | Conditional go/no-go, standalone triggers, phases, documentation target, build/adopt choices, 20 decisions, 30 open questions, 18 stop/pivot criteria, and ready-to-code definition. | Whether any implementation work is authorized. |
| [Evidence base](evidence-base.md) | Research method, standards, practitioner and user findings, AI/scientific evidence, counterevidence, and bias. | Why the recommendations are plausible and where evidence conflicts. |
| [Source register](source-register.md) | Stable inventory of material sources, provenance clusters, uses, scope, limitations, access gaps, and expert gaps. | Auditing citations and evidence independence. |
| [Source usage manifest](source-usage-manifest.md) | Generated mechanical join from every external citation occurrence to its stable `SRC-*` owner, including exact and explicit same-work mappings. | Auditing point-of-use source traceability without duplicating substantive claims. |
| [AI subsystem](ai-subsystem.md) | Permitted and forbidden model authority, stage contracts, manifests, no-CoT dependency, calibration, portability, security, promotion, and fallback. | Whether and where a model may be introduced. |
| [Governance and workflows](governance-and-workflows.md) | User contracts, roles, competence, blind review, community boundary, separation of powers, appeals, corrections, transparency, and capture resistance. | Who may decide, challenge, publish, or change policy. |
| [Threat, privacy, and rights model](threat-model.md) | Adversaries, harm tiers, controls, EU/France legal-design boundaries, retention, publication, DSA/AI Act surface classification, and launch blockers. | Whether a proposed source, claim, user flow, or publication is allowed. |
| [Provenance and cryptographic trust](provenance-and-cryptographic-trust.md) | Trusted computing base, PROV, CAS, canonicalization, signatures, time, transparency, key compromise, privacy-preserving commitments, and offline verification. | What cryptography can prove and how it fails. |
| [Scientific-claims profile](scientific-claims-profile.md) | PICO/estimand scope, PRISMA/Cochrane/GRADE/RoB, registration, replication, publication bias, living reviews, corrections, cost, and v1 exclusion. | Why scientific causal claims need a separate specialist service. |
| [Operations and cost](operations-and-cost.md) | Queues, capacity, staffing, SLO hypotheses, parametric lifecycle economics, observability, restore, support, retention, and scale gates. | Whether the service can be operated and afforded without lowering assurance. |
| [Evaluation and vertical slice](evaluation-and-vertical-slice.md) | Four-track corpus, oracle, adversarial tests, baselines, metrics, statistical bounds, V0 gates, shadow evaluation, and three complete illustrative terminal objects: one certificate and two abstention attestations. | Whether the architecture survives a falsifiable pre-build test. |
| [Final audit](final-audit.md) | Requirement traceability, consistency findings, citation/link checks, residual risks, unknowns, biases, and outside-expert blockers. | Whether this dossier itself satisfies the research contract. |

## Observed Parallax baseline

### The accepted MVP is orientation, not truth adjudication

The current product owner says Parallax optimizes for understanding a debate,
and explicitly rejects `verified_true` for the MVP. Verification means the
relationship between one source and one scoped claim
([Product decision D5](../../02-product.md#d5--verification--claimsource-alignment-never-truth-accepted)).
The README likewise says the prototype does not provide automated factual
verification ([current status](../../../README.md#current-status)).

This is a narrow and defensible contract: retrieval, exact quotation, relevance,
support, contradiction, and uncertainty can be inspected without claiming that
the whole proposition has been proven.

### The long-term documents introduce a second product

The target vision describes a "living library of truths" whose claims become
`established` or `refuted` after adversarial cross-camp review
([Library of Truths](../../06-vision.md#the-library-of-truths)). The data model
then introduces globally reusable claims, evaluations, provenance events,
dependency propagation, source artefacts, and alerts
([Global Claim Graph](../../03-data-model.md#the-global-claim-graph-cross-debate-model)).
The source document adds authenticity, citation fidelity, inferential warrant,
corpus synthesis, source versioning, retractions, review coverage, juries, and
appeals ([Sources and Evidence](../../08-sources.md)).

Those responsibilities are not merely an advanced debate feature. Together
they form a general-purpose evidence and assurance system that could serve
journalists, researchers, institutions, agents, and applications unrelated to
debate presentation.

### The current runtime is prototype evidence only

The browser derives the scalar state `established | contested | values` from a
stored reviewer decision or, as fallback, from the presence of supporting and
contradicting evidence labels
([state derivation](../../../app/src/data/state.ts)). This is useful UI
scaffolding, not a defensible truth computation.

The optional live-model path performs an OpenRouter readiness ping and then
calls the same deterministic mock-completion procedure used by mock mode
([seed analysis function](../../../supabase/functions/analyze-seed/index.ts)).
The database also contains reviewer claim evaluations, a simplified camp-based
bridging gate, and rule-based source-integrity fields. These demonstrate review
and audit mechanics; they do not implement the long-term assurance model.

## Conflicts the standalone design must resolve

| ID | Observed conflict | Why it fails | Required direction |
| --- | --- | --- | --- |
| B-01 | The MVP rejects truth labels while the long-term vision names an `established` claim a truth. | Readers cannot tell whether `established` means citation support, procedural survival, expert synthesis, or correspondence with reality. | Define separate assurance dimensions and reserve strong language for a claim-type-specific standard. |
| B-02 | Cross-camp agreement is described as making a claim true, while the source model admits that bridging can be merely sociological. | Coordinated or sincerely mistaken groups can agree; disagreement clusters do not observe the world. | Use bridging for legitimacy, fairness, and objection coverage only. Never use it as evidence of truth. |
| B-03 | A claim has one global scalar lifecycle state. | Authenticity, citation fidelity, methodological quality, corpus completeness, temporal validity, and inferential strength can disagree. | Use a versioned assurance vector plus a derived, policy-specific public presentation. |
| B-04 | "Verify once, cite everywhere" implies durable reuse of a conclusion. | Scope, context, source status, methods, and the world change. A valid use can become stale without becoming false. | Reuse versioned evidence dossiers and certificates with applicability, dependencies, expiry, and re-evaluation triggers. |
| B-05 | The target jumps from a relational prototype to a property graph as the operational store. | Graph-shaped information does not itself prove a graph database is the safest first store; transactions, constraints, review queues, and bitemporal history may dominate. | Compare relational, graph, and hybrid implementations against measured flows before choosing. |
| B-06 | The documents specify evidence labels but not a reproducible search protocol. | A perfectly quoted source can still be cherry-picked from an incomplete corpus. | Make search scope, queries, inclusion/exclusion, source lineage, counter-evidence, and stopping rules part of the certificate. |
| B-07 | "Humans review everything" is a permanent trust boundary. | It does not specify competence, independence, workload, agreement, calibration, or what happens when review capacity is absent. | Route review by claim type and harm tier; measure reviewer performance and preserve abstention when qualified review is unavailable. |
| B-08 | Reviewer camps are both a governance input and sensitive latent data. | Publishing or retaining political/philosophical inference creates privacy, discrimination, manipulation, and capture risks without proving expertise. | Minimize and isolate such data; prefer task-relevant independence and competence signals, with bridging optional and never epistemic. |
| B-09 | "Nothing is deleted" protects auditability. | Permanent public retention can conflict with safety, privacy, legal duties, source licences, and the continued-influence effect. | Separate evidentiary retention, restricted audit access, public discoverability, legal holds, redaction, and deletion obligations. |
| B-10 | Every argument is required to have a non-AI primary source. | Normative premises, definitions, formal deductions, firsthand testimony, and some historical claims require different support contracts. | Define evidence profiles by claim and inference type rather than one universal source rule. |

## Recommended logical boundary and falsifiers

This dossier does not duplicate a second normative ownership table here. The
[architecture](architecture.md#logical-data-and-api-boundary-with-parallax) owns the proposed
logical data, command, event, and API responsibilities. The
[roadmap](roadmap-and-decisions.md#standalone-engine-versus-parallax) alone owns
the adoption decision and the mandatory/demand triggers for a physical or
organizational split.

In summary only: keep the proposed verification context logical and portable
inside Parallax during feasibility work. Reject or fold it back if the minimum
executable slice provides no value outside debate, its governance remains
inseparable from debate, or a narrower evidence-dossier service produces the
same measured value with materially less complexity. This is a recommendation
with falsifiers, not an observed or accepted Parallax boundary.

## Recommended noncanonical assurance principles

1. **Certify the process and evidence record; qualify the conclusion.** A
   machine can guarantee that all required, instrumented receipts validate for
   identified inputs under named checker and policy versions. Human judgment is
   attestable, not mechanically observed. Neither establishes that an
   open-world proposition is universally true.
2. **Assurance is a vector, not a universal percentage.** Artefact integrity,
   citation fidelity, relevance, inference quality, independence, corpus
   coverage, temporal freshness, and review status stay separately visible.
3. **Every result is scoped and dated.** Geography, population, definitions,
   measure, threshold, assumptions, observation window, and valid-as-of time
   are part of identity, not footnotes.
4. **Abstention is a successful run disposition, not an outcome.** A run sets
   `run_disposition: abstained` and emits an `AbstentionAttestation` with a
   typed reason such as `insufficient_evidence`, `scope_unresolved`,
   `material_counterevidence_unresolved`, `not_truth_apt`, or
   `qualified_review_unavailable`. It emits no certificate or epistemic
   outcome. `stale` belongs only to an issued certificate's lifecycle.
5. **Provenance is necessary but not probative.** A signature can establish
   origin and integrity without establishing truth.
6. **Evidence independence is about origin chains, not URLs.** Ten reports
   derived from one dataset remain one observational lineage.
7. **AI may propose and test; it may not grant assurance.** Deterministic checks
   and human/domain review govern transitions; model diversity is not assumed
   to be independent evidence.
8. **No silent verdict propagation.** A changed premise triggers dependency
   review and fail-closed removal from active use when material; it does not by
   itself invalidate, stale, or flip the dependent certificate's conclusion.
   The lifecycle owner determines the resulting `needs_review`, `stale`,
   `restricted`, `superseded`, `withdrawn`, or restored state from evidence.
9. **High assurance is domain-specific and expensive.** The engine needs
   explicit profiles and must refuse unsupported domains rather than applying
   a generic fact-check template.
10. **Every architecture claim must be falsifiable.** The vertical slice and
    benchmark must be able to show that the system is not better enough to
    justify its cost.

## Research completion map

| Completion question | Research answer | Owner |
| --- | --- | --- |
| Safest first claim family | Bounded public documents, complete versioned registries, and deterministic calculations; value remains unproven. | [Evaluation](evaluation-and-vertical-slice.md#four-benchmark-tracks) and [roadmap](roadmap-and-decisions.md#first-vertical-slice) |
| Public statuses | Typed process-relative outcomes plus an assurance vector; no unqualified `true`, `false`, or `verified`. | [Assurance result axes](assurance-model.md#orthogonal-machine-result-axes) |
| Universal versus domain dimensions | Claim specification, artifact/citation/provenance, coverage, time, review, replay, and conformance are cross-cutting; inference, method, uncertainty, and ceilings are profile-specific. | [Assurance vector](assurance-model.md#assurance-vector) and [scientific profile](scientific-claims-profile.md) |
| Source independence | Supported origin, dataset, observation, method, funding, coordination, and control lineage; unresolved lineage remains unknown. | [Source independence](assurance-model.md#source-independence) and [architecture](architecture.md#evidence-use-revisions-and-origin) |
| Replayed portion | Frozen deterministic transformations, checks, calculations, policy evaluation, serialization, and captured model outputs; a new call to a mutable model or Web source is a new run. | [Protocol](verification-protocol.md#failure-retry-and-resume-rules), [AI subsystem](ai-subsystem.md#replay-and-reproducibility-limits), and [cryptographic trust](provenance-and-cryptographic-trust.md) |
| Reviewer qualifications | Claim-, method-, language-, jurisdiction-, and harm-specific competence plus task-level independence, conflict disclosure, workload controls, blind first review, and separate adjudication. | [Governance](governance-and-workflows.md#roles-competence-independence-and-conflicts) |
| Lowest-regret architecture | PostgreSQL authority, private content-addressed evidence vault, transactional audit/outbox, and derived replaceable projections; add specialized graph/event infrastructure only after benchmark proof. | [Architecture](architecture.md#alternatives-compared) |
| Benchmark | Four separate tracks, hidden temporal/OOD/adversarial splits, contestable gold, open-world abstention, lifecycle failure injection, human/tool baselines, and risk-coverage gates. | [Evaluation](evaluation-and-vertical-slice.md) |
| Rights and retention | Access, mining, storage, provider transfer, quotation, and redistribution are separate permissions; protected payloads must remain restrictable or erasable even when a minimal audit event persists. | [Threat and rights model](threat-model.md#copyright-database-access-and-redistribution) |
| Evidence that justifies building | Prospective human-plus-engine improvement over evidence-only and human baselines at a predeclared harm bound, useful coverage, comprehensible UX, lawful replay, sustainable lifecycle cost, and working correction/appeal propagation. | [Evaluation gates](evaluation-and-vertical-slice.md#v0-gates), [operations](operations-and-cost.md#proof-required-before-scale), and [roadmap](roadmap-and-decisions.md#definition-of-ready-to-code) |

## What remains unproven

This dossier is complete as architecture research but does not establish market
demand, a lawful deployment basis, safe user comprehension, benchmark
performance, reviewer supply, unit economics, provider behavior, operational
recovery, or any real certificate's correctness. The next authorized work is
therefore the non-production discovery and evaluation preparation described in
the roadmap. Production code remains a no-go until “ready to code” is met.

The detailed research contract is preserved in the
[maximum-assurance prompt](../../gpt-prompts/02-max-assurance-verification-engine.md).
