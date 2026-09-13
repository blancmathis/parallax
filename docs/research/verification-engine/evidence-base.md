---
context_room:
  id: research.verification-engine.evidence-base
---

# Evidence base and practitioner findings

## Summary

No existing standard or workflow supplies end-to-end truth certification.
Existing mechanisms solve narrower problems: provenance interchange,
tamper-evident media history, transparent statement registration, structured
fact-check export, editorial accountability, systematic evidence synthesis, or
AI factuality evaluation. The proposed engine should compose those mechanisms
without importing claims they do not make.

Public practitioner research consistently points to source discovery,
origin-tracing, audiovisual verification, deduplication, workload, corrections,
and distribution as bottlenecks. Users benefit from warnings and contextual
notes, but they also follow incorrect labels. This makes an inspectable dossier,
abstention, visible scope, correction propagation, and coverage measurement
product requirements rather than optional transparency features.

## Defines

The research method, synthesis of observed user and practitioner needs,
competing evidence, reusable standards, and evidence gaps supporting the
architecture proposal. Stable source IDs, canonical URLs, provenance clusters,
and inventory coverage belong to the [source register](source-register.md).

## Does not define

A systematic review of every discipline, legal advice, vendor selection,
accepted product requirements, the canonical source inventory, or proof that
the proposed engine will work.

## Research method and limits

- **Repository baseline:** Parallax `main` at
  `df6f316e989d5d420003c47b39035a084c6a1c0a`, checked locally and against both
  the canonical `blancmathis/parallax` and configured `Swarek/parallax` remote
  heads on 12 August 2026.
- **External cutoff:** sources below were checked on 12 August 2026 unless a
  different date is stated.
- **Priority order:** current official standards and policies, original
  research, audits and postmortems, then product documentation and public
  practitioner reports. Search-result snippets, vendor slogans, aggregate
  counts, and model agreement are not treated as proof.
- **Contradictory search:** for each mechanism, the review sought both its
  intended benefit and documented failure, non-goal, cost, or boundary.
- **Research-search provenance limit:** this architecture pass did not retain a
  complete query ledger, database-by-database result export, screening flow,
  inclusion/exclusion record, or stopping receipt for its own Web research.
  Consequently the corpus is a broad, source-reconciled synthesis, not a
  reproducible systematic search or evidence of exhaustive practitioner views.
  The [source usage manifest](source-usage-manifest.md) proves citation-to-source
  joins only. Any future design-freeze evidence review must preregister and
  retain the full search protocol required by the verification model itself.
- **User evidence:** the sample is deliberately multi-context but not
  exhaustive. It includes public studies of fact-checkers, community
  contributors, review experts, and information consumers. It does not
  represent every country, language, profession, accessibility need, or
  deployment context.
- **Independence:** standards from the same institution and studies using the
  same platform or dataset are related evidence, not independent replications.
- **Legal status:** regulations and regulator materials establish text and
  guidance. Their application to a future deployment remains a professional
  assessment, not a conclusion of this dossier.

## Source-quality vocabulary

| Code | Meaning | Proper use |
| --- | --- | --- |
| `OFFICIAL-NORMATIVE` | Standard, regulation, or binding project policy from its owner. | Establishes what the mechanism or rule says, not whether it works in practice. |
| `OFFICIAL-INFORMATIVE` | Owner guidance, explainer, method, or product documentation. | Establishes intended behavior and admitted limits; self-interest is visible. |
| `ORIGINAL-EMPIRICAL` | Peer-reviewed or clearly identified original study. | Supports findings inside the studied sample and method. |
| `SYSTEMATIC-SYNTHESIS` | Systematic review or meta-analysis with declared method. | Supports cross-study patterns, subject to included-study quality and scope. |
| `AUDIT-POSTMORTEM` | Direct audit or incident record. | Strong for the observed implementation or event, weak for universal rates. |
| `PREPRINT` | Public research not yet peer reviewed. | Hypothesis or early evidence requiring corroboration. |
| `PUBLIC-FEEDBACK` | Forum, issue, survey response, or anecdote. | Design signal only unless supported by stronger evidence. |

## Standards and mechanisms register

