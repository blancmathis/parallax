---
context_room:
  id: research.verification-engine.source-usage-manifest
  depends_on:
    - research.verification-engine.ai-subsystem
    - research.verification-engine.architecture
    - research.verification-engine.assurance-model
    - research.verification-engine.evidence-base
    - research.verification-engine.evaluation-vertical-slice
    - research.verification-engine.governance-workflows
    - research.verification-engine.operations-cost
    - research.verification-engine.provenance-cryptographic-trust
    - research.verification-engine.roadmap-decisions
    - research.verification-engine.scientific-claims-profile
    - research.verification-engine.source-register
    - research.verification-engine.threat-model
    - research.verification-engine.verification-protocol
---

# Verification-engine source usage manifest

## Summary

This non-canonical research manifest is the mechanical join between every external
Markdown citation used by the verification-engine dossier and the stable `SRC-*`
identifier that owns the source in the [source register](source-register.md). It
was regenerated from the dossier snapshot on 2026-08-12. The repository
baseline is commit `df6f316e989d5d420003c47b39035a084c6a1c0a`; because the dossier
itself is currently untracked research work, this manifest is valid only for
the working-tree snapshot recorded by this receipt and the final audit, not for
that baseline commit alone.

Inline prose and citations remain the human-readable truth about what a source is
being used to support. This manifest does not replace that prose or reinterpret
it: it makes the join auditable. The [evidence base](evidence-base.md) still owns
the evidence vocabulary, and the source register still owns source identity,
provenance, limits, and claim-family classification.

## Defines

A complete citation-occurrence inventory for the stated snapshot, exact and
explicit same-work join rules, document/heading pointers, cited URLs, stable
source-register IDs, and a zero-unmatched coverage result.

## Does not define

Accepted Parallax behavior, source truth, claim validity, source independence,
licence permission, legal advice, or a substitute for reading the cited claim in
context. A successful join proves only that a citation is inventoried.

## Extraction contract

- **Included:** every HTTP or HTTPS target inside a Markdown link in
  the `*.md` files in this directory.
- **Excluded:** `source-register.md`, `final-audit.md`, and this manifest, to
  avoid self-reference. `INDEX.md` was scanned and contains no external Markdown
  citation in this snapshot.
- **Primary key:** `(document, cited_url)`. Repeated occurrences of the exact
  URL in one document are grouped, while every observed heading and anchor label
  is retained.
- **`exact`:** the cited URL is byte-for-byte identical to a URL in one
  source-register row.
- **`same-work-fragment`:** only the fragment differs from the canonical
  same-document URL owned by that row.
- **`same-work-part`:** a cited URL identifies an explicit part of the same
  official work. The only such joins here are GDPR Articles 33 and 34 to
  `SRC-LAW-EU-GDPR`; neither article is counted as an independent source.
- **Failure mode:** zero or multiple candidate IDs is `unmatched`; generation
  must fail closed instead of choosing heuristically.

## Coverage receipt

| Measure | Result |
| --- | ---: |
| Markdown documents scanned | 13 |
| Documents containing external citations | 12 |
| Citation occurrences | 365 |
| Distinct cited URLs | 229 |
| Document-URL groups below | 304 |
| Stable source IDs referenced | 179 |
| Exact joins | 353 occurrences / 292 groups |
| Same-work fragment joins | 10 occurrences / 10 groups |
| Same-work part joins | 2 occurrences / 2 groups |
| Unmatched citations | **0** |
| Bound source-set SHA-256 | `7bbe3dbfabcf3e4b56a176f6e519bc4a2bee2e83cde2cd83fa62a89ca2a3481b` |

The brief-use column deliberately carries the source-register claim families and
the local citation anchor. The exact substantive claim remains the sentence,
paragraph, table row, or list item under the named heading in the owning document.

### Snapshot binding

The bound source set is the 13 scanned documents plus `source-register.md`, in
this exact order: `INDEX.md`, `ai-subsystem.md`, `architecture.md`,
`assurance-model.md`, `evaluation-and-vertical-slice.md`, `evidence-base.md`,
`governance-and-workflows.md`, `operations-and-cost.md`,
`provenance-and-cryptographic-trust.md`, `roadmap-and-decisions.md`,
`scientific-claims-profile.md`, `source-register.md`, `threat-model.md`, and
`verification-protocol.md`.

The receipt hashes each file with macOS `shasum -a 256`, preserving the listed
filename in each output line, concatenates those 14 lines with their final
newlines, and hashes that byte stream again with `shasum -a 256`. A different
file byte, filename, order, or missing final line invalidates the receipt. The
manifest and `final-audit.md` are intentionally excluded to avoid self-reference.

