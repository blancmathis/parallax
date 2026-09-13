---
context_room:
  id: research.verification-engine.threat-model
  depends_on:
    - research.verification-engine.architecture
    - research.verification-engine.assurance-model
---

# Threat model, privacy, and rights boundaries

## Summary

The engine is a high-value target because an attacker does not need to alter a
database directly: controlling acquisition, ranking, interpretation, review,
identity, or correction timing can produce a defensible-looking false dossier.
All documents, APIs, metadata, signatures, model outputs, and human judgments
therefore remain untrusted until the control appropriate to that object passes.

Security can guarantee containment, authorization, byte integrity, audit
detectability, and fail-closed transitions within a declared trust boundary. It
cannot guarantee that a signed source, credentialed expert, popular conclusion,
or internally consistent paper is truthful. The residual risk is substantial,
so the first product excludes private allegations and high-stakes medical,
legal, financial, safety, and electoral conclusions from autonomous public
issuance.

For an EU/France launch, legal permissions are part of the assurance boundary:
the right to access an item, mine it, retain it, quote it, send it to a model
provider, and redistribute it are independent. Public availability is neither a
personal-data exemption nor a content licence. The architecture must therefore
be able to erase or restrict protected payloads without rewriting the minimal
non-personal history needed to explain why a certificate was withdrawn.

## Defines

Protected assets, actors, trust boundaries, harm tiers, threat register,
security invariants, privacy and rights architecture, incident behavior, and
launch exclusions for the proposed engine.

## Does not define

A deployment-specific risk acceptance, DPIA, legal opinion, penetration test,
incident runbook, or production control configuration.

## Legal status and jurisdiction boundary

This document is a product and security risk analysis, not legal advice. The
legal source check below is limited to European Union law and French law as
available on **2026-08-12**. Availability in another country, the location of a
source or data subject, or a new customer use can change the applicable rules.

Every legal statement is assigned one of three operating statuses:

| Status | Meaning | Required treatment |
| --- | --- | --- |
| **Observed legal rule** | A cited official text states the rule. | Preserve the citation and date; do not infer that it applies to the product until roles, purpose, data and service surface are classified. |
| **Legal design assumption** | A conservative product choice reduces risk but is not asserted to be legally required in every case. | Implement fail-closed and record the assumption in the applicable policy version. |
| **Professional-review blocker** | Applicability or balancing is unresolved and could materially change launch scope. | Do not launch the affected source class, claim class, feature or jurisdiction until qualified counsel and, where relevant, the DPO record the decision and evidence. |

The initial legal design assumes a France-established operator offering the
service in the EEA. Before any pilot, a versioned role-and-purpose matrix must
classify each surface separately: acquisition, evidence vault, search/index,
public certificate, reviewer administration, appeals, API exports, model
providers, user submissions, comments and any general-web search. It records
controller/processor or intermediary/editor roles, target jurisdictions,
purpose, data categories, recipients/transfers, legal basis, rights/licences,
retention and the professional decision that cleared the surface. “Research”,
“journalism”, “public task”, “open data”, “hosting” and “search engine” are never
self-declared exemptions.

## Assets and security objectives

| Asset | Required security property | Material failure |
| --- | --- | --- |
| Claim identity and scope | Integrity, version isolation, semantic-change detection | A certified claim silently changes meaning. |
| Evidence artifacts and manifests | Byte integrity, confidentiality where needed, lawful retention, availability | A different or prohibited artifact is presented as the reviewed one. |
| Evidence-use and origin graph | Integrity, dissent visibility, lineage uncertainty | Syndicated or fabricated sources appear independently corroborated. |
| Method profiles and policies | Authorized versioned change, rollback resistance, public applicability | Standards are weakened for a target case. |
| Reviewer identity and qualifications | Authentication, purpose limitation, conflict and delegation trace | A compromised, conflicted, or unqualified actor grants assurance. |
| Model, prompt, tool and index versions | Integrity, provenance, containment, reproducibility | An opaque provider change alters a decision path. |
| Certificate and status | Non-equivocation, integrity, freshness, revocability | Consumers see a false, stale, or split status as current. |
| Audit events and logs | Completeness within the system, tamper evidence, recovery | Material actions disappear or a false history is served. |
| Personal and sensitive data | Confidentiality, minimization, lawful access, correction/deletion behavior | Doxxing, inference, discrimination, or unlawful persistence. |
| Review capacity and queues | Availability, fair prioritization, visible coverage | Attackers exhaust review and turn “unreviewed” into apparent acceptance. |
| Signing, encryption, identity and timestamp keys | Confidentiality, integrity, availability, rotation and incident evidence | Forged certificates, inaccessible evidence, or unreliable historical signatures. |

## Actors

- ordinary submitters, sources, reviewers, experts, appellants, auditors, and
  API consumers;
- publishers, search/index providers, archives, model providers, identity
  providers, credential issuers, timestamp authorities, and transparency logs;
- financially or politically motivated propagandists, litigants, fraudsters,
  paper mills, public-relations networks, and coordinated groups;
- opportunistic and advanced technical attackers;
- malicious, coerced, careless, or conflicted insiders;
- compromised upstream services, keys, sources, accounts, software packages,
  parsers, or models; and
- the engine operator itself, which may be mistaken, captured, or tempted to
  present a stronger conclusion than its evidence permits.

## Trust boundaries

1. **Public input boundary:** claims, URLs, files, messages, and metadata carry
   no instructions or permissions.
2. **Network acquisition boundary:** the fetch broker has no internal network
   route or production secrets.
3. **Parsing boundary:** risky formats execute only in disposable, limited,
   non-privileged sandboxes.
4. **Model boundary:** models see purpose-limited data and can emit proposals,
   never authorization or canonical transitions.
5. **Canonical-write boundary:** only validated commands under current policy
   update the relational authority.
6. **Human-authority boundary:** role, qualification, conflict, independence,
   and expected revision are checked outside reviewer prose.
7. **Issuance boundary:** a small deterministic kernel alone authorizes a
   signed, versioned certificate. Protected payloads stay outside immutable
   logs; the public projection can be restricted, redacted or withdrawn while
   a minimal lawful issuance/tombstone record remains.
8. **Projection boundary:** search, vector, graph, analytics, and public views
   can lag or fail without becoming authority.
9. **Tenant and sensitivity boundary:** public, private, restricted-review, and
   legal-hold data use distinct access and key domains.
10. **External-accountability boundary:** timestamp/log receipts prove only
    their named cryptographic property and never bypass internal review.

## Threat register

The qualitative severities and residual ratings are proposal judgments to be
reassessed for a real deployment.