| Mechanism | Source and maturity | What it supports | What it does not support | Integration decision |
| --- | --- | --- | --- | --- |
| W3C PROV-O | `OFFICIAL-NORMATIVE`, W3C Recommendation: [PROV-O](https://www.w3.org/TR/prov-o/) | Interoperable entities, activities, agents, derivations, attribution, and responsibility. | Truth, source quality, completeness, or a verification workflow. | Map canonical provenance to PROV-O for export; keep domain constraints internal. |
| JSON-LD 1.1 | `OFFICIAL-NORMATIVE`, W3C Recommendation: [JSON-LD](https://www.w3.org/TR/json-ld/) | JSON representation interoperable with linked-data/RDF tooling. | Validation, identity resolution, or evidence semantics by itself. | Use as an export profile, not the canonical persistence model. |
| SHACL | `OFFICIAL-NORMATIVE`, W3C Recommendation: [SHACL](https://www.w3.org/TR/shacl/) | Machine validation of RDF graphs against declared shapes. | Completeness or real-world truth of the validated graph. | Useful for exported-package conformance; assurance still depends on the profile. |
| C2PA Content Credentials 2.4 | `OFFICIAL-NORMATIVE/INFORMATIVE`: [specification index](https://spec.c2pa.org/specifications/specifications/2.4/index.html), [explainer](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) | Cryptographically bound media provenance, assertions, integrity validation, trust-list context, and transformation history. | The explainer explicitly declines value judgments about whether provenance data or content is true; provenance can be incomplete or removed. | Ingest and preserve C2PA when present. Display “provenance validated” separately from factual support. Absence is `unknown`, not suspicious by default. |
| SCITT | `OFFICIAL-NORMATIVE`, IETF Standards Track: [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) | Signed statements, registration policies, receipts, append-only verifiable structures, non-equivocation, and replayable registration. | Semantic validity of opaque statements, universal discovery, or source truth. | Optional certificate-transparency layer after the internal issuance path is proven. |
| Certificate Transparency | `OFFICIAL-NORMATIVE`, IETF: [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html) | Append-only certificate log proofs and consistency checking. | Prevention of all omission, false issuance, key compromise, or split views without monitoring and gossip. | Reuse design lessons for witnesses and consistency; do not call a log a truth ledger. |
| Schema.org ClaimReview | `OFFICIAL-INFORMATIVE`: [ClaimReview](https://schema.org/ClaimReview), [Google guidance](https://developers.google.com/search/docs/appearance/structured-data/factcheck) | Common claim-review, author, rating, appearance, and URL metadata; Fact Check Explorer interoperability. | Evidence graph, exact excerpts, reviewer independence, uncertainty, search coverage, appeals, or assurance dimensions. Google is phasing out its Search appearance. | Export adapter only. Never round-trip it into the canonical certificate. |
| Schema.org MediaReview | `OFFICIAL-INFORMATIVE`: [MediaReview](https://schema.org/MediaReview) | Media-manipulation categories and association with claim reviews. | Mature version/provenance lifecycle or factual adjudication. | Optional lossy export; retain C2PA/forensic results separately. |
| IFCN Code of Principles | `OFFICIAL-NORMATIVE` for signatories: [commitments](https://ifcncodeofprinciples.poynter.org/the-commitments) | Nonpartisanship, source/method/funding transparency, primary sourcing, corrections, and organizational assessment. | Accuracy of every fact-check or full verification of an applicant's disclosures. | Minimum organizational governance baseline, not a certificate grant. |
| EFCSN Code | `OFFICIAL-NORMATIVE` for members: [Code of Standards](https://efcsn.com/code-of-standards/) | Supporting and contradicting evidence, independent editing, source naming, privacy, corrections, complaints, and external assessment. | Infallible verdicts; the code admits limits in verifying transparency declarations. | Adapt its separation of author/editor, corrections, and complaints into workflow gates. |
| Cochrane Handbook | `OFFICIAL-INFORMATIVE` current method: [Handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current) | Protocols, duplicate extraction, searches, risk of bias, synthesis, applicability, and update guidance for intervention evidence. | Exhaustive discovery, error-free extraction, valid meta-analysis, permanent freshness, or individual clinical decisions. | A domain profile and source of controls, not the universal pipeline. |
| GRADE | `OFFICIAL-INFORMATIVE`: [GRADE Working Group](https://www.gradeworkinggroup.org/), [Cochrane chapter 14](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14) | Structured outcome-level judgments about certainty with explicit domains and reasons. | Removal of expert judgment, proof of an effect, review completeness, or an automatic recommendation. | Use only in a specialist scientific profile with trained duplicate reviewers. |
| PRISMA 2020 | `OFFICIAL-NORMATIVE` reporting guidance: [PRISMA statement](https://www.prisma-statement.org/prisma-2020) | Transparent reporting of systematic-review search, selection, synthesis, and flow. | Methodological quality or correctness merely through checklist compliance. | Reporting checklist for applicable research dossiers, not a quality badge. |
| NIST AI RMF and GAI profile | `OFFICIAL-INFORMATIVE`: [AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | Risk mapping, measurement, governance, documentation, testing, and explicit generative-AI risks such as confabulation. | Certification that a system is trustworthy. | Structure model risk, evaluation, incident, and knowledge-limit documentation. |

This register satisfies mechanism, primary owner source, maturity,
supported/non-supported property and proposed integration role. It does **not**
yet establish an exact implementation licence/access route or integration-risk
assessment for every mechanism and version. Those facts are deployment
artifacts, not safely inferable from a specification landing page. Before any
mechanism is adopted, its exact version must receive a row in the source-class
rights matrix covering licence, patents where relevant, access/retention/
redistribution, security and privacy risk, maintenance owner, conformance tests,
exit strategy and professional approval. Until then the mechanism register is
research input, not a cleared dependency catalogue.

## Editorial and collaborative workflow evidence

### Professional fact-checking supplies process controls, not certainty

Full Fact describes claim interpretation, contact with the claimant, evidence
gathering, specialist consultation, a second researcher, additional senior
review for sensitive topics, and post-publication correction requests
([Full Fact methodology](https://fullfact.org/about/frequently-asked-questions/)).
AFP describes source-original search, at least two independent sources,
archiving, method disclosure, editorial review, and refusal to use an AI
detector as sole evidence
([AFP methodology](https://factcheck.afp.com/How-we-work)). These are
`OFFICIAL-INFORMATIVE` descriptions of intended practice, not comparative
effectiveness studies.

The gap between formal correction policy and observable correction quality is
material. A 2026 peer-reviewed audit of 62 EFCSN sites and 1,555 correction
entries found that many visible entries were minor or updates, while important
metadata such as responsibility and cause were often missing; the authors
conclude that compliance can be formal rather than substantive
([Beyond compliance](https://misinforeview.hks.harvard.edu/article/beyond-compliance-how-european-fact-checkers-correct-their-own-errors/)).
This is `ORIGINAL-EMPIRICAL`; it observes public corrections, not undisclosed
errors or every internal process.

**Design implication:** correction, update, restriction, withdrawal, and
supersession need typed events with mandatory reason, responsible role,
affected dependencies, public-notice route, and delivery receipt. A policy page
alone is not evidence that correction worked.

### Community consensus can scale context, but suppresses polarizing cases

X describes Community Notes as surfacing notes that contributors from different
viewpoints rate helpful and publishes its algorithm and data
([X Help](https://help.x.com/en/using-x/community-notes)). This makes the
procedure inspectable, but cross-viewpoint agreement is a selection rule.

Empirical work supplies both benefit and failure evidence:

- A PNAS study of 40,078 noted posts estimates substantial reductions in
  engagement after notes appear, while also finding that faster attachment
  would improve total effect
  ([PNAS study](https://doi.org/10.1073/pnas.2503413122)).
- A 2026 Science Advances study using 1.9 million notes and 135 million ratings
  reports that the bridging design captures major polarization dimensions but
  systematically undermoderates polarizing content, including election cases
  ([Bouchaud et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC13322233/)).
- Target-selection research finds little overlap between Community Notes and
  professional fact-checking replies even when their assessments agree on the
  overlap
  ([ICWSM 2024](https://doi.org/10.1609/icwsm.v18i1.31387)).

These are related `ORIGINAL-EMPIRICAL` studies on X, not proof for every
community or platform.

**Design implication:** community participation can discover candidates,
objections, wording problems, or procedural legitimacy. It cannot grant truth,
prove coverage, or replace expertise. The engine must measure selection gaps
and keep consensus state separate from evidence status.

### Wikipedia separates publication verifiability from editor belief

English Wikipedia's official policy defines verifiability as correspondence to
reliable published sources, requires direct support, and says even something an
editor knows to be true needs a publishable source
([Wikipedia Verifiability](https://en.wikipedia.org/wiki/Wikipedia:Verifiability)).
It also warns against circular use of Wikipedia mirrors. This is a mature
editorial policy and an instructive source-use contract; it is not proof that
every article complies or that a cited source is true.

**Design implication:** retain direct-support checks, source appropriateness by
claim context, circular-origin detection, and dispute routes. Do not copy
Wikipedia's encyclopedic publication objective into a verification certificate.

## Practitioner and user evidence

### Workflow research

| Evidence | Sample and result | Scope limit | Requirement inferred |
| --- | --- | --- | --- |
| [Micallef et al., CSCW](https://par.nsf.gov/servlets/purl/10410750) | `ORIGINAL-EMPIRICAL` interviews with 21 fact-checkers across 19 countries described fragmented tooling and difficult filtering, origin search, audiovisual work, and dissemination; most were skeptical of opaque automation. | Small qualitative sample, role and country heterogeneity, self-report. | One case workspace, visible provenance, human-in-control assistance, and export/distribution support. |
| [Krobot et al.](https://arxiv.org/abs/2211.12143) | `PREPRINT`, nine interviews plus 24 respondents from 20 countries; source research was a central need while monitoring, deduplication, and dissemination were underrepresented in many AI pipelines. | Small, substantially European sample; not a prevalence estimate. | Optimize assistive research and deduplication before automated verdicts. |
| [Professional and community-based fact-checking review](https://misinforeview.hks.harvard.edu/article/professional-and-community-based-fact-checking-show-different-strengths-but-neither-performs-strongly-across-trust-scalability-and-impact/) | `SYSTEMATIC-SYNTHESIS` of 21 studies: professional approaches tend toward rigor/trust but are slower; community approaches scale but can be late, invisible, or imbalanced. | Literature dominated by X/Community Notes and North America. | Hybrid discovery plus qualified review; publish latency and coverage, not just accepted cases. |
| [Cochrane production study](https://onlinelibrary.wiley.com/doi/full/10.1002/cesm.70043) | `ORIGINAL-EMPIRICAL`, 8,137 protocols and 8,477 reviews from 2003–2024: median 25.7 months from protocol to review; many reviews were never updated and updated ones had long intervals. | Bibliographic lifecycle does not prove each review was stale; Cochrane-specific. | High-assurance synthesis is a specialist service tier, not interactive default behavior. |
| [Borah et al.](https://bmjopen.bmj.com/content/7/2/e012545) | `ORIGINAL-EMPIRICAL`, 195 registered medical reviews: mean 67.3 weeks from registration to publication and a small fraction of retrieved references included. | Not exclusively Cochrane; start dates and person-hours imperfectly observed. | Search/review cost is dominated by screening and judgment; record funnels and stop rules. |

The recurring practitioner preference is **autonomation** rather than
unobservable autonomy: tools should remove repetitive work while surfacing
their candidates, limitations, and decisions. The evidence is qualitative and
does not establish one universal interface.

### Consumer response to labels and explanations

| Evidence | Finding | Scope limit | Requirement inferred |
| --- | --- | --- | --- |
| [Walter et al. meta-analysis](https://cris.haifa.ac.il/en/publications/fact-checking-a-meta-analysis-of-what-works-and-for-whom/) | `SYSTEMATIC-SYNTHESIS`, 30 studies and 20,963 participants: fact-checking has a positive but modest aggregate effect, moderated by format and prior beliefs. | Primarily political misinformation and heterogeneous interventions. | The engine's success cannot be “a label was shown”; measure comprehension and decisions. |
| [Martel and Rand](https://pubmed.ncbi.nlm.nih.gov/39223352/) | `ORIGINAL-EMPIRICAL`, the checked bibliographic record/abstract reports 21 experiments and 14,133 participants: warnings reduced belief and sharing intention, including among distrusting participants, with smaller effects for them. | Full text and supplements were not lawfully available in this pass, so methods, subgroup detail, and exact quantitative claims are provisional; experimental headlines/labels also do not reproduce every real-world setting. | Warnings can help, but confidence and political subgroup performance need measurement; obtain and recheck lawful full text before relying on the subgroup claim. |
| [People adhere to warning labels even when wrong](https://pubmed.ncbi.nlm.nih.gov/40263336/) | `ORIGINAL-EMPIRICAL`, three experiments and 1,313 participants: inaccurate labels also moved judgments and could reverse discernment. | Controlled experiments; effect size and external setting vary. | A high-assurance false positive is a primary harm. Show reasons, evidence, issuer, scope, appeal, and expiry; test wrong-label susceptibility. |
| [Community notes increase trust](https://pubmed.ncbi.nlm.nih.gov/38948016/) | `ORIGINAL-EMPIRICAL`: community framing can increase perceived trust relative to expert flags in the studied setting. | Perceived trust is not accuracy; platform and political context matter. | Governance presentation changes trust and must not masquerade as epistemic strength. |

## Scientific evidence controls and limits

Cochrane and GRADE are useful precisely because they expose uncertainty and
judgment rather than claiming error-free truth:

- duplicate extraction reduces individual error, yet the Cochrane Handbook
  notes that extraction errors can escape peer and editorial review
  ([data collection](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-05));
- sensitive multi-database searches reduce selection bias but remain bounded by
  resources and inaccessible or unreported studies
  ([searching](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04),
  [reporting biases](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-13));
- statistical synthesis does not make biased or heterogeneous inputs valid
  ([meta-analysis](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-10)); and
- GRADE makes outcome-level judgment structured and reviewable but explicitly
  retains judgment
  ([Cochrane GRADE chapter](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14)).

Inter-rater studies support both benefit and residual variability. Mustafa et
al. found improved reliability after structured training and calibration
([JCE 2013](https://pubmed.ncbi.nlm.nih.gov/23623694/)); Hartling et al. found
weak-to-moderate agreement for several domains and global ratings in another
application
([PLOS One 2012](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0034697)).
These samples are limited and partly connected to GRADE developers.

**Design implication:** scientific causal claims require specialist profiles,
protocol registration, duplicate extraction, risk-of-bias assessment,
uncertainty, and living-update operations. They are explicitly excluded from
the first automated publication tier.

## AI pipeline evidence

No benchmark covers the whole desired chain with a permanent gold truth.
Stage-wise evidence shows why the engine must test each boundary separately.

| Stage | Evidence | Result used | Limitation |
| --- | --- | --- | --- |
| Short factual answer | [OpenAI SimpleQA](https://openai.com/index/introducing-simpleqa/) | The benchmark deliberately restricts itself to stable, short questions with one answer; a third trainer exposed remaining ambiguity and label issues. | Does not test search, long answers, open-world claims, or evidence sufficiency. |
| Grounding to a supplied document | [FACTS Grounding](https://deepmind.google/discover/blog/facts-grounding-a-new-benchmark-for-evaluating-the-factuality-of-large-language-models/) | Separates answer eligibility from complete grounding over long supplied documents. | Uses model judges and does not establish that the supplied document is true or complete. |
| Claim plus evidence retrieval | [FEVER](https://aclanthology.org/N18-1074/) | Its original baseline lost substantial performance when complete evidence retrieval was required rather than label-only classification. | Synthetic Wikipedia claims and frozen corpus. |
| Scientific evidence retrieval | [SciFact](https://aclanthology.org/2020.emnlp-main.609/) | Open retrieval was much harder than classification with oracle abstracts. | Abstracts only; claim supplied; no multi-study synthesis. |
| Real-world Web claims | [AVeriTeC](https://proceedings.neurips.cc/paper_files/paper/2023/hash/cd86a30526cd1aff61d6f89f107634e4-Abstract-Datasets_and_Benchmarks.html) | Real fact-check claims expose evidence-retrieval and conflicting-evidence difficulty. | Gold evidence is incomplete; alternate valid evidence and changing Web pages complicate scoring. |
| Long-form atomization | [VeriFact/FactRBench](https://aclanthology.org/2025.emnlp-main.905/) | Human correction of extracted claims changed downstream verdicts in a material share of audited cases. | Dataset references and model judges have their own incompleteness and bias. |
| End-to-end factuality | [Factcheck-Bench](https://arxiv.org/abs/2311.09000) | The reported best preliminary system struggled to identify false claims. | Preprint-era systems, generated content, and evaluation choices limit portability. |
| Model error dependence | [Correlated errors in LLMs](https://proceedings.mlr.press/v267/kim25e.html) | Model errors are correlated; majority agreement cannot be treated as independent evidence. | Leaderboard tasks and model population do not match every future workflow. |
| Distribution shift | [Ovadia et al.](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html) | Predictive uncertainty and calibration methods degrade under shift. | Image-classification experiments, not direct fact-checking deployment. |

The causal conclusion is deliberately modest: model assistance can improve
throughput on measured subtasks, while its permission to publish must remain
bounded by deterministic and human gates. Model diversity is an error-detection
strategy, not an evidence source.

## Evidence and counterevidence matrix

| Proposal | Supporting evidence | Strongest counterevidence or alternative | Current judgment | What could reverse it |
| --- | --- | --- | --- | --- |
| Build a certificate/dossier engine rather than a truth oracle. | Provenance, fact-checking, and scientific standards all scope their guarantees; C2PA explicitly separates provenance from truth. | Users may prefer a simple label and ignore a complex dossier. | Strong recommendation, provided the summary remains comprehensible. | Blinded studies show the dossier adds cost without improving error detection, comprehension, or correction over a simpler evidence record. |
| Keep AI assistive and selective. | Practitioner studies prefer transparent assistance; benchmarks show retrieval, atomization, grounding, drift, and correlated-error failures. | Fresh search, external tools, and specialized models can materially outperform unaided workflows. | Use AI widely for proposals and triage, but never as self-certifying authority. | Prospective temporal trials of a narrow pipeline meet the harm budget without human review and independent audits reproduce the result. |
| Use human review for high-risk cases. | Professional codes and Cochrane require independent or duplicate review; users can be harmed by wrong labels. | Human review is slow, variable, capturable, and itself error-prone. | Route by claim family and harm; qualify, calibrate, and audit reviewers. | Human review fails to improve material-error risk at comparable cost; then narrow or abandon the affected tier rather than silently automate it. |
| Separate consensus from evidence. | Community Notes can reduce diffusion but recent work finds polarizing content systematically underserved; Wikipedia consensus serves publication. | Bridging can increase perceived legitimacy and surface cross-viewpoint notes. | Use consensus for objection coverage and legitimacy only. | A preregistered study shows a specific consensus mechanism supplies independent, calibrated evidence beyond the underlying sources without selection harm. |
| Search explicitly for counterevidence. | IFCN/EFCSN, AFP, and systematic-review methods require adverse or contradicting material; retrieval is a major benchmark bottleneck. | Complete Web search is impossible and expensive; recorded protocol can create false comfort. | Guarantee execution of a bounded plan and expose coverage gaps. | The plan does not improve decisive-counterevidence recall over a simpler baseline at sustainable cost. |
| Start with bounded attribution, registers, and calculations. | These claim families permit exact artifacts, local closure, deterministic replay, and clearer gold sets. | They may have too little user value to sustain a standalone product. | Safest first vertical, not yet a market decision. | Discovery and willingness-to-use tests show no meaningful demand, or existing tools already solve the workflow at lower cost. |
| Make correction propagation a core capability. | Current fact-check correction practice is inconsistent; state changes and source retractions are normal. | Downstream consumers may not acknowledge notices, making propagation unverifiable. | Record delivery and acknowledgement separately; never promise universal correction. | Consumers do not integrate status updates or users cannot understand replaced results; narrow the distribution contract. |

## Material unknowns and research bias

The research does not establish:

- market demand or willingness to pay for a standalone engine;
- a representative global rate of fact-checking errors or correction quality;
- how non-English, low-resource, closed, deleted, or adversarial information
  changes coverage;
- a universal mapping from assurance dimensions to user decisions;
- stable reviewer supply, qualification verification, or acceptable wages;
- the lawful retention and redistribution policy for a specific deployment;
- a reliable automated measure of source-origin independence;
- a permanent gold set for changing open-world claims;
- that transparency increases trust appropriately rather than merely increasing
  perceived authority;
- an economically viable service level for expert synthesis; or
- benefit beyond a narrower evidence-dossier and citation-audit tool.

Several research clusters reuse the same platforms, standards authors, or
benchmarks. Findings about Community Notes are not independent of X's public
data; GRADE studies include contributors close to GRADE; vendor benchmarks may
favor the tasks and judging systems their authors selected. The evaluation plan
therefore requires fresh temporal cases, independent adjudicators, measured
disagreement, and adversarial evidence rather than treating this literature as
validation of the proposed product.
