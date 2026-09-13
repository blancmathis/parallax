import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react";
import type { DebateFixture, EvidenceLabel } from "../../types";
import { letterOf } from "../../data";
import { useAuth } from "../../lib/auth";
import { isSupabaseConfigured } from "../../lib/supabase";
import { LocaleLink as Link } from "../../i18n/links";
import { useI18n } from "../../i18n";
import { workflowErrorMessage } from "../workflow/model";
import {
  captureClaimDossierSource,
  submitClaimDossier,
  type ClaimDossierRecord,
  type SubmitClaimDossierResult,
} from "./api";
import {
  DOSSIER_LANGUAGE,
  DOSSIER_PILOT_TOPIC_ID,
  DOSSIER_PROFILE,
  dossierSourceUrl,
  exactUtf8Selection,
  validateClaimDossierDraft,
  type CapturedSourceArtifact,
  type ClaimDossierDraft,
  type ClaimDossierEvidenceDraft,
  type DossierArgumentDirection,
  type DossierResearchRole,
} from "./model";
import "./dossier.css";

const LABELS: EvidenceLabel[] = [
  "supports_claim",
  "partially_supports_claim",
  "contradicts_claim",
  "does_not_support_claim",
  "unclear",
];

function freshKey(): string {
  return globalThis.crypto.randomUUID();
}

function roleTitle(role: DossierResearchRole): string {
  return role === "support" ? "Support source" : "Counter source";
}

