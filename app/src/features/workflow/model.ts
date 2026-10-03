import type { Locale } from "../../i18n";
import type { Contribution } from "../../types";

export const REVIEW_RATIONALE_MIN_LENGTH = 8;

export type WorkflowProvenance = "supabase" | "local";
export type WorkflowReviewDecision =
  | "approve"
  | "reject"
  | "request_changes"
  | "mark_contested";
export type WorkflowReviewVisibility =
  | "visible"
  | "not_reviewed"
  | "restricted";

export interface WorkflowReview {
  decision: WorkflowReviewDecision;
  rationale: string;
  reviewed_at: string;
  provenance: "supabase";
}

export interface WorkflowContribution extends Contribution {
  provenance: WorkflowProvenance;
  review: WorkflowReview | null;
  review_visibility: WorkflowReviewVisibility;
  topic_title?: string;
  topic_question?: string;
  topic_slug?: string;
}

export interface WorkflowSeedPacket {
  id: string;
  topic_id: string;
  topic_question: string;
  initial_position: string;
  initial_arguments: string[];
  status: string;
  generated_revision_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  source_inputs: { url?: string; note?: string }[];
  provenance: "supabase";
}

export interface WorkflowRevision {
  id: string;
  topic_id: string;
  topic_title: string;
  topic_question: string;
  slug: string;
  revision_number: number;
  review_status: string;
  status: string;
  created_at: string;
  provenance: "supabase";
  review: WorkflowReview | null;
}

export interface ContributorWorkflowState {
  contributions: WorkflowContribution[];
  seedPackets: WorkflowSeedPacket[];
}

export interface DraftPosition {
  id: string;
  title: string;
  short_summary: string;
  steelman: string;
  status: string;
  generated_by: string;
  review_status: string;
  provenance: "supabase";
}

export interface DraftArgument {
  id: string;
  position_id: string;
  direction: string;
  summary: string;
  claim_ids: string[];
  generated_by: string;
  review_status: string;
  provenance: "supabase";
}

export interface DraftClaim {
  id: string;
  text: string;
  claim_type: string[];
  generated_by: string;
  review_status: string;
  provenance: "supabase";
}

export interface DraftSource {
  id: string;
  url: string;
  title: string;
  publisher: string;
  source_type: string;
  retrieval_status: string;
  retrieved_at: string | null;
  quality_notes: string;
  provenance: "supabase";
}

export interface DraftSourceExcerpt {
  id: string;
  source_id: string;
  text: string;
  locator: string;
  extracted_by: string;
  provenance: "supabase";
}

export interface DraftEvidenceLink {
  id: string;
  claim_id: string;
  source_id: string;
  source_excerpt_id: string | null;
  label: string;
  rationale: string;
  confidence: number;
  review_status: string;
  provenance: "supabase";
}

export interface DraftValue {
  id: string;
  name: string;
  description: string;
  tension_with: string[];
  position_ids: string[];
  provenance: "supabase";
}

export interface DraftTradeoff {
  id: string;
  position_id: string;
  gain: string;
  cost: string;
  risk: string;
  review_status: string;
  provenance: "supabase";
}

export interface DraftRevisionSnapshot {
  revision_id: string;
  positions: DraftPosition[];
  arguments: DraftArgument[];
  claims: DraftClaim[];
  sources: DraftSource[];
  excerpts: DraftSourceExcerpt[];
  evidenceLinks: DraftEvidenceLink[];
  values: DraftValue[];
  tradeoffs: DraftTradeoff[];
}

export type WorkflowErrorContext =
  | "generic"
  | "load"
  | "submit"
  | "review"
  | "publish"
  | "generate";

export interface WorkflowErrorMessageOptions {
  /** Required before a mapped message is returned, so legacy callers keep their localized fallback. */
  locale?: Locale;
  context?: WorkflowErrorContext;
  /** A caller-provided operation or request reference used only in development logs. */
  reference?: string;
}

type WorkflowErrorKind =
  | "permission"
  | "constraint"
  | "not_found"
  | "conflict";

type WorkflowErrorRecord = Record<string, unknown>;

const WORKFLOW_ERROR_MESSAGES: Record<
  Locale,
  Record<WorkflowErrorContext, Record<WorkflowErrorKind, string>>
