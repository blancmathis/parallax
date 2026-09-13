import type { Locale } from "../../i18n";
import type {
  ClaimDossierDisplayStatus,
  ClaimDossierReviewDecision,
} from "./api";
import type {
  ClaimDossierValidationCode,
  DossierArgumentDirection,
  DossierResearchRole,
  SourceCaptureStatus,
} from "./model";

const EN = {
  panelTitle: "Evidence dossier for review",
  pilotOnly:
    "This bounded pilot is currently available only on the congestion-pricing debate.",
  back: "Back",
  authRequired:
    "This review workflow requires Supabase and a signed-in account.",
  openAccount: "Open account",
  pilotBadge: "bounded pilot",
  newTitle: "Submit a dossier for independent review",
  challengeTitle: "Challenge with a dossier for independent review",
  revisionTitle: "Revise a dossier after requested changes",
  backQuick: "Back to quick contribution",
  profile: "Profile: factual descriptive claim · dossier content in English only",
  profileRule:
    "Factual description only: no causal, predictive, normative, medical, legal, or personal-harm claim. Scope every statement by place, population, and period.",
  reviewBoundary:
    "Review checks whether the structured dossier meets the publication criteria; it is not a truth verdict, completeness score, or confidence score.",
  languageContract:
    "This pilot accepts claim, scope, summary, locator, and rationale text in English only. Captured source content keeps its original language and is never silently translated.",
  challengeTarget: "Contesting reviewed evidence link:",
  supersedes: "Revises dossier:",
  position: "Position",
  choosePosition: "Choose a position",
  claimText: "Claim text",
  claimPlaceholder: "A bounded observation in English (20–600 characters).",
  scope: "Scope",
  scopePlaceholder:
    "In English: population, geography, measurement, and period covered.",
  direction: "Argument direction",
  summary: "Argument summary",
  summaryPlaceholder:
    "Explain in English how the bounded claim relates to the selected position.",
  englishConfirmation:
    "I confirm that the claim, scope, summary, locators, and rationales are written in English.",
  englishConfirmationRequired:
    "Confirm that the authored dossier fields are in English before submission.",
  beforeSubmit: "Before submission:",
  submitting: "Submitting dossier…",
  submit: "Submit evidence dossier",
  resubmit: "Submit revised dossier",
  submittedBadge: "Submitted",
  submittedTitle: "Evidence dossier sent for independent review",
  submittedStatus: (status: string, id: string) => `Status: ${status} · dossier ${id}`,
  submittedBoundary:
    "Nothing was published or marked true. A reviewer may request changes, approve, or reject the dossier. An admin must separately prepare a draft, and that revision must pass its own review before publication.",
  track: "Track my dossier",
  unsafeUrl:
    "Use a public HTTP(S) URL without credentials, a non-standard port, or sensitive query parameters or fragments.",
  captureFailed:
    "Capture failed. It cannot be used as evidence, and this failure does not refute the claim.",
  unusableCapture: (status: string) =>
    `Capture ${status}. It cannot be used as evidence, and this failure does not refute the claim.`,
  submitFailed: "Could not submit the evidence dossier.",
  sourceLanguage: "Captured source content · original language",
  selectionHelp:
    "Select one exact continuous passage, then confirm it. Offsets are stored as UTF-8 bytes against the normalized text hash.",
  selectionReady: "Exact passage selected and ready to confirm.",
  selectionMissing: "No exact passage is selected yet.",
  locatorPlaceholder: "Page, section, paragraph, table…",
  rationalePlaceholder:
    "Explain in English the relationship to the claim (8+ characters).",
  rawHash: "Raw artifact hash",
  normalizedHash: "Normalized text hash",
  excerptHash: "Excerpt hash",
  unavailable: "not available",
  truncated:
    "Partial capture: the excerpt remains exact for this captured artifact, but the source was truncated.",
  calloutTitle: "Need a reviewable claim with exact source passages?",
  calloutBody:
    "The bounded evidence-dossier pilot captures two distinct public source identities, hashes the artifacts, records exact UTF-8 excerpt offsets, and keeps publication as a separate reviewed step.",
  calloutAction: "Open evidence dossier for review",
  reviewQueueTitle: "Claim evidence dossiers",
  reviewQueueIntro:
    "Human-only bounded pilot. Research roles are coverage roles; labels describe a passage/claim relationship. Retrieval failure is never counter-evidence.",
  refreshQueue: "Refresh dossier queue",
  queueLoading: "Loading claim dossiers…",
  queueEmpty: "No claim dossiers are visible to this reviewer.",
  inspect: "Inspect full dossier",
  reloadDetail: "Reload full dossier",
  detailBoundary:
    "Full normalized source text is restricted to the owner and reviewers. Load it before deciding.",
  detailFailed: "Could not load the full dossier.",
  reviewRationale: "Dossier review rationale",
  reviewRationalePlaceholder: "Required rationale (8–2,000 characters).",
  reviewRationaleHint:
    "Review structure, exact evidence, scope, and the proposed change. Approval means eligible for draft preparation—not true, complete, or published.",
  requestChanges: "Request changes",
  approve: "Approve dossier",
  reject: "Reject dossier",
  reviewFailed: "Could not review the evidence dossier.",
  decisionRecorded: (decision: string) => `Dossier decision recorded: ${decision}.`,
  prepare: "Prepare draft revision",
  prepareAdmin:
    "Creates an inspectable draft and exact diff only. It does not publish or establish the claim.",
  prepareRestricted:
    "Admin role required. Reviewers can approve the dossier but cannot prepare or publish a revision.",
  prepareFailed: "Could not prepare the draft revision.",
  prepared: (revision: string, changeSet: string) =>
    `Draft revision prepared: ${revision} · change set ${changeSet}. Nothing was published.`,
  preparedRevision: "Prepared draft revision:",
  preparedBoundary:
    "It must be separately reviewed before an admin can publish it.",
  loadQueueFailed: "Could not load claim dossiers.",
  myTitle: "My evidence dossiers",
  myIntro:
    "Real backend status, reasoned decision, and prepared draft—with no automatic publication.",
  myLoading: "Loading evidence dossiers…",
  myEmpty: "No evidence dossier has been submitted for this pilot.",
  myLoadFailed: "Could not load your claim dossiers.",
  changesLoadFailed: "Could not load the requested changes.",
  loadingChanges: "Loading requested changes…",
  revise: "Revise requested dossier",
  publicEyebrow: "Reviewed evidence dossiers",
  publicTitle: "Inspect the claim, the counter-search, and the exact passages.",
  publicBoundary:
    "Reviewed means the structured dossier and its revision passed the published checks. It is not a truth verdict, completeness guarantee, or confidence score.",
  publicChallengeBoundary:
    "Every dossier remains contestable with two new distinct public source identities and exact excerpts.",
  publicLoading: "Loading reviewed evidence dossiers…",
  publicLoadFailed: "Could not load reviewed evidence dossiers.",
  challenge: "Challenge this dossier",
  challengeUnavailable:
    "Contestation will be available once this dossier exposes its published evidence-link locator.",
  statusBoundary:
    "Status labels describe review history. They never automatically establish a claim.",
  method: "Read the review method",
  dossierId: "Dossier ID",
  baseRevision: "Base revision",
  preparedRevisionLabel: "Prepared revision",
  profileLabel: "Profile",
  languageLabel: "Language",
  directionLabel: "Argument direction",
  created: "Created",
  published: "Published",
  notExposed: "not exposed",
  scopeLabel: "Scope",
  structuredArgument: "Structured argument",
  contests: "Contests evidence link",
  reviewLabel: "Review",
  exactDiff: "Exact prepared revision diff",
  baseHash: "Base snapshot hash",
  preparedHash: "Prepared snapshot hash",
  changeHash: "Change hash",
  diffUnavailable: "Change set could not be displayed.",
  sourceFallback: "Captured source",
  captureLabel: "Capture",
  bytes: "bytes",
  inspectNormalized: "Inspect captured normalized text",
  locatorAndOffsets: (locator: string, start: number, end: number) =>
    `${locator} · bytes ${start}–${end} · UTF-8`,
  supportRole: "support",
  counterRole: "counter",
  roleNote: (role: string) =>
    `Research role: ${role}. Choose the passage label independently below; a counter-search source is not automatically contradictory.`,
  roleAria: (role: string) => `Research role: ${role}`,
  sourceUrl: (title: string) => `${title} URL`,
  capturing: "Capturing…",
  captureAction: (role: string) => `Capture ${role} source`,
  normalizedText: (title: string) => `${title} normalized source text`,
  useSelection: (role: string) => `Use selected ${role} passage`,
  offsets: (start: number, end: number) => `${start}–${end} UTF-8 bytes`,
  locator: (title: string) => `${title} exact excerpt locator`,
  passageLabel: (title: string) => `${title} passage label`,
  rationale: (title: string) => `${title} passage rationale`,
  artifactLabel: (title: string) => `Captured artifact: ${title}`,
  linkOpens: "Open captured source",
  retry: "Try again",
  genericUnavailable:
    "The dossier service is temporarily unavailable. Try again without changing your dossier.",
  authError: "Sign in with an authorized account, then try again.",
  quotaError: "This pilot's current quota has been reached. Try again later.",
  staleError: "The base revision changed. Reload the debate before submitting again.",
  conflictError:
    "This request conflicts with an earlier attempt. Change the dossier and try again.",
  invalidEvidenceError:
    "The server could not verify this evidence pair. Recapture the sources and select the exact passages again.",
  blockedHostError:
    "This source host cannot be captured safely. Use another public source URL.",
  captureBusyError:
    "This source capture is already in progress. Wait briefly, then try again.",
} as const;