function EvidenceCaptureField({
  role,
  value,
  onChange,
}: {
  role: DossierResearchRole;
  value: ClaimDossierEvidenceDraft | null;
  onChange: (value: ClaimDossierEvidenceDraft | null) => void;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [artifact, setArtifact] = useState<CapturedSourceArtifact | null>(
    value?.source_artifact ?? null,
  );
  const [selection, setSelection] = useState<ReturnType<typeof exactUtf8Selection>>(null);
  const [captureKey, setCaptureKey] = useState(freshKey);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const title = roleTitle(role);

  const capture = async () => {
    const safe = dossierSourceUrl(url);
    if (!safe) {
      setError(
        "Use a public HTTP(S) URL without credentials, a non-standard port, or sensitive query parameters.",
      );
      return;
    }
    setCapturing(true);
    setError("");
    setArtifact(null);
    setSelection(null);
    onChange(null);
    try {
      const result = await captureClaimDossierSource(safe, captureKey);
      setArtifact(result);
      if (!result.ok || (result.status !== "found" && result.status !== "partial")) {
        setError(
          `Capture ${result.status}. It cannot be used as evidence, and this failure does not refute the claim.`,
        );
      }
    } catch (captureError) {
      setError(
        workflowErrorMessage(
          captureError,
          "Capture failed. It cannot be used as evidence, and this failure does not refute the claim.",
        ),
      );
    } finally {
      setCapturing(false);
    }
  };

  const readSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    if (!artifact?.normalized_text) return;
    const target = event.currentTarget;
    setSelection(
      exactUtf8Selection(
        artifact.normalized_text,
        target.selectionStart,
        target.selectionEnd,
      ),
    );
  };

  const useSelection = () => {
    if (!artifact || !selection) return;
    onChange({
      research_role: role,
      source_artifact: artifact,
      ...selection,
      locator: value?.locator ?? "",
      label: value?.label ?? "unclear",
      rationale: value?.rationale ?? "",
    });
  };

  const updateEvidence = (
    field: "locator" | "label" | "rationale",
    next: string,
  ) => {
    if (!value) return;
    onChange({ ...value, [field]: next });
  };

  return (
    <fieldset className="dossier-source">
      <legend>{title}</legend>
      <p className="dossier-note" aria-label={`Research role: ${role}`}>
        Research role: <b>{role}</b>. Choose the passage label independently below;
        a counter-search source is not automatically contradictory.
      </p>
      <div className="dossier-source__capture">
        <label className="field">
          <span className="field__label">{title} URL</span>
          <input
            className="field__input"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setUrl(event.target.value);
              setCaptureKey(freshKey());
              setArtifact(null);
              setSelection(null);
              setError("");
              onChange(null);
            }}
            placeholder="https://…"
          />
        </label>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          disabled={capturing || !url.trim()}
          onClick={capture}
        >
          {capturing ? "Capturing…" : `Capture ${role} source`}
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {artifact && (
        <article
          className={`dossier-artifact dossier-artifact--${artifact.status}`}
          data-testid={`dossier-${role}-artifact`}
        >
          <header>
            <b>{artifact.title || artifact.final_url}</b>
            <span className="dossier-status">{artifact.status}</span>
          </header>
          <p>{artifact.publisher} · {artifact.content_type} · {artifact.byte_length} bytes</p>
          <dl className="dossier-hashes">
            <div><dt>Raw artifact hash</dt><dd>{artifact.raw_hash ?? "not available"}</dd></div>
            <div><dt>Normalized text hash</dt><dd>{artifact.normalized_hash ?? "not available"}</dd></div>
          </dl>
          {artifact.is_truncated && (
            <p className="dossier-note">
              Partial capture: the excerpt remains exact for this captured artefact,
              but the source was truncated.
            </p>
          )}

          {artifact.ok && artifact.normalized_text && (
            <>
              <label className="field">
                <span className="field__label">{title} normalized source text</span>
                <textarea
                  ref={textareaRef}
                  className="field__input dossier-source__text"
                  readOnly
                  value={artifact.normalized_text}
                  onSelect={readSelection}
                  aria-describedby={`dossier-${role}-selection-help`}
                />
              </label>
              <p className="dossier-note" id={`dossier-${role}-selection-help`}>
                Select one exact continuous passage, then confirm it. Offsets are
                stored as UTF-8 bytes against the normalized text hash.
              </p>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={!selection}
                onClick={useSelection}
              >
                Use selected {role} passage
              </button>
            </>
          )}
        </article>
      )}

      {value && (
        <div className="dossier-excerpt">
          <p className="dossier-excerpt__meta">
            {value.start_offset}–{value.end_offset} UTF-8 bytes
          </p>
          <blockquote>{value.exact_excerpt}</blockquote>
          <label className="field">
            <span className="field__label">{title} exact excerpt locator</span>
            <input
              className="field__input"
              value={value.locator}
              onChange={(event) => updateEvidence("locator", event.target.value)}
              placeholder="Page, section, paragraph, table…"
            />
          </label>
          <label className="field">
            <span className="field__label">{title} passage label</span>
            <select
              className="field__input"
              value={value.label}
              onChange={(event) => updateEvidence("label", event.target.value)}
            >
              {LABELS.map((label) => (
                <option key={label} value={label}>
                  {t.common.evidenceLabels[label]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">{title} passage rationale</span>
            <textarea
              className="field__input"
              value={value.rationale}
              onChange={(event) => updateEvidence("rationale", event.target.value)}
              placeholder="Explain the relationship to the claim (8+ characters)."
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}

export function ClaimDossierForm({
  debate,
  challengeEvidenceLinkId = null,
  initialDossier = null,
  onCancel,
  onSubmitted,
}: {
  debate: DebateFixture;
  challengeEvidenceLinkId?: string | null;
  initialDossier?: ClaimDossierRecord | null;
  onCancel?: () => void;
  onSubmitted?: (result: SubmitClaimDossierResult) => void;
}) {
  const { locale } = useI18n();
  const auth = useAuth();
  const targetEvidenceLinkId =
    initialDossier?.target_evidence_link_id ?? challengeEvidenceLinkId;
  const challengeLink = targetEvidenceLinkId
    ? debate.evidence_links.find((link) => link.id === targetEvidenceLinkId)
    : null;
  const challengeClaim = challengeLink
    ? debate.claims.find((claim) => claim.id === challengeLink.claim_id)
    : null;
  const challengeArgument = challengeClaim
    ? debate.arguments.find((argument) => argument.claim_ids.includes(challengeClaim.id))
    : null;
  const [positionId, setPositionId] = useState(
    initialDossier?.target_position_id ??
      challengeArgument?.position_id ??
      debate.positions[0]?.id ??
      "",
  );
  const [claimText, setClaimText] = useState(
    initialDossier?.claim_text ?? (locale === "en" ? challengeClaim?.text ?? "" : ""),
  );
  const [scopeNote, setScopeNote] = useState(initialDossier?.scope_note ?? "");
  const [argumentSummary, setArgumentSummary] = useState(
    initialDossier?.argument_summary ?? "",
  );
  const [argumentDirection, setArgumentDirection] =
    useState<DossierArgumentDirection>(
      initialDossier?.argument_direction ?? (challengeLink ? "qualifies" : "supports"),
    );
  const initialEvidence = (role: DossierResearchRole): ClaimDossierEvidenceDraft | null => {
    const source = initialDossier?.evidence.find((item) => item.research_role === role);
    if (!source?.artifact.artifact_id || !source.artifact.normalized_text) return null;
    return {
      research_role: role,
      source_artifact: {
        ok: true,
        artifact_id: source.artifact.artifact_id,
        requested_url: source.artifact.requested_url,
        final_url: source.artifact.final_url,
        status: source.artifact.status,
        content_type: source.artifact.content_type,
        byte_length: source.artifact.byte_length,
        raw_hash: source.artifact.raw_hash,
        normalized_hash: source.artifact.normalized_hash,
        normalized_text: source.artifact.normalized_text,
        title: source.artifact.title,
        publisher: source.artifact.publisher,
        source_type: source.artifact.source_type,
        parser_version: source.artifact.parser_version,
        is_truncated: source.artifact.is_truncated,
        captured_at: source.artifact.captured_at,
        reused: true,
      },
      start_offset: source.start_offset,
      end_offset: source.end_offset,
      exact_excerpt: source.exact_excerpt,
      locator: source.locator,
      label: source.label,
      rationale: source.rationale,
    };
  };
  const [support, setSupport] = useState<ClaimDossierEvidenceDraft | null>(() =>
    initialEvidence("support"),
  );
  const [counter, setCounter] = useState<ClaimDossierEvidenceDraft | null>(() =>
    initialEvidence("counter"),
  );
  const [submissionKey, setSubmissionKey] = useState(freshKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<SubmitClaimDossierResult | null>(null);
  const [englishConfirmed, setEnglishConfirmed] = useState(locale === "en");
  const isFr = locale === "fr";
  const isPilot = debate.topic.id === DOSSIER_PILOT_TOPIC_ID;

  const draft = useMemo<ClaimDossierDraft>(
    () => ({
      topic_id: debate.topic.id,
      base_revision_id: debate.revision.id,
      submission_kind:
        initialDossier?.submission_kind ?? (challengeLink ? "challenge" : "new_claim"),
      target_position_id: positionId,
      target_evidence_link_id:
        initialDossier?.target_evidence_link_id ?? challengeLink?.id ?? null,
      claim_profile: DOSSIER_PROFILE,
      claim_text: claimText,
      argument_summary: argumentSummary,
      argument_direction: argumentDirection,
      scope_note: scopeNote,
      language: DOSSIER_LANGUAGE,
      supersedes_submission_id: initialDossier?.id ?? null,
      evidence: [support, counter].filter(
        (item): item is ClaimDossierEvidenceDraft => item !== null,
      ),
    }),
    [
      argumentDirection,
      argumentSummary,
      challengeLink,
      claimText,
      counter,
      debate.revision.id,
      debate.topic.id,
      positionId,
      scopeNote,
      support,
      initialDossier,
    ],
  );
  const validation = validateClaimDossierDraft(draft);

  const touch = () => {
    setSubmissionKey(freshKey());
    setError("");
  };

  const submit = async () => {
    if (!englishConfirmed) {
      setError(
        isFr
          ? "Confirmez que les champs rédigés du dossier sont en anglais avant l’envoi."
          : "Confirm that the authored dossier fields are in English before submission.",
      );
      return;
    }
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await submitClaimDossier(validation.value, submissionKey);
      setSubmitted(result);
      onSubmitted?.(result);
    } catch (submitError) {
      setError(
        workflowErrorMessage(submitError, "Could not submit the evidence dossier."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPilot) {
    return (
      <section className="dossier-panel">
        <h3>Reviewed evidence dossier</h3>
        <p className="dossier-note">
          This bounded pilot is currently available only on the congestion-pricing
          debate.
        </p>
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Back</button>}
      </section>
    );
  }

  if (!isSupabaseConfigured || !auth.user) {
    return (
      <section className="dossier-panel">
        <h3>Reviewed evidence dossier</h3>
        <p className="dossier-note">
          {isFr
            ? "Ce parcours vérifié nécessite Supabase et un compte connecté."
            : "This verified workflow requires Supabase and a signed-in account."}
        </p>
        <Link to="/you" className="btn btn--primary">
          {isFr ? "Ouvrir le compte" : "Open account"}
        </Link>
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Back</button>}
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="dossier-panel" role="status">
        <span className="stamp stamp--inline">Submitted</span>
        <h3>Evidence dossier sent for independent review</h3>
        <p>
          Status: <b>{submitted.status}</b> · dossier <code>{submitted.id}</code>
        </p>
        <p className="dossier-note">
          Nothing was published or marked true. A reviewer may request changes,
          approve, or reject the dossier. An admin must separately prepare a draft,
          and that revision must pass its own review before publication.
        </p>
        <Link to="/you" className="btn btn--primary">Track my dossier</Link>
      </section>
    );
  }

  return (
    <section className="dossier-panel" aria-labelledby="claim-dossier-title">
      <header className="dossier-panel__header">
        <div>
          <span className="stamp stamp--inline">bounded pilot</span>
          <h3 id="claim-dossier-title">
            {challengeLink ? "Challenge with a reviewed evidence dossier" : "Submit a reviewed evidence dossier"}
          </h3>
        </div>
        {onCancel && (
          <button type="button" className="btn btn--ghost btn--small" onClick={onCancel}>
            Back to quick contribution
          </button>
        )}
      </header>

      <div className="dossier-boundary">
        <b>Profile: {DOSSIER_PROFILE} · English only</b>
        <p>
          Factual description only: no causal, predictive, normative, medical,
          legal, or personal-harm claim. Scope every statement by place, population,
          and period.
        </p>
        <p>
          Review checks whether the structured dossier is publishable; it is not a
          truth verdict, completeness score, or confidence score.
        </p>
        {isFr && (
          <p>
            L’interface est traduite, mais ce pilote accepte uniquement en anglais le
            texte de l’assertion, sa portée, le résumé, les localisateurs et les
            justifications. Le contenu des sources capturées conserve sa langue
            d’origine et n’est jamais traduit silencieusement.
          </p>
        )}
      </div>

      {challengeLink && (
        <p className="dossier-challenge-target">
          Contesting reviewed evidence link: <code>{challengeLink.id}</code>
        </p>
      )}

      <label className="field">
        <span className="field__label">Position</span>
        <select
          className="field__input"
          value={positionId}
          onChange={(event) => {
            setPositionId(event.target.value);
            touch();
          }}
        >
          <option value="">Choose a position</option>
          {debate.positions.map((position) => (
            <option key={position.id} value={position.id}>
              {letterOf(debate, position.id)} — {position.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Claim text</span>
        <textarea
          className="field__input"
          lang="en"
          value={claimText}
          onChange={(event) => {
            setClaimText(event.target.value);
            touch();
          }}
          placeholder="A bounded observation (20–600 characters)."
        />
      </label>

      <label className="field">
        <span className="field__label">Scope</span>
        <textarea
          className="field__input"
          lang="en"
          value={scopeNote}
          onChange={(event) => {
            setScopeNote(event.target.value);
            touch();
          }}
          placeholder="Population, geography, measurement, and period covered."
        />
      </label>

      <label className="field">
        <span className="field__label">Argument direction</span>
        <select
          className="field__input"
          value={argumentDirection}
          onChange={(event) => {
            setArgumentDirection(event.target.value as DossierArgumentDirection);
            touch();
          }}
        >
          <option value="supports">Supports the position</option>
          <option value="opposes">Opposes the position</option>
          <option value="qualifies">Qualifies the position</option>
        </select>
      </label>

      <label className="field">
        <span className="field__label">Argument summary</span>
        <textarea
          className="field__input"
          lang="en"
          value={argumentSummary}
          onChange={(event) => {
            setArgumentSummary(event.target.value);
            touch();
          }}
          placeholder="Explain how the bounded claim relates to the selected position."
        />
      </label>

      <EvidenceCaptureField
        role="support"
        value={support}
        onChange={(next) => {
          setSupport(next);
          touch();
        }}
      />
      <EvidenceCaptureField
        role="counter"
        value={counter}
        onChange={(next) => {
          setCounter(next);
          touch();
        }}
      />

      <label className="field dossier-language-confirmation">
        <span className="field__label">
          <input
            type="checkbox"
            checked={englishConfirmed}
            onChange={(event) => {
              setEnglishConfirmed(event.target.checked);
              touch();
            }}
          />{" "}
          {isFr
            ? "Je confirme que l’assertion, la portée, le résumé, les localisateurs et les justifications sont rédigés en anglais."
            : "I confirm that the claim, scope, summary, locators, and rationales are written in English."}
        </span>
      </label>

      <div className="dossier-submit">
        {!validation.ok && (
          <p className="dossier-note">Before submission: {validation.message}</p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button
          type="button"
          className="btn btn--primary"
          disabled={submitting || !validation.ok || !englishConfirmed}
          onClick={submit}
        >
          {submitting ? "Submitting dossier…" : "Submit evidence dossier"}
        </button>
      </div>
    </section>
  );
}