> = {
  en: {
    generic: {
      permission: "You do not have permission to complete this action.",
      constraint: "This request does not satisfy the workflow rules.",
      not_found: "The requested item could not be found.",
      conflict: "This item changed while you were working. Reload it and try again.",
    },
    load: {
      permission: "You do not have permission to view this content.",
      constraint: "This content no longer satisfies the workflow rules.",
      not_found: "The requested content could not be found.",
      conflict: "This content changed while it was loading. Reload and try again.",
    },
    submit: {
      permission: "You do not have permission to submit this item.",
      constraint: "This submission does not satisfy the workflow rules. Check it and try again.",
      not_found: "The item for this submission could not be found. Reload and try again.",
      conflict: "This item changed or was already submitted. Reload and try again.",
    },
    review: {
      permission: "You do not have permission to review this item.",
      constraint: "This review does not satisfy the workflow rules. Check it and try again.",
      not_found: "The item to review could not be found. Reload the review queue.",
      conflict: "This item was changed or reviewed elsewhere. Reload it and try again.",
    },
    publish: {
      permission: "You do not have permission to publish this revision.",
      constraint: "This revision does not meet the publishing rules yet.",
      not_found: "The revision to publish could not be found. Reload and try again.",
      conflict: "This revision changed before it could be published. Reload and try again.",
    },
    generate: {
      permission: "You do not have permission to generate this draft.",
      constraint: "This draft request does not satisfy the workflow rules.",
      not_found: "The source item for this draft could not be found. Reload and try again.",
      conflict: "This draft request conflicts with a newer change. Reload and try again.",
    },
  },
  fr: {
    generic: {
      permission: "Vous n’avez pas l’autorisation d’effectuer cette action.",
      constraint: "Cette demande ne respecte pas les règles du processus.",
      not_found: "L’élément demandé est introuvable.",
      conflict: "Cet élément a changé pendant votre action. Rechargez-le puis réessayez.",
    },
    load: {
      permission: "Vous n’avez pas l’autorisation de consulter ce contenu.",
      constraint: "Ce contenu ne respecte plus les règles du processus.",
      not_found: "Le contenu demandé est introuvable.",
      conflict: "Ce contenu a changé pendant son chargement. Rechargez puis réessayez.",
    },
    submit: {
      permission: "Vous n’avez pas l’autorisation d’envoyer cet élément.",
      constraint: "Cette soumission ne respecte pas les règles du processus. Vérifiez-la puis réessayez.",
      not_found: "L’élément lié à cette soumission est introuvable. Rechargez puis réessayez.",
      conflict: "Cet élément a changé ou a déjà été envoyé. Rechargez puis réessayez.",
    },
    review: {
      permission: "Vous n’avez pas l’autorisation de réviser cet élément.",
      constraint: "Cette révision ne respecte pas les règles du processus. Vérifiez-la puis réessayez.",
      not_found: "L’élément à réviser est introuvable. Rechargez la file de révision.",
      conflict: "Cet élément a été modifié ou révisé ailleurs. Rechargez-le puis réessayez.",
    },
    publish: {
      permission: "Vous n’avez pas l’autorisation de publier cette révision.",
      constraint: "Cette révision ne respecte pas encore les règles de publication.",
      not_found: "La révision à publier est introuvable. Rechargez puis réessayez.",
      conflict: "Cette révision a changé avant sa publication. Rechargez puis réessayez.",
    },
    generate: {
      permission: "Vous n’avez pas l’autorisation de générer ce brouillon.",
      constraint: "Cette demande de brouillon ne respecte pas les règles du processus.",
      not_found: "L’élément source de ce brouillon est introuvable. Rechargez puis réessayez.",
      conflict: "Cette demande de brouillon entre en conflit avec une modification plus récente. Rechargez puis réessayez.",
    },
  },
};

let workflowErrorReferenceSequence = 0;

function asWorkflowErrorRecord(value: unknown): WorkflowErrorRecord | null {
  return typeof value === "object" && value !== null
    ? (value as WorkflowErrorRecord)
    : null;
}

function stableErrorCode(error: unknown): string | null {
  const record = asWorkflowErrorRecord(error);
  const code = record?.code;
  if (typeof code !== "string" && typeof code !== "number") return null;
  const normalized = String(code).trim().toUpperCase();
  return normalized || null;
}