const FR: typeof EN = {
  ...EN,
  panelTitle: "Dossier de preuves à faire relire",
  pilotOnly:
    "Ce pilote limité est actuellement disponible uniquement dans le débat sur le péage de congestion.",
  back: "Retour",
  authRequired:
    "Ce parcours de relecture nécessite Supabase et un compte connecté.",
  openAccount: "Ouvrir le compte",
  pilotBadge: "pilote limité",
  newTitle: "Soumettre un dossier à une relecture indépendante",
  challengeTitle:
    "Contester avec un dossier soumis à une relecture indépendante",
  revisionTitle: "Corriger un dossier après une demande de modifications",
  backQuick: "Revenir à la contribution rapide",
  profile:
    "Profil : assertion descriptive factuelle · contenu du dossier en anglais uniquement",
  profileRule:
    "Description factuelle uniquement : aucune assertion causale, prédictive, normative, médicale, juridique ou portant sur un préjudice personnel. Délimitez chaque assertion par un lieu, une population et une période.",
  reviewBoundary:
    "La relecture vérifie si le dossier structuré respecte les critères de publication ; elle ne constitue ni un verdict de vérité, ni un score d’exhaustivité, ni un indice de confiance.",
  languageContract:
    "L’interface est traduite, mais ce pilote accepte uniquement en anglais le texte de l’assertion, sa portée, le résumé, les localisateurs et les justifications. Le contenu des sources capturées conserve sa langue d’origine et n’est jamais traduit silencieusement.",
  challengeTarget: "Lien de preuve relu contesté :",
  supersedes: "Corrige le dossier :",
  position: "Position",
  choosePosition: "Choisir une position",
  claimText: "Texte de l’assertion",
  claimPlaceholder:
    "Une observation délimitée, rédigée en anglais (20 à 600 caractères).",
  scope: "Portée",
  scopePlaceholder:
    "En anglais : population, zone géographique, mesure et période couvertes.",
  direction: "Sens de l’argument",
  summary: "Résumé de l’argument",
  summaryPlaceholder:
    "Expliquez en anglais comment l’assertion délimitée se rapporte à la position choisie.",
  englishConfirmation:
    "Je confirme que l’assertion, la portée, le résumé, les localisateurs et les justifications sont rédigés en anglais.",
  englishConfirmationRequired:
    "Confirmez que les champs rédigés du dossier sont en anglais avant l’envoi.",
  beforeSubmit: "Avant l’envoi :",
  submitting: "Envoi du dossier…",
  submit: "Soumettre le dossier de preuves",
  resubmit: "Soumettre le dossier corrigé",
  submittedBadge: "Envoyé",
  submittedTitle:
    "Dossier de preuves envoyé pour une relecture indépendante",
  submittedStatus: (status: string, id: string) =>
    `Statut : ${status} · dossier ${id}`,
  submittedBoundary:
    "Rien n’a été publié ni déclaré vrai. Une personne chargée de la relecture peut demander des modifications, approuver ou rejeter le dossier. Un administrateur doit ensuite préparer séparément un brouillon, et cette révision doit réussir sa propre relecture avant toute publication.",
  track: "Suivre mon dossier",
  unsafeUrl:
    "Utilisez une URL HTTP(S) publique, sans identifiants intégrés, port non standard ni paramètre ou fragment sensible.",
  captureFailed:
    "La capture a échoué. Elle ne peut pas servir de preuve, et cet échec ne réfute pas l’assertion.",
  unusableCapture: (status: string) =>
    `Capture : ${status}. Elle ne peut pas servir de preuve, et cet échec ne réfute pas l’assertion.`,
  submitFailed: "Impossible d’envoyer le dossier de preuves.",
  sourceLanguage: "Contenu de la source capturée · langue d’origine",
  selectionHelp:
    "Sélectionnez un passage continu exact, puis confirmez-le. Les positions sont enregistrées en octets UTF-8 relativement à l’empreinte du texte normalisé.",
  selectionReady: "Le passage exact est sélectionné et prêt à être confirmé.",
  selectionMissing: "Aucun passage exact n’est encore sélectionné.",
  locatorPlaceholder: "Page, section, paragraphe, tableau…",
  rationalePlaceholder:
    "Expliquez en anglais le lien avec l’assertion (8 caractères minimum).",
  rawHash: "Empreinte de l’artefact brut",
  normalizedHash: "Empreinte du texte normalisé",
  excerptHash: "Empreinte de l’extrait",
  unavailable: "indisponible",
  truncated:
    "Capture partielle : l’extrait reste exact pour cet artefact capturé, mais la source a été tronquée.",
  calloutTitle:
    "Besoin d’une assertion relisible avec des passages de source exacts ?",
  calloutBody:
    "Le pilote limité de dossier de preuves capture deux identités de sources publiques distinctes, calcule les empreintes des artefacts, enregistre les positions exactes des extraits en octets UTF-8 et sépare la publication dans une étape relue.",
  calloutAction: "Ouvrir le dossier de preuves à faire relire",
  reviewQueueTitle: "Dossiers de preuves des assertions",
  reviewQueueIntro:
    "Pilote limité à relecture humaine. Les rôles de recherche couvrent deux pistes ; les libellés décrivent le lien entre un passage et l’assertion. Un échec de récupération n’est jamais une contre-preuve.",
  refreshQueue: "Actualiser la file des dossiers",
  queueLoading: "Chargement des dossiers d’assertion…",
  queueEmpty: "Aucun dossier d’assertion n’est visible pour cette personne.",
  inspect: "Inspecter le dossier complet",
  reloadDetail: "Recharger le dossier complet",
  detailBoundary:
    "Le texte normalisé complet des sources est réservé à l’auteur et aux personnes chargées de la relecture. Chargez-le avant de décider.",
  detailFailed: "Impossible de charger le dossier complet.",
  reviewRationale: "Justification de la relecture du dossier",
  reviewRationalePlaceholder:
    "Justification obligatoire (8 à 2 000 caractères).",
  reviewRationaleHint:
    "Relisez la structure, les preuves exactes, la portée et la modification proposée. Une approbation rend le dossier admissible à la préparation d’un brouillon ; elle ne le déclare ni vrai, ni complet, ni publié.",
  requestChanges: "Demander des modifications",
  approve: "Approuver le dossier",
  reject: "Rejeter le dossier",
  reviewFailed: "Impossible de relire le dossier de preuves.",
  decisionRecorded: (decision: string) =>
    `Décision enregistrée pour le dossier : ${decision}.`,
  prepare: "Préparer la révision brouillon",
  prepareAdmin:
    "Crée uniquement un brouillon inspectable et une différence exacte. Cela ne publie ni n’établit l’assertion.",
  prepareRestricted:
    "Rôle administrateur requis. La personne chargée de la relecture peut approuver le dossier, mais ne peut ni préparer ni publier une révision.",
  prepareFailed: "Impossible de préparer la révision brouillon.",
  prepared: (revision: string, changeSet: string) =>
    `Révision brouillon préparée : ${revision} · jeu de modifications ${changeSet}. Rien n’a été publié.`,
  preparedRevision: "Révision brouillon préparée :",
  preparedBoundary:
    "Elle doit être relue séparément avant qu’un administrateur puisse la publier.",
  loadQueueFailed: "Impossible de charger les dossiers d’assertion.",
  myTitle: "Mes dossiers de preuves",
  myIntro:
    "Statut backend réel, décision motivée et révision préparée, sans publication automatique.",
  myLoading: "Chargement des dossiers de preuves…",
  myEmpty: "Aucun dossier de preuves n’a été soumis pour ce pilote.",
  myLoadFailed: "Impossible de charger vos dossiers d’assertion.",
  changesLoadFailed: "Impossible de charger les modifications demandées.",
  loadingChanges: "Chargement des modifications demandées…",
  revise: "Corriger le dossier",
  publicEyebrow: "Dossiers de preuves relus",
  publicTitle:
    "Inspectez l’assertion, la contre-recherche et les passages exacts.",
  publicBoundary:
    "« Relu » signifie que le dossier structuré et sa révision ont franchi les contrôles publiés. Ce n’est ni un verdict de vérité, ni une garantie d’exhaustivité, ni un score de confiance.",
  publicChallengeBoundary:
    "Chaque dossier reste contestable avec deux nouvelles identités de sources publiques distinctes et des extraits exacts.",
  publicLoading: "Chargement des dossiers de preuves relus…",
  publicLoadFailed: "Impossible de charger les dossiers de preuves relus.",
  challenge: "Contester ce dossier",
  challengeUnavailable:
    "La contestation sera disponible lorsque ce dossier exposera le localisateur de son lien de preuve publié.",
  statusBoundary:
    "Les libellés de statut décrivent l’historique de relecture. Ils n’établissent jamais automatiquement une assertion.",
  method: "Lire la méthode de relecture",
  dossierId: "Identifiant du dossier",
  baseRevision: "Révision de base",
  preparedRevisionLabel: "Révision préparée",
  profileLabel: "Profil",
  languageLabel: "Langue",
  directionLabel: "Sens de l’argument",
  created: "Créé",
  published: "Publié",
  notExposed: "non exposé",
  scopeLabel: "Portée",
  structuredArgument: "Argument structuré",
  contests: "Conteste le lien de preuve",
  reviewLabel: "Relecture",
  exactDiff: "Différence exacte de la révision préparée",
  baseHash: "Empreinte de l’instantané de base",
  preparedHash: "Empreinte de l’instantané préparé",
  changeHash: "Empreinte des modifications",
  diffUnavailable: "Impossible d’afficher le jeu de modifications.",
  sourceFallback: "Source capturée",
  captureLabel: "Capture",
  bytes: "octets",
  inspectNormalized: "Inspecter le texte normalisé capturé",
  locatorAndOffsets: (locator: string, start: number, end: number) =>
    `${locator} · octets ${start}–${end} · UTF-8`,
  supportRole: "appui",
  counterRole: "contre-vérification",
  roleNote: (role: string) =>
    `Rôle de recherche : ${role}. Choisissez séparément ci-dessous le libellé du passage ; une source de contre-vérification n’est pas automatiquement contradictoire.`,
  roleAria: (role: string) => `Rôle de recherche : ${role}`,
  sourceUrl: (title: string) => `URL — ${title}`,
  capturing: "Capture en cours…",
  captureAction: (role: string) => `Capturer la source ${role}`,
  normalizedText: (title: string) => `Texte normalisé — ${title}`,
  useSelection: (role: string) => `Utiliser le passage sélectionné ${role}`,
  offsets: (start: number, end: number) => `${start}–${end} octets UTF-8`,
  locator: (title: string) => `Localisateur exact de l’extrait — ${title}`,
  passageLabel: (title: string) => `Libellé du passage — ${title}`,
  rationale: (title: string) => `Justification du passage — ${title}`,
  artifactLabel: (title: string) => `Artefact capturé : ${title}`,
  linkOpens: "Ouvrir la source capturée",
  retry: "Réessayer",
  genericUnavailable:
    "Le service de dossiers est temporairement indisponible. Réessayez sans modifier votre dossier.",
  authError: "Connectez-vous avec un compte autorisé, puis réessayez.",
  quotaError:
    "Le quota actuel de ce pilote est atteint. Réessayez ultérieurement.",
  staleError:
    "La révision de base a changé. Rechargez le débat avant un nouvel envoi.",
  conflictError:
    "Cette requête entre en conflit avec une tentative précédente. Modifiez le dossier, puis réessayez.",
  invalidEvidenceError:
    "Le serveur n’a pas pu vérifier cette paire de preuves. Capturez de nouveau les sources et resélectionnez les passages exacts.",
  blockedHostError:
    "Cet hôte ne peut pas être capturé de manière sûre. Utilisez une autre URL de source publique.",
  captureBusyError:
    "La capture de cette source est déjà en cours. Patientez un instant, puis réessayez.",
};

