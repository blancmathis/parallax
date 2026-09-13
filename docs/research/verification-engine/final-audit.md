---
context_room:
  id: research.verification-engine.final-audit
  depends_on:
    - research.verification-engine
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
status: final-internal-audit
document_type: research-audit
---

# Final architecture-research audit

## Summary

This audit closes the current documentation-only research cycle for a proposed
standalone verification engine derived from Parallax. The dossier passes as a
noncanonical, falsifiable architecture blueprint. It does not pass as an
implementation authorization, production design approval, legal opinion,
scientific validation, market proof, or promise that arbitrary information can
be verified with certainty.

The final posture is therefore:

- **conditional go** for Phase 0 product discovery and Phase 1 offline
  falsification;
- **no-go** for production coding, public certificate issuance, a standalone
  repository, or scientific/public high-harm verification; and
- **mandatory stop or scope reduction** whenever the evidence, harm, rights,
  reviewer, security, comprehension, operational, or economic gates fail.

The proposed lowest-regret architecture is a logically standalone bounded
context with PostgreSQL as canonical relational authority, a private
content-addressed evidence vault, transactional audit/outbox events, rebuildable
search/vector/graph/RDF projections, and a small deterministic assurance kernel
as the sole certificate-issue authority. AI remains a replaceable proposal
layer. Parallax is an initial consumer, not the epistemic authority. A physical
split is deferred until every mandatory boundary trigger and at least one demand
trigger pass.

No pre-build plan can be proved “perfect.” The strongest defensible completion
claim is narrower: the dossier records the fundamental architecture choices,
their alternatives, failure modes, reversal evidence, and external gates as a
concrete handoff for an independent architect to challenge. Only after that
review and Phase 0 acceptance should the surviving subset become a formal
specification; this audit does not claim that the handoff is defect-free.

## Defines

The audit basis, requirement traceability, internal consistency result,
validation receipts, residual-risk and bias registers, external expert gates,
and final research/build verdict for this dossier snapshot.

## Does not define

Accepted Parallax behavior, approval of any proposed decision, empirical proof
that the engine is useful or safe, exact implementation schemas, a legal or
regulatory conclusion, a scientific assurance service, a budget, staffing, an
SLA, or permission to code, publish, contact users, ingest data, or launch.

## Audit basis and authority