function rawErrorMessage(error: unknown): string | null {
  const message = asWorkflowErrorRecord(error)?.message;
  if (typeof message !== "string") return null;
  const normalized = message.trim();
  return normalized || null;
}

function stableErrorStatus(error: unknown): number | null {
  const record = asWorkflowErrorRecord(error);
  const nestedContext = asWorkflowErrorRecord(record?.context);
  const value = record?.status ?? record?.statusCode ?? nestedContext?.status;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value !== "string" || !/^\d{3}$/.test(value.trim())) return null;
  return Number(value.trim());
}

function workflowErrorKind(error: unknown): WorkflowErrorKind | null {
  const code = stableErrorCode(error);
  const status = stableErrorStatus(error);

  if (
    code &&
    [
      "42501",
      "PGRST301",
      "PGRST302",
      "FORBIDDEN",
      "NOT_AUTHENTICATED",
      "PERMISSION_DENIED",
      "INSUFFICIENT_PRIVILEGE",
      "UNAUTHORIZED",
    ].includes(code)
  ) {
    return "permission";
  }
  if (status === 401 || status === 403) return "permission";

  if (
    code &&
    ["PGRST116", "NOT_FOUND", "RESOURCE_NOT_FOUND", "ROW_NOT_FOUND"].includes(
      code,
    )
  ) {
    return "not_found";
  }
  if (status === 404) return "not_found";

  if (
    code &&
    [
      "23505",
      "40001",
      "40P01",
      "ALREADY_EXISTS",
      "CONFLICT",
      "DUPLICATE",
    ].includes(code)
  ) {
    return "conflict";
  }
  if (status === 409 || status === 412) return "conflict";

  if (
    (code && /^23[0-9A-Z]{3}$/.test(code)) ||
    code === "CONSTRAINT_VIOLATION" ||
    status === 422
  ) {
    return "constraint";
  }
  return null;
}

function workflowErrorReference(explicitReference?: string): string {
  const reference = explicitReference?.trim();
  if (reference) return reference;
  workflowErrorReferenceSequence += 1;
  return `workflow-${Date.now().toString(36)}-${workflowErrorReferenceSequence.toString(36)}`;
}

function logWorkflowError(
  error: unknown,
  kind: WorkflowErrorKind | null,
  options: WorkflowErrorMessageOptions,
): void {
  if (!import.meta.env.DEV || error === null || error === undefined) return;
  console.error("[workflow:error]", {
    context: options.context ?? "generic",
    reference: workflowErrorReference(options.reference),
    kind: kind ?? "unmapped",
    code: stableErrorCode(error),
    status: stableErrorStatus(error),
    error,
  });
}

export function normalizedReviewRationale(value: string): string | null {
  const rationale = value.trim();
  return rationale.length >= REVIEW_RATIONALE_MIN_LENGTH ? rationale : null;
}

export function requireReviewRationale(value: string): string {
  const rationale = normalizedReviewRationale(value);
  if (!rationale) {
    throw new Error(
      `A review rationale of at least ${REVIEW_RATIONALE_MIN_LENGTH} characters is required.`,
    );
  }
  return rationale;
}

export function workflowErrorMessage(
  error: unknown,
  fallback: string,
  options: WorkflowErrorMessageOptions = {},
): string {
  const kind = workflowErrorKind(error);
  logWorkflowError(error, kind, options);

  if (kind && options.locale) {
    const context = options.context ?? "generic";
    return WORKFLOW_ERROR_MESSAGES[options.locale][context][kind];
  }

  const trimmedFallback = fallback.trim();
  const rawMessage = rawErrorMessage(error);
  if (
    trimmedFallback &&
    (!rawMessage || !trimmedFallback.includes(rawMessage))
  ) {
    return fallback;
  }
  return options.locale === "fr"
    ? "Une erreur s’est produite. Réessayez."
    : "Something went wrong. Try again.";
}

export function withWorkflowContribution(
  contribution: Contribution,
  provenance: WorkflowProvenance,
  review: WorkflowReview | null = null,
  reviewVisibility: WorkflowReviewVisibility = "not_reviewed",
): WorkflowContribution {
  return {
    ...contribution,
    provenance,
    review,
    review_visibility: reviewVisibility,
  };
}