export type DossierCopy = typeof EN;

export function dossierCopy(locale: Locale): DossierCopy {
  return locale === "fr" ? FR : EN;
}

const VALIDATION_EN: Record<ClaimDossierValidationCode, string> = {
  pilot_topic_required:
    "The claim dossier pilot is limited to the congestion-pricing topic.",
  profile_required: "This pilot accepts English factual descriptive claims only.",
  base_revision_required: "A current base revision is required.",
  position_required: "Choose the position this argument belongs to.",
  challenge_target_required:
    "A challenge must identify the reviewed evidence link it contests.",
  challenge_target_forbidden: "A new claim cannot target an existing evidence link.",
  claim_out_of_profile:
    "Write a 20–600 character factual description in English, without causal, predictive, or normative language.",
  argument_required:
    "The structured argument summary must contain 20–1,200 characters.",
  scope_required: "State the population, place, and period covered by the claim.",
  evidence_pair_required: "Attach exactly one support source and one counter source.",
  distinct_sources_required:
    "Support and counter evidence must use two distinct public source identities.",
  unusable_capture:
    "Only found or partial captures with verifiable hashes can be evidence. A failure is not a refutation.",
  invalid_excerpt: "Each excerpt must exactly match the selected UTF-8 byte range.",
  excerpt_too_large:
    "Each exact excerpt is limited to 2,000 characters and 8,192 UTF-8 bytes.",
  locator_required: "Add a human-readable source locator of at most 500 characters.",
  rationale_required:
    "Explain the claim/source relationship in 8–2,000 characters.",
};