| Item | Audited fact | Consequence |
| --- | --- | --- |
| Date and jurisdiction context | Audit completed on 2026-08-12 from the France/EU-oriented research context declared by the dossier. | Legal analysis remains deployment- and date-specific. |
| Repository | Local checkout of `blancmathis/parallax`, configured origin `Swarek/parallax`. | Repository files and Git are the local evidence surface; no Context Room document was accepted. |
| Baseline commit | `df6f316e989d5d420003c47b39035a084c6a1c0a` on `main`. Both the canonical GitHub `blancmathis/parallax` main and configured origin main resolved to the same commit at final verification. | The project baseline was current for this audit without a pull or code change. |
| Working tree | `docs/gpt-prompts/` and `docs/research/` are untracked. No tracked source, dependency, infrastructure, or canonical Parallax document was changed. | The dossier has no durable Git provenance until the user chooses to add and commit it. |
| Governing request | The active research goal and the [maximum-assurance prompt](../../gpt-prompts/02-max-assurance-verification-engine.md), with the [pre-build feasibility prompt](../../gpt-prompts/01-prebuild-feasibility-audit.md) as context. | Current user intent outranks older project intentions; the work stays documentation-only and noncanonical. |
| Baseline sources | `README.md`, `docs/02-product.md`, `03-data-model.md`, `06-vision.md`, `07-engine.md`, `08-sources.md`, and the prototype paths recorded in the [index](INDEX.md#baseline-inspection-record). | Implemented prototype, accepted product contract, long-term intention, and this recommendation remain distinct. |
| Research method | Repository audit, broad contradictory source review, source reconciliation, architecture comparison, contract synthesis, adversarial review, specialist cross-document review, and mechanical validation. | This is deep architecture research, not a systematic review or independent professional audit. |
| External actions | No interviews, surveys, paid-source access, expert engagement, user contact, publication, issue, PR, or implementation was performed. | User, practitioner, legal, domain, and operational evidence remains an explicit external gate. |

## Audit vocabulary

| Status | Meaning here |
| --- | --- |
| **PASS** | The dossier contains a coherent, navigable, internally reviewed answer at the proposal level. It does not imply implementation or real-world validation. |
| **PASS WITH LIMIT** | The documentary mechanism exists, but its evidence scope or reproducibility limitation must travel with the result. |
| **EXTERNAL GATE** | Resolution requires authorized empirical work, a product-owner decision, private or paid access, professional advice, independent review, or measured operation. |
| **FAIL TODAY** | A release or readiness condition is currently false. Research may continue, but coding or launch cannot be inferred. |
| **NOT APPLICABLE** | The item is deliberately excluded from this documentation-only phase. |

Review by several agents or models was used to find contradictions. Agreement
between those reviewers is not treated as independent evidence that the design
is correct. The evidence is the corrected contract and its future falsification,
not reviewer count.

## Research-contract traceability

| Required outcome | Documentary owner and result | Audit status | Material limit |
| --- | --- | --- | --- |
| Record repository commit, files, access and assumptions | [Index baseline](INDEX.md#baseline-inspection-record) and this audit basis. | **PASS** | The dossier is still untracked. |
| Distinguish observation, intention, hypothesis, contradiction, decision and recommendation | [Research assertion taxonomy](INDEX.md#research-assertion-taxonomy) plus the roadmap decision register. | **PASS** | Future edits must preserve the labels; prose cannot turn a proposal into current behavior. |
| Explain why universal 100-percent truth is unavailable | [Assurance object](assurance-model.md#the-object-being-certified), [open-world rule](assurance-model.md#open-world-by-default), and [100-percent boundary](assurance-model.md#what-can-be-guaranteed-at-100-percent). | **PASS** | Product language is restricted to exact versioned receipt coverage; finite internal tests may require all named fixtures to pass only with their denominator and failures shown. |
| Define honest public wording | [Qualified UX language](assurance-model.md#qualified-ux-language) and the index executive verdict. | **PASS** | Must pass direct comprehension and wrong-label harm tests. |
| Cover claim families, examples, automation, human review, abstention and revision triggers | [Claim-family matrix](assurance-model.md#claim-families-and-assurance-ceilings). | **PASS** | Domain-specific thresholds are not accepted yet. |
| Separate outcome, run, lifecycle, visibility and challenge | [Orthogonal axes](assurance-model.md#orthogonal-machine-result-axes) and [terminal-object finalization](verification-protocol.md#terminal-object-finalization). | **PASS** | Exact schemas remain a ready-to-code artifact. |
| Define abstention, refusal and failure without false negative inference | [Abstention policy](assurance-model.md#abstention-policy-and-attestation), [run lifecycle](verification-protocol.md#verification-run-lifecycle), and architecture boundary objects. | **PASS** | User comprehension is untested. |
| Define an auditable, replayable certificate and lifecycle | [Certificate contract](assurance-model.md#verification-certificate), [terminal-object transaction](architecture.md#terminal-object-sealing-prepare-sign-finalize-and-activate), and [certificate lifecycle](verification-protocol.md#certificate-lifecycle). | **PASS** | Canonical schema, fixtures, key profile and restore proof are open gates. |
| Provide one simple result, one scientific/causal result and one correct inconclusive result | [Three terminal examples](evaluation-and-vertical-slice.md#illustrative-certificate-1--simple-bounded-attribution): one issued attribution certificate and two abstention attestations. | **PASS** | Examples are fictional design fixtures, not observed engine output. |
| Make counterevidence and source independence non-optional | [Counterevidence protocol](assurance-model.md#counterevidence-protocol), [independence rules](assurance-model.md#source-independence), and [kernel constructors](verification-protocol.md#permitted-set-constructors-and-provenance). | **PASS** | The current research itself lacks a complete query and screening ledger. |
| Define meta-verification and external challenge | [Meta-verification](assurance-model.md#meta-verification), [governance tests](governance-and-workflows.md#tests-and-acceptance-evidence), and [replication package](evaluation-and-vertical-slice.md#replication-and-audit-package). | **PASS** | No independent replication, bounty, audit or red-team exercise has run. |
| Bound AI authority, portability, calibration and adversarial failure | [AI authority boundary](ai-subsystem.md#authority-boundary), [provider exit](ai-subsystem.md#provider-portability-and-exit), and [promotion/rollback](ai-subsystem.md#promotion-fallback-and-rollback). | **PASS** | No model stage has passed prospective promotion. |
| Define humans, experts, conflicts, appeals and correction | [Roles and independence](governance-and-workflows.md#roles-competence-independence-and-conflicts), [appeals](governance-and-workflows.md#appeals-complaints-rights-requests-and-moderation), and [correction lifecycle](governance-and-workflows.md#correction-and-notification-lifecycle). | **PASS** | Reviewer supply, competence thresholds, compensation and capture resistance are untested. |
| Compare at least three architectures | [Four alternatives](architecture.md#alternatives-compared): relational core, graph core, event-sourced core, and pragmatic hybrid. | **PASS** | Workload superiority is a hypothesis until V0/MES benchmarks. |
| Recommend the lowest-regret technical architecture | [Recommended trust architecture](architecture.md#recommended-trust-architecture), [components](architecture.md#components-and-authority), and [decision tests](architecture.md#decisions-counter-hypotheses-and-promotion-tests). | **PASS** | It is a proposal, not an accepted ADR. |
| Cover canonical data, provenance, ingestion, search, review, API, portability and recovery | [Canonical domain model](architecture.md#canonical-domain-model), [workflow](architecture.md#end-to-end-workflow), [projections](architecture.md#search-and-graph-projections), [API](architecture.md#public-api-contract), [import/export](architecture.md#versioned-export-verify-only-and-import-contract), and [recovery](architecture.md#operations-and-recovery-baseline). | **PASS** | Exact schema, protocol adapters, performance and provider-exit drills remain open. |
| Decide the exact Parallax boundary | [Logical boundary](architecture.md#logical-data-and-api-boundary-with-parallax) and [standalone decision](roadmap-and-decisions.md#standalone-engine-versus-parallax). | **PASS** | Logical separation is recommended; a physical split is explicitly deferred. |
| Define cryptographic guarantees without converting integrity into truth | [Proof-property contract](provenance-and-cryptographic-trust.md#proof-property-contract), [canonical signature](provenance-and-cryptographic-trust.md#canonical-certificate-and-signature), and [staged maturity](provenance-and-cryptographic-trust.md#staged-maturity). | **PASS** | Keys, trust anchors, external time/log services and long-term validation are not deployed. |
| Cover security, privacy, rights, licences, publication and legal uncertainty | [Threat register](threat-model.md#threat-register), [privacy architecture](threat-model.md#privacy-and-data-protection-architecture), [rights](threat-model.md#copyright-database-access-and-redistribution), and [launch blockers](threat-model.md#professional-review-blockers-before-launch). | **PASS WITH LIMIT** | Conceptual design only; counsel, DPO and deployment-specific tests are mandatory. |
| Give every threat actor, mechanism, impact, detection, prevention, response, residual risk and proof | Threats `TM-01` through `TM-18` in the [threat register](threat-model.md#threat-register). | **PASS** | Residual ratings are proposal judgments, not measured risk. |
| Include public user and practitioner evidence, failures and counterarguments | [Practitioner/user evidence](evidence-base.md#practitioner-and-user-evidence), [evidence/counterevidence matrix](evidence-base.md#evidence-and-counterevidence-matrix), and [research limits](evidence-base.md#research-method-and-limits). | **PASS WITH LIMIT** | Public studies are not direct Parallax discovery and are not globally representative. |
| Inventory reusable external mechanisms by solved problem, guarantee boundary, maturity, primary source, licence/access and integration risk | [Standards/mechanisms register](evidence-base.md#standards-and-mechanisms-register), [access register](source-register.md#access-and-paid-source-register), and architecture dependency exits. | **PARTIAL / EXTERNAL GATE** | Problem, guarantee/non-guarantee, maturity, source and intended role are mapped; exact-version licence/access, patent, security/privacy, maintenance and integration-risk clearance is not complete per mechanism and blocks adoption. |
| Give scientific claims a specialist method | [Scientific profile](scientific-claims-profile.md), including claim specification, method stack, living review, correction and shadow evaluation. | **PASS AS SHADOW DESIGN** | All subtype labels remain non-issuable until signed mapping, experts, licences and prospective evidence exist. |
| Cover workload, staffing, cost, SLOs, support and sustainability | [Operations/cost](operations-and-cost.md), especially [parametric economics](operations-and-cost.md#parametric-unit-economics), [recovery](operations-and-cost.md#backup-restore-and-disaster-recovery), and [proof before scale](operations-and-cost.md#proof-required-before-scale). | **PASS WITH LIMIT** | No real prices, staffing, service times, WTP, avoided cost, RPO/RTO or capacity are validated. |
| Define benchmark, metrics, adversarial tests and a falsifiable vertical slice | [Evaluation protocol](evaluation-and-vertical-slice.md), including [four tracks](evaluation-and-vertical-slice.md#four-benchmark-tracks), [failure injection](evaluation-and-vertical-slice.md#adversarial-and-failure-injection-suite), [metrics](evaluation-and-vertical-slice.md#metrics-and-mandatory-denominators), and [V0 gates](evaluation-and-vertical-slice.md#v0-gates). | **PASS AS PREREGISTRATION DESIGN** | No case has run and no threshold has passed. |
| Make build/stop decisions evidence-gated | [Phased roadmap](roadmap-and-decisions.md#evidence-gated-roadmap), [20 critical decisions](roadmap-and-decisions.md#critical-decision-register), [30 open questions](roadmap-and-decisions.md#prioritized-open-questions), and [18 kill criteria](roadmap-and-decisions.md#kill-stop-and-pivot-criteria). | **PASS** | Owners and thresholds must be ratified before results are observed. |
| Define readiness without hiding missing work | [Definition of ready to code](roadmap-and-decisions.md#definition-of-ready-to-code). | **FAIL TODAY** | All 38 readiness items remain open; none may be inferred from document quality. |
| Inventory source provenance, scope, limits and access gaps | [Source register](source-register.md) and [evidence gaps](source-register.md#expert-and-evidence-gap-register). | **PASS WITH LIMIT** | Some rows are owner-reviewed imports rather than reopened sources; paid/full-text gaps remain. |
| Map citations mechanically to stable source IDs | [Source usage manifest](source-usage-manifest.md), covering every in-scope external Markdown citation occurrence. | **PASS WITH LIMIT** | It proves identity joins, not semantic support; the durable generator remains a ready-to-code gate. |
| Keep the work documentation-only and noncanonical | Every file declares its research/proposal boundary; Git shows no tracked change. | **PASS** | Adding the dossier to project authority requires an explicit later decision. |

## Fundamental architecture decisions are explicit

The dossier does not require a future architect to guess the following
directions. It does require the named owners to accept or reverse them using the
recorded evidence.

| Decision surface | Current recommendation | Why it is lowest-regret now | What can reverse or narrow it |
| --- | --- | --- | --- |
| Product promise | Certify a scoped dossier and executed method, never universal truth. | Honest across closed and open worlds; keeps limits and counterevidence inspectable. | Simpler wording may replace it only if comprehension improves without false authority; the universal-truth ban is not reversible by popularity. |
| Initial scope | Test T0 document attribution, bounded register lookup and deterministic calculation plus an open-world-negative abstention track; select exactly one positive family for the MES. | These offer the strongest local closure and replay properties while still testing dangerous absence inference. | Discovery and V0 may select one family, narrow to a plain dossier, or kill the engine. |
| System boundary | Logical standalone context first; physical repository/service split later. | Preserves portability without premature operational and governance duplication. | Split only when all mandatory boundary triggers and at least one independent-demand trigger pass. |
| Canonical persistence | PostgreSQL relational authority plus a private content-addressed vault. | Strong transactions, constraints, bitemporality, rights controls and simpler recovery dominate early graph convenience. | Locked workloads, fan-out and recovery benchmarks may justify specialized canonical infrastructure later. |
| Derived infrastructure | Lexical, vector, graph and RDF views are disposable projections. | Search and traversal can evolve or fail without gaining write/issue authority. | Measured non-rebuildable requirements would require a new ADR and trust analysis. |
| Issue authority | A total deterministic kernel authorizes issue. The five-phase terminal saga signs the frozen payload outside the database transaction, finalizes canonical state internally, signs that finalization event separately, then activates external visibility in a second transaction. | Minimizes the trusted decision surface and prevents model/reviewer prose, signer latency or an unsealed internal pointer from becoming a public result. | Only conformance and operational evidence may refine the mechanism; no result may bypass a deterministic gate or the activation receipt. |
| AI role | Models propose, extract, diversify, compare and triage; they never admit evidence, establish independence or issue. | Uses model leverage while containing drift, prompt injection and correlated error. | A narrow stage can gain bounded automation only after prospective ablation and independent audit, never by self-evaluation. |
| Human role | During V0/MES/first pilot, every newly issued T0 case receives the profile's per-case human authority; sampled independent re-audit is additional. Governance and issue authority remain separated. | Human review without competence, workload and independence controls is not assurance. | A later major T0 profile may replace one exact judgment only with a deterministic predicate that passes prospective harm, drift and adversarial gates without reviewer rescue; missing required authority never becomes support. |
| Result model | Orthogonal epistemic outcome, run disposition, certificate lifecycle, visibility, challenge status and domain certainty. | Prevents “stale,” “refused,” “contested” or “private” from silently changing evidentiary meaning. | A simpler projection may be tested, but must losslessly preserve machine semantics. |
| Scientific claims | Separate shadow-only profile; no public issuance in v1. | Scientific causal conclusions require distinct estimands, bias tools, certainty scales, synthesis and living-review capacity. | Promotion requires signed mappings, specialists, lawful access, prospective evaluation and independent replication. |
| Cryptography | Sign canonical certificate bytes; optionally add trusted time/transparency after the core works. | Integrity and attribution are useful, but do not justify epistemic status and add cost/privacy risk. | Higher tiers may mandate witnesses or time evidence after threat, privacy and recovery proof. |
| Public/community layer | Evidence discovery and objection only; no vote-count truth authority. | Participation can widen discovery but introduces brigading, popularity and capture risks. | A controlled post-v1 experiment may add bounded functions only if harm-adjusted value exceeds ordinary appeals. |

The detailed option, mechanism, cost, risk, failure scenario, confidence and
reversal evidence for each critical choice remain owned by the [decision
register](roadmap-and-decisions.md#critical-decision-register), not this summary.

## Cross-document consistency audit

### Material contradictions resolved

1. **Truth versus procedure:** the product now certifies a scoped method result,
   not a universal proposition.
2. **Outcome versus workflow:** abstention, refusal and failure are terminal run
   dispositions with distinct signed objects, never low-grade epistemic labels.
3. **Boundary versus run failure:** malformed boundary input has no run
   disposition; a schema-valid prohibited request can receive a pre-run refusal;
   only a created run ends in one of four dispositions.
4. **Certificate versus mutable status:** signed at-issue bytes remain immutable;
   lifecycle, visibility, challenge and correction are ordered external events
   and a rebuildable current-status projection.
5. **Visibility versus epistemic meaning:** rights or safety may deny publication
   or withhold the complete certificate view, but may not prune, null or rewrite
   the signed outcome.
6. **AI versus issue authority:** models can propose; typed reviewers can attest;
   only the deterministic kernel and finalization contract can issue.
7. **Ceilings versus scores:** eligibility is an intersection of typed permitted
   sets with retained exclusion reasons, not an averaged confidence score.
8. **Fallback authority:** the outcome registry determines same-track weaker
   eligibility; a frozen request rank alone selects among pre-attested eligible
   fallbacks. Outside-family/profile outcomes cannot fall back.
9. **Science versus generic outcomes:** scientific subtype, causal force, exact
   certainty and outcome are jointly bound; diagnostic `body_of_evidence_*`
   labels stay shadow-only until an explicit signed mapping exists.
10. **Open-world absence versus scientific null:** open-world non-discovery never
    becomes absence; null, equivalence and non-inferiority require their own
    estimand, margin, power, uncertainty and bias predicates.
11. **Cryptographic integrity versus truth:** digests, signatures, time and log
    receipts prove only their named bounded properties.
12. **V0 versus MES versus pilot:** the four-track V0 falsifies architecture; the
    MES implements exactly one selected positive family with the negative safety
    suite; the later pilot binds one source/domain/language/jurisdiction/decision.
13. **Logical versus physical separation:** architecture owns the logical
    Parallax boundary; the roadmap alone owns the physical split decision.
14. **Source inventory versus semantic support:** the manifest proves URL-to-ID
    joins; it explicitly does not claim that a citation proves nearby prose.

After correction and targeted re-review, no known material contradiction remains
inside the proposal contracts. This is a snapshot claim, not a guarantee that a
future reviewer or experiment will find no defect.

### Deliberate non-uniformity

The dossier intentionally does not force one method across all claims. Shared
objects and controls cover identity, provenance, rights, replay, review,
correction and result axes. Inferential criteria, certainty, closure, reviewers,
expiry and public ceilings remain claim-family or domain-profile responsibilities.
That specialization is a safety property, not unfinished normalization.

## Evidence and citation audit

| Measure | Final pre-audit-source snapshot |
| --- | ---: |
| Stable source rows | 189 `SRC-*` IDs, no duplicates |
| External Markdown citation occurrences in the 13 scanned dossier documents | 365 |
| Distinct cited URLs as written | 229 |
| Document-URL groups | 304 |
| Stable source IDs reached by citations | 179 |
| Exact URL joins | 353 occurrences / 292 groups |
| Same-work fragment joins | 10 occurrences / 10 groups |
| Same-work part joins | 2 occurrences / 2 groups |
| Unmatched or ambiguous joins | 0 |

The source-usage manifest excludes itself, the source register and this audit to
avoid self-reference. The 14-document manifest source set is the 13 scanned
documents plus the source register. Its SHA-256 digest is recorded after final
non-audit edits in the validation receipt below.

The identity join is mechanically complete for this snapshot, but four limits
remain material:

- inline prose, not the manifest, states what a citation is used to support;
- a matching source ID does not establish source truth, legal permission,
  independence, representativeness or semantic entailment;
- the research did not retain a systematic-search query ledger, screening flow,
  inclusion/exclusion record or stopping receipt; and
- the register distinguishes directly checked sources from owner-reviewed
  imports, and some paid/full-text or automated-access gaps remain.

The external URL check normalized fragments and queried 221 unique network
targets. It found 178 accessible targets, 41 access-control or anti-bot `403`
responses, one `429`, and one timeout. It found no confirmed `404`, `410`, DNS,
TLS or server-error failure. The 43 non-success responses are unproven automated
access, not proof that a link is valid or broken; they remain access caveats.

## Residual-risk and unknowns register

| ID | Open risk or unknown | Current state | Smallest decisive next evidence | Consequence while open |
| --- | --- | --- | --- | --- |
| R-01 | A user needs a certificate rather than an official link or simple evidence dossier. | No direct discovery or behavior study. | Q01–Q02 interviews and task tests across at least three real user segments, including the two simpler baselines. | Do not code a product surface or infer demand. |
| R-02 | Certificate language improves decisions without creating false authority. | Public studies are mixed; Parallax-specific UX is untested. | Preregistered wrong/stale/abstention study including multilingual, low-literacy, accessibility and distrust cohorts. | No public badge or certificate. |
| R-03 | One T0 source boundary supports defensible complete snapshots and negative lookup. | Candidate families only. | Source-owner guarantee, version/audit history and adversarial missing/update/access tests. | No negative certificate; positive attribution only. |
| R-04 | Claims can be compiled with stable identity and sufficient agreement. | Contract and examples exist; no annotated target corpus. | Double annotation of ambiguous cases with frozen identity/change thresholds. | Narrow to structured inputs or stop the subtype. |
| R-05 | The proposed machinery beats an official-link or simple-dossier baseline under a harm budget. | Evaluation design only; zero executed cases. | Run V0 prospectively with hidden/adversarial splits and frozen minimum worthwhile effect. | No MES selection or implementation claim. |
| R-06 | Qualified, independent reviewers are available at sustainable cost. | Roles and controls specified; no paid capacity study. | Qualification rubric, conflict model, paid time/capacity sample and agreement calibration. | Never automate around reviewer absence. |
| R-07 | Acquisition, retention, provider transfer, quotation, publication, export and deletion can coexist lawfully. | Legal-design analysis only. | Source-class rights matrix, actual data flow, counsel/DPO review and DPIA where required. | No scale ingestion or public release. |
| R-08 | Untrusted Web/file ingestion and privileged operations can be contained. | Threats and required proof defined; no system exists to test. | Executable adversarial corpus, auth design, secure-SDLC evidence and independent red-team. | Do not process untrusted inputs in a certificate path. |
| R-09 | Certificate correction, restriction, expiry and supersession propagate to consumers. | Event/API contract only. | End-to-end consumer drill with delivery, acknowledgment, stale cache and critical suspension. | Distribution promise stays narrow and non-public. |
| R-10 | Canonical data and evidence can recover within acceptable loss/time bounds. | Proposed restore contract; no approved RPO/RTO or retained case. | Business-impact decision plus repeated independent backup/restore and projection-rebuild drills. | No operational SLA or durable assurance claim. |
| R-11 | Lifecycle cost is below measured value or willingness to pay. | Parametric equations only. | Manual prospective cases with full reviewer/support/correction cost and real WTP or avoided-cost evidence. | Do not scale or use benchmark token cost as unit economics. |
| R-12 | Governance resists capture and remains operable. | Separation and tests specified; no institution or independent authority exists. | Named owners, authority matrix, conflict exercises, independent audit and capture tabletop. | No autonomous public issuer. |
| R-13 | Source-origin clustering is accurate enough to support independence floors. | Provenance model exists; no target-domain labeled corpus. | Syndication/mirror/dataset/control lineage corpus with false-independence limits and hidden-origin cases. | Unknown lineage counts as zero. |
| R-14 | Scientific assurance can be made reproducible, lawful and professionally accountable. | Shadow profile only. | Signed mapping/fixtures, specialist leadership, lawful databases, prospective review, replication and professional approval. | Scientific outputs remain abstentions/diagnostics, never public certificates. |
| R-15 | A standalone product has demand and governance independent of Parallax. | Logical boundary only; no external consumer evidence. | Apply every mandatory and demand split trigger after discovery and portability exercises. | Keep logical separation; do not create a new repository/service. |
| R-16 | The source manifest and material-claim traceability stay reproducible as docs change. | Snapshot identity join exists; no committed generator or proposition-level matrix. | Versioned fail-closed generator plus requirement/decision/gate-to-source proposition and limit matrix. | Documentation is not ready to code. |
| R-17 | The architecture contracts can be encoded without missing authority or unsafe optionality. | Fundamental decisions are explicit; exact schemas/fixtures are not accepted. | Resolve all P0 questions and every ready-to-code item with independent domain and security review. | Implementation must not fill gaps by developer guesswork. |
| R-18 | The dossier itself is durable project evidence. | Entire dossier and prompts are untracked. | User-authorized review, add and commit on an intentional branch or main. | Current work can be lost or drift outside Git history. |

## Bias and coverage register

| Bias or blind spot | How it can distort the recommendation | Containment in this dossier | Required correction before broader claims |
| --- | --- | --- | --- |
| English-language and Western institutional bias | Overstates transferability of sources, statuses, law and professional workflows. | Explicit scope limits and no global launch claim. | Replicate discovery, claim annotation, retrieval and comprehension in each language/jurisdiction. |
| Fact-checking, X/Community Notes and scientific-review concentration | Makes a general engine resemble the best-documented adjacent fields. | Claim-family ceilings and domain specialization reject one universal method. | Study target users and source classes outside those ecosystems before expanding. |
| Publicly accessible evidence bias | Underrepresents private, paywalled, sensitive, dangerous and legally restricted work. | Access gaps and private/high-harm exclusions are explicit. | Lawful paid/full-text review and professional source-safety design where indispensable. |
| Publication and survivorship bias | Published studies and visible incidents may miss ordinary failures, quiet withdrawals and unsuccessful products. | Counterevidence and unknowns are retained; no prevalence claim is inferred. | Prospective pilot logging, unfavorable-result publication and independent replication. |
| Shared-author/institution/platform dependence | Multiple documents may repeat one method, dataset or institutional worldview. | Source clusters are conservative and counts are never treated as truth. | Origin-level independence audit for every decision-critical evidence chain. |
| Recency and standards-owner bias | Current standards define intended mechanisms but may lack outcome evidence or change after cutoff. | Normative, informative, empirical and preprint evidence types are separated. | Version monitoring and measured implementation evidence. |
| AI benchmark and preprint bias | Clean tasks and early papers can overstate real performance or hide contamination. | Benchmarks are development inputs only; temporal/OOD/adversarial evaluation is mandatory. | Prospective target-domain evaluation and independent labels. |
| Architecture familiarity bias | PostgreSQL and derived projections may be favored because their failure modes are more familiar. | Four options, counter-hypotheses and promotion tests are documented. | Locked real-workload, recovery, fan-out and cost benchmark before specialized adoption. |
| Reviewer correlation | Specialist agents shared the same repository, task framing and model family; agreement is not independence. | Reviews were used to locate contradictions, never to prove correctness. | Independent human architecture, epistemic, security, domain and user review. |
| No direct Parallax user evidence | Public practitioner literature can miss the actual decision, incentive and vocabulary of intended users. | Product readiness remains a fail and Q01 is first. | Direct contextual inquiry and task testing before product commitment. |

## Required outside review and authority

| Gate owner | Decision or evidence they must supply | Why the dossier cannot substitute for it |
| --- | --- | --- |
| Product owner | Accept/reject the non-oracle promise, one MES family, user decision, harm budget, minimum worthwhile effect, Parallax boundary and kill authority. | These are product values and resource commitments, not technical deductions. |
| User researcher/HCI/accessibility specialist | Direct discovery plus scope, expiry, abstention, wrong-label and downstream-decision studies. | Public literature cannot predict this interface or user population. |
| Information-retrieval/research-method specialist | Search plans, source closure, screening, stopping rules, counterevidence recall and source-origin audit. | Broad Web research does not prove search completeness or methodological fitness. |
| Domain expert and epistemic/method lead | Claim identity, profile predicates, ceilings, certainty, reference cases and adjudication manual. | Domain judgment cannot be generated safely from a generic architecture. |
| Deployment counsel, DPO and rights/licensing specialist | Actual data-flow, terms, lawful bases, copyright/database rights, publication, remedies, retention and deletion decisions. | The law depends on precise facts, contracts, jurisdictions and current interpretation. |
| Security architect and independent red team | Auth, authorization, secure development, ingestion containment, supply chain, insider/key compromise and failure evidence. | A threat table is not an implemented control. |
| Reviewer-operations lead | Qualification, independence, compensation, capacity, workload, calibration, disagreement and appeal feasibility. | “Human reviewed” has no assurance value without an operable institution. |
| SRE/operations lead | RPO/RTO, queues, SLOs, observability, backup/restore, projection rebuild, provider exit and incident drills. | No runtime, load or retained case exists. |
| Finance/commercial discovery | Full lifecycle cost, value, WTP/avoided cost, support/incident reserve and stop threshold. | Parametric equations contain unknown inputs, not a viable business. |
| Independent architect | Challenge trust boundaries, transaction invariants, import/export loss, schema authority and implementation decomposition after Phase 0 decisions. | The current review is internal and documentation-only. |

## Mechanical validation receipt

The final receipt must be read with the Git caveat: `git diff --check` does not
inspect untracked file content. Direct validators therefore inspect the dossier
files themselves, while Git reports only repository state.

| Check | Final result |
| --- | --- |
| Dossier Markdown files | 16, including this audit |
| Frontmatter blocks | 16 parsed |
| Unique `context_room.id` values | 16 |
| Unresolved `depends_on` IDs | 0 |
| Dependency cycles | 0 |
| Required `Summary`, `Defines`, `Does not define` sections | Present in all 16 files |
| Local Markdown links and anchors | 191 local Markdown link occurrences; 0 unresolved paths or anchors |
| Example YAML payloads | 3/3 parse with Ruby Psych |
| Source-register IDs | 189 `SRC-*`, unique |
| Citation-to-source joins | 365 occurrences, 304 document-URL groups, 179 source IDs, 0 unmatched |
| Ready-to-code checklist | 38 open, 0 complete |
| Conflict markers, trailing whitespace, final newlines and fence balance | 0 conflict markers, 0 trailing-whitespace lines, 0 missing final newlines; 29 fenced blocks balanced and language-labelled |
| `git diff --check` | Exit 0; direct checks cover untracked content |
| `context-room doctor --root .` | Repository integration **not green**: the checkout has no `.context-room/config.json`, existing Hub paths fall outside its declared allowlist, and the unaccepted `docs/research/` proposal is classified by that incomplete profile as record content. No Context Room acceptance or canonical-current status is claimed; direct corpus validators are the applicable snapshot proof. |
| Tracked code/config/infrastructure changes | 0 |
| Git state | `docs/gpt-prompts/` and `docs/research/` untracked |
| Source-set SHA-256 | `7bbe3dbfabcf3e4b56a176f6e519bc4a2bee2e83cde2cd83fa62a89ca2a3481b`, over the exact 14-file source set and algorithm recorded by the manifest |

## Completion and stop decision

### What is complete

- The repository and product-document contradiction is made explicit.
- The maximum honest assurance promise and its 100-percent boundary are defined.
- Fundamental architecture, trust, data, lifecycle, AI, human, governance,
  security, rights, scientific, operational, economic and evaluation choices
  have proposed owners and reversal evidence.
- The plan includes a falsifiable V0, one-family MES rule, controlled later
  pilot, baselines, harm gates, independent review, kill criteria and exact
  readiness checklist.
- External citations are inventoried and their limitations remain visible.
- Known material internal contradictions found during red-team review have been
  corrected rather than deferred to implementation.

### What is intentionally not complete

- no user or market decision has been validated;
- no evaluation case, security control, restore, rights workflow, reviewer pool,
  cost model, appeal or correction propagation has run;
- no profile, schema, policy, trust root, issuer or public wording is accepted;
- no scientific or high-harm public service is authorized;
- no physical repository split is justified; and
- no implementation is ready while any of the 38 readiness items remains open.

### Final verdict

The architecture-research goal is complete at the documentary proposal level.
The result is not “a machine that verifies everything at 100 percent.” It is a
plan for an assurance system that can make narrow, auditable, reversible claims
about what was checked, under which boundary, with which evidence and human
judgments, and why it must abstain.

The next authorized sequence is exactly the [immediate decision
sequence](roadmap-and-decisions.md#immediate-next-decision-sequence): ratify the
non-oracle product promise and Phase 0 scope, perform direct discovery, freeze
and run the offline falsification protocol, obtain the required legal/domain/
security/operations evidence, select at most one MES family, and apply the kill
criteria before writing an implementation plan. If the simple evidence dossier
matches the engine's value at lower cost or harm, the correct result is to stop
the certificate engine and keep the simpler product.
