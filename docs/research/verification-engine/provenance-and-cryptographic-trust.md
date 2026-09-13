---
context_room:
  id: research.verification-engine.provenance-cryptographic-trust
  depends_on:
    - research.verification-engine.architecture
    - research.verification-engine.assurance-model
    - research.verification-engine.threat-model
---

# Provenance and cryptographic trust

## Summary

The proposed engine must use cryptography to make evidence and decisions
tamper-evident, attributable, time-bounded, and independently auditable. It
must never use a valid digest, signature, timestamp, provenance record, or
transparency receipt as proof that a factual claim is true.

The recommended minimum executable-slice baseline is cryptographic maturity
`P0`: a private content-addressed evidence vault and a versioned canonical
certificate encoded with RFC 8785, signed in a COSE envelope, and validated
under a frozen trust snapshot. Cryptographic `P1` adds RFC 3161 timestamps over
batched Merkle roots only before the product claims externally witnessed time.
The stronger profiles add SCITT-compatible transparency receipts,
independently operated monitors and witnesses, and long-term evidence renewal.
C2PA is an ingestion signal for media. Sigstore protects the engine's own
software supply chain; it does not adjudicate evidence or issue the engine's
epistemic conclusions.

Every public or machine result must expose the exact property that was checked
and its trusted computing base. “Cryptographically verified” without that
qualification is prohibited.

## Defines

The proposed provenance semantics, artifact identity, canonical serialization,
signature and credential profile, trusted-time protocol, transparency design,
offline verification bundle, compromise behavior, maturity stages, and
falsification tests for cryptographic trust.

## Does not define

Whether evidence supports a claim, source independence, search completeness,
reviewer competence, the legal right to retain or publish content, an accepted
production deployment, or canonical Parallax behavior. Those subjects remain
owned by the [assurance model](assurance-model.md),
[verification protocol](verification-protocol.md), and
[threat model](threat-model.md).

## Status and governing rule

- **Status:** active research proposal; not an accepted implementation
  contract.
- **Primary design rule:** preserve separate proof results for byte identity,
  attribution, credential validity, trusted time, log inclusion, log
  consistency, global non-equivocation, and epistemic assurance.
- **Failure rule:** failure or absence at one layer must never be silently
  converted into a conclusion at another. An unsigned source is not thereby
  false; a validly signed source is not thereby true.