const VALIDATION_FR: Record<ClaimDossierValidationCode, string> = {
  pilot_topic_required:
    "Le pilote des dossiers d’assertion est limité au débat sur le péage de congestion.",
  profile_required:
    "Ce pilote accepte uniquement des assertions descriptives factuelles rédigées en anglais.",
  base_revision_required: "Une révision de base actuelle est requise.",
  position_required:
    "Choisissez la position à laquelle cet argument se rattache.",
  challenge_target_required:
    "Une contestation doit identifier le lien de preuve relu qu’elle remet en cause.",
  challenge_target_forbidden:
    "Une nouvelle assertion ne peut pas cibler un lien de preuve existant.",
  claim_out_of_profile:
    "Rédigez en anglais une description factuelle de 20 à 600 caractères, sans formulation causale, prédictive ou normative.",
  argument_required:
    "Le résumé structuré de l’argument doit contenir entre 20 et 1 200 caractères.",
  scope_required:
    "Indiquez la population, le lieu et la période couverts par l’assertion.",
  evidence_pair_required:
    "Joignez exactement une source d’appui et une source de contre-vérification.",
  distinct_sources_required:
    "Les preuves d’appui et de contre-vérification doivent utiliser deux identités de sources publiques distinctes.",
  unusable_capture:
    "Seules les captures trouvées ou partielles dotées d’empreintes vérifiables peuvent servir de preuve. Un échec de capture n’est pas une réfutation.",
  invalid_excerpt:
    "Chaque extrait doit correspondre exactement à la plage d’octets UTF-8 sélectionnée.",
  excerpt_too_large:
    "Chaque extrait exact est limité à 2 000 caractères et 8 192 octets UTF-8.",
  locator_required:
    "Ajoutez un localisateur de source compréhensible de 500 caractères maximum.",
  rationale_required:
    "Expliquez le lien entre l’assertion et la source en 8 à 2 000 caractères.",
};