| Menace / Threat | Acteur / Actor | Mécanisme / Mechanism | Impact | Détection / Detection | Prévention / Prevention | Réponse / Response | Risque résiduel / Residual risk | Preuve du contrôle / Control proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TM-01` **Indirect prompt injection — critical** | Malicious submitter, source or publisher; compromised upstream content; attacker controlling retrieved text or media. | Hidden or visible instructions in HTML, PDFs, Office files, images, OCR, Unicode, metadata, retrieved text, or email cross the data/model boundary. | Models suppress evidence, invoke unauthorized tools, disclose data, or create a plausible poisoned proposal. | Compare rendered and extracted content; flag hidden or instruction-like material; use canaries; require every extracted fact to resolve to a locator. | Treat all content as data; deterministic tool authorization; quote-only extraction; no secrets in model context; least-capability adapters; network deny-by-default; separate control prompts and source bytes. | Quarantine the artifact and affected jobs; revoke exposed capability; investigate and replay every dependent case. | Novel semantic attacks remain likely even when known strings are blocked. | Zero unauthorized action or exfiltration on a multimodal adversarial suite; evidence must not be “the model ignored every injection.” [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [Greshake et al.](https://arxiv.org/abs/2302.12173). |
| `TM-02` **SSRF and hostile parsers — critical** | Malicious submitter or source host; opportunistic or advanced technical attacker; compromised content origin. | URLs target loopback, metadata services or private networks; redirects/rebinding evade validation; archives, PDFs, XML, images or Office files exploit parsers or exhaust resources. | Internal access, credential theft, code execution, denial of service, or corruption of acquisition/transformation results. | Network telemetry; sandbox resource limits; AV/CDR; parser-crash, timeout and egress alerts. | Isolated fetch broker; resolve and revalidate every hop; block private/link-local schemes and addresses; MIME/signature checks; decompression, CPU, memory and recursion limits; non-root disposable parser; content-disarm routes. | Terminate and preserve the sandbox; block the origin; rotate exposed credentials; rebuild from clean images; inspect dependent artifacts. | Parser zero-days and novel protocol smuggling remain. | Tests cover IPv4/IPv6 SSRF, DNS rebinding, redirects, `file:` URLs, metadata endpoints, zip/XML bombs and malformed corpora. [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), [File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). |
| `TM-03` **Retrieval and SEO poisoning — critical** | Propagandist, fraudster, PR network or coordinated group; compromised search/index provider or publisher. | Coordinated pages, quasi-duplicates, malicious passages, ranking manipulation, memory poisoning or source removal distort discovery. | Apparent convergence is manufactured and decisive counterevidence is hidden, allowing an over-strong dossier. | Detect ownership, infrastructure and text clusters; bursts; rank concentration; index drift; cross-provider and primary-source divergence. | Never equate rank with evidentiary weight; primary-source connectors; separate support/refutation routes; origin clustering; caps per lineage; snapshot indexes and query/candidate ledger; trust delay for unknown domains. | Freeze the index/query snapshot; remove or down-weight the origin cluster from eligibility; rerun research; restrict affected certificates pending review. | A well-funded campaign can resemble genuine adoption and may control multiple apparently independent channels. | Injected targeted documents must not reach a strong status even when highly ranked. [PoisonedRAG](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag). |
| `TM-04` **Provenance laundering — critical** | Deceptive publisher, signer, syndication network, paper mill, translator or data owner; careless researcher repeating a chain. | A signed lie, syndicated report, circular citation, translated summary or one dataset across many sites appears authentic and independent. | False origin independence inflates coverage and support; integrity or attribution is mistaken for factual truth. | Near-duplicate, chronology, citation, ownership, funding and data-lineage analysis; unresolved lineage alerts. | Separate byte integrity, signer identity, statement meaning and epistemic status; trace to observation/dataset; group common origins; preserve transformations and qualifications; unknown independence is not independence. | Mark origin assertion disputed/unknown; collapse derived sources; recompute coverage and assurance; review affected certificates. | Hidden common origins and authoritative sources lying remain possible. | Ten syndicated pages count as one lineage; a false but validly signed artifact remains factually unverified. C2PA explicitly separates provenance from truth ([C2PA explainer](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html)). |
| `TM-05` **Upstream API or software compromise — critical** | Malicious or compromised provider, maintainer, SDK/build pipeline or dependency; supply-chain attacker. | A provider returns plausible false data, changes semantics, replays stale data, leaks tokens, or ships a compromised SDK/build. | Systemic correlated evidence corruption, credential exposure, unsafe code execution, or silent semantic drift follows. | Canaries; cross-provider and primary-source divergence; schema/semantic drift alarms; release, dependency and key monitoring. | Treat APIs as untrusted evidence; validate schema, signature, version, freshness and invariants; retain raw responses; isolate credentials/providers; pin and verify software; reproducible/SLSA-informed release controls; manual/degraded routes. | Isolate provider and affected release; rotate credentials; fail to abstention or read-only; rollback and replay affected cases from retained inputs. | Schema-valid lies and correlated provider compromise can evade validation. | Chaos-test a false but structurally valid upstream response: it must not independently produce issuance. [NIST SP 800-161r1](https://csrc.nist.gov/pubs/sp/800/161/r1/final), [SLSA threats](https://slsa.dev/spec/v1.0/threats), [Codecov postmortem](https://about.codecov.io/apr-2021-post-mortem/). |
| `TM-06` **Audit-log tampering or split view — critical** | Privileged insider or operator; attacker holding log/signing keys; colluding log, monitor or witness operators. | Events are omitted, deleted, reordered, backdated or forked; stolen keys sign false checkpoints. | Consumers and auditors receive false histories, equivocation is hidden, and affected certificates cannot be reliably audited. | Sequence and consistency checks; external checkpoint comparison; missing-event/fork alerts; restore and erasure exercises. | Transactional domain events; retention-scoped WORM/off-site copies with no unnecessary personal/protected payload; revocable opaque references; role separation; HSM-backed keys; verifiable append-only structure; independent monitors/witnesses; multi-operator receipts at high tier. | Suspend issuance; revoke/rotate keys; preserve independent checkpoints; reconstruct history; mark affected certificates unauditable; notify and replay. | Append-only systems preserve lies and unlawful data; colluding logs or witnesses can agree on a false view. | Inject deletion, reordering, truncation and divergent views, then erase a protected payload without breaking detection or leaving a dictionary-testable public commitment. [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html), [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html), [EDPB blockchain guidance](https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202502_blockchain_v2_en.pdf). |
| `TM-07` **Insider, conflict, or institutional capture — critical** | Malicious, coerced, careless or conflicted reviewer, administrator, policy owner or issuer; captured institution; colluding privileged actors. | Authorized people alter evidence, thresholds, assignments, public status, access or correction priority, possibly through formally valid actions. | Selected cases receive improper assurance, contrary evidence is delayed, access is abused, or corrections disappear behind legitimate credentials. | Access/export/change analytics; policy/rule diffs; reviewer/domain anomalies; conflict and assignment checks; external sample audits. | Least privilege and just-in-time access; separation of author, reviewer, policy owner and issuer; two-person control; protected policy versions; rotation/sortition; conflict disclosure and recusal; independent audit/whistleblowing channel. | Suspend access and issuance authority; preserve evidence outside the affected chain; investigate, independently re-review and disclose affected decisions. | Coercion, aligned incentives and institutional conflicts may be invisible; a quorum may collude. | Demonstrate that no one administrator can alter evidence/policy and issue the same certificate; exercise collusion and emergency-access scenarios. [SEI insider-threat guide](https://www.sei.cmu.edu/library/common-sense-guide-to-mitigating-insider-threats-seventh-edition/). |
| `TM-08` **Privacy leakage and source harm — critical** | Malicious or careless operator, reviewer, tenant or downstream consumer; compromised model/provider/account; attacker probing cross-tenant state. | Personal, political, health, location, whistleblower, minor or confidential data enters prompts, logs, embeddings, public receipts, exports or cross-tenant retrieval. | Doxxing, reidentification, discrimination, retaliation, unlawful disclosure or persistent provider copies harm subjects and sources. | DLP/canaries; cross-tenant and reidentification tests; export anomaly detection; data-access audit; deletion reappearance monitoring. | Purpose/lawful-basis record; minimization and classification; access outside LLMs; encryption/key separation; pseudonymization/redaction; local sensitive processing; provider no-training controls; retention/deletion workflows. | Block access/export; revoke links, tokens and keys; purge and reindex where lawful; restrict dependent views; notify and protect affected people under the incident lane. | Auditability conflicts with erasure, and inference/reidentification risk persists after minimization. | Cross-tenant isolation tests, deletion/retention receipts, backup-restore suppression and deployment-specific DPIA. [NIST Privacy Framework](https://www.nist.gov/privacy-framework/privacy-framework), [C2PA security considerations](https://spec.c2pa.org/specifications/specifications/2.4/security/Security_Considerations.html). |
| `TM-09` **Rights, licence, and retention laundering — critical** | Careless or malicious submitter, rights broker, crawler/operator, model provider or downstream exporter; falsely represented licensor. | Public accessibility, TDM exception, licence label, citation or hash is promoted into permission to retain, transfer, publish or export an artifact. | Protected works, press publications, database contents or personal data enter permanent vaults/open corpora and unlawful derivatives propagate. | Licence/terms/reservation drift monitor; cumulative extraction counters; rights-holder notice lane; deletion deadlines; retention/export audit. | Versioned rights manifest per artifact and operation; source-class allowlist; cumulative database-extraction accounting; reservation/terms capture; ephemeral mining zone; rights-cleared vault; excerpt/export gate; no bypass of authentication, paywalls or controls. | Quarantine source class; stop crawl/transfer/export; purge unlawful derivatives where required; withdraw dependent public projections; reassess certificates and notify recipients. | Ownership, authority to license, conflict of laws and status of derived representations can remain uncertain. | Prove access, TDM, retention, quotation and redistribution fail independently, and destroy the general French TDM copy at the policy deadline. [DSM Directive](https://eur-lex.europa.eu/eli/dir/2019/790/oj), [CPI L122-5-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044363192), [CPI L342-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006279247). |
| `TM-10` **Defamation, privacy, or presumption-of-innocence amplification — critical** | Malicious submitter, careless analyst/operator, model-generated publisher, downstream API consumer or coordinated accuser. | A polished verdict, summary, autocomplete result, snippet, API response or repeated allegation identifies and harms a person despite attribution, questions or “contested” wording; a true fact may intrude on private life. | Reputation, safety, privacy and fair-process harms are amplified by apparently authoritative distribution and detached screenshots. | Named-entity/high-harm classifier; subject/counsel review queue; screenshot/snippet audit; complaint, right-of-reply and downstream monitoring. | Exclude private/criminal allegations in v1; no global person score; claim-specific wording/status; human/legal pre-publication gate; subject response where safe; minimal excerpt; no autonomous public issue; independent correction and urgent restriction. | Immediately restrict plausible serious-harm projections; preserve lawful evidence; route independent legal/editorial review; correct, notify and propagate. | Serious investigation and prudent wording reduce but do not eliminate publication and private-life risk. | Red-team indirect identification, dubitative wording, a true private fact, an unproven criminal allegation and a detached screenshot. [1881 Act Article 29](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006419790), [Civil Code Articles 9 and 9-1](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006117610/?anchor=LEGIARTI000006419316). |
| `TM-11` **Rights-request or appeal suppression — high** | Malicious/careless operator or insider; queue attacker; misconfigured automation; missing or non-acknowledging recipient. | Identity friction, queue starvation, merged legal/factual workflows, automation, missing recipients or immutable payloads block timely access, correction, erasure, restriction, objection, reply or appeal. | Rights expire unanswered, unlawful use persists, downstream copies reappear, and legitimate challenges lose effective remedy. | Deadline/backlog/reversal metrics; recipient acknowledgements; restore and reappearance monitoring; statutory-clock alarms. | One intake with separately clocked legal lanes; proportional identity checks; object/derivative/recipient index; restriction pending review where required; independent reviewer; reasoned decision/human override; deletion/propagation receipts. | Escalate statutory clocks; freeze affected uses; notify requester and external recourse; repair downstream state; audit missed recipients and restore paths. | Fraudulent requests, identity uncertainty and conflicting rights still require judgment. | Complete an Article 18 restriction, Article 19 propagation, restore-safe erasure and French online right of reply without conflating remedies. [GDPR Articles 12–22](https://eur-lex.europa.eu/eli/reg/2016/679/oj), [LCEN Article 1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614). |
| `TM-12` **Sybil, brigading, and reviewer collusion — high** | Coordinated group using fake/rented identities; bribed, captured or strategically inactive reviewers; identity provider abuse. | Synchronized ratings, strategic nonparticipation, coordinated review or appeal monopolization manufacture legitimacy and suppress objections. | Governance appears independent while evidence/review coverage is captured; minority or dissent routes are denied. | Coordination/timing/text/infrastructure graph; cohort counterfactuals; influence concentration; identity anomalies; random audit panels. | Identity assurance proportional to harm; rate/maturity limits; clustered influence caps; random qualified assignment; hidden initial review; independent adjudication; votes never determine evidence strength. | Freeze affected state; invalidate coordinated batch; suspend actors; rerun with fresh independent reviewers; preserve dissent and disclose impact. | Strong identity damages privacy, real movements resemble attacks, and collusion can occur off-platform. | Simulate coordinated minorities and require no direct truth-status movement from vote count. [Douceur, Sybil Attack](https://www.microsoft.com/en-us/research/wp-content/uploads/2002/01/IPTPS2002.pdf). |
| `TM-13` **Fake research, data, and peer review — high** | Fraudulent researcher, paper mill, author/reviewer ring, compromised journal/publisher or fabricated-data vendor. | Fabricated patients, images, statistics, authors, citations or reviews pass prestigious publication filters. | False studies contaminate synthesis, inflate independence and can drive harmful scientific or policy certificates. | Crossmark/retraction/publisher monitoring; duplicate data/images; impossible chronology/statistics; author/funding/reviewer networks. | Prestige/peer review never suffice; DOI/version/correction/retraction checks; data/code/protocol availability; statistical/image forensics; independent replication and method review; ceiling when data cannot be audited. | Mark dependencies `needs_review`/stale; suspend affected issuance; investigate origin; remove inadmissible uses; replay every dependent certificate. | Coherent fraud may remain undetectable and confidentiality may block raw-data audit. | Include fabricated-paper cases and refuse strong assurance when raw evidence is inaccessible. [COPE/STM paper-mills report](https://members.publicationethics.org/sites/default/files/paper-mills-cope-stm-research-report.pdf), [Surgisphere retraction](https://pubmed.ncbi.nlm.nih.gov/32511943/), [Crossref Retraction Watch](https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/). |
| `TM-14` **Source or identity impersonation — high** | Typosquatter, state/financial influence operator, forged author, cloned publisher or attacker controlling an official account/domain. | Homographs, cloned sites, forged authors, copied branding or compromised official endpoints create false attribution. | Malicious content acquires trusted identity, contaminating artifact origin, evidence use and downstream certificates. | Domain-age/lookalike monitoring; TLS/CT/DNS/history checks; credential/revocation change alerts; out-of-band confirmation. | Canonical identity/endpoint registry; direct publisher acquisition; DOI/registry resolution; signatures; two known channels for critical attribution. | Label impersonation; block endpoint/artifact; notify legitimate entity; revoke affected dependencies; require fresh acquisition and review. | A genuine endpoint, credential or registry can itself be compromised. | Test corpus includes typosquats, homographs and a compromised-authority case. [US DOJ Doppelganger disruption](https://www.justice.gov/archives/opa/pr/justice-department-disrupts-covert-russian-government-sponsored-foreign-malign-influence). |
| `TM-15` **Deepfake and synthetic media — high** | Fraudster, harasser, influence operator, compromised media channel or malicious submitter. | Generated/edited audio, video or image, replay, staged media or false context impersonates a person or event. | False attribution or event evidence harms people and creates fabricated corroboration. | Reverse search; temporal/geolocation checks; multiple forensic methods; channel confirmation; provenance/credential validation. | For high harm require original, origin/chain evidence, context verification and independent corroboration; validate C2PA when present; detector output or credential absence is never dispositive. | Mark authenticity contested; restrict visibility; seek original and independent channels; withdraw or review dependent certificates. | Genuine unsigned and falsely signed media remain possible; detectors drift and can be evaded. | Hard cases must abstain; exercise genuine-unsigned, falsely signed and multimethod-disagreement cases. [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf), [Hong Kong deepfake fraud statement](https://www.info.gov.hk/gia/general/202406/26/P2024062600192.htm). |
| `TM-16` **Review denial of service — high** | Spammer, coordinated group, disgruntled appellant or attacker crafting oversized/complex cases; legitimate surge as a non-malicious stressor. | Floods, huge files, near-duplicate claims, appeals or deliberately complex cases exhaust experts and budget. | Unsafe shortcuts, starvation of high-harm cases and invisible backlog turn unreviewed work into apparent acceptance. | Arrival, age, service-time, cost, duplication, actor/topic concentration and queue-SLO metrics. | Quotas and file/cost limits; deduplication; harm-based queues with protected random capacity; explicit budgets; `unreviewed`/`overloaded` states; no timeout-to-verified transition. | Degrade explicitly; rate-limit abusive clusters; protect high-harm capacity; add authorized surge routing; publish backlog and coverage gaps. | Legitimate events can exceed all capacity, and prioritization itself carries editorial power. | Load tests at 10x/100x preserve critical SLOs and explicit non-conclusion for every unreviewed case. |
| `TM-17` **Automation bias and false-authority UX — high** | Product/operator or downstream integrator; model-generated presentation; user/reviewer cognitive bias; attacker exploiting authority cues. | Polished certificates, green badges, numeric scores or “AI verified” wording are presented or interpreted as universal truth. | Users and agents over-trust wrong or stale results, reviewers anchor, and downstream decisions magnify errors. | Comprehension and wrong-label experiments; behavior analytics; badge/copy lint; appeal, reversal and downstream-decision studies. | Ban unqualified truth badges; expose issuer, scope, date, dimensions, evidence and limits; active high-harm review; separate provenance from factual support; appeal/history routes. | Remove or weaken public certification and misleading cues; notify affected consumers; retrain reviewers; restrict integrations if misunderstanding persists. | Any credential can create authority even with technically correct qualifiers. | Meet predeclared comprehension thresholds and pass a false-label harm comparison before launch. [Incorrect warning-label study](https://pubmed.ncbi.nlm.nih.gov/40263336/). |
| `TM-18` **Cryptographic key or trust-root compromise — high** | External attacker, malicious insider, compromised KMS/HSM/TSA/log/CA/OIDC provider or root delegate. | Stolen signing, timestamp, log, identity or root keys forge signatures, timestamps, identities, checkpoints or trust updates. | Forged certificates/status, false historical time, impersonated actors and split trust views become apparently valid. | Key-use anomaly detection; transparency monitors; revocation/status feeds; independent checkpoint comparison; credential and trust-bundle diff alarms. | HSM/KMS; offline threshold root; scoped short-lived keys; algorithm agility; frozen trust snapshots; independent TSA/log/witnesses for high tier; rehearsed rotation/reissue. | Restrict the affected interval; revoke/rotate; preserve external evidence; investigate boundary; publish status; revalidate and reissue only after substantive review. | The compromise interval may be unknowable and prior signatures may become indeterminate. | Key-compromise/rotation/rebootstrap drills; RFC 3161 compromise handling ([RFC 3161 section 4](https://www.rfc-editor.org/rfc/rfc3161.html#section-4)); independent verifier and Sigstore threat cases ([threat model](https://docs.sigstore.dev/about/threat-model/)). |

## Non-bypassable security invariants

1. Untrusted content cannot grant a capability, change a policy, or authorize a
   tool.
2. The network fetcher, parsers, models, projection builders, and public API do
   not possess direct certificate-issue authority.
3. Every evidence statement resolves to exact acquired input and versioned
   transformation; every missing link lowers the allowed status.
4. A signature or trust-list result never changes the epistemic dimension by
   itself.
5. Source independence is assessed at origin and control level, not URL count.
6. No single actor may propose, independently review, alter the applicable
   policy, and issue the same material certificate.
7. Changed evidence, key status, source status, or policy creates review work;
   it does not automatically produce the opposite conclusion.
8. Missing, delayed, saturated, or failed review remains visibly unresolved.
9. Projection lag is surfaced and can never overwrite canonical status.
10. Every high-severity control has an injected-failure test, an observable
    alarm, an owner, and a recovery action.

## Harm tiers and launch exclusions

| Tier | Example | Initial publication rule |
| --- | --- | --- |
| `T0 bounded-low-harm` | Public document attribution, checksum, deterministic calculation, lookup in a declared complete public register | During V0, MES and the first pilot, eligible only after every per-case human authority required by the claim-family profile plus an additional sampled independent audit. A later major profile may replace one judgment with a validated deterministic predicate only through the D10 promotion gate. |
| `T1 ordinary-public` | Non-sensitive current public statistic with stable official source and limited consequence | Independent human evidence review required until prospective validation supports a narrower automated route. |
| `T2 consequential` | Public-policy, corporate, historical, scientific association, disputed identity, or material reputation claim | Qualified independent reviewers, explicit counterevidence search, appeal, monitoring, and no autonomous issue. |
| `T3 high-harm` | Medical treatment, legal rights/advice, financial action, safety, active election, conflict, criminal allegation, private person, minor, protected characteristic, doxxing risk | Excluded from first public product. Research/private decision support only under specialist governance and legal/safety review. |
| `T4 prohibited` | Unsupported private allegation, targeted harassment, secret exposure, identity inference without legitimate need, content where publication creates disproportionate danger | Refuse processing or preserve only a minimal protected incident record where required. |

Tier assignment considers both claim content and foreseeable use. A low-risk
fact embedded in an eligibility, policing, healthcare, employment, credit, or
legal decision inherits the higher context.

## Privacy and data-protection architecture

The observed GDPR rules include lawfulness, purpose limitation, minimization,
accuracy, storage limitation, integrity/confidentiality and accountability
([Articles 5 and 6](https://eur-lex.europa.eu/eli/reg/2016/679/oj)). A public web
page can still contain personal data; public accessibility is not a legal basis.
Indirect collection can trigger Article 14 information duties. Special-category
data needs both an Article 6 basis and an Article 9 exception; “manifestly made
public” is narrow and not equivalent to “found online”. Criminal-conviction and
offence data has the separate Article 10 restriction, supplemented in France by
[Article 46 of the Data Protection Act](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037823133).

These design requirements are conservative assumptions until the
role-and-purpose matrix and professional review resolve applicability:

- create a processing record before acquisition for every
  `purpose × data category × operation × recipient × retention` combination;
- record the candidate Article 6 basis and, where applicable, exact Article 9
  condition or Article 10 authority; consent, contract or “public interest” for
  one actor never silently covers third-party subjects;
- complete a documented necessity and balancing test before relying on
  legitimate interests, including reasonable expectations, source context,
  vulnerable people, reputational harm, model memorization and inability to
  exercise rights; legitimate interest is not the default because collection is
  useful ([CNIL AI guidance](https://www.cnil.fr/fr/base-legale-interet-legitime-developpement-systeme));
- collect against a declared source inventory and search protocol instead of a
  general people crawl; exclude private spaces, minors, health, sexuality,
  genealogy, doxxing and accusation-heavy sources by default; capture and
  enforce source opposition ([CNIL web-scraping guidance](https://www.cnil.fr/fr/focus-interet-legitime-collecte-par-moissonnage));
- distinguish `person made statement`, `allegation exists`, `evidence supports`,
  `contested`, `restricted`, `stale` and `corrected`; source fidelity does not
  convert an allegation into an accurate biographical fact;
- avoid global scores for a person's honesty, credibility, reliability or
  political “camp”; evaluate an evidence use in one claim, context and time;
- isolate identities from public reviewer output and minimize reviewer,
  whistleblower and source data independently of claim evidence;
- send only necessary, redacted inputs to model providers under an applicable
  processor/transfer contract and no-training/no-secondary-use control; do not
  train a persistent v1 model on the live corpus where erasure cannot be proved;
- implement access, rectification, erasure, restriction, objection and, where
  applicable, portability and automated-decision safeguards as object-level
  workflows, not a support mailbox; and
- perform a DPIA before the public pilot. Scoring/evaluation, source matching,
  large-scale collection, sensitive data, vulnerable people, innovative
  technology and reputational consequences make “DPIA likely required” the
  prudent starting assumption, not a final legal conclusion
  ([CNIL DPIA criteria](https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd)).

Retention and visibility use different, independently enforced planes:

| Plane | Privacy and deletion rule |
| --- | --- |
| Acquisition/TDM scratch | Encrypted, isolated and TTL-bound. Delete inputs and derived temporary representations when the authorized processing ends; emit a deletion receipt. |
| Evidence vault | Contains exact bytes only when a recorded purpose and rights basis permits retention. Bytes are immutable/write-once while lawfully retained; controlled deletion may erase the payload or destroy its key while leaving only the minimal permitted tombstone. An artifact version is never mutated in place. |
| Canonical records | Store the minimum claim, provenance, rights, scope and status metadata needed for the current purpose. Personal excerpts and embeddings remain separately addressable and deletable. |
| Audit log or external commitment | Store event type, policy version, random object identifier and non-personal batch commitment, not source content, subject identity or a guessable hash. A hash, pseudonym or encrypted payload is not automatically anonymous. |
| Public certificate projection/export | Publish only the current, rights-cleared, minimized view. Withdrawal, correction, noindex and depublication must propagate to search, caches, feeds, share cards and export consumers. |
| Restricted legal hold and backup | Separate key/access domain, documented legal basis, exact scope, owner, review/expiry date and restoration suppression list. A legal hold or backup never becomes ordinary public retention. |

“Nothing is deleted” is therefore not an admissible invariant. Erasure is also
not automatic: Article 17 contains expression/information, legal-obligation,
research/archiving and legal-claims exceptions whose application requires a
case-specific decision. Whatever the outcome, Article 18 restriction and
Article 19 recipient propagation must remain possible. Erasure tests cover raw
objects, relational fields, lexical/vector indexes, caches, replicas, model
provider copies, exports and backup restore; a non-personal tombstone may record
that a policy action occurred without preserving the deleted substance.

Solely automated decisions are not automatically present merely because AI
assists verification. Article 22 becomes a blocker when a score or certificate
determines or strongly influences a legal or similarly significant outcome.
The API therefore prohibits employment, credit, insurance, healthcare,
education, policing, migration, benefits or equivalent automatic eligibility
uses by default. Any exception needs meaningful human review with real override,
the evidence and limitations visible, and the person's ability to state their
view and contest the decision. A contractual disclaimer is insufficient if the
actual integration depends on the score
([CJEU C-634/21, SCHUFA](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62021CJ0634)).

If Parallax position/value signals are later connected to this engine, their
claimed anonymity is a separate professional-review blocker. Political or
philosophical positions may be Article 9 data, and account gating, one-revisable
vote enforcement, before/after linkage, segmentation or small cells can make a
nominal aggregate linkable. No server-side implementation launches until the
DPIA proves the lawful basis/Article 9 condition, aggregation threshold,
unlinkability, anti-abuse method, retention and erasure path.

Row-level policies, pseudonymization and encryption are defense layers, not
proof of lawful processing. Model providers, embeddings, logs, backups,
monitoring, support exports and public digests all remain in the data flow.

## Copyright, database, access, and redistribution

The engine must separate lawful access, analysis, retention, quotation, and
redistribution. They are not one permission.

- Under the observed EU rule, Directive 2019/790 Article 3 covers qualifying
  research organisations and cultural-heritage institutions doing scientific
  research with lawful access; Article 4 can cover any person only when access
  is lawful and rights have not been appropriately reserved, including through
  machine-readable means for public online content
  ([Directive 2019/790](https://eur-lex.europa.eu/eli/dir/2019/790/oj)).
- The initial legal design assumes Parallax is **not** an Article 3 research
  organisation. French Article 4 transposition permits copies for general TDM
  under its conditions but requires them to be secured and then destroyed at
  the end of the mining operation
  ([CPI L122-5-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044363192),
  [R122-27–R122-28](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069414/LEGISCTA000045960683/)).
  A continuously living product cannot define the mining operation as endless
  merely to keep protected copies. Whether an embedding or other derived
  representation must also be destroyed is a professional-review blocker.
- `robots.txt` is neither an access licence nor the only possible rights
  reservation. The rights broker captures the applicable user-agent/path
  response, HTTP/HTML metadata, work-level notices, terms, contract, licence and
  direct rights-holder notice with date and version. Any applicable reservation
  blocks TDM by default; absence of a reservation clears only that condition,
  not retention or publication. Authentication, paywalls, CAPTCHAs and other
  technical controls are never bypassed.
- Short quotation is an independent publication analysis. French law requires
  author and source attribution and a short extract justified by the critical,
  polemical, pedagogical, scientific or information purpose of the incorporating
  work; there is no universally safe word count
  ([CPI L122-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048603495)).
  The UI shows the minimum locator-bounded excerpt and explains what it supports;
  it does not publish whole screenshots, figures, pages or serial excerpts that
  substitute for the source without a separate licence/review.
- Press publications can carry neighbouring rights; hyperlinks, isolated words
  and some very short extracts do not create a general right to reconstruct or
  substitute for the article
  ([CPI L218-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038826732),
  [L211-3-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038826394)).
- Database makers may prohibit extraction/reuse of a substantial part, and
  repeated or systematic extraction of insubstantial parts that exceeds normal
  use. Counters therefore aggregate extraction by database, origin, period and
  purpose rather than treating each request independently
  ([CPI L342-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006279247),
  [L342-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006279250)).
- A hash, signature, C2PA manifest, PROV record, or transparency receipt grants
  no content license.

Each artifact version therefore records access route, terms/license snapshot,
rights holder/provenance uncertainty, rights reservations, purpose, jurisdiction,
permitted transformations, model-provider transfer, retention, quotation,
redistribution, public excerpt, audit access, expiry and deletion policy.
Licences are recorded by exact version and right; an open licence cannot grant
rights the licensor did not hold and does not neutralize personal-data duties.

Rights enforce three physically separate spaces:

1. **Ephemeral mining zone:** encrypted, access-restricted copies with an
   operation-specific deadline and destruction receipt.
2. **Evidence vault:** complete artifacts only when licence, public domain,
   authorization or another professionally cleared basis permits retention.
3. **Public certificate/export:** original annotations, links, lawful metadata,
   digest and only the minimum rights-cleared excerpt; third-party bytes do not
   inherit the corpus licence.

Every certificate states `byte_replayable`, `licensed_retrieval`,
`live_retrieval_only`, `source_unavailable`, or `rights_restricted`. When exact
bytes cannot lawfully be retained or shown, reproducibility and assurance are
capped rather than silently implied. Deployment counsel must approve each source
class, extraction template, press use, quotation pattern, database budget,
retention basis and corpus export before ingestion at scale.

## Publication, personality rights, and reply

Under the observed French rule, an allegation or imputation of fact harming the
honour or consideration of an identifiable person can be defamatory even if it
is dubitative, attributed to another source or does not name the person
([1881 Act Article 29](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006419790)).
Proof of truth is not available in the same way for private-life imputations
([Article 35](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044568131));
privacy and presumption of innocence also have independent protection
([Civil Code Articles 9 and 9-1](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006117610/?anchor=LEGIARTI000006419316)).

Consequently, a source citation, uncertainty label or correct quotation never
auto-clears publication. For any identifiable-person claim above T1, the
publication gate records public-interest purpose, seriousness of investigation,
exact factual basis, counterevidence, procedural status, timeliness, necessity,
privacy/safety impact, subject contact where safe, wording proportionality and
named editorial/legal approver. Private allegations, criminal allegations,
minors, location/doxxing, special-category data and major professional harm stay
outside v1 public issuance. A non-response is never evidence of guilt.

The public site must identify its publisher and director of publication as
applicable. French online law gives every named or designated person a distinct
right of reply, without prejudice to correction or deletion: request within
three months and insertion by the director within three days, free of charge
([LCEN Article 1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614),
[Decree 2007-1527](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000428279)).
Counsel must confirm the exact procedure and whether a particular native comment
surface affects it. The product nevertheless provides a visible reply endpoint,
records the statutory clock, and links an accepted reply directly to every live
projection of the challenged content.

## DSA and AI Act applicability boundaries

The DSA is surface-specific, not a general “fact-checker law”. Its definitions
distinguish hosting, an online platform and an online search engine
([Regulation 2022/2065, Article 3](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng)).
The initial design classifies:

- operator-authored certificates as `editorial_content`; intermediary safe
  harbours do not protect the operator's own editorial information;
- privately stored claims/evidence submitted by recipients as a potential
  `hosting_service`;
- contributions, comments or evidence publicly disseminated at the submitting
  recipient's request as a potential `online_platform`; and
- a service that searches, in principle, all websites or all websites in a
  language as a potential `online_search_engine`.

Those are legal design hypotheses, not classifications. Counsel must classify
each surface before public beta. If hosting applies, the architecture can enable
DSA points of contact, terms describing moderation/automation/human review,
Article 16 notice-and-action, Article 17 statements of reasons, Article 18
life/safety reporting and Article 15 transparency. If online-platform duties
apply, it can additionally enable free internal complaints with qualified human
supervision and never a solely automated resolution, out-of-court dispute
information, trusted-flagger priority only for officially designated entities,
and anonymized transparency-database export. A micro/small-enterprise exemption
from some platform duties is never an architecture dependency. Epistemically
wrong, policy-violating and legally illegal remain three different decision
grounds.

The AI Act status below reflects the law as available on 2026-08-12. The Act's
general application began on 2026-08-02, but Regulation (EU) 2026/1744 changed
material dates: high-risk Sections 1–3 of Chapter III apply from 2027-12-02 for
Annex III systems and 2028-08-02 for Annex I product systems
([consolidated AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02024R1689-20260727),
[amending Regulation 2026/1744](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32026R1744)).
Article 50 transparency applies now; systems placed on the market before
2026-08-02 have until 2026-12-02 for Article 50(2) synthetic-output marking.

A general verification system is not automatically high-risk and an
application using a third-party LLM is not automatically the provider of a GPAI
model. Intended purpose and actual chain roles control the analysis. The product
therefore versions provider/deployer/GPAI-role assessment, intended purpose,
marketing claims, allowed/prohibited uses and customer context. Police evidence,
migration/asylum evidence, judicial fact/law research, employment, education,
credit, essential services, insurance/health and emergency-service use are
professional-review blockers because they can enter Annex III or Article 22
territory. Profiling natural persons also defeats the limited Article 6(3)
high-risk derogation.

At minimum, the interaction informs users when they are dealing with AI unless
that is obvious, preserves available machine-readable synthetic-content marking,
and records `ai_assisted`, provider/model/version, automated stages, human
stages, editorial owner and review depth. AI-generated or manipulated text
published to inform the public on matters of public interest is visibly
disclosed unless counsel confirms a genuine Article 50(4) human-review/editorial-
responsibility exception. That exception does not itself remove a provider's
Article 50(2) machine-readable marking duty. Reviewer training and AI literacy,
model inventory, change control and incident/evaluation evidence remain required
even where the system is not high-risk.

## Appeals, correction, and rights requests

One intake may route a request, but it must not collapse distinct legal or
epistemic remedies. The system opens separately clocked, cross-linked cases for:

1. a **GDPR data-subject request (DSAR)**: information/access, rectification,
   erasure, restriction, objection, portability where applicable, or Article 22
   intervention;
2. a **factual appeal**: claim identity, quotation, counterevidence, method,
   status, freshness or correction;
3. a **French publication remedy**: correction, deletion, privacy/presumption-
   of-innocence complaint or statutory right of reply;
4. a **DSA case if applicable**: notice of alleged illegality, statement of
   reasons, internal platform complaint or out-of-court information; and
5. a **rights-holder request**: access/TDM reservation, copyright, press,
   database, licence, quotation, retention or redistribution challenge.

An appellant may challenge:

- identity or wording of the claim;
- authenticity, citation fidelity, applicability, or rights of evidence;
- omitted counterevidence or false independence;
- method profile, reviewer competence, conflict, or inconsistent application;
- current status, expiry, public presentation, personal data, or safety harm;
  and
- correction propagation or refusal to act.

Each case has a stable versioned identity, but protected request content is not
immutable. It records the minimum standing/identity evidence, legal lane,
grounds, affected objects, requested remedy, conflicts, independent assignee,
decision, rationale, statutory/product clocks and notice receipts in erasable or
restricted storage. A non-personal event/tombstone can remain after lawful
erasure.

The common state machine is:

`received → identity_checked_proportionately → objects_and_derivatives_located
→ restricted_pending_review_when_required → accepted_or_rejected_with_reason
→ corrected_erased_replied_or_reinstated → recipients_and_indexes_updated
→ requester_informed`.

GDPR requests normally use the one-month response clock, with only the stated
extension and notice conditions; Article 18 restriction is available while
accuracy or an objection is examined, and Article 19 propagation reaches known
recipients. French right of reply uses its separate three-day publication clock.
DSA platform complaints, when applicable, remain free, timely, reasoned and not
solely automated. Rights-holder and factual appeals use published service levels
but never overwrite statutory clocks.

Urgent restriction is available for plausible serious harm without prejudging
the final epistemic or legal outcome. Restriction has an explicit owner, scope,
review date and appeal; it is not a silent shadow ban. The signed certificate
snapshot remains attributable, but public serving, indexability and export are
withdrawn or superseded, and protected payload is erased where required. The
subject or appellant receives a reasoned outcome and the appropriate CNIL,
judicial, DSA or other external route.

## Professional-review blockers before launch

The following are release blockers, not backlog items:

1. Counsel and the DPO approve the entity, target jurisdictions and per-surface
   controller/processor, editor/intermediary, DSA, AI Act and model-chain roles.
2. Every processing purpose has an Article 6 analysis, any Article 9 condition
   or Article 10 French authority, Article 14 information route, retention and
   transfer/vendor contract. The DPIA is complete and, if residual risk remains
   high, prior supervisory-authority consultation is resolved.
3. Counsel decides whether any claimed journalism, scientific-research, public-
   task or TDM status actually applies. Until then, the scientific TDM retention
   exception and French journalism derogations are unavailable assumptions.
4. Each source class has an approved access/TDM/retention/quotation/press/
   database/export matrix, including robots/metadata/terms handling, cumulative
   extraction budgets, destruction deadlines and licence provenance.
5. French publication counsel approves publisher/director details, pre-
   publication review for person claims, defamation/privacy/presumption-of-
   innocence policy, subject contact, emergency restriction, correction and
   right-of-reply procedure.
6. Product counsel classifies user submissions, comments, public contributions
   and search. Any hosting/platform surface has the applicable DSA notice,
   reasons, complaint, transparency and reporting controls before activation.
7. AI counsel confirms provider/deployer/GPAI roles, Article 50 marking and
   disclosure per output surface, and blocks Annex III/high-impact client uses
   until their separate conformity and Article 22 paths are cleared.
8. End-to-end exercises prove deletion/restriction across vault, relational
   data, embeddings, indexes, caches, providers, exports and backups; recipient
   propagation; French right of reply; DSA appeal if enabled; and certificate
   withdrawal without exposing protected content in immutable logs.

The most defensible first slice is restricted to non-personal, non-sensitive,
low-harm institutional claims based on a small allowlist of official or
rights-cleared sources, with targeted retrieval, erasable storage, no person
score, no consequential downstream decision, human correction and no public
user-content dissemination.

## Incident behavior

Incident handling follows preparation, detection, response, and recovery rather
than treating a correction as ordinary content editing, consistent with the
current NIST incident-response guidance
([NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)).

Every material incident must be able to:

1. stop acquisition, model tools, issue, or public serving independently;
2. preserve forensic artifacts outside the affected trust boundary;
3. identify certificates by input, source, origin, model, policy, reviewer,
   key, provider, parser, index, and time range;
4. bulk-mark them restricted or review-required without changing history;
5. rotate credentials and trust bundles;
6. rebuild canonical and projected state from known-good evidence;
7. notify affected users and downstream consumers with receipts; and
8. document residual uncertainty and the proof required to resume each tier.

### Personal-data breach lane

A suspected confidentiality, integrity, availability, unauthorized-access, or
unlawful-disclosure event involving personal data opens a separate
`PersonalDataBreachCase`; it is not handled only as a product correction. The
case records detection time, controller awareness time, affected systems,
categories and approximate numbers of people and records, likely consequences,
containment, evidence, risk assessment, DPO and counsel decisions, authority,
owner, clock, notices, and delivery receipts.

Under GDPR Article 33, the controller notifies the competent supervisory
authority without undue delay and, where feasible, within 72 hours after
becoming aware of a breach, unless the breach is unlikely to result in a risk
to natural persons; delay reasons must be recorded. Article 34 requires
communication to affected people without undue delay when the breach is likely
to result in a high risk, subject to its stated exceptions. The DPO and counsel
own the deployment-specific applicability and risk decision; engineering does
not infer “no notification” from successful containment. Processor-to-
controller notice, regulator communication, data-subject communication, public
status changes, and ordinary incident communication remain separate receipts
([GDPR Article 33](https://eur-lex.europa.eu/eli/reg/2016/679/art_33/oj),
[GDPR Article 34](https://eur-lex.europa.eu/eli/reg/2016/679/art_34/oj)).

The 72-hour rule is a legal outer clock where applicable, not the response SLO.
A deployment cannot pass the privacy gate until counsel/DPO approve the
jurisdictional runbook and a timed exercise proves awareness capture, risk
decision, regulator package, data-subject threshold decision, multilingual
notice, evidence preservation, and downstream-recipient coordination.

## Decisions and falsifiers

| Decision | Recommendation | Confidence | Counter-hypothesis | Evidence that reverses or restricts it |
| --- | --- | --- | --- | --- |
| Public high-harm conclusions | Exclude from first product. | High | Strong controls make narrow high-harm issue acceptably safe and uniquely valuable. | Independent legal/domain/safety review plus prospective evaluation meets the declared harm budget, reviewer supply, incident, appeal, and comprehension gates. |
| Remote untrusted parsing | Broker and sandbox outside canonical plane. | High | Managed parsers alone are sufficient. | A documented service architecture proves equivalent network isolation, no secret exposure, bounded resources, provenance, and incident recovery under adversarial testing. |
| Transparency | Use external witnesses only for issued commitments, not source content. | High | Fully public logs maximize accountability without material privacy harm. | Formal privacy/threat analysis plus user testing and legal review show public fields cannot reveal or enable sensitive inference. |
| Reviewer identity | Verify competence/independence while minimizing public identity. | Medium-high | Full public identity is required for accountability. | Threat and trust research shows named disclosure improves detection more than it creates coercion, discrimination, or safety harm for the target domain. |
| Retention | Purpose-specific retention and restricted tombstones, not permanent public history. | High | Permanent full retention is necessary for audit. | Legal, safety, and data-subject analysis identifies a narrow class where full retention is lawful, proportionate, secured, and materially improves error resolution. |
| Immutable accountability | Keep signed certificate/event identity immutable, but protected payload erasable and public projection withdrawable. | High | Putting all bytes or hashes in an immutable public log produces superior accountability. | A formal privacy/linkability analysis, rights review and adversarial dictionary/reidentification test prove the exact public fields are non-personal, non-protected, necessary and deletion-compatible for the declared lifetime. |
| Community governance | Discovery and objections only; never truth status. | High | Robust crowd aggregation adds calibrated epistemic evidence. | Adversarial, cross-cultural, prospective evaluation demonstrates improvement beyond source evidence with resistance to Sybil, selection bias, polarized nonparticipation, and expert disagreement. |
| Source acquisition | Use a rights-cleared allowlist and operation-specific rights manifest; default-deny ambiguous TDM/retention/export. | High for France launch | Broad public-web ingestion is lawful and necessary for useful coverage. | Written counsel analysis and source-class tests demonstrate lawful access, rights-reservation handling, post-TDM destruction, database extraction limits, retention and public quotation/redistribution for each enabled class. |
| Open corpus | Licence and export original annotations plus only independently rights-cleared third-party material. | High | All evidence used by a certificate can inherit one open-corpus licence. | Item-level title, database, press, personal-data and contract analysis proves the operator owns or can sublicense every included right, and withdrawal/attribution obligations remain enforceable through downstream exports. |
| Personal claims | Exclude sensitive, criminal and high-harm person dossiers from v1 public issuance. | High | Human editorial review makes a narrow personal-claim vertical defensible. | DPIA, written publication/privacy counsel decision, prospective red-team and deletion/right-of-reply drills meet predeclared harm, timeliness, correction and comprehension gates. |
| Rights and appeals | Use one intake but distinct DSAR, factual, publication, DSA and rights-holder cases, clocks and remedies. | High | One generic appeal workflow is simpler without losing rights. | Counsel/DPO mapping and end-to-end drills demonstrate identical standing, notice, deadlines, decision-maker independence, remedies, recipient propagation and external recourse for every enabled legal lane. |
| User public content and general search | Keep disabled until each surface is classified and DSA controls are ready. | Medium-high | Editorial review makes all inputs operator content or the functions remain minor/ancillary. | Written DSA role analysis based on the actual flow, contracts and UI plus regulator/court guidance demonstrates the narrower classification; architecture still supports reclassification without migration. |
| AI Act classification | Treat as an AI system, not automatically GPAI or high-risk; block Annex III/high-impact uses. | Medium-high | Parallax's chain role or intended purpose makes it GPAI-provider or high-risk. | Model ownership/rebranding/modification evidence or an enabled intended use satisfies the current statutory category; reclassify and complete the applicable conformity path before launch. |
| AI-generated public-interest text | Disclose AI assistance and preserve machine-readable marking by default. | High | A genuine human review/editorial-responsibility exception makes visible disclosure unnecessary for a surface. | Counsel-approved Article 50 analysis plus logged competent review with authority to modify/reject and named editorial responsibility; provider marking obligations remain separately satisfied. |

## Official legal sources and change triggers

These sources support the legal boundary analysis; they do not replace
deployment advice:

- [GDPR, consolidated official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
  — Articles 5–6, 9–10, 12–22 and 35–36;
- [CNIL legitimate interest for AI](https://www.cnil.fr/fr/base-legale-interet-legitime-developpement-systeme),
  [web scraping](https://www.cnil.fr/fr/focus-interet-legitime-collecte-par-moissonnage),
  [retention](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees)
  and [DPIA](https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd);
- [French Data Protection Act, Articles 46 and 80](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460/2025-07-01);
- [DSM Directive 2019/790](https://eur-lex.europa.eu/eli/dir/2019/790/oj),
  [CPI L122-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048603495),
  [L122-5-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044363192)
  and [database rights](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069414/LEGISCTA000006146357/);
- [1881 Press Act Articles 29 and 35](https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006070722),
  [Civil Code Articles 9 and 9-1](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006117610/?anchor=LEGIARTI000006419316),
  [LCEN Article 1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614)
  and [online-reply decree](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000428279);
- [Digital Services Act](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng);
  and
- [AI Act consolidated on 2026-07-27](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02024R1689-20260727)
  and [Regulation 2026/1744](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32026R1744).

Reopen the corresponding decision and dependent certificates when an official
source changes, a regulator/court adopts controlling guidance, a source changes
its terms/licence/reservation, a service surface or target jurisdiction changes,
a customer enables a consequential use, a model/provider changes, a rights
exercise fails, or incident/evaluation evidence contradicts the stated control.
The EDPB's 2026 web-scraping guidelines were still a consultation draft on the
cutoff date and are deliberately not treated as final authority here.