export function workflowProvenanceLabel(
  locale: Locale,
  provenance: WorkflowProvenance,
): string {
  if (locale === "fr") {
    return provenance === "supabase" ? "Backend Supabase" : "Démo locale";
  }
  return provenance === "supabase" ? "Supabase backend" : "Local demo";
}

export function workflowStatusLabel(locale: Locale, status: string): string {
  const labels: Record<string, [string, string]> = {
    submitted: ["Submitted", "Soumise"],
    accepted: ["Accepted", "Acceptée"],
    rejected: ["Rejected", "Rejetée"],
    pending: ["Pending", "En attente"],
    running: ["Running", "En cours"],
    analyzed: ["Draft generated", "Brouillon généré"],
    failed: ["Failed", "Échec"],
    unreviewed: ["Unreviewed", "Non révisée"],
    approved: ["Approved", "Approuvée"],
    contested: ["Contested", "Contestée"],
  };
  const label = labels[status];
  return label ? label[locale === "fr" ? 1 : 0] : status.replace(/_/g, " ");
}

export function workflowDecisionLabel(
  locale: Locale,
  decision: WorkflowReviewDecision,
): string {
  const labels: Record<WorkflowReviewDecision, [string, string]> = {
    approve: ["Approve", "Approuver"],
    reject: ["Reject", "Rejeter"],
    request_changes: ["Request changes", "Demander des modifications"],
    mark_contested: ["Mark contested", "Marquer comme contestée"],
  };
  return labels[decision][locale === "fr" ? 1 : 0];
}

export function workflowCopy(locale: Locale) {
  return locale === "fr"
    ? {
        rationaleLabel: "Justification de la décision",
        rationalePlaceholder: `Justification obligatoire (${REVIEW_RATIONALE_MIN_LENGTH} caractères minimum)`,
        rationaleRequired: `Ajoutez une justification d’au moins ${REVIEW_RATIONALE_MIN_LENGTH} caractères avant de décider.`,
        inspectDraft: "Inspecter le brouillon complet",
        reloadDraft: "Recharger le brouillon",
        loadingDraft: "Chargement du brouillon…",
        draftLoadFailed: "Impossible de charger le brouillon complet.",
        completeDraft: "Brouillon structuré complet",
        noObjects: "Aucun objet dans cette section.",
        reviewHistory: "Dernière décision",
        reviewPending: "Aucune décision enregistrée.",
        rationaleRestricted:
          "La décision est visible, mais sa justification n’est pas exposée aux contributeurs par le backend actuel.",
        mergedRevision: "Révision fusionnée",
        backendSubmissions: "Vos soumissions backend",
        backendSubmissionsHint:
          "Chaque objet ci-dessous vient du backend et conserve son statut réel.",
        backendLoadFailed: "Impossible de charger vos soumissions backend.",
        noBackendSubmissions: "Aucune soumission backend pour ce compte.",
        seedPackets: "Dossiers de recherche",
        contributions: "Contributions",
        origin: "Provenance",
        objectId: "Identifiant",
        createdAt: "Créée le",
        updatedAt: "Mise à jour le",
      }
    : {
        rationaleLabel: "Decision rationale",
        rationalePlaceholder: `Required rationale (${REVIEW_RATIONALE_MIN_LENGTH} characters minimum)`,
        rationaleRequired: `Add a rationale of at least ${REVIEW_RATIONALE_MIN_LENGTH} characters before deciding.`,
        inspectDraft: "Inspect complete draft",
        reloadDraft: "Reload draft",
        loadingDraft: "Loading draft…",
        draftLoadFailed: "Could not load the complete draft.",
        completeDraft: "Complete structured draft",
        noObjects: "No objects in this section.",
        reviewHistory: "Latest decision",
        reviewPending: "No decision recorded.",
        rationaleRestricted:
          "The decision is visible, but the current backend does not expose its rationale to contributors.",
        mergedRevision: "Merged revision",
        backendSubmissions: "Your backend submissions",
        backendSubmissionsHint:
          "Every object below comes from the backend and keeps its real status.",
        backendLoadFailed: "Could not load your backend submissions.",
        noBackendSubmissions: "No backend submissions for this account.",
        seedPackets: "Research seed packets",
        contributions: "Contributions",
        origin: "Provenance",
        objectId: "Object ID",
        createdAt: "Created",
        updatedAt: "Updated",
      };
}