export function dossierValidationMessage(
  locale: Locale,
  code: ClaimDossierValidationCode,
): string {
  return (locale === "fr" ? VALIDATION_FR : VALIDATION_EN)[code];
}

export function dossierStatusLabel(
  locale: Locale,
  status: ClaimDossierDisplayStatus,
): string {
  const labels: Record<Locale, Record<ClaimDossierDisplayStatus, string>> = {
    en: {
      submitted: "Submitted",
      changes_requested: "Changes requested",
      accepted: "Accepted",
      rejected: "Rejected",
      reviewed_and_published: "Reviewed and published",
    },
    fr: {
      submitted: "Envoyé",
      changes_requested: "Modifications demandées",
      accepted: "Accepté",
      rejected: "Rejeté",
      reviewed_and_published: "Relu et publié",
    },
  };
  return labels[locale][status];
}

export function captureStatusLabel(locale: Locale, status: SourceCaptureStatus): string {
  const labels: Record<Locale, Record<SourceCaptureStatus, string>> = {
    en: {
      found: "Found",
      partial: "Partial",
      blocked: "Blocked",
      failed: "Failed",
      missing: "Missing",
      oversize: "Too large",
      unsupported: "Unsupported",
    },
    fr: {
      found: "Trouvée",
      partial: "Partielle",
      blocked: "Bloquée",
      failed: "Échec",
      missing: "Introuvable",
      oversize: "Trop volumineuse",
      unsupported: "Non prise en charge",
    },
  };
  return labels[locale][status];
}