## `ai-subsystem.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Stage proposal envelope<br>section Primary benchmark evidence and its limits | [JSONSchemaBench](https://arxiv.org/abs/2501.10868) | `SRC-PRE-JSONSCHEMABENCH` | `exact` | `C-HUMAN-AI`, `C-EVAL`, `C-LIMIT`; anchor: "JSONSchemaBench" |
| section Stage proposal envelope | [Grammar-Aligned Decoding](https://papers.nips.cc/paper_files/paper/2024/hash/2bdc2267c3d7d01523e2e17ac0a754f3-Abstract-Conference.html) | `SRC-MET-GRAMMAR-ALIGNED-DECODING` | `exact` | `C-HUMAN-AI`, `C-EVAL`, `C-LIMIT`; anchor: "Grammar-Aligned Decoding" |
| section Replay and reproducibility limits | [Chen et al., 2023](https://arxiv.org/abs/2307.09009) | `SRC-PRE-HOSTED-LLM-DRIFT` | `exact` | `C-FRESH`, `C-EVAL`, `C-HUMAN-AI`; anchor: "Chen et al., 2023" |
| section Replay and reproducibility limits | [Towards Reproducible LLM Evaluation](https://arxiv.org/abs/2410.03492) | `SRC-PRE-LLM-EVAL-REPRO` | `exact` | `C-REPRO`, `C-EVAL`, `C-LIMIT`; anchor: "Towards Reproducible LLM Evaluation" |
| section Stage blocks map to canonical abstention | [Nature, 2026](https://www.nature.com/articles/s41586-026-10549-w) | `SRC-EMP-ABSTENTION-PENALTIES` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "Nature, 2026" |
| section Stage blocks map to canonical abstention | [FactTest](https://proceedings.mlr.press/v267/nie25a.html) | `SRC-MET-FACTTEST` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "FactTest" |
| section Stage blocks map to canonical abstention<br>section Primary benchmark evidence and its limits | [Nature, 2024](https://www.nature.com/articles/s41586-024-07421-0) | `SRC-MET-SEMANTIC-ENTROPY` | `exact` | `C-LIMIT`, `C-EVAL`, `C-HUMAN-AI`; anchors: "Nature, 2024"; "Semantic entropy" |
| section Model and agent dependence<br>section Primary benchmark evidence and its limits | [Correlated Errors in Large Language Models](https://proceedings.mlr.press/v267/kim25e.html) | `SRC-EMP-CORRELATED-LLM-ERRORS` | `exact` | `C-INDEP`, `C-HUMAN-AI`, `C-EVAL`; anchors: "Correlated Errors in Large Language Models"; "Correlated model errors" |
| section Model and agent dependence | [Self-Preference Bias in LLM-as-a-Judge](https://papers.nips.cc/paper_files/paper/2024/hash/7f1f0218e45f5414c79c0679633e47bc-Abstract-Conference.html) | `SRC-EMP-JUDGE-SELF-PREFERENCE` | `exact` | `C-INDEP`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Self-Preference Bias in LLM-as-a-Judge" |
| section Model and agent dependence | [Replacing Judges with Juries](https://arxiv.org/abs/2404.18796) | `SRC-PRE-JUDGE-JURIES` | `exact` | `C-INDEP`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Replacing Judges with Juries" |
| section Distribution shift and benchmark contamination | [Cross-lingual contamination](https://aclanthology.org/2024.emnlp-main.990/) | `SRC-EMP-CROSS-LINGUAL-CONTAMINATION` | `exact` | `C-EVAL`, `C-INDEP`, `C-SCOPE`; anchor: "Cross-lingual contamination" |
| section Distribution shift and benchmark contamination | [Time Travel in LLMs](https://proceedings.iclr.cc/paper_files/paper/2024/hash/bc39a59c49b731c51398ad6b12f301d3-Abstract-Conference.html) | `SRC-EMP-TIME-TRAVEL-CONTAMINATION` | `exact` | `C-EVAL`, `C-INDEP`; anchor: "Time Travel in LLMs" |
| section Distribution shift and benchmark contamination | [LiveBench](https://livebench.ai/) | `SRC-DOC-LIVEBENCH` | `exact` | `C-FRESH`, `C-EVAL`, `C-SCOPE`; anchor: "LiveBench" |
| section Injection and retrieval-poisoning boundary | [AgentDojo](https://arxiv.org/abs/2406.13352) | `SRC-PRE-AGENTDOJO` | `exact` | `C-SEC`, `C-HUMAN-AI`, `C-EVAL`; anchor: "AgentDojo" |
| section Injection and retrieval-poisoning boundary | [PoisonedRAG](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag) | `SRC-EMP-POISONEDRAG` | `exact` | `C-SEC`, `C-SEARCH`, `C-INDEP`; anchor: "PoisonedRAG" |
| section Primary benchmark evidence and its limits | [Claimify](https://aclanthology.org/2025.acl-long.348/) | `SRC-EMP-CLAIMIFY` | `exact` | `C-SCOPE`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Claimify" |
| section Primary benchmark evidence and its limits | [VeriFact / FactRBench](https://aclanthology.org/2025.emnlp-main.905/) | `SRC-EMP-VERIFACT` | `exact` | `C-SCOPE`, `C-EVAL`, `C-HUMAN-AI`; anchor: "VeriFact / FactRBench" |
| section Primary benchmark evidence and its limits | [FEVER](https://aclanthology.org/N18-1074/) | `SRC-EMP-FEVER` | `exact` | `C-SEARCH`, `C-EVAL`; anchor: "FEVER" |
| section Primary benchmark evidence and its limits | [SciFact](https://aclanthology.org/2020.emnlp-main.609/) | `SRC-EMP-SCIFACT` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-EVAL`; anchor: "SciFact" |
| section Primary benchmark evidence and its limits | [2024 shared task](https://aclanthology.org/2024.fever-1.1/) | `SRC-EMP-AVERITEC` | `exact` | `C-SEARCH`, `C-CORRECT`, `C-EVAL`; anchor: "2024 shared task" |
| section Primary benchmark evidence and its limits | [AVeriTeC](https://proceedings.neurips.cc/paper_files/paper/2023/hash/cd86a30526cd1aff61d6f89f107634e4-Abstract-Datasets_and_Benchmarks.html) | `SRC-EMP-AVERITEC` | `exact` | `C-SEARCH`, `C-CORRECT`, `C-EVAL`; anchor: "AVeriTeC" |
| section Primary benchmark evidence and its limits | [AVeriTeC 2.0](https://fever.ai/2025/task.html) | `SRC-EMP-AVERITEC` | `exact` | `C-SEARCH`, `C-CORRECT`, `C-EVAL`; anchor: "AVeriTeC 2.0" |
| section Primary benchmark evidence and its limits | [CRAG](https://arxiv.org/abs/2406.04744) | `SRC-PRE-CRAG` | `exact` | `C-SEARCH`, `C-EVAL`, `C-LIMIT`; anchor: "CRAG" |
| section Primary benchmark evidence and its limits | [RAGTruth](https://aclanthology.org/2024.acl-long.585/) | `SRC-EMP-RAGTRUTH` | `exact` | `C-HUMAN-AI`, `C-EVAL`, `C-LIMIT`; anchor: "RAGTruth" |
| section Primary benchmark evidence and its limits | [ALCE](https://aclanthology.org/2023.emnlp-main.398/) | `SRC-EMP-ALCE` | `exact` | `C-PROV`, `C-SCOPE`, `C-EVAL`; anchor: "ALCE" |
| section Primary benchmark evidence and its limits | [DeepFactBench](https://aclanthology.org/2026.acl-long.1586/) | `SRC-EMP-DEEPFACTBENCH` | `exact` | `C-HUMAN-AI`, `C-EVAL`, `C-OPS`; anchor: "DeepFactBench" |
| section Primary benchmark evidence and its limits | [official paper](https://cdn.openai.com/papers/simpleqa.pdf) | `SRC-DOC-SIMPLEQA` | `exact` | `C-SCOPE`, `C-EVAL`, `C-LIMIT`; anchor: "official paper" |

## `architecture.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section A. Relational core only | [PostgreSQL 18 release notes](https://www.postgresql.org/docs/18/release-18.html) | `SRC-DOC-POSTGRES-18` | `exact` | `C-ARCH`, `C-SEC`, `C-FRESH`; anchor: "PostgreSQL 18 release notes" |
| section A. Relational core only | [PostgreSQL full-text search](https://www.postgresql.org/docs/18/textsearch.html) | `SRC-DOC-POSTGRES-18` | `exact` | `C-ARCH`, `C-SEC`, `C-FRESH`; anchor: "PostgreSQL full-text search" |
| section B. Native property-graph core | [Neo4j transaction behavior](https://neo4j.com/docs/operations-manual/current/database-internals/) | `SRC-DOC-NEO4J-TRANSACTIONS` | `exact` | `C-ARCH`; anchor: "Neo4j transaction behavior" |
| section Transactional invariants | [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | `SRC-DOC-POSTGRES-18` | `exact` | `C-ARCH`, `C-SEC`, `C-FRESH`; anchor: "PostgreSQL row security" |
| section Search and graph projections | [JSON-LD 1.1](https://www.w3.org/TR/json-ld/) | `SRC-STD-JSON-LD` | `exact` | `C-ARCH`; anchor: "JSON-LD 1.1" |
| section Minimum signature profile and later strengthening | [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html) | `SRC-STD-JCS-RFC8785` | `exact` | `C-CRYPTO`, `C-REPRO`, `C-ARCH`; anchor: "RFC 8785" |
| section Minimum signature profile and later strengthening | [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052.html) | `SRC-STD-COSE-RFC9052` | `exact` | `C-CRYPTO`, `C-ARCH`; anchor: "RFC 9052" |
| section Minimum signature profile and later strengthening | [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161.html) | `SRC-STD-TSP-RFC3161` | `same-work-fragment` | `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 3161" |
| section Minimum signature profile and later strengthening | [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) | `SRC-STD-SCITT-RFC9943` | `exact` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943" |
| section Operations and recovery baseline | [PITR](https://www.postgresql.org/docs/18/continuous-archiving.html) | `SRC-DOC-POSTGRES-18` | `exact` | `C-ARCH`, `C-SEC`, `C-FRESH`; anchor: "PITR" |

## `assurance-model.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section The object being certified | [C2PA goals and non-goals](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html#_goals_and_non_goals) | `SRC-DOC-C2PA-EXPLAINER` | `same-work-fragment` | `C-LIMIT`, `C-PROV`, `C-INDEP`; anchor: "C2PA goals and non-goals" |
| section The object being certified | [PROV-O Recommendation](https://www.w3.org/TR/prov-o/) | `SRC-STD-PROV-O` | `exact` | `C-PROV`, `C-ARCH`; anchor: "PROV-O Recommendation" |
| section What can be guaranteed at 100 percent | [seL4 assumptions](https://sel4.systems/Verification/assumptions.html) | `SRC-DOC-SEL4-ASSUMPTIONS` | `exact` | `C-LIMIT`, `C-REPRO`; anchor: "seL4 assumptions" |
| section What can be guaranteed at 100 percent | [SCITT architecture](https://www.rfc-editor.org/rfc/rfc9943.html) | `SRC-STD-SCITT-RFC9943` | `exact` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "SCITT architecture" |
| section Open world by default | [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/) | `SRC-DOC-OWL-OPEN-WORLD` | `exact` | `C-OPEN`, `C-LIMIT`; anchor: "OWL 2 Primer" |
| section Open world by default | [SHACL Recommendation](https://www.w3.org/TR/shacl/) | `SRC-STD-SHACL` | `exact` | `C-LIMIT`, `C-OPEN`, `C-ARCH`; anchor: "SHACL Recommendation" |
| section Claim compiler | [VeriFact paper](https://aclanthology.org/2025.emnlp-main.905/) | `SRC-EMP-VERIFACT` | `exact` | `C-SCOPE`, `C-EVAL`, `C-HUMAN-AI`; anchor: "VeriFact paper" |
| section Claim families and assurance ceilings | [JCGM Guide to the Expression of Uncertainty in Measurement](https://www.bipm.org/en/committees/jc/jcgm/publications) | `SRC-MET-JCGM-GUM` | `exact` | `C-SCIENCE`, `C-LIMIT`; anchor: "JCGM Guide to the Expression of Uncertainty in Measurement" |
| section Evidence and inference objects | [PROV-O starting-point terms](https://www.w3.org/TR/prov-o/#description-starting-point-terms) | `SRC-STD-PROV-O` | `same-work-fragment` | `C-PROV`, `C-ARCH`; anchor: "PROV-O starting-point terms" |
| section Source independence | [Jeong and Rothenhäusler, 2025](https://jmlr.org/papers/v26/23-0714.html) | `SRC-EMP-INDEPENDENT-BIASES` | `exact` | `C-INDEP`, `C-LIMIT`; anchor: "Jeong and Rothenhäusler, 2025" |
| section Counterevidence protocol | [Cochrane Handbook, searching](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane Handbook, searching" |
| section Counterevidence protocol | [reporting biases](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-13) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "reporting biases" |
| section Quantitative confidence | [El-Yaniv and Wiener, 2010](https://www.jmlr.org/papers/volume11/el-yaniv10a/el-yaniv10a.pdf) | `SRC-STUDY-SELECTIVE-PREDICTION` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "El-Yaniv and Wiener, 2010" |
| section Quantitative confidence | [Ovadia et al., 2019](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html) | `SRC-EMP-OVADIA-SHIFT` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "Ovadia et al., 2019" |
| section Human, AI, and expert authority | [Cochrane data collection](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-05) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane data collection" |
| section Human, AI, and expert authority | [risk-of-bias assessment](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "risk-of-bias assessment" |
| section Verification certificate | [Google ClaimReview documentation](https://developers.google.com/search/docs/appearance/structured-data/factcheck) | `SRC-DOC-GOOGLE-CLAIMREVIEW` | `exact` | `C-ARCH`, `C-CORRECT`; anchor: "Google ClaimReview documentation" |

## `evaluation-and-vertical-slice.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Preregistration record | [OSF registration model](https://help.osf.io/article/330-welcome-to-registrations) | `SRC-DOC-OSF-REGISTRATION` | `exact` | `C-PROV`, `C-REPRO`, `C-CORRECT`; anchor: "OSF registration model" |
| section Track B — versioned registry lookup under local closure | [GLEIF data portal](https://www.gleif.org/en/lei-data) | `SRC-DOC-GLEIF-DATA` | `exact` | `C-ARCH`, `C-EVAL`, `C-OPEN`; anchor: "GLEIF data portal" |
| section Track C — deterministic calculation over frozen inputs | [SEC EDGAR data APIs](https://www.sec.gov/edgar/sec-api-documentation) | `SRC-DOC-SEC-EDGAR-API` | `exact` | `C-ARCH`, `C-REPRO`, `C-EVAL`; anchor: "SEC EDGAR data APIs" |
| section Track C — deterministic calculation over frozen inputs | [Eurostat data services](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction) | `SRC-DOC-EUROSTAT-API` | `exact` | `C-ARCH`, `C-REPRO`, `C-EVAL`; anchor: "Eurostat data services" |
| section Track D — open-world negative requiring abstention<br>section Source register and limits | [Cochrane Handbook, chapter 4](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchors: "Cochrane Handbook, chapter 4"; "Cochrane search guidance" |
| section Development benchmarks<br>section Source register and limits | [FEVER](https://aclanthology.org/N18-1074/) | `SRC-EMP-FEVER` | `exact` | `C-SEARCH`, `C-EVAL`; anchor: "FEVER" |
| section Development benchmarks<br>section Source register and limits | [SciFact](https://aclanthology.org/2020.emnlp-main.609/) | `SRC-EMP-SCIFACT` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-EVAL`; anchor: "SciFact" |
| section Development benchmarks<br>section Source register and limits | [AVeriTeC](https://proceedings.neurips.cc/paper_files/paper/2023/hash/cd86a30526cd1aff61d6f89f107634e4-Abstract-Datasets_and_Benchmarks.html) | `SRC-EMP-AVERITEC` | `exact` | `C-SEARCH`, `C-CORRECT`, `C-EVAL`; anchor: "AVeriTeC" |
| section Development benchmarks | [ContractNLI](https://aclanthology.org/2021.findings-emnlp.164/) | `SRC-EMP-CONTRACTNLI` | `exact` | `C-SCOPE`, `C-HUMAN-AI`, `C-EVAL`; anchor: "ContractNLI" |
| section Adversarial and failure-injection suite | [Greshake et al.](https://arxiv.org/abs/2302.12173) | `SRC-PRE-INDIRECT-PROMPT-INJECTION` | `exact` | `C-SEC`, `C-HUMAN-AI`; anchor: "Greshake et al." |
| section Adversarial and failure-injection suite | [PoisonedRAG](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag) | `SRC-EMP-POISONEDRAG` | `exact` | `C-SEC`, `C-SEARCH`, `C-INDEP`; anchor: "PoisonedRAG" |
| section Adversarial and failure-injection suite | [NIST adversarial machine-learning taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final) | `SRC-DOC-NIST-AI-100-2` | `exact` | `C-SEC`, `C-HUMAN-AI`, `C-EVAL`; anchor: "NIST adversarial machine-learning taxonomy" |
| section End-to-end selective risk and mandatory denominators<br>section Source register and limits | [El-Yaniv and Wiener](https://www.jmlr.org/papers/volume11/el-yaniv10a/el-yaniv10a.pdf) | `SRC-STUDY-SELECTIVE-PREDICTION` | `exact` | `C-LIMIT`, `C-EVAL`; anchors: "El-Yaniv and Wiener"; "Selective prediction" |
| section Calibration and uncertainty<br>section Source register and limits | [Ovadia et al.](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html) | `SRC-EMP-OVADIA-SHIFT` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "Ovadia et al." |
| section Calibration and uncertainty<br>section Source register and limits | [WILDS](https://proceedings.mlr.press/v139/koh21a.html) | `SRC-EMP-WILDS` | `exact` | `C-SCOPE`, `C-EVAL`, `C-LIMIT`; anchor: "WILDS" |
| section User comprehension and decision harm<br>section Source register and limits | [Horne et al.](https://pubmed.ncbi.nlm.nih.gov/40263336/) | `SRC-EMP-WRONG-WARNING-LABELS` | `exact` | `C-LABEL`, `C-EVAL`, `C-SEC`; anchors: "Horne et al."; "Wrong-label reliance experiment" |
| section Scientific claims: separate shadow protocol<br>section Source register and limits | [National Academies](https://www.nationalacademies.org/read/25303/chapter/3) | `SRC-SYN-NAS-REPRO` | `exact` | `C-REPRO`, `C-LIMIT`, `C-SCIENCE`; anchors: "National Academies"; "National Academies on reproducibility and replicability" |
| section Replication and audit package<br>section Source register and limits | [BagIt](https://www.rfc-editor.org/rfc/rfc8493) | `SRC-STD-BAGIT` | `exact` | `C-PROV`, `C-REPRO`, `C-EVAL`; anchor: "BagIt" |
| section Replication and audit package<br>section Source register and limits | [RO-Crate](https://www.researchobject.org/ro-crate/) | `SRC-DOC-RO-CRATE` | `exact` | `C-PROV`, `C-REPRO`, `C-EVAL`; anchor: "RO-Crate" |
| section Replication and audit package<br>section Source register and limits | [W3C PROV-O](https://www.w3.org/TR/prov-o/) | `SRC-STD-PROV-O` | `exact` | `C-PROV`, `C-ARCH`; anchor: "W3C PROV-O" |
| section Replication and audit package<br>section Source register and limits | [ACM artifact-review and badging policy](https://www.acm.org/publications/policies/artifact-review-and-badging-current) | `SRC-GOV-ACM-ARTIFACT-REVIEW` | `exact` | `C-REPRO`, `C-EVAL`, `C-HUMAN-AI`; anchors: "ACM artifact-review and badging policy"; "ACM artifact review" |
| section Source register and limits | [Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | `SRC-DOC-NIST-GAI-600-1` | `exact` | `C-HUMAN-AI`, `C-SEC`, `C-LABEL`; anchor: "Generative AI Profile" |
| section Source register and limits | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) | `SRC-DOC-NIST-AI-RMF` | `exact` | `C-HUMAN-AI`, `C-SEC`, `C-EVAL`; anchor: "NIST AI Risk Management Framework" |
| section Track D — open-world negative requiring abstention<br>section Source register and limits | [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/) | `SRC-DOC-OWL-OPEN-WORLD` | `exact` | `C-OPEN`, `C-LIMIT`; anchors: "OWL 2 open-world model"; "OWL 2 Primer" |
| section Source register and limits | [Conformal Risk Control](https://openreview.net/forum?id=33XGfHLtZg) | `SRC-MET-CONFORMAL-RISK-CONTROL` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "Conformal Risk Control" |
| section Source register and limits | [PRISMA-S](https://systematicreviewsjournal.biomedcentral.com/articles/10.1186/s13643-020-01542-z) | `SRC-MET-PRISMA-S` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-REPRO`; anchor: "PRISMA-S" |

## `evidence-base.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Standards and mechanisms register | [PROV-O](https://www.w3.org/TR/prov-o/) | `SRC-STD-PROV-O` | `exact` | `C-PROV`, `C-ARCH`; anchor: "PROV-O" |
| section Standards and mechanisms register | [JSON-LD](https://www.w3.org/TR/json-ld/) | `SRC-STD-JSON-LD` | `exact` | `C-ARCH`; anchor: "JSON-LD" |
| section Standards and mechanisms register | [SHACL](https://www.w3.org/TR/shacl/) | `SRC-STD-SHACL` | `exact` | `C-LIMIT`, `C-OPEN`, `C-ARCH`; anchor: "SHACL" |
| section Standards and mechanisms register | [explainer](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) | `SRC-DOC-C2PA-EXPLAINER` | `exact` | `C-LIMIT`, `C-PROV`, `C-INDEP`; anchor: "explainer" |
| section Standards and mechanisms register | [specification index](https://spec.c2pa.org/specifications/specifications/2.4/index.html) | `SRC-STD-C2PA-24` | `exact` | `C-PROV`, `C-ARCH`; anchor: "specification index" |
| section Standards and mechanisms register | [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) | `SRC-STD-SCITT-RFC9943` | `exact` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943" |
| section Standards and mechanisms register | [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html) | `SRC-STD-CT-RFC9162` | `exact` | `C-CRYPTO`, `C-SEC`; anchor: "RFC 9162" |
| section Standards and mechanisms register | [Google guidance](https://developers.google.com/search/docs/appearance/structured-data/factcheck) | `SRC-DOC-GOOGLE-CLAIMREVIEW` | `exact` | `C-ARCH`, `C-CORRECT`; anchor: "Google guidance" |
| section Standards and mechanisms register | [ClaimReview](https://schema.org/ClaimReview) | `SRC-DOC-SCHEMA-REVIEWS` | `exact` | `C-ARCH`, `C-LABEL`; anchor: "ClaimReview" |
| section Standards and mechanisms register | [MediaReview](https://schema.org/MediaReview) | `SRC-DOC-SCHEMA-REVIEWS` | `exact` | `C-ARCH`, `C-LABEL`; anchor: "MediaReview" |
| section Standards and mechanisms register | [commitments](https://ifcncodeofprinciples.poynter.org/the-commitments) | `SRC-GOV-IFCN-CODE` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`, `C-INDEP`; anchor: "commitments" |
| section Standards and mechanisms register | [Code of Standards](https://efcsn.com/code-of-standards/) | `SRC-GOV-EFCSN-CODE` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`, `C-PRIVACY`; anchor: "Code of Standards" |
| section Standards and mechanisms register | [Handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Handbook" |
| section Standards and mechanisms register<br>section Scientific evidence controls and limits | [Cochrane chapter 14](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchors: "Cochrane chapter 14"; "Cochrane GRADE chapter" |
| section Standards and mechanisms register | [GRADE Working Group](https://www.gradeworkinggroup.org/) | `SRC-MET-GRADE` | `exact` | `C-SCIENCE`, `C-LIMIT`, `C-HUMAN-AI`; anchor: "GRADE Working Group" |
| section Standards and mechanisms register | [PRISMA statement](https://www.prisma-statement.org/prisma-2020) | `SRC-MET-PRISMA-2020` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-EVAL`; anchor: "PRISMA statement" |
| section Standards and mechanisms register | [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | `SRC-DOC-NIST-GAI-600-1` | `exact` | `C-HUMAN-AI`, `C-SEC`, `C-LABEL`; anchor: "NIST AI 600-1" |
| section Standards and mechanisms register | [AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | `SRC-DOC-NIST-AI-RMF` | `exact` | `C-HUMAN-AI`, `C-SEC`, `C-EVAL`; anchor: "AI RMF" |
| section Professional fact-checking supplies process controls, not certainty | [Full Fact methodology](https://fullfact.org/about/frequently-asked-questions/) | `SRC-DOC-FULLFACT-METHOD` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`; anchor: "Full Fact methodology" |
| section Professional fact-checking supplies process controls, not certainty | [AFP methodology](https://factcheck.afp.com/How-we-work) | `SRC-DOC-AFP-METHOD` | `exact` | `C-SEARCH`, `C-INDEP`, `C-HUMAN-AI`, `C-CORRECT`; anchor: "AFP methodology" |
| section Professional fact-checking supplies process controls, not certainty | [Beyond compliance](https://misinforeview.hks.harvard.edu/article/beyond-compliance-how-european-fact-checkers-correct-their-own-errors/) | `SRC-EMP-EFCSN-CORRECTIONS-AUDIT` | `exact` | `C-CORRECT`, `C-EVAL`; anchor: "Beyond compliance" |
| section Community consensus can scale context, but suppresses polarizing cases | [X Help](https://help.x.com/en/using-x/community-notes) | `SRC-DOC-X-COMMUNITY-NOTES` | `exact` | `C-COMMUNITY`, `C-CORRECT`; anchor: "X Help" |
| section Community consensus can scale context, but suppresses polarizing cases | [PNAS study](https://doi.org/10.1073/pnas.2503413122) | `SRC-EMP-CN-DIFFUSION` | `exact` | `C-COMMUNITY`, `C-CORRECT`, `C-EVAL`; anchor: "PNAS study" |
| section Community consensus can scale context, but suppresses polarizing cases | [Bouchaud et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC13322233/) | `SRC-EMP-CN-POLARIZATION` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "Bouchaud et al." |
| section Community consensus can scale context, but suppresses polarizing cases | [ICWSM 2024](https://doi.org/10.1609/icwsm.v18i1.31387) | `SRC-EMP-CN-TARGET-SELECTION` | `exact` | `C-COMMUNITY`, `C-SEARCH`, `C-EVAL`; anchor: "ICWSM 2024" |
| section Wikipedia separates publication verifiability from editor belief | [Wikipedia Verifiability](https://en.wikipedia.org/wiki/Wikipedia:Verifiability) | `SRC-DOC-WIKIPEDIA-VERIFY` | `exact` | `C-PROV`, `C-SEARCH`, `C-INDEP`; anchor: "Wikipedia Verifiability" |
| section Workflow research | [Micallef et al., CSCW](https://par.nsf.gov/servlets/purl/10410750) | `SRC-EMP-MICALLEF-FACTCHECKERS` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-INDEP`, `C-CORRECT`, `C-OPS`; anchor: "Micallef et al., CSCW" |
| section Workflow research | [Krobot et al.](https://arxiv.org/abs/2211.12143) | `SRC-PRE-KROBOT-FACTCHECKERS` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`; anchor: "Krobot et al." |
| section Workflow research | [Professional and community-based fact-checking review](https://misinforeview.hks.harvard.edu/article/professional-and-community-based-fact-checking-show-different-strengths-but-neither-performs-strongly-across-trust-scalability-and-impact/) | `SRC-SYN-FACTCHECK-MODES` | `exact` | `C-HUMAN-AI`, `C-COMMUNITY`, `C-LABEL`, `C-EVAL`; anchor: "Professional and community-based fact-checking review" |
| section Workflow research | [Cochrane production study](https://onlinelibrary.wiley.com/doi/full/10.1002/cesm.70043) | `SRC-EMP-REVIEW-PRODUCTION` | `exact` | `C-SCIENCE`, `C-FRESH`, `C-HUMAN-AI`; anchor: "Cochrane production study" |
| section Workflow research | [Borah et al.](https://bmjopen.bmj.com/content/7/2/e012545) | `SRC-EMP-BORAH-REVIEW-TIME` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`, `C-SEARCH`; anchor: "Borah et al." |
| section Consumer response to labels and explanations | [Walter et al. meta-analysis](https://cris.haifa.ac.il/en/publications/fact-checking-a-meta-analysis-of-what-works-and-for-whom/) | `SRC-SYN-WALTER-FACTCHECKING` | `exact` | `C-LABEL`, `C-EVAL`; anchor: "Walter et al. meta-analysis" |
| section Consumer response to labels and explanations | [Martel and Rand](https://pubmed.ncbi.nlm.nih.gov/39223352/) | `SRC-EMP-MARTEL-RAND-WARNINGS` | `exact` | `C-LABEL`, `C-EVAL`; anchor: "Martel and Rand" |
| section Consumer response to labels and explanations | [People adhere to warning labels even when wrong](https://pubmed.ncbi.nlm.nih.gov/40263336/) | `SRC-EMP-WRONG-WARNING-LABELS` | `exact` | `C-LABEL`, `C-EVAL`, `C-SEC`; anchor: "People adhere to warning labels even when wrong" |
| section Consumer response to labels and explanations | [Community notes increase trust](https://pubmed.ncbi.nlm.nih.gov/38948016/) | `SRC-EMP-CN-TRUST` | `exact` | `C-COMMUNITY`, `C-LABEL`; anchor: "Community notes increase trust" |
| section Scientific evidence controls and limits | [data collection](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-05) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "data collection" |
| section Scientific evidence controls and limits | [searching](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "searching" |
| section Scientific evidence controls and limits | [reporting biases](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-13) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "reporting biases" |
| section Scientific evidence controls and limits | [meta-analysis](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-10) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "meta-analysis" |
| section Scientific evidence controls and limits | [JCE 2013](https://pubmed.ncbi.nlm.nih.gov/23623694/) | `SRC-EMP-GRADE-TRAINING-RELIABILITY` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`; anchor: "JCE 2013" |
| section Scientific evidence controls and limits | [PLOS One 2012](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0034697) | `SRC-EMP-GRADE-INTERRATER` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`; anchor: "PLOS One 2012" |
| section AI pipeline evidence | [OpenAI SimpleQA](https://openai.com/index/introducing-simpleqa/) | `SRC-DOC-SIMPLEQA` | `exact` | `C-SCOPE`, `C-EVAL`, `C-LIMIT`; anchor: "OpenAI SimpleQA" |
| section AI pipeline evidence | [FACTS Grounding](https://deepmind.google/discover/blog/facts-grounding-a-new-benchmark-for-evaluating-the-factuality-of-large-language-models/) | `SRC-DOC-FACTS-GROUNDING` | `exact` | `C-PROV`, `C-EVAL`, `C-LIMIT`; anchor: "FACTS Grounding" |
| section AI pipeline evidence | [FEVER](https://aclanthology.org/N18-1074/) | `SRC-EMP-FEVER` | `exact` | `C-SEARCH`, `C-EVAL`; anchor: "FEVER" |
| section AI pipeline evidence | [SciFact](https://aclanthology.org/2020.emnlp-main.609/) | `SRC-EMP-SCIFACT` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-EVAL`; anchor: "SciFact" |
| section AI pipeline evidence | [AVeriTeC](https://proceedings.neurips.cc/paper_files/paper/2023/hash/cd86a30526cd1aff61d6f89f107634e4-Abstract-Datasets_and_Benchmarks.html) | `SRC-EMP-AVERITEC` | `exact` | `C-SEARCH`, `C-CORRECT`, `C-EVAL`; anchor: "AVeriTeC" |
| section AI pipeline evidence | [VeriFact/FactRBench](https://aclanthology.org/2025.emnlp-main.905/) | `SRC-EMP-VERIFACT` | `exact` | `C-SCOPE`, `C-EVAL`, `C-HUMAN-AI`; anchor: "VeriFact/FactRBench" |
| section AI pipeline evidence | [Factcheck-Bench](https://arxiv.org/abs/2311.09000) | `SRC-PRE-FACTCHECK-BENCH` | `exact` | `C-EVAL`, `C-HUMAN-AI`; anchor: "Factcheck-Bench" |
| section AI pipeline evidence | [Correlated errors in LLMs](https://proceedings.mlr.press/v267/kim25e.html) | `SRC-EMP-CORRELATED-LLM-ERRORS` | `exact` | `C-INDEP`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Correlated errors in LLMs" |
| section AI pipeline evidence | [Ovadia et al.](https://proceedings.neurips.cc/paper_files/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html) | `SRC-EMP-OVADIA-SHIFT` | `exact` | `C-LIMIT`, `C-EVAL`; anchor: "Ovadia et al." |

## `governance-and-workflows.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Official mechanisms, policies, and professional methods | [Ranking notes](https://communitynotes.x.com/guide/en/under-the-hood/ranking-notes) | `SRC-DOC-X-CN-RANKING` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "Ranking notes" |
| section Official mechanisms, policies, and professional methods | [twitter/communitynotes](https://github.com/twitter/communitynotes) | `SRC-CODE-X-COMMUNITY-NOTES` | `exact` | `C-COMMUNITY`, `C-REPRO`, `C-SEC`; anchor: "twitter/communitynotes" |
| section Official mechanisms, policies, and professional methods | [Additional review](https://communitynotes.x.com/guide/en/contributing/additional-review) | `SRC-DOC-X-CN-ADDITIONAL-REVIEW` | `exact` | `C-COMMUNITY`, `C-CORRECT`; anchor: "Additional review" |
| section Official mechanisms, policies, and professional methods | [Challenges](https://communitynotes.x.com/guide/en/about/challenges) | `SRC-DOC-X-CN-CHALLENGES` | `exact` | `C-COMMUNITY`, `C-SEC`, `C-LIMIT`; anchor: "Challenges" |
| section Official mechanisms, policies, and professional methods | [Verifiability](https://en.wikipedia.org/wiki/Wikipedia:Verifiability) | `SRC-DOC-WIKIPEDIA-VERIFY` | `exact` | `C-PROV`, `C-SEARCH`, `C-INDEP`; anchor: "Verifiability" |
| section Official mechanisms, policies, and professional methods | [Consensus](https://en.wikipedia.org/wiki/Wikipedia:Consensus) | `SRC-DOC-WIKIPEDIA-CONSENSUS` | `exact` | `C-COMMUNITY`, `C-LIMIT`; anchor: "Consensus" |
| section Official mechanisms, policies, and professional methods | [Neutral point of view](https://en.wikipedia.org/wiki/Wikipedia:Neutral_point_of_view) | `SRC-DOC-WIKIPEDIA-NPOV` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-LIMIT`; anchor: "Neutral point of view" |
| section Official mechanisms, policies, and professional methods | [Dispute resolution](https://en.wikipedia.org/wiki/Wikipedia:Dispute_resolution) | `SRC-DOC-WIKIPEDIA-DISPUTES` | `exact` | `C-COMMUNITY`, `C-CORRECT`; anchor: "Dispute resolution" |
| section Official mechanisms, policies, and professional methods | [Sockpuppetry](https://en.wikipedia.org/wiki/Wikipedia:Sockpuppetry) | `SRC-DOC-WIKIPEDIA-SOCKPUPPETRY` | `exact` | `C-COMMUNITY`, `C-SEC`; anchor: "Sockpuppetry" |
| section Official mechanisms, policies, and professional methods | [Canvassing](https://en.wikipedia.org/wiki/Wikipedia:Canvassing) | `SRC-DOC-WIKIPEDIA-CANVASSING` | `exact` | `C-COMMUNITY`, `C-SEC`; anchor: "Canvassing" |
| section Official mechanisms, policies, and professional methods | [Statements](https://www.wikidata.org/wiki/Help:Statements/en) | `SRC-DOC-WIKIDATA-STATEMENTS` | `exact` | `C-PROV`, `C-ARCH`, `C-CORRECT`; anchor: "Statements" |
| section Official mechanisms, policies, and professional methods | [Ranking](https://www.wikidata.org/wiki/Help:Ranking) | `SRC-DOC-WIKIDATA-RANKING` | `exact` | `C-LIMIT`, `C-CORRECT`; anchor: "Ranking" |
| section Official mechanisms, policies, and professional methods | [Chapter 4](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Chapter 4" |
| section Official mechanisms, policies, and professional methods | [Chapter 5](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-05) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Chapter 5" |
| section Official mechanisms, policies, and professional methods | [Chapter 8](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Chapter 8" |
| section Official mechanisms, policies, and professional methods | [Code commitments](https://ifcncodeofprinciples.poynter.org/the-commitments) | `SRC-GOV-IFCN-CODE` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`, `C-INDEP`; anchor: "Code commitments" |
| section Official mechanisms, policies, and professional methods | [external assessment/application](https://ifcncodeofprinciples.poynter.org/application-process) | `SRC-GOV-IFCN-CODE` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`, `C-INDEP`; anchor: "external assessment/application" |
| section Official mechanisms, policies, and professional methods | [Code of Standards](https://efcsn.com/code-of-standards/) | `SRC-GOV-EFCSN-CODE` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-CORRECT`, `C-PRIVACY`; anchor: "Code of Standards" |
| section Official mechanisms, policies, and professional methods | [SLSA threats](https://slsa.dev/spec/v1.0/threats) | `SRC-DOC-SLSA-THREATS` | `exact` | `C-SEC`, `C-ARCH`; anchor: "SLSA threats" |
| section Official mechanisms, policies, and professional methods | [RFC 9116, security.txt](https://www.rfc-editor.org/rfc/rfc9116.html) | `SRC-STD-SECURITYTXT-RFC9116` | `exact` | `C-SEC`, `C-CORRECT`; anchor: "RFC 9116, security.txt" |
| section Original research, audits, and contradictory evidence | [JAMA 2024](https://doi.org/10.1001/jama.2024.4800) | `SRC-EMP-CN-JAMA-VACCINE` | `exact` | `C-COMMUNITY`, `C-EVAL`; anchor: "JAMA 2024" |
| section Original research, audits, and contradictory evidence | [PNAS 2025](https://doi.org/10.1073/pnas.2503413122) | `SRC-EMP-CN-DIFFUSION` | `exact` | `C-COMMUNITY`, `C-CORRECT`, `C-EVAL`; anchor: "PNAS 2025" |
| section Original research, audits, and contradictory evidence | [Nature Communications 2026](https://www.nature.com/articles/s41467-026-72597-0) | `SRC-EMP-CN-DIFFUSION-TIMING` | `exact` | `C-COMMUNITY`, `C-CORRECT`, `C-EVAL`; anchor: "Nature Communications 2026" |
| section Original research, audits, and contradictory evidence | [Science Advances 2026](https://doi.org/10.1126/sciadv.aee6932) | `SRC-EMP-CN-POLARIZATION` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "Science Advances 2026" |
| section Original research, audits, and contradictory evidence | [data and code](https://doi.org/10.17605/OSF.IO/2KP36) | `SRC-EMP-CN-POLARIZATION` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "data and code" |
| section Original research, audits, and contradictory evidence | [ICWSM 2024](https://doi.org/10.1609/icwsm.v18i1.31387) | `SRC-EMP-CN-TARGET-SELECTION` | `exact` | `C-COMMUNITY`, `C-SEARCH`, `C-EVAL`; anchor: "ICWSM 2024" |
| section Original research, audits, and contradictory evidence | [ACL 2025](https://aclanthology.org/2025.acl-short.42/) | `SRC-EMP-CN-USES-PRO-FACTCHECKS` | `exact` | `C-COMMUNITY`, `C-SEARCH`, `C-INDEP`; anchor: "ACL 2025" |
| section Original research, audits, and contradictory evidence | [Lorenz et al., PNAS](https://doi.org/10.1073/pnas.1008636108) | `SRC-EMP-SOCIAL-INFLUENCE-DIVERSITY` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "Lorenz et al., PNAS" |
| section Original research, audits, and contradictory evidence | [Science Advances](https://doi.org/10.1126/sciadv.abf4393) | `SRC-EMP-BALANCED-CROWDS` | `exact` | `C-COMMUNITY`, `C-EVAL`; anchor: "Science Advances" |
| section Original research, audits, and contradictory evidence | [Nature Human Behaviour 2019](https://www.nature.com/articles/s41562-019-0541-6) | `SRC-EMP-WIKIPEDIA-DIVERSITY` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "Nature Human Behaviour 2019" |
| section Original research, audits, and contradictory evidence | [ACM 2024](https://doi.org/10.1145/3637338) | `SRC-AUDIT-CROATIAN-WIKIPEDIA-CAPTURE` | `exact` | `C-COMMUNITY`, `C-SEC`, `C-EVAL`; anchor: "ACM 2024" |
| section Original research, audits, and contradictory evidence | [Wikimedia-l announcement](https://lists.wikimedia.org/hyperkitty/list/wikimedia-l%40lists.wikimedia.org/thread/6ANVSSZWOGH27OXAIN2XMJ2X7NWRVURF/) | `SRC-AUDIT-WIKIMEDIA-CHINESE-COMMUNITY` | `exact` | `C-COMMUNITY`, `C-SEC`, `C-CORRECT`; anchor: "Wikimedia-l announcement" |
| section Original research, audits, and contradictory evidence | [ACM 2022](https://doi.org/10.1145/3555225) | `SRC-EMP-FLAGGEDREVS` | `exact` | `C-COMMUNITY`, `C-EVAL`, `C-OPS`; anchor: "ACM 2022" |
| section Original research, audits, and contradictory evidence | [Management Science 2023](https://doi.org/10.1287/mnsc.2023.4852) | `SRC-EMP-EXPERTISE-MATCHING` | `exact` | `C-HUMAN-AI`, `C-EVAL`, `C-OPS`; anchor: "Management Science 2023" |
| section Original research, audits, and contradictory evidence | [Heindorf et al. 2019](https://doi.org/10.1145/3308558.3313507) | `SRC-EMP-WIKIDATA-FALSE-POSITIVES` | `exact` | `C-COMMUNITY`, `C-SEC`, `C-EVAL`; anchor: "Heindorf et al. 2019" |
| section Original research, audits, and contradictory evidence | [Experimental evidence](https://pubmed.ncbi.nlm.nih.gov/40263336/) | `SRC-EMP-WRONG-WARNING-LABELS` | `exact` | `C-LABEL`, `C-EVAL`, `C-SEC`; anchor: "Experimental evidence" |
| section Original research, audits, and contradictory evidence | [Experimental evidence](https://pubmed.ncbi.nlm.nih.gov/38948016/) | `SRC-EMP-CN-TRUST` | `exact` | `C-COMMUNITY`, `C-LABEL`; anchor: "Experimental evidence" |
| section Original research, audits, and contradictory evidence | [Beyond compliance](https://misinforeview.hks.harvard.edu/article/beyond-compliance-how-european-fact-checkers-correct-their-own-errors/) | `SRC-EMP-EFCSN-CORRECTIONS-AUDIT` | `exact` | `C-CORRECT`, `C-EVAL`; anchor: "Beyond compliance" |
| section Original research, audits, and contradictory evidence | [Harvard Kennedy School Misinformation Review](https://misinforeview.hks.harvard.edu/article/professional-and-community-based-fact-checking-show-different-strengths-but-neither-performs-strongly-across-trust-scalability-and-impact/) | `SRC-SYN-FACTCHECK-MODES` | `exact` | `C-HUMAN-AI`, `C-COMMUNITY`, `C-LABEL`, `C-EVAL`; anchor: "Harvard Kennedy School Misinformation Review" |
| section Preprints used only as risk signals | [Consensus stability, accepted at WWW 2026](https://arxiv.org/abs/2601.14002) | `SRC-PRE-CN-STATUS-STABILITY` | `exact` | `C-COMMUNITY`, `C-CORRECT`, `C-EVAL`; anchor: "Consensus stability, accepted at WWW 2026" |
| section Preprints used only as risk signals | [Hyperactive minority](https://arxiv.org/abs/2602.08970) | `SRC-PRE-CN-HYPERACTIVE-MINORITY` | `exact` | `C-COMMUNITY`, `C-SEC`, `C-EVAL`; anchor: "Hyperactive minority" |
| section Preprints used only as risk signals | [Manipulation study](https://arxiv.org/abs/2511.02615) | `SRC-PRE-CN-STRATEGIC-RATERS` | `exact` | `C-COMMUNITY`, `C-SEC`, `C-EVAL`; anchor: "Manipulation study" |

## `operations-and-cost.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section What is measured | [open PDF](https://cronfa.swansea.ac.uk/Record/cronfa60585/Download/60585__24694__b1b52c023375424ea644f72b2ab1b58b.pdf) | `SRC-EMP-MICALLEF-FACTCHECKERS` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-INDEP`, `C-CORRECT`, `C-OPS`; anchor: "open PDF" |
| section What is measured | [Micallef et al., CSCW 2022](https://doi.org/10.1145/3512974) | `SRC-EMP-MICALLEF-FACTCHECKERS` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-INDEP`, `C-CORRECT`, `C-OPS`; anchor: "Micallef et al., CSCW 2022" |
| section What is measured | [MIT Knight Science Journalism / Moore Foundation report](https://www.moore.org/docs/default-source/default-document-library/fact-checking-in-science-journalism_mit-ksj.pdf?sfvrsn=a6346e0c_2) | `SRC-EMP-SCIENCE-JOURNALISM-COST` | `exact` | `C-HUMAN-AI`, `C-OPS`; anchor: "MIT Knight Science Journalism / Moore Foundation report" |
| section What is measured | [Full Fact](https://fullfact.org/blog/2024/jul/general-election-2024-fact-checked/) | `SRC-DOC-FULLFACT-ELECTION-2024` | `exact` | `C-SEARCH`, `C-CORRECT`, `C-OPS`; anchor: "Full Fact" |
| section What is measured | [Allen and Olkin, JAMA 1999](https://doi.org/10.1001/jama.282.7.634) | `SRC-EMP-ALLEN-OLKIN-REVIEW-WORKLOAD` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-OPS`; anchor: "Allen and Olkin, JAMA 1999" |
| section What is measured | [Haddaway and Westgate 2019](https://doi.org/10.1111/cobi.13231) | `SRC-EMP-HADDAWAY-REVIEW-WORKLOAD` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-OPS`; anchor: "Haddaway and Westgate 2019" |
| section What is measured | [Clark et al. 2020](https://doi.org/10.1016/j.jclinepi.2020.01.008) | `SRC-EMP-CLARK-RAPID-REVIEW` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`, `C-OPS`; anchor: "Clark et al. 2020" |
| section What is measured | [Shemilt et al. 2016](https://doi.org/10.1186/s13643-016-0315-4) | `SRC-EMP-SHEMILT-SCREENING` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-OPS`; anchor: "Shemilt et al. 2016" |
| section What is measured | [Wang et al. 2020](https://doi.org/10.1371/journal.pone.0227742) | `SRC-EMP-WANG-SCREENING-ERRORS` | `exact` | `C-HUMAN-AI`, `C-SCIENCE`, `C-EVAL`, `C-OPS`; anchor: "Wang et al. 2020" |
| section What is measured | [Misinformation Review](https://misinforeview.hks.harvard.edu/article/beyond-compliance-how-european-fact-checkers-correct-their-own-errors/) | `SRC-EMP-EFCSN-CORRECTIONS-AUDIT` | `exact` | `C-CORRECT`, `C-EVAL`; anchor: "Misinformation Review" |
| section What is measured | [EFCSN 2025 report](https://efcsn.com/wp-content/uploads/2026/02/EFCSN-Report-Digital-EU.pdf) | `SRC-REPORT-EFCSN-APPEALS` | `exact` | `C-CORRECT`, `C-PLATFORM`, `C-OPS`; anchor: "EFCSN 2025 report" |
| section What is measured | [EFCSN submission](https://www.oversightboard.com/wp-content/uploads/gravity_forms/1-e2f76a9fb25fb0a6267e3480be5a45a9/2025/08/EFCSN-Comment-Meta-Oversight-Board-case-2025-050-FB-UA-.pdf) | `SRC-REPORT-EFCSN-APPEALS` | `exact` | `C-CORRECT`, `C-PLATFORM`, `C-OPS`; anchor: "EFCSN submission" |
| section What is measured | [IFCN State of Fact-Checkers 2025](https://www.poynter.org/wp-content/uploads/2026/03/2026-State-of-Fact-Checkers-4.pdf) | `SRC-SURVEY-IFCN-STATE-2025` | `exact` | `C-HUMAN-AI`, `C-SEARCH`, `C-CORRECT`, `C-SEC`; anchor: "IFCN State of Fact-Checkers 2025" |
| section Capacity equations | [Little 1961](https://doi.org/10.1287/opre.9.3.383) | `SRC-MET-LITTLES-LAW` | `exact` | `C-ARCH`, `C-OPS`; anchor: "Little 1961" |
| section SLOs, SLAs, and the quality budget | [SRE workbook](https://sre.google/workbook/implementing-slos/) | `SRC-DOC-GOOGLE-SRE-SLOS` | `exact` | `C-EVAL`, `C-OPS`; anchor: "SRE workbook" |
| section SLOs, SLAs, and the quality budget | [SRE book](https://sre.google/sre-book/service-level-objectives/) | `SRC-DOC-GOOGLE-SRE-SLOS` | `exact` | `C-EVAL`, `C-OPS`; anchor: "SRE book" |
| section Backup, restore, and disaster recovery | [PostgreSQL continuous archiving and PITR](https://www.postgresql.org/docs/18/continuous-archiving.html) | `SRC-DOC-POSTGRES-18` | `exact` | `C-ARCH`, `C-SEC`, `C-FRESH`; anchor: "PostgreSQL continuous archiving and PITR" |
| section Support, appeals, corrections, and incidents | [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | `SRC-DOC-NIST-SP800-61R3` | `exact` | `C-SEC`, `C-CORRECT`; anchor: "NIST SP 800-61r3" |

## `provenance-and-cryptographic-trust.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Status and governing rule | [PROV-AQ, section 1.3](https://www.w3.org/TR/prov-aq/#interpreting-provenance-records) | `SRC-STD-PROV-AQ` | `same-work-fragment` | `C-PROV`, `C-LIMIT`; anchor: "PROV-AQ, section 1.3" |
| section Status and governing rule | [C2PA 2.4, scope](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html#_scope) | `SRC-STD-C2PA-24` | `same-work-fragment` | `C-PROV`, `C-ARCH`; anchor: "C2PA 2.4, scope" |
| section Status and governing rule | [RFC 9943, section 9.2](https://www.rfc-editor.org/rfc/rfc9943.html#section-9.2) | `SRC-STD-SCITT-RFC9943` | `same-work-fragment` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943, section 9.2" |
| section Semantic provenance with W3C PROV | [PROV-O](https://www.w3.org/TR/prov-o/) | `SRC-STD-PROV-O` | `exact` | `C-PROV`, `C-ARCH`; anchor: "PROV-O" |
| section Semantic provenance with W3C PROV | [PROV-DM](https://www.w3.org/TR/prov-dm/) | `SRC-STD-PROV-DM` | `exact` | `C-PROV`, `C-ARCH`; anchor: "PROV-DM" |
| section One authoritative byte representation | [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html) | `SRC-STD-JCS-RFC8785` | `exact` | `C-CRYPTO`, `C-REPRO`, `C-ARCH`; anchor: "RFC 8785" |
| section COSE signature profile | [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052.html) | `SRC-STD-COSE-RFC9052` | `exact` | `C-CRYPTO`, `C-ARCH`; anchor: "RFC 9052" |
| section Trusted time with RFC 3161 | [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161.html) | `SRC-STD-TSP-RFC3161` | `same-work-fragment` | `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 3161" |
| section Trusted time with RFC 3161 | [RFC 3161, section 4](https://www.rfc-editor.org/rfc/rfc3161.html#section-4) | `SRC-STD-TSP-RFC3161` | `exact` | `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 3161, section 4" |
| section Privacy-preserving leaves | [RFC 9942, section 6](https://www.rfc-editor.org/rfc/rfc9942.html#section-6) | `SRC-STD-COSE-RECEIPTS-RFC9942` | `same-work-fragment` | `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9942, section 6" |
| section Privacy-preserving leaves | [RFC 9943, section 8](https://www.rfc-editor.org/rfc/rfc9943.html#section-8) | `SRC-STD-SCITT-RFC9943` | `same-work-fragment` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943, section 8" |
| section SCITT receipts and witnesses | [RFC 9942](https://www.rfc-editor.org/rfc/rfc9942.html) | `SRC-STD-COSE-RECEIPTS-RFC9942` | `exact` | `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9942" |
| section SCITT receipts and witnesses | [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) | `SRC-STD-SCITT-RFC9943` | `exact` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943" |
| section SCITT receipts and witnesses | [RFC 9162, sections 1 and 11.3](https://www.rfc-editor.org/rfc/rfc9162.html#section-11.3) | `SRC-STD-CT-RFC9162` | `same-work-fragment` | `C-CRYPTO`, `C-SEC`; anchor: "RFC 9162, sections 1 and 11.3" |
| section C2PA media ingestion | [C2PA 2.4 technical specification](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html) | `SRC-STD-C2PA-24` | `exact` | `C-PROV`, `C-ARCH`; anchor: "C2PA 2.4 technical specification" |
| section C2PA media ingestion | [C2PA 2.4 security considerations](https://spec.c2pa.org/specifications/specifications/2.4/security/Security_Considerations.html) | `SRC-DOC-C2PA-SECURITY` | `exact` | `C-PROV`, `C-SEC`, `C-PRIVACY`; anchor: "C2PA 2.4 security considerations" |
| section Sigstore boundary | [Sigstore threat model](https://docs.sigstore.dev/about/threat-model/) | `SRC-DOC-SIGSTORE-THREATS` | `exact` | `C-CRYPTO`, `C-SEC`; anchor: "Sigstore threat model" |
| section Sigstore boundary | [security model](https://docs.sigstore.dev/about/security/) | `SRC-DOC-SIGSTORE-THREATS` | `exact` | `C-CRYPTO`, `C-SEC`; anchor: "security model" |
| section Sigstore boundary | [Rekor repository](https://github.com/sigstore/rekor) | `SRC-CODE-SIGSTORE-REKOR` | `exact` | `C-CRYPTO`, `C-ARCH`, `C-SEC`; anchor: "Rekor repository" |
| section Long-term validation and renewal | [RFC 4998 Evidence Record Syntax](https://www.rfc-editor.org/rfc/rfc4998.html) | `SRC-STD-EVIDENCE-RECORD-RFC4998` | `exact` | `C-CRYPTO`, `C-CORRECT`, `C-REPRO`; anchor: "RFC 4998 Evidence Record Syntax" |

## `roadmap-and-decisions.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section First vertical slice | [C2PA explainer](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) | `SRC-DOC-C2PA-EXPLAINER` | `exact` | `C-LIMIT`, `C-PROV`, `C-INDEP`; anchor: "C2PA explainer" |
| section Phase 1 — offline falsification and paper prototype | [wrong-label study](https://pubmed.ncbi.nlm.nih.gov/40263336/) | `SRC-EMP-WRONG-WARNING-LABELS` | `exact` | `C-LABEL`, `C-EVAL`, `C-SEC`; anchor: "wrong-label study" |
| section Phase 5 — additional domain profiles | [Cochrane Handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane Handbook" |
| section Phase 6 — measured specialization and ecosystem features | [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) | `SRC-STD-SCITT-RFC9943` | `exact` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943" |
| section Build, adopt, adapt, or defer | [PROV-O](https://www.w3.org/TR/prov-o/) | `SRC-STD-PROV-O` | `exact` | `C-PROV`, `C-ARCH`; anchor: "PROV-O" |
| section D17 — Community role: discovery and objection, never truth authority | [Bouchaud et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC13322233/) | `SRC-EMP-CN-POLARIZATION` | `exact` | `C-COMMUNITY`, `C-INDEP`, `C-EVAL`; anchor: "Bouchaud et al." |

## `scientific-claims-profile.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section The scientific method stack<br>section Source register and limitations | [PRISMA publication](https://www.bmj.com/content/372/bmj.n71.long) | `SRC-MET-PRISMA-PAPER` | `exact` | `C-SCIENCE`, `C-LIMIT`; anchors: "PRISMA publication"; "BMJ statement" |
| section The scientific method stack<br>section Source register and limitations | [PRISMA 2020](https://www.prisma-statement.org/prisma-2020) | `SRC-MET-PRISMA-2020` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-EVAL`; anchor: "PRISMA 2020" |
| section The scientific method stack<br>section Source register and limitations | [Cochrane Handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane Handbook" |
| section The scientific method stack<br>section Source register and limitations | [RoB 2](https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2) | `SRC-MET-ROB2` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`; anchor: "RoB 2" |
| section The scientific method stack<br>section Source register and limitations | [ROBINS-I 2016](https://www.riskofbias.info/welcome/home/original-2016-version-of-robins-i) | `SRC-MET-ROBINS-I` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`; anchor: "ROBINS-I 2016" |
| section The scientific method stack<br>section Source register and limitations | [draft V2](https://www.riskofbias.info/welcome/robins-i-v2) | `SRC-MET-ROBINS-I` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`; anchors: "draft V2"; "draft ROBINS-I V2" |
| section The scientific method stack<br>section Source register and limitations | [GRADE](https://book.gradepro.org/) | `SRC-MET-GRADE` | `exact` | `C-SCIENCE`, `C-LIMIT`, `C-HUMAN-AI`; anchors: "GRADE"; "GRADE Book" |
| section The scientific method stack | [Minozzi et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32562833/) | `SRC-EMP-ROB2-RELIABILITY` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Minozzi et al., 2020" |
| section The scientific method stack | [Minozzi et al., 2022](https://pubmed.ncbi.nlm.nih.gov/34537386/) | `SRC-EMP-ROB2-CALIBRATION` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Minozzi et al., 2022" |
| section The scientific method stack | [Minozzi et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30981833/) | `SRC-EMP-ROBINS-I-RELIABILITY` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`, `C-EVAL`; anchor: "Minozzi et al., 2019" |
| section Preregistration and Registered Reports<br>section Source register and limitations | [OSF registration](https://help.osf.io/article/330-welcome-to-registrations) | `SRC-DOC-OSF-REGISTRATION` | `exact` | `C-PROV`, `C-REPRO`, `C-CORRECT`; anchors: "OSF registration"; "OSF registrations" |
| section Preregistration and Registered Reports<br>section Source register and limitations | [Registered Report](https://www.cos.io/initiatives/registered-reports) | `SRC-DOC-REGISTERED-REPORTS` | `exact` | `C-REPRO`, `C-SCIENCE`; anchors: "Registered Report"; "Registered Reports" |
| section Preregistration and Registered Reports | [Claesen et al., 2021](https://doi.org/10.1098/rsos.211037) | `SRC-EMP-CLAESEN-PREREGISTRATION` | `exact` | `C-REPRO`, `C-SCIENCE`, `C-CORRECT`; anchor: "Claesen et al., 2021" |
| section Preregistration and Registered Reports | [Scheel et al., 2021](https://doi.org/10.1177/25152459211007467) | `SRC-EMP-SCHEEL-REGISTERED-REPORTS` | `exact` | `C-REPRO`, `C-SCIENCE`; anchor: "Scheel et al., 2021" |
| section Reproducibility, robustness, replication, and generalization<br>section Source register and limitations | [US National Academies](https://www.nationalacademies.org/read/25303/chapter/3) | `SRC-SYN-NAS-REPRO` | `exact` | `C-REPRO`, `C-LIMIT`, `C-SCIENCE`; anchors: "US National Academies"; "National Academies, 2019" |
| section Reproducibility, robustness, replication, and generalization<br>section Source register and limitations | [Open Science Collaboration, 2015](https://doi.org/10.1126/science.aac4716) | `SRC-EMP-OPEN-SCIENCE-REPLICATION` | `exact` | `C-REPRO`, `C-SCIENCE`, `C-EVAL`; anchor: "Open Science Collaboration, 2015" |
| section Missing results and publication bias<br>section Source register and limitations | [ROB-ME](https://www.riskofbias.info/welcome/rob-me-tool) | `SRC-MET-ROB-ME` | `exact` | `C-SCIENCE`, `C-SEARCH`; anchor: "ROB-ME" |
| section Missing results and publication bias<br>section Source register and limitations | [Showell et al., 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11600493/) | `SRC-SYN-SHOWELL-NONPUBLICATION` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-OPEN`; anchor: "Showell et al., 2024" |
| section Missing results and publication bias<br>section Source register and limitations | [Chan et al., 2004](https://jamanetwork.com/journals/jama/fullarticle/198809) | `SRC-EMP-CHAN-OUTCOME-REPORTING` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-REPRO`; anchor: "Chan et al., 2004" |
| section Missing results and publication bias<br>section Source register and limitations | [Turner et al., 2008](https://pubmed.ncbi.nlm.nih.gov/18199864/) | `SRC-EMP-TURNER-PUBLICATION-BIAS` | `exact` | `C-SEARCH`, `C-SCIENCE`, `C-OPEN`; anchor: "Turner et al., 2008" |
| section Missing results and publication bias | [Cochrane reporting-bias chapter](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-13) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane reporting-bias chapter" |
| section Living evidence and freshness<br>section Source register and limitations | [Cochrane living-review chapter](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-22) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane living-review chapter" |
| section Living evidence and freshness<br>section Source register and limitations | [Elliott et al., 2014](https://journals.plos.org/plosmedicine/article?id=10.1371%2Fjournal.pmed.1001603) | `SRC-EMP-ELLIOTT-LIVING-REVIEWS` | `exact` | `C-FRESH`, `C-SCIENCE`; anchor: "Elliott et al., 2014" |
| section Living evidence and freshness<br>section Source register and limitations | [PRISMA-LSR](https://www.bmj.com/content/387/bmj-2024-079183) | `SRC-MET-PRISMA-LSR` | `exact` | `C-FRESH`, `C-CORRECT`, `C-SCIENCE`; anchor: "PRISMA-LSR" |
| section Living evidence and freshness | [Cochrane living-review guidance](https://resources.cochrane.org/sites/default/files/uploads/inline-files/Transform/201912_LSR_Revised_Guidance.pdf) | `SRC-DOC-COCHRANE-LIVING-GUIDANCE` | `exact` | `C-FRESH`, `C-SCIENCE`; anchor: "Cochrane living-review guidance" |
| section Living evidence and freshness | [Akl et al., 2023](https://doi.org/10.1016/j.jclinepi.2023.02.005) | `SRC-EMP-AKL-LIVING-REVIEWS` | `exact` | `C-FRESH`, `C-SCIENCE`, `C-CORRECT`; anchor: "Akl et al., 2023" |
| section Corrections, expressions of concern, and retractions<br>section Source register and limitations | [Crossmark](https://www.crossref.org/documentation/crossmark/) | `SRC-DOC-CROSSMARK` | `exact` | `C-CORRECT`, `C-FRESH`, `C-SCIENCE`; anchor: "Crossmark" |
| section Corrections, expressions of concern, and retractions<br>section Source register and limitations | [Retraction Watch data](https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/) | `SRC-DOC-CROSSREF-RETRACTIONS` | `exact` | `C-CORRECT`, `C-FRESH`, `C-SCIENCE`; anchors: "Retraction Watch data"; "Crossref Retraction Watch" |
| section Corrections, expressions of concern, and retractions<br>section Source register and limitations | [NLM errata and retraction policy](https://www.nlm.nih.gov/bsd/policy/errata.html) | `SRC-DOC-NLM-ERRATA` | `exact` | `C-CORRECT`, `C-FRESH`, `C-SCIENCE`; anchors: "NLM errata and retraction policy"; "NLM policy" |
| section Corrections, expressions of concern, and retractions<br>section Source register and limitations | [COPE Retraction Guidelines](https://publicationethics.org/sites/default/files/retraction-guidelines-cope.pdf) | `SRC-GOV-COPE-RETRACTION` | `exact` | `C-CORRECT`, `C-SCIENCE`; anchors: "COPE Retraction Guidelines"; "COPE guidelines" |
| section Resource model<br>section Source register and limitations | [Borah et al., 2017](https://bmjopen.bmj.com/content/7/2/e012545) | `SRC-EMP-BORAH-REVIEW-TIME` | `exact` | `C-SCIENCE`, `C-HUMAN-AI`, `C-SEARCH`; anchor: "Borah et al., 2017" |

## `threat-model.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Threat register | [Greshake et al.](https://arxiv.org/abs/2302.12173) | `SRC-PRE-INDIRECT-PROMPT-INJECTION` | `exact` | `C-SEC`, `C-HUMAN-AI`; anchor: "Greshake et al." |
| section Threat register | [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | `SRC-DOC-OWASP-PROMPT-INJECTION` | `exact` | `C-SEC`, `C-HUMAN-AI`; anchor: "OWASP prompt injection" |
| section Threat register | [File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | `SRC-DOC-OWASP-INGESTION` | `exact` | `C-SEC`, `C-ARCH`; anchor: "File Upload" |
| section Threat register | [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) | `SRC-DOC-OWASP-INGESTION` | `exact` | `C-SEC`, `C-ARCH`; anchor: "OWASP SSRF" |
| section Threat register | [PoisonedRAG](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag) | `SRC-EMP-POISONEDRAG` | `exact` | `C-SEC`, `C-SEARCH`, `C-INDEP`; anchor: "PoisonedRAG" |
| section Threat register | [C2PA explainer](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) | `SRC-DOC-C2PA-EXPLAINER` | `exact` | `C-LIMIT`, `C-PROV`, `C-INDEP`; anchor: "C2PA explainer" |
| section Threat register | [Codecov postmortem](https://about.codecov.io/apr-2021-post-mortem/) | `SRC-AUDIT-CODECOV` | `exact` | `C-SEC`, `C-CORRECT`; anchor: "Codecov postmortem" |
| section Threat register | [NIST SP 800-161r1](https://csrc.nist.gov/pubs/sp/800/161/r1/final) | `SRC-DOC-NIST-SP800-161R1` | `exact` | `C-SEC`, `C-ARCH`; anchor: "NIST SP 800-161r1" |
| section Threat register | [SLSA threats](https://slsa.dev/spec/v1.0/threats) | `SRC-DOC-SLSA-THREATS` | `exact` | `C-SEC`, `C-ARCH`; anchor: "SLSA threats" |
| section Threat register | [EDPB blockchain guidance](https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202502_blockchain_v2_en.pdf) | `SRC-GOV-EDPB-BLOCKCHAIN` | `exact` | `C-PRIVACY`, `C-CRYPTO`, `C-CORRECT`; anchor: "EDPB blockchain guidance" |
| section Threat register | [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html) | `SRC-STD-CT-RFC9162` | `exact` | `C-CRYPTO`, `C-SEC`; anchor: "RFC 9162" |
| section Threat register | [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) | `SRC-STD-SCITT-RFC9943` | `exact` | `C-PROV`, `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 9943" |
| section Threat register | [SEI insider-threat guide](https://www.sei.cmu.edu/library/common-sense-guide-to-mitigating-insider-threats-seventh-edition/) | `SRC-DOC-SEI-INSIDER` | `exact` | `C-SEC`, `C-HUMAN-AI`; anchor: "SEI insider-threat guide" |
| section Threat register | [C2PA security considerations](https://spec.c2pa.org/specifications/specifications/2.4/security/Security_Considerations.html) | `SRC-DOC-C2PA-SECURITY` | `exact` | `C-PROV`, `C-SEC`, `C-PRIVACY`; anchor: "C2PA security considerations" |
| section Threat register | [NIST Privacy Framework](https://www.nist.gov/privacy-framework/privacy-framework) | `SRC-DOC-NIST-PRIVACY` | `exact` | `C-PRIVACY`, `C-SEC`; anchor: "NIST Privacy Framework" |
| section Threat register<br>section Copyright, database, access, and redistribution<br>section Official legal sources and change triggers | [DSM Directive](https://eur-lex.europa.eu/eli/dir/2019/790/oj) | `SRC-LAW-EU-DSM` | `exact` | `C-RIGHTS`; anchors: "DSM Directive"; "Directive 2019/790"; "DSM Directive 2019/790" |
| section Threat register<br>section Copyright, database, access, and redistribution | [CPI L342-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006279247) | `SRC-LAW-FR-DATABASES` | `exact` | `C-RIGHTS`, `C-SEARCH`; anchor: "CPI L342-1" |
| section Threat register<br>section Copyright, database, access, and redistribution<br>section Official legal sources and change triggers | [CPI L122-5-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044363192) | `SRC-LAW-FR-COPYRIGHT-TDM` | `exact` | `C-RIGHTS`, `C-CORRECT`; anchors: "CPI L122-5-3"; "L122-5-3" |
| section Threat register<br>section Publication, personality rights, and reply<br>section Official legal sources and change triggers | [Civil Code Articles 9 and 9-1](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006117610/?anchor=LEGIARTI000006419316) | `SRC-LAW-FR-CIVIL-PERSONALITY` | `exact` | `C-PERSON`, `C-PRIVACY`; anchor: "Civil Code Articles 9 and 9-1" |
| section Threat register<br>section Publication, personality rights, and reply | [1881 Act Article 29](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006419790) | `SRC-LAW-FR-PRESS` | `exact` | `C-PERSON`, `C-LABEL`, `C-CORRECT`; anchor: "1881 Act Article 29" |
| section Threat register<br>section Privacy and data-protection architecture<br>section Official legal sources and change triggers | [GDPR Articles 12–22](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | `SRC-LAW-EU-GDPR` | `exact` | `C-PRIVACY`, `C-CORRECT`, `C-PERSON`; anchors: "GDPR Articles 12–22"; "Articles 5 and 6"; "GDPR, consolidated official text" |
| section Threat register<br>section Publication, personality rights, and reply<br>section Official legal sources and change triggers | [LCEN Article 1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614) | `SRC-LAW-FR-ONLINE-REPLY` | `exact` | `C-PERSON`, `C-CORRECT`, `C-PLATFORM`; anchor: "LCEN Article 1-1" |
| section Threat register | [Douceur, Sybil Attack](https://www.microsoft.com/en-us/research/wp-content/uploads/2002/01/IPTPS2002.pdf) | `SRC-STUDY-DOUCEUR-SYBIL` | `exact` | `C-COMMUNITY`, `C-SEC`; anchor: "Douceur, Sybil Attack" |
| section Threat register | [COPE/STM paper-mills report](https://members.publicationethics.org/sites/default/files/paper-mills-cope-stm-research-report.pdf) | `SRC-AUDIT-PAPER-MILLS` | `exact` | `C-SCIENCE`, `C-INDEP`, `C-SEC`; anchor: "COPE/STM paper-mills report" |
| section Threat register | [Surgisphere retraction](https://pubmed.ncbi.nlm.nih.gov/32511943/) | `SRC-AUDIT-SURGISPHERE` | `exact` | `C-SCIENCE`, `C-CORRECT`, `C-INDEP`; anchor: "Surgisphere retraction" |
| section Threat register | [Crossref Retraction Watch](https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/) | `SRC-DOC-CROSSREF-RETRACTIONS` | `exact` | `C-CORRECT`, `C-FRESH`, `C-SCIENCE`; anchor: "Crossref Retraction Watch" |
| section Threat register | [US DOJ Doppelganger disruption](https://www.justice.gov/archives/opa/pr/justice-department-disrupts-covert-russian-government-sponsored-foreign-malign-influence) | `SRC-AUDIT-DOJ-DOPPELGANGER` | `exact` | `C-SEC`, `C-PROV`; anchor: "US DOJ Doppelganger disruption" |
| section Threat register | [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | `SRC-DOC-NIST-GAI-600-1` | `exact` | `C-HUMAN-AI`, `C-SEC`, `C-LABEL`; anchor: "NIST AI 600-1" |
| section Threat register | [Hong Kong deepfake fraud statement](https://www.info.gov.hk/gia/general/202406/26/P2024062600192.htm) | `SRC-AUDIT-HK-DEEPFAKE` | `exact` | `C-SEC`, `C-PROV`, `C-LABEL`; anchor: "Hong Kong deepfake fraud statement" |
| section Threat register | [Incorrect warning-label study](https://pubmed.ncbi.nlm.nih.gov/40263336/) | `SRC-EMP-WRONG-WARNING-LABELS` | `exact` | `C-LABEL`, `C-EVAL`, `C-SEC`; anchor: "Incorrect warning-label study" |
| section Threat register | [threat model](https://docs.sigstore.dev/about/threat-model/) | `SRC-DOC-SIGSTORE-THREATS` | `exact` | `C-CRYPTO`, `C-SEC`; anchor: "threat model" |
| section Threat register | [RFC 3161 section 4](https://www.rfc-editor.org/rfc/rfc3161.html#section-4) | `SRC-STD-TSP-RFC3161` | `exact` | `C-CRYPTO`, `C-CORRECT`; anchor: "RFC 3161 section 4" |
| section Privacy and data-protection architecture | [Article 46 of the Data Protection Act](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037823133) | `SRC-LAW-FR-DATA-PROTECTION` | `exact` | `C-PRIVACY`, `C-PERSON`; anchor: "Article 46 of the Data Protection Act" |
| section Privacy and data-protection architecture<br>section Official legal sources and change triggers | [CNIL AI guidance](https://www.cnil.fr/fr/base-legale-interet-legitime-developpement-systeme) | `SRC-GOV-CNIL-AI-DATA` | `exact` | `C-PRIVACY`, `C-RIGHTS`, `C-SEC`; anchors: "CNIL AI guidance"; "CNIL legitimate interest for AI" |
| section Privacy and data-protection architecture<br>section Official legal sources and change triggers | [CNIL web-scraping guidance](https://www.cnil.fr/fr/focus-interet-legitime-collecte-par-moissonnage) | `SRC-GOV-CNIL-AI-DATA` | `exact` | `C-PRIVACY`, `C-RIGHTS`, `C-SEC`; anchors: "CNIL web-scraping guidance"; "web scraping" |
| section Privacy and data-protection architecture<br>section Official legal sources and change triggers | [CNIL DPIA criteria](https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd) | `SRC-GOV-CNIL-AI-DATA` | `exact` | `C-PRIVACY`, `C-RIGHTS`, `C-SEC`; anchors: "CNIL DPIA criteria"; "DPIA" |
| section Privacy and data-protection architecture | [CJEU C-634/21, SCHUFA](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62021CJ0634) | `SRC-LAW-CJEU-SCHUFA` | `exact` | `C-PRIVACY`, `C-PLATFORM`; anchor: "CJEU C-634/21, SCHUFA" |
| section Copyright, database, access, and redistribution | [R122-27–R122-28](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069414/LEGISCTA000045960683/) | `SRC-LAW-FR-COPYRIGHT-TDM` | `exact` | `C-RIGHTS`, `C-CORRECT`; anchor: "R122-27–R122-28" |
| section Copyright, database, access, and redistribution<br>section Official legal sources and change triggers | [CPI L122-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048603495) | `SRC-LAW-FR-COPYRIGHT-TDM` | `exact` | `C-RIGHTS`, `C-CORRECT`; anchor: "CPI L122-5" |
| section Copyright, database, access, and redistribution | [CPI L218-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038826732) | `SRC-LAW-FR-COPYRIGHT-TDM` | `exact` | `C-RIGHTS`, `C-CORRECT`; anchor: "CPI L218-2" |
| section Copyright, database, access, and redistribution | [L211-3-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038826394) | `SRC-LAW-FR-COPYRIGHT-TDM` | `exact` | `C-RIGHTS`, `C-CORRECT`; anchor: "L211-3-1" |
| section Copyright, database, access, and redistribution | [L342-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006279250) | `SRC-LAW-FR-DATABASES` | `exact` | `C-RIGHTS`, `C-SEARCH`; anchor: "L342-2" |
| section Publication, personality rights, and reply | [Article 35](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044568131) | `SRC-LAW-FR-PRESS` | `exact` | `C-PERSON`, `C-LABEL`, `C-CORRECT`; anchor: "Article 35" |
| section Publication, personality rights, and reply<br>section Official legal sources and change triggers | [Decree 2007-1527](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000428279) | `SRC-LAW-FR-ONLINE-REPLY` | `exact` | `C-PERSON`, `C-CORRECT`, `C-PLATFORM`; anchors: "Decree 2007-1527"; "online-reply decree" |
| section DSA and AI Act applicability boundaries<br>section Official legal sources and change triggers | [Regulation 2022/2065, Article 3](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng) | `SRC-LAW-EU-DSA` | `exact` | `C-PLATFORM`, `C-CORRECT`, `C-PERSON`; anchors: "Regulation 2022/2065, Article 3"; "Digital Services Act" |
| section DSA and AI Act applicability boundaries<br>section Official legal sources and change triggers | [consolidated AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02024R1689-20260727) | `SRC-LAW-EU-AI-ACT` | `exact` | `C-PLATFORM`, `C-HUMAN-AI`, `C-LABEL`; anchors: "consolidated AI Act"; "AI Act consolidated on 2026-07-27" |
| section DSA and AI Act applicability boundaries<br>section Official legal sources and change triggers | [amending Regulation 2026/1744](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32026R1744) | `SRC-LAW-EU-AI-ACT` | `exact` | `C-PLATFORM`, `C-HUMAN-AI`, `C-LABEL`; anchors: "amending Regulation 2026/1744"; "Regulation 2026/1744" |
| section Incident behavior | [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | `SRC-DOC-NIST-SP800-61R3` | `exact` | `C-SEC`, `C-CORRECT`; anchor: "NIST SP 800-61r3" |
| section Personal-data breach lane | [GDPR Article 33](https://eur-lex.europa.eu/eli/reg/2016/679/art_33/oj) | `SRC-LAW-EU-GDPR` | `same-work-part` | `C-PRIVACY`, `C-CORRECT`, `C-PERSON`; anchor: "GDPR Article 33" |
| section Personal-data breach lane | [GDPR Article 34](https://eur-lex.europa.eu/eli/reg/2016/679/art_34/oj) | `SRC-LAW-EU-GDPR` | `same-work-part` | `C-PRIVACY`, `C-CORRECT`, `C-PERSON`; anchor: "GDPR Article 34" |
| section Official legal sources and change triggers | [retention](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees) | `SRC-GOV-CNIL-AI-DATA` | `exact` | `C-PRIVACY`, `C-RIGHTS`, `C-SEC`; anchor: "retention" |
| section Official legal sources and change triggers | [French Data Protection Act, Articles 46 and 80](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460/2025-07-01) | `SRC-LAW-FR-DATA-PROTECTION` | `exact` | `C-PRIVACY`, `C-PERSON`; anchor: "French Data Protection Act, Articles 46 and 80" |
| section Official legal sources and change triggers | [database rights](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069414/LEGISCTA000006146357/) | `SRC-LAW-FR-DATABASES` | `exact` | `C-RIGHTS`, `C-SEARCH`; anchor: "database rights" |
| section Official legal sources and change triggers | [1881 Press Act Articles 29 and 35](https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006070722) | `SRC-LAW-FR-PRESS` | `exact` | `C-PERSON`, `C-LABEL`, `C-CORRECT`; anchor: "1881 Press Act Articles 29 and 35" |

## `verification-protocol.md`

| Heading(s) and occurrence count | Cited URL | `SRC-*` ID | Join | Brief local use |
| --- | --- | --- | --- | --- |
| section Status and dependencies | [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/) | `SRC-DOC-OWL-OPEN-WORLD` | `exact` | `C-OPEN`, `C-LIMIT`; anchor: "OWL 2 Primer" |
| section Layer-by-layer protocol | [Cochrane Handbook, chapter 4](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04) | `SRC-MET-COCHRANE-HANDBOOK` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-SCIENCE`, `C-FRESH`, `C-CORRECT`; anchor: "Cochrane Handbook, chapter 4" |
| section Two service velocities | [Micallef et al.](https://par.nsf.gov/servlets/purl/10410750) | `SRC-EMP-MICALLEF-FACTCHECKERS` | `exact` | `C-SEARCH`, `C-HUMAN-AI`, `C-INDEP`, `C-CORRECT`, `C-OPS`; anchor: "Micallef et al." |

## Unmatched citations

**None.** All 365 external Markdown-link occurrences resolve to exactly one
source-register ID under the declared rules. Any future unmatched or ambiguous
URL invalidates this receipt until the source register or the citation is
deliberately reconciled.

## Maintenance rule

Regenerate and review this manifest whenever an inline external citation, its URL,
a containing heading, a source-register URL, or a `SRC-*` ID changes. Reviewers
must compare both sides of the join: this file can detect inventory drift, but it
cannot tell whether the cited source truly supports the surrounding prose.

No durable generator is committed in this research-only phase. Before this
dossier can pass the ready-to-code gate, extraction, exact/same-work joining,
uniqueness, and zero-unmatched checks must be captured as a versioned script or
equivalent reproducible documentation test. Until then, regeneration is a
reviewer-owned manual/mechanical gate and a new citation invalidates this receipt.