This separation follows the standards themselves. W3C states that a provenance
record is not automatically authoritative or correct
([PROV-AQ, section 1.3](https://www.w3.org/TR/prov-aq/#interpreting-provenance-records)).
C2PA asks validators to determine whether assertions are associated with an
asset and free from tampering, not whether they are good, bad, or factually
correct
([C2PA 2.4, scope](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html#_scope)).
SCITT likewise says that an issuer may make a false statement and that
registration proves only that the statement was produced by that issuer
([RFC 9943, section 9.2](https://www.rfc-editor.org/rfc/rfc9943.html#section-9.2)).

## Proof-property contract

The verification API and certificate must report the following properties
independently. A `passed` result means only the statement in the second column,
under the recorded trust assumptions.

| Property | What a successful check proves | What it does not prove |
| --- | --- | --- |
| `artifact_digest_match` | The supplied bytes produce the recorded algorithm-qualified digest. | Origin, publication time, completeness, rights, meaning, or truth of the bytes. |
| `canonical_representation_match` | The structured object produces the recorded canonical bytes under the named schema and canonicalization version. | That the schema captured every material fact or that all implementations are bug-free. |
| `statement_signature_valid` | The private key corresponding to the recorded public key signed the exact protected payload and headers, assuming the algorithm and verifier are sound. | Who controlled the key, whether signing was authorized, or whether the payload is true. |
| `credential_chain_accepted` | The credential chains to an anchor accepted by the recorded trust policy. | That the anchor, issuer, identity proofing, or holder was honest or uncompromised. |
| `credential_valid_at_attested_time` | Archived status material and trusted time satisfy the recorded credential policy at that time. | That compromise had not occurred but was still unknown, or that the act was legitimate. |
| `timestamp_valid` | The named timestamp authority signed an imprint and claims that it existed no later than its recorded time and accuracy interval. | Creation time, first publication, authorship, truth, or any time before submission to the authority. |
| `batch_inclusion_valid` | The leaf commitment is included in the identified Merkle root. | That every eligible object was submitted, that the leaf is lawful to retain, or that the root was externally observed. |
| `log_receipt_valid` | The transparency service registered the signed statement in the verifiable data structure represented by the receipt. | Statement accuracy, universal visibility, issuer completeness, or correct log behavior after receipt issuance. |
| `log_consistency_valid` | The later checkpoint is an append-only extension of the earlier checkpoint under the selected verifiable-data-structure algorithm. | That a different client was not shown a separate fork. |
| `witness_quorum_valid` | The configured threshold of named, independent witnesses signed the same checkpoint. | That all witnesses are independent in reality, that none colluded, or that omitted statements exist nowhere. |
| `provenance_shape_valid` | The provenance graph satisfies the engine's declared structural constraints. | That any provenance assertion is accurate, complete, independent, or probative. |
| `offline_bundle_replay_valid` | The deterministic verifier reproduced the recorded checks from the frozen bundle. | Current revocation status, current source state, real-world correspondence, or adequacy of the verification protocol. |

An overall boolean such as `cryptographically_valid` is therefore an unsafe
public contract. Consumers may apply a named policy to these properties, but
the individual results and failure reasons remain available.

## Trusted computing base

A guarantee is meaningful only when its trusted computing base (TCB) is named.
The certificate and verifier report must identify at least the following TCB
elements and versions.

| Layer | Trusted elements | Consequence of failure |
| --- | --- | --- |
| Artifact identity | Hash implementation, algorithm profile, byte acquisition boundary, object-store integrity, and manifest parser | Different or incomplete bytes can be presented as the evaluated artifact. |
| Canonical object | Certificate schema, number/string rules, RFC 8785 implementation, media type, and domain-separation rules | Semantically different objects can collide at the signing boundary or equivalent objects can fail replay. |
| Signature | COSE implementation, signer key, KMS/HSM, protected headers, verifier, and algorithm registry | Forged or misbound certificates can validate. |
| Credential and identity | Credential issuer, identity-proofing policy, trust anchors, validity and purpose constraints, revocation/status services | A valid key can be bound to the wrong entity or purpose. |
| Trusted time | TSA key and certificate chain, time source, policy OID, accuracy declaration, validation and archived status material | Backdated or incorrectly timed evidence can appear valid. |
| Transparency | Leaf construction, Merkle/VDS implementation, log key, registration policy, checkpoint distribution, monitors, witnesses, and their independence | Entries can be omitted, reordered, deleted, or presented through split views. |
| Long-term validation | Archive operator, renewal scheduler, algorithm-deprecation feed, old validation material, and new timestamp/signature authorities | Previously valid evidence can become unverifiable after algorithms, keys, or certificates age. |
| Presentation | Status projection, terminology, policy mapper, current-revocation feed, and user interface | A narrow cryptographic result can be presented as factual truth or current validity. |

Hardware, operating systems, random-number generation, build chain, deployment
identity, operator access, and incident procedures are transitive TCB members.
The engine cannot truthfully claim an absolute guarantee outside these
assumptions. It can claim that a named verification procedure accepted a named
object under a frozen TCB snapshot.

## Semantic provenance with W3C PROV

The internal model should express provenance using the W3C PROV distinction
between:

- an `Entity`, such as an acquired PDF, an OCR result, a claim revision, an
  evidence dossier, or an issued certificate;
- an `Activity`, such as acquisition, parsing, translation, review, synthesis,
  issuance, withdrawal, or renewal; and
- an `Agent`, such as a publisher, tool, model provider, reviewer, issuer, TSA,
  or transparency service.

Generation, use, derivation, attribution, association, delegation, and
specialization links should map to
[PROV-O](https://www.w3.org/TR/prov-o/) for JSON-LD/RDF export. A PROV bundle can
describe the provenance of another provenance bundle, which is useful for
recording who generated or reviewed the engine's own provenance statements
([PROV-DM](https://www.w3.org/TR/prov-dm/)).

PROV is the semantic layer, not the authority layer. Every provenance
assertion records:

- its asserting agent and evidence;
- whether it was observed, supplied, inferred, or imported;
- the applicable valid and record times;
- its confidence or unresolved status where it is not deterministic; and
- the immutable version that supersedes or disputes it.

A signed PROV graph means that a signer endorsed those graph bytes. It does not
make the described derivation happen in the world. Conflicting provenance
bundles remain separate assertions; the engine must not merge them into one
apparently certain history.

## Artifact identity and the evidence vault

### Content-addressed storage

The evidence vault uses algorithm-qualified identifiers, for example
`sha256:<lowercase-hex>`, derived from the exact admitted bytes. Source URLs,
DOIs, filenames, mutable database identifiers, and titles are aliases or
locators, never content identity.

Each artifact version records:

- digest algorithm and digest;
- byte length and detected media type;
- acquisition request, response metadata, channel, and observed time;
- source locator and resolver state;
- rights, retention, visibility, tenant, and encryption-key domain;
- parent artifact and exact transformation profile, if derived; and
- validation reports for signatures, C2PA, malware, parsing, and completeness.

The original admitted bytes remain immutable while retention is lawful. A
derived text, normalized spreadsheet, OCR transcript, translation, or excerpt
is a new entity with a new digest. It never replaces its parent.

An object may be physically erased or access-restricted when policy requires
it. Its former digest must not be published if it enables dictionary attacks
against predictable private content. A minimal non-personal tombstone may
state that a dependency became unavailable, without retaining or disclosing
the substance.

### Digest limits

A collision-resistant digest supports byte identity under current
cryptographic assumptions. It does not establish semantic equivalence between
formats or renditions. Conversely, two byte-distinct files may communicate the
same proposition. Perceptual hashes and C2PA soft bindings may propose related
assets but must never replace the exact digest used for integrity.

Hash agility is mandatory: identifiers include the algorithm, certificate
schemas permit more than one digest during migration, and the renewal process
binds the old and new digests before the old algorithm becomes unsafe.

## Canonical certificate and signature

### One authoritative byte representation

The engine should define one versioned unsigned `CertificatePayload` schema.
Its authoritative signing bytes are the UTF-8 bytes produced by the JSON
Canonicalization Scheme in
[RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html). The implementation must
reject duplicate keys, non-schema fields in strict contexts, out-of-range or
non-interoperable numbers, malformed Unicode, and any input whose parsed value
does not round-trip to the same canonical bytes.

Every signed payload includes:

- schema identifier and version;
- certificate, claim-revision, dossier, policy, and method-profile identifiers;
- digests for every authoritative referenced object;
- issuer and intended certificate purpose;
- valid-time and record-time fields with explicit semantics, including
  prepare-transaction time and issue-intent sequence but never a predicted
  finalization/issuance commit time;
- issue sequence and, when known at issuance, a
  `predecessor_reference_at_issue`; a stable status-feed reference and the
  supersession policy/version, but never a future successor or current
  supersession status;
- initial requested visibility, the versioned disclosure policy and stable
  status-feed reference; optionally, the exact digest of one explicitly named
  prepared disclosure proposal, never an ambiguous digest for a future or
  mutable view; and
- a domain-separation string such as
  `verification-engine/certificate/v1`.

The readable JSON, HTML, PROV export, and API projections are derived views.
They must round-trip to or reference the exact signed payload; they are not
separately authoritative.

A later `superseding_certificate_id`, correction, challenge, restriction,
withdrawal, or current lifecycle value is an immutable signed event and status
projection outside `CertificatePayload`. It cannot be inserted into or used to
re-sign the historical payload. This keeps certificate identity stable while
allowing consumers to prove current status separately.

The payload also never contains its own digest, signature, timestamp token,
transparency-log receipt or witness receipt. The digest is computed over the
canonical payload; `COSE_Sign1` then covers those bytes; later time and log
receipts bind the payload or signature-envelope digest outside both. Every later
full or redacted view receives its own `DisclosureManifest`. The actual initial
visibility and installed manifest digest are historical facts bound by the
database `FinalizationEvent` and signed `FinalizationReceipt`, not predictions
smuggled into the prepared payload.

The authority database's finalization-statement record time is recorded as
`finalized_at` and, for a certificate, `issued_at` in an immutable
`FinalizationEvent` committed atomically with the object, initial state event,
internal current pointer and outbox.

A
separate signer then creates unsigned canonical `FinalizationReceiptPayload`
bytes binding that event, certificate ID, payload/signature digests,
issue-intent sequence, initial lifecycle/visibility/challenge facts and
audit/outbox event IDs. A detached `FinalizationSignatureEnvelope` covers those
bytes; together with the algorithm-tagged receipt-payload digest and frozen
signer-trust snapshot they form the complete `FinalizationReceipt`. The receipt
payload contains none of its own digest, signature or later activation facts.

External serving is disabled until a second transaction validates and stores
that complete receipt. A prechosen timestamp in a payload is never reinterpreted as actual issuance time,
and no external signing call occurs inside either database transaction. This
record time is not misrepresented as PostgreSQL's future wall-clock commit
instant; transaction/WAL ordering and any post-commit observation remain
separate evidence.

### COSE signature profile

The canonical payload is carried as the payload of `COSE_Sign1`, defined by
[RFC 9052](https://www.rfc-editor.org/rfc/rfc9052.html). The protected header
must bind the algorithm, key identifier, content type, certificate profile, and
critical extension handling. Unprotected headers are never used for an
authorization or assurance decision.

The launch profile should mandate one widely implemented, HSM/KMS-supported
algorithm suite and a collision-resistant digest, while encoding algorithm
identifiers everywhere needed for migration. A second algorithm is introduced
only after cross-language conformance and negative-test vectors prove that it
does not create algorithm-confusion or downgrade paths. The choice between
ES256 and another approved COSE algorithm is an implementation-time security
profile decision, not an epistemic property.

The online certificate-signing key is purpose-scoped, short-lived, non-exportable
where supported, and unable to change policy or trust roots. An offline
threshold root signs versioned trust bundles and recovery transitions, not
ordinary certificates.

### Signer, credential, and trust snapshot

Signature validation and identity attribution are separate checks. Each
certificate carries or resolves to a frozen trust snapshot containing:

- public key or credential chain and key identifier;
- credential issuer and identity-proofing policy;
- permitted purpose, namespace, tenant, and assurance tier;
- validity interval and certificate-policy identifiers;
- trust anchors and their distribution version;
- available OCSP responses, CRLs, or equivalent signed status material;
- the time at which each status source was observed; and
- compromise, revocation, replacement, or distrust events known at that
  snapshot cutoff.

A current live lookup must not silently rewrite the historical validation
result. The verifier reports both `valid_at_issue_under_snapshot` and
`current_trust_status`. Events learned after the cutoff belong only to that
versioned current-status overlay/feed; they are never inserted retroactively
into the frozen trust snapshot. If compromise time is unknown, signatures in the
possibly affected interval become `authenticity_indeterminate`; an operator
must not assume that everything before the public revocation announcement is
safe.

## Trusted time with RFC 3161

[RFC 3161](https://www.rfc-editor.org/rfc/rfc3161.html) defines a protocol in
which a Time Stamping Authority signs a message imprint and provides evidence
that the datum existed before a specified time. The TSA does not inspect the
underlying datum and the token does not identify the requester. That is useful
for confidentiality, but it also means the token establishes neither author
nor meaning.

The cryptographic `P1` protocol, which is not a dependency of the minimum
executable slice, must:

1. build a deterministic Merkle batch from newly issued certificate
   commitments and lifecycle-event commitments;
2. request an RFC 3161 token over the batch root with a fresh nonce and an
   approved TSA policy;
3. validate the response, imprint, nonce, TSA chain, policy, time, accuracy,
   and available revocation material before accepting it;
4. retain the token, chain, policy, validation transcript, status material,
   Merkle parameters, root, and per-object inclusion proof; and
5. expose the TSA's time and accuracy interval separately from acquisition,
   publication, observation, signing, and system-record times.

Batching reduces TSA calls and limits disclosure of individual objects. It
also creates a maximum anchoring delay that must be declared. Trusted time is a
proof-property axis, not an epistemic outcome or certificate lifecycle. The
closed `trusted_time_status` values are `not_requested`, `pending_anchor`,
`anchored_valid`, `anchor_invalid`, and `anchor_indeterminate`. From COSE
finalization until a valid RFC 3161 proof is attached, a P1-bound certificate
has `pending_anchor`; it must not be represented as having trusted external
time. The legacy phrase `signed_unanchored` may appear only as human-readable
rendering of `pending_anchor`, never as a machine enum.

For a high-assurance tier, use two independently operated TSAs with distinct
root and operational dependencies. RFC 3161 itself recommends two TSAs as one
response to TSA-key compromise and states that tokens made with a compromised
TSA key can no longer be trusted
([RFC 3161, section 4](https://www.rfc-editor.org/rfc/rfc3161.html#section-4)).
Two correlated resellers or authorities sharing one root, clock, operator, or
cloud failure domain do not count as independent.

## Merkle batches and transparency

### Privacy-preserving leaves

The public or externally witnessed leaf must not be a raw digest of private,
low-entropy, or identifying content. Use a domain-separated hiding commitment:

```text
leaf_commitment = H(
  "verification-engine/log-leaf/v1" ||
  random_256_bit_nonce ||
  canonical_private_statement
)
```

The nonce and private statement remain in the authorized offline bundle. The
public log receives only the commitment and minimum non-sensitive routing
metadata. Fixed-size or cadence-controlled batches should be evaluated where
volume and timing themselves reveal sensitive activity.

This protects against straightforward dictionary recovery; it does not make
all metadata anonymous. Log size, timing, repeated submissions, headers, and
access patterns can leak information. RFC 9942 and RFC 9943 require explicit
privacy analysis even when a transparency service retains only cryptographic
metadata
([RFC 9942, section 6](https://www.rfc-editor.org/rfc/rfc9942.html#section-6),
[RFC 9943, section 8](https://www.rfc-editor.org/rfc/rfc9943.html#section-8)).

### Inclusion is not completeness

The tree construction uses a versioned leaf format, unambiguous length
encoding, leaf/node domain separation, deterministic ordering, and explicit
batch sequence. The bundle retains the inclusion path and signed checkpoint.

A valid inclusion proof establishes membership in one committed tree. A
consistency proof establishes append-only extension between two tree states.
Neither proves that the issuer submitted every eligible certificate, that the
log accepted every submission, or that a different client saw the same tree.

### SCITT receipts and witnesses

The strengthened design profiles the engine's signed certificate or private
commitment as a SCITT Signed Statement. The external Transparency Service:

- authenticates the issuer under a versioned Registration Policy;
- commits the statement to a Verifiable Data Structure;
- returns a COSE Receipt carrying an inclusion proof as specified by
  [RFC 9942](https://www.rfc-editor.org/rfc/rfc9942.html); and
- makes its policies, trust anchors, checkpoints, statements needed for audit,
  and consistency material available according to
  [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html).

Registration policy and trust-anchor changes are themselves signed and logged.
The relying party re-verifies the issuer statement locally instead of treating
the receipt as a substitute for the issuer signature.

RFC 9162 shows why a lone append-only log is insufficient: a malicious log can
present conflicting views, and detecting this requires clients or monitors to
compare signed tree heads; its gossip mechanism is outside the RFC
([RFC 9162, sections 1 and 11.3](https://www.rfc-editor.org/rfc/rfc9162.html#section-11.3)).
The engine must therefore specify the missing operational layer:

- at least two independently administered monitors fetch and verify every new
  checkpoint and consistency proof;
- witnesses sign checkpoints only after verifying consistency from their last
  accepted state;
- verifiers require a declared witness threshold for the stronger tier;
- checkpoints and witness signatures travel through at least two independent
  channels and are retained off-site; and
- high-risk profiles can require receipts from two transparency services under
  different operators.

No monitor means no operational claim of global consistency. A receipt alone
supports `log_inclusion_valid`, not `global_non_equivocation`.

## C2PA media ingestion

For an asset containing Content Credentials, the engine should preserve the
original bytes and execute the complete C2PA 2.4 validation procedure against a
frozen trust-list and status snapshot
([C2PA 2.4 technical specification](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html)).
The admitted record separates:

- manifest well-formedness;
- claim-signature and credential results;
- trusted-time and revocation results;
- hard-binding coverage and byte integrity;
- ingredient and action assertions;
- created versus gathered assertions;
- excluded byte ranges and unsigned external metadata;
- soft-binding matches; and
- the exact trust-list and validator versions.

A C2PA hard binding can show that the covered asset bytes have not changed
since signing. It does not establish that the camera observed a real event,
that metadata was accurate before signing, or that the signer was honest. A
soft binding is useful for discovering renditions but must not be accepted as a
hard binding. A stolen signing key can produce malicious manifests that pass
validation, and C2PA cannot prevent complete removal of a manifest
([C2PA 2.4 security considerations](https://spec.c2pa.org/specifications/specifications/2.4/security/Security_Considerations.html)).

Consequently:

- valid C2PA raises only the attribution/provenance dimensions it actually
  supports;
- invalid C2PA is evidence of a validation failure, not proof that the media is
  fake;
- absent C2PA is an unknown, not evidence of synthetic origin; and
- remote manifest or ingredient content is fetched only through the isolated
  acquisition boundary, never automatically from a user's device.

C2PA generation for a published media rendering may be offered later, but the
engine's canonical certificate remains the separate COSE object.

## Sigstore boundary

Sigstore should secure the engine's builds, release artifacts, containers,
deployment attestations, and verifier binaries. Its short-lived Fulcio
credentials, Rekor transparency, and TUF-distributed trust root offer useful
supply-chain patterns. They do not establish that a source is factually
correct, that an OIDC identity was authorized to make an epistemic decision,
or that a signed artifact is safe. Sigstore states these limits explicitly and
depends on monitors to detect service misbehavior
([Sigstore threat model](https://docs.sigstore.dev/about/threat-model/),
[security model](https://docs.sigstore.dev/about/security/)).

The public Rekor service is not the default evidence or certificate log because
evidence commitments have different privacy, subject, retention, credential,
and correction requirements. Rekor may be used for a non-sensitive release or
checkpoint anchor after a privacy review. The business protocol should target
the standard SCITT receipt abstraction rather than depend on one Rekor version;
Rekor v1 is in maintenance while its successor is under development
([Rekor repository](https://github.com/sigstore/rekor)).

The engine may adopt a TUF-like offline threshold root for distributing signer,
TSA, log, witness, schema, and verifier trust material. That root is still a
TCB, not a proof of truth.

## Compromise, revocation, and recovery

Every incident creates an immutable status event; it never edits an issued
certificate. Public and offline verification distinguish historical result,
current status, and whether the compromise interval is known.

| Compromised element | What the attacker may do | Required response | Honest residual status |
| --- | --- | --- | --- |
| Certificate signer key | Forge certificates within the key's authority and backdate them using an untrusted local clock. | Suspend issuance, revoke/retire key, determine earliest defensible compromise bound from independent timestamps/logs, rotate through offline root, identify all affected certificates, and re-evaluate before reissue. | `authenticity_indeterminate` throughout any unresolved interval; re-signing alone cannot repair a false dossier. |
| Credential issuer or identity provider | Bind attacker keys to legitimate identities or purposes. | Freeze affected identity namespace, distrust issuer version, obtain out-of-band identity evidence, rotate credentials, replay affected cases, and publish scope. | Signature integrity may remain valid while attribution becomes `identity_indeterminate`. |
| TSA key or clock | Create false or backdated trusted-time tokens. | Revoke TSA credential, quarantine all tokens under the affected key, compare independent TSA and log evidence, renew from the last defensible point, and publish affected interval. | RFC 3161 tokens under a compromised key cannot remain `trusted_time_valid` solely because their signatures verify. |
| Transparency-log key or service | Forge receipts/checkpoints, omit entries, truncate history, or serve forks. | Freeze acceptance, compare witness and monitor archives, retain signed proof of equivocation, roll back to a named known-good checkpoint, rotate through the root, reconstruct, and issue fresh receipts. | Inclusion may be indeterminate after the last independently witnessed checkpoint. |
| Monitor or witness | Suppress detection or endorse a fork. | Remove it from future quorum, recompute independence, compare other channels, and reclassify checkpoints that no longer satisfy threshold. | Other valid signatures do not prove that the failed actor was independent. |
| Offline trust root | Authorize arbitrary new signers, policies, logs, witnesses, or verifier material. | Stop issuance and trust updates; invoke a separately protected, pre-documented recovery root or manual out-of-band ceremony; publish the breach through independent channels; rebuild the trust graph and require explicit consumer rebootstrap. | This is catastrophic. No automatic in-band event signed only by the compromised root can restore trust. |
| Hash or signature algorithm | Create collisions, second preimages, or forgeries as cryptanalysis advances. | Deprecate before practical break, bind old and new digests/signatures in a renewal event, timestamp and witness that event, and reject new use of the weak suite. | Evidence not renewed before the break may become unverifiable rather than false. |
| Canonicalizer or verifier | Cause implementations to sign or accept different bytes or ignore protected fields. | Stop issuance, publish test vectors and affected versions, verify with an independent implementation, replay every impacted object, and rotate keys if malicious payloads could have been signed. | Prior results are `replay_untrusted` until reproduced with a corrected independent verifier. |

Revocation solves future reliance only when consumers obtain and apply status
updates. Every machine consumer therefore receives a status endpoint or signed
status feed, a maximum-staleness policy, and a dependency list. Offline-only
verification reports that its status is valid **as of the bundle cutoff**, not
that it is current.

## Long-term validation and renewal

Certificates may need to outlive keys, certificates, hash algorithms, software,
and external services. The archive must preserve the bytes needed to validate
the original signature at the original trusted time, including trust anchors,
status evidence, policies, schemas, algorithms, receipts, and verifier test
vectors.

Before a TSA certificate, signature suite, or hash suite ceases to be reliable,
the engine creates a renewal record covering the previous certificate,
signature, timestamps, revocation evidence, transparency receipts, and current
status. The renewal is hashed with the new suite and independently timestamped
and witnessed. When the tree hash itself weakens, the protected source objects
must be re-read and rebound; simply timestamping the old weak root is
insufficient.

[RFC 4998 Evidence Record Syntax](https://www.rfc-editor.org/rfc/rfc4998.html)
provides the relevant model: archive timestamp chains renew time/signature
evidence, while hash-tree renewal rebinds the underlying data after hash
weakening. The first implementation need not expose ASN.1 ERS as its native API,
but its evidence package and renewal tests must preserve equivalent information
and permit a future standards-compatible export.

No archival system guarantees perpetual validity. The honest states are
`long_term_validation_current`, `renewal_due`, `renewal_failed`, and
`historical_proof_unverifiable` under a dated algorithm and trust policy.

## Offline verification bundle

An authorized auditor receives a self-contained bundle with a manifest that
binds every included object. The profile is generic across `Certificate`,
`AbstentionAttestation`, `PreRunRefusalReceipt`, `RefusalReceipt`, and
`FailureRecord`; certificate-only evidence is required only when that object
type exists. It contains, subject to rights and access policy:

1. the exact canonical terminal payload bytes, algorithm-tagged digest and
   payload signature envelope;
2. the immutable `FinalizationEvent`, signed `FinalizationReceipt`, status-
   signer trust snapshot and activation record that authorized the served view;
3. schema, canonicalization profile, policy, method profile, and domain
   separator;
4. payload-signer credential chain and the complete frozen trust snapshot;
5. archived credential and TSA status material plus observation times;
6. RFC 3161 token, TSA chain, policy, batch root, leaf nonce, and Merkle
   inclusion proof;
7. SCITT statement and receipt, VDS parameters, checkpoints, consistency
   proofs, witness signatures, and monitor observations when applicable;
8. artifact manifests and digests, with exact bytes only where authorized;
9. provenance bundle, transformation lineage, and every cryptographic
   validation report;
10. the complete ordered lifecycle, challenge, visibility, restriction,
    `needs_review`, staleness, restoration, correction, supersession,
    withdrawal, compromise and renewal event chain through the declared cutoff,
    plus the stable state and latest signed status projection when applicable;
11. verifier source/version, signed release provenance, conformance vectors,
    and deterministic command contract; and
12. bundle cutoff time, current-status limitation, omitted-object list, reason
    for each omission, and the resulting replay ceiling.

The verifier performs no network access by default. It validates internal
manifest integrity before parsing nested objects, applies resource limits, and
emits one result per proof property. An optional online mode fetches newer
signed trust and status material but records the exact update separately.

If source bytes cannot lawfully be bundled, the auditor may verify certificate,
signature, time, and log inclusion but cannot recheck byte identity, citation,
or transformations. The output must say `replay_limited_by_unavailable_artifact`
rather than treating a digest alone as equivalent evidence.

## Staged maturity

External transparency increases operational and privacy risk. It should be
earned after the smaller trust boundary works, not used to make an immature
system appear trustworthy.

| Stage | Added mechanism | Promotion evidence | Claims still prohibited |
| --- | --- | --- | --- |
| P0 — deterministic integrity | Private content-addressed vault, strict schema, RFC 8785 canonicalization, COSE signature, frozen trust snapshot, independent offline verifier | Cross-language golden/negative vectors; byte mutation, parser differential, algorithm-confusion and restore tests all pass; key ceremony and revocation drill observed | Trusted external time, public append-only history, global non-equivocation |
| P1 — witnessed time | Domain-separated Merkle batches and RFC 3161 anchoring; dual TSA for high tier | End-to-end inclusion/replay; bounded anchoring delay; TSA outage and compromise exercises; privacy dictionary/correlation test | Log completeness and split-view resistance |
| P2 — transparent issuance | SCITT-compatible statements and receipts, published policies/checkpoints, at least two monitors and witness threshold | Deletion, reorder, truncation and fork injections detected; witness independence and recovery measured; no sensitive content or guessable commitment leaks | Universal visibility, issuer completeness, factual truth |
| P3 — independent high assurance | Two operator-independent logs for selected tiers, offline threshold root, practiced consumer rebootstrap | Correlated-failure analysis, multi-operator incident game, recovery from one malicious log/root delegate, measured cost and availability | Safety against collusion beyond the declared quorum |
| P4 — long-term preservation | Scheduled evidence renewal, algorithm migration, durable verifier/test-vector archive, RFC 4998-compatible export if justified | Multi-generation timestamp and hash renewal replayed by an independent implementation after simulated deprecation | Perpetual proof or immunity from future cryptanalysis |

P0 alone is the minimum cryptographic target for the roadmap's Phase 2 minimum
executable slice. P1 is required before any interface or contract claims a
trusted external issuance or lifecycle time; until then, the engine may expose
only its database-assigned and signer-observed times with their trust limits.
P2 is required before the product claims transparent or externally auditable
issuance history. P3 is reserved for use cases whose harm model justifies the
cost and metadata exposure. P4 is required only when retention periods exceed
the credible lifetime of the selected cryptographic material. The `P0`–`P4`
labels here are cryptographic maturity profiles and must not be confused with
the roadmap's numbered implementation phases.

## Decisions, counter-hypotheses, and falsifiers

| Decision | Recommendation and confidence | Counter-hypothesis | Evidence that reverses or narrows it |
| --- | --- | --- | --- |
| Semantic provenance | Use PROV-O as an export/interchange model, not the transactional authority or trust engine. **High.** | A native RDF/PROV store simplifies every critical workflow without weakening constraints. | A representative vertical slice proves atomic lifecycle invariants, authorization, bitemporal history, replay, and operations are simpler and safer in the native store. |
| Certificate bytes | Sign one strict RFC 8785 representation in COSE and derive every display from it. **Medium-high.** | Deterministic CBOR should be authoritative and JSON only a projection. | Cross-language conformance, ecosystem support, incident tooling, and SCITT interoperability show deterministic CBOR materially reduces ambiguity and total complexity. |
| Artifact identity | Use exact algorithm-qualified digests; keep perceptual similarity non-authoritative. **High.** | A robust perceptual hash can safely identify an evidentiary artifact across renditions. | A hostile multilingual/multimedia corpus meets predeclared collision and false-nonmatch bounds and survives adversarial transformation without conflating materially different evidence. |
| Trusted time | Timestamp batched roots with RFC 3161; use two independent TSAs only for high tier. **High.** | One internal signed clock or one TSA is sufficient. | Threat analysis and compromise exercises demonstrate the same independent antedating resistance, recovery, and external acceptance at lower complexity. |
| Transparency | Add SCITT receipts and witnesses only after P1; never publish evidence payloads. **High.** | A public log from day one creates more trust than risk. | A formal privacy/rights analysis and adversarial launch trial show no material identity, timing, dictionary, erasure, or operational harm and demonstrate launch-critical detection value. |
| Sigstore | Use it for software supply chain and verifier releases, not epistemic certificates. **High.** | Rekor/Fulcio can directly serve all certificate trust needs. | A deployment profile satisfies domain authorization, privacy, correction, retention, offline replay, identity, and SCITT semantics without public-log leakage or coupling. |
| Long-term proof | Renew before algorithms or credentials age; report failure explicitly. **High.** | One strong initial signature and timestamp remain sufficient for the retention horizon. | Conservative cryptoperiod, regulatory, archive, and independent validation evidence proves no renewal is required for that bounded horizon. |

The cryptographic layer is falsified as a maximum-assurance design if any of
the following remains true after its claimed maturity stage:

- two conforming verifiers accept different authoritative payload bytes;
- a syntactically valid but factually false signed source raises epistemic
  assurance without independent evidence review;
- a raw or guessable public commitment reveals a protected artifact through a
  dictionary or correlation attack;
- deletion, reordering, truncation, or a split view is not detected within the
  declared monitor and witness window;
- compromise of one online key can authorize both trust-policy change and
  certificate issuance;
- the system labels signatures from an unresolved compromise interval as
  historically valid;
- an offline verifier silently treats missing evidence bytes or stale status as
  fully replayed and current;
- revocation, withdrawal, or renewal fails to reach a test consumer within the
  declared maximum staleness; or
- the system cannot migrate hash/signature algorithms without losing the
  binding between old and new evidence.

Passing these tests would establish the named cryptographic and operational
properties only. It would still not establish that the engine's factual
conclusions correspond perfectly to the world.