export function researchRoleLabel(locale: Locale, role: DossierResearchRole): string {
  const copy = dossierCopy(locale);
  return role === "support" ? copy.supportRole : copy.counterRole;
}

export function sourceRoleTitle(locale: Locale, role: DossierResearchRole): string {
  if (locale === "fr") {
    return role === "support" ? "Source d’appui" : "Source de contre-vérification";
  }
  return role === "support" ? "Support source" : "Counter source";
}

export function argumentDirectionLabel(
  locale: Locale,
  direction: DossierArgumentDirection,
): string {
  const labels: Record<Locale, Record<DossierArgumentDirection, string>> = {
    en: {
      supports: "Supports the position",
      opposes: "Opposes the position",
      qualifies: "Qualifies the position",
    },
    fr: {
      supports: "Appuie la position",
      opposes: "S’oppose à la position",
      qualifies: "Nuance la position",
    },
  };
  return labels[locale][direction];
}

export function reviewDecisionLabel(
  locale: Locale,
  decision: ClaimDossierReviewDecision,
): string {
  const labels: Record<Locale, Record<ClaimDossierReviewDecision, string>> = {
    en: {
      request_changes: "Changes requested",
      approve: "Approved",
      reject: "Rejected",
    },
    fr: {
      request_changes: "Modifications demandées",
      approve: "Approuvé",
      reject: "Rejeté",
    },
  };
  return labels[locale][decision];
}

export function dossierKindLabel(
  locale: Locale,
  kind: "new_claim" | "challenge",
): string {
  if (locale === "fr") {
    return kind === "challenge" ? "contestation de preuve" : "dossier d’assertion";
  }
  return kind === "challenge" ? "evidence challenge" : "claim dossier";
}

export function dossierProfileLabel(locale: Locale): string {
  return locale === "fr" ? "Description factuelle" : "Factual description";
}

export function dossierLanguageLabel(locale: Locale): string {
  return locale === "fr" ? "Anglais" : "English";
}

export function formatDossierDate(locale: Locale, value: string | null): string {
  if (!value) return dossierCopy(locale).notExposed;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export type DossierErrorKind =
  | "capture"
  | "submit"
  | "detail"
  | "review"
  | "prepare"
  | "queue"
  | "mine"
  | "revision"
  | "public";

function errorFingerprint(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const row = error as Record<string, unknown>;
  return [row.code, row.name, row.status, row.message, row.details, row.hint]
    .filter((value): value is string | number =>
      typeof value === "string" || typeof value === "number",
    )
    .join(" ")
    .toLowerCase();
}

/**
 * Map backend failures to stable localized recovery messages. Raw Supabase,
 * PostgREST and SQL text is deliberately never returned to the interface.
 */
export function safeDossierError(
  locale: Locale,
  error: unknown,
  kind: DossierErrorKind,
): string {
  const copy = dossierCopy(locale);
  const fingerprint = errorFingerprint(error);
  if (/jwt|unauth|not signed|permission|forbidden|42501|rls/.test(fingerprint)) {
    return copy.authError;
  }
  if (/quota|rate limit|too many|429/.test(fingerprint)) return copy.quotaError;
  if (/stale|base revision|revision conflict/.test(fingerprint)) return copy.staleError;
  if (/idempot|conflict|409|23505/.test(fingerprint)) return copy.conflictError;
  if (/dns|private host|blocked host|ssrf|redirect policy/.test(fingerprint)) {
    return copy.blockedHostError;
  }
  if (/capture.*progress|already.*capture|pending capture/.test(fingerprint)) {
    return copy.captureBusyError;
  }
  if (/evidence|excerpt|artifact|locator|source identit/.test(fingerprint)) {
    return copy.invalidEvidenceError;
  }
  const fallback: Record<DossierErrorKind, string> = {
    capture: copy.captureFailed,
    submit: copy.submitFailed,
    detail: copy.detailFailed,
    review: copy.reviewFailed,
    prepare: copy.prepareFailed,
    queue: copy.loadQueueFailed,
    mine: copy.myLoadFailed,
    revision: copy.changesLoadFailed,
    public: copy.publicLoadFailed,
  };
  return fallback[kind] || copy.genericUnavailable;
}
