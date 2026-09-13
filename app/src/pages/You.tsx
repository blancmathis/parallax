import { useEffect, useState, type FormEvent } from "react";
import { LocaleLink as Link } from "../i18n/links";
import { POSITION_LETTERS, getDebates, slugOf } from "../data";
import { useI18n } from "../i18n";
import {
  authCopy,
  authPasswordMeetsPolicy,
  MIN_AUTH_PASSWORD_LENGTH,
} from "../features/auth/model";
import { loadMySupabaseWorkflow } from "../lib/backend";
import { useAuth, type PasswordRecoveryPath } from "../lib/auth";
import { localTestIdentityHelp } from "../lib/localTestIdentities";
import { isSupabaseConfigured } from "../lib/supabase";
import { safeHttpUrl } from "../lib/url";
import { resetProfile, useProfile } from "../lib/profile";
import { useStore } from "../lib/store";
import { usePageTitle } from "../lib/ui";
import {
  workflowCopy,
  workflowErrorMessage,
  workflowProvenanceLabel,
  workflowStatusLabel,
  type ContributorWorkflowState,
} from "../features/workflow/model";
import { MyClaimDossiers } from "../features/dossier/DossierViews";
import { DOSSIER_PILOT_TOPIC_ID } from "../features/dossier/model";

type AuthMode = "login" | "signup" | "forgot";
type AuthFeedback = { kind: "status" | "error"; text: string } | null;

export function AuthPanel() {
  const auth = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback>(null);
  const copy = authCopy(locale);

  if (!isSupabaseConfigured) {
    return (
      <section className="authbox">
        <p className="authbox__eyebrow">Auth</p>
        <p>
          {isFr
            ? "Supabase n’est pas configuré ; le prototype local est actif."
            : "Supabase is not configured; local prototype mode is active."}
        </p>
      </section>
    );
  }

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFeedback(null);
    setPassword("");
    setPasswordConfirmation("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (auth.isPasswordRecovery || mode === "signup") {
      if (!authPasswordMeetsPolicy(password)) {
        setFeedback({ kind: "error", text: copy.passwordInvalid });
        return;
      }
    }
    if (auth.isPasswordRecovery && password !== passwordConfirmation) {
      setFeedback({ kind: "error", text: copy.passwordMismatch });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      if (auth.isPasswordRecovery) {
        await auth.updatePassword(password);
        setPassword("");
        setPasswordConfirmation("");
        setFeedback({ kind: "status", text: copy.passwordUpdated });
      } else if (mode === "forgot") {
        const redirectPath: PasswordRecoveryPath = isFr ? "/fr/you" : "/you";
        await auth.requestPasswordReset(email.trim(), redirectPath);
        setFeedback({ kind: "status", text: copy.resetRequested });
      } else if (mode === "login") {
        await auth.signIn(email.trim(), password);
        setPassword("");
        setFeedback({ kind: "status", text: copy.loggedIn });
      } else {
        const redirectPath: PasswordRecoveryPath = isFr ? "/fr/you" : "/you";
        const outcome = await auth.signUp(email.trim(), password, redirectPath);
        setPassword("");
        setFeedback({
          kind: "status",
          text: outcome === "signed_in" ? copy.signedUp : copy.confirmationRequired,
        });
      }
    } catch {
      const text = auth.isPasswordRecovery
        ? copy.updateFailed
        : mode === "forgot"
          ? copy.resetFailed
          : mode === "signup"
            ? copy.signupFailed
            : copy.loginFailed;
      setFeedback({ kind: "error", text });
    } finally {
      setBusy(false);
    }
  };

  const refreshSession = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const nextProfileState = await auth.refreshProfile();
      setFeedback({
        kind: nextProfileState === "error" ? "error" : "status",
        text: nextProfileState === "error" ? copy.profileUnavailable : copy.sessionRefreshed,
      });
    } catch {
      setFeedback({ kind: "error", text: copy.profileUnavailable });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await auth.signOut();
    } catch {
      setFeedback({ kind: "error", text: copy.signOutFailed });
    } finally {
      setBusy(false);
    }
  };

  const role = auth.profile?.role ??
    (auth.profileState === "loading" ? copy.loading : copy.unavailable);

  return (
    <section className="authbox">
      <div>
        <p className="authbox__eyebrow">{copy.auth}</p>
        {auth.isPasswordRecovery ? (
          <>
            <h2 className="youpage__subtitle">{copy.recoveryTitle}</h2>
            <p className="youpage__hint">{copy.recoveryHint}</p>
          </>
        ) : auth.user ? (
          <>
            <h2 className="youpage__subtitle">{auth.profile?.display_name ?? auth.user.email}</h2>
            <p className="youpage__hint">
              {auth.user.email} · {copy.role}: <b>{role}</b>
            </p>
          </>
        ) : (
          <h2 className="youpage__subtitle">{copy.signInTitle}</h2>
        )}
        {!auth.user && localTestIdentityHelp && (
          <p className="youpage__hint">
            {copy.localOnly} — {copy.localAccounts}: {localTestIdentityHelp.identities
              .map((identity) => `${identity.label}: ${identity.email}`)
              .join(", ")}. {copy.localPassword}: {localTestIdentityHelp.password}.
          </p>
        )}
      </div>

      {auth.profileState === "error" && auth.user && !auth.isPasswordRecovery && (
        <p className="form-error" role="alert">{copy.profileUnavailable}</p>
      )}

      {auth.user && !auth.isPasswordRecovery ? (
        <div className="authbox__actions">
          <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={refreshSession}>
            {copy.refreshSession}
          </button>
          <button type="button" className="btn btn--primary btn--small" disabled={busy} onClick={signOut}>
            {copy.logOut}
          </button>
        </div>
      ) : (
        <form className="authbox__form" onSubmit={submit}>
          {!auth.isPasswordRecovery && (
            <label className="field">
              <span className="field__label">{copy.email}</span>
              <input
                className="field__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          )}
          {(auth.isPasswordRecovery || mode !== "forgot") && (
            <label className="field">
              <span className="field__label">
                {auth.isPasswordRecovery ? copy.newPassword : copy.password}
              </span>
              <input
                className="field__input"
                type="password"
                autoComplete={auth.isPasswordRecovery || mode === "signup" ? "new-password" : "current-password"}
                minLength={auth.isPasswordRecovery || mode === "signup" ? MIN_AUTH_PASSWORD_LENGTH : undefined}
                aria-describedby={auth.isPasswordRecovery || mode === "signup" ? "auth-password-requirements" : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          )}
          {(auth.isPasswordRecovery || mode === "signup") && (
            <p className="youpage__hint" id="auth-password-requirements">
              {copy.recoveryHint}
            </p>
          )}
          {auth.isPasswordRecovery && (
            <label className="field">
              <span className="field__label">{copy.confirmPassword}</span>
              <input
                className="field__input"
                type="password"
                autoComplete="new-password"
                minLength={MIN_AUTH_PASSWORD_LENGTH}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
            </label>
          )}
          <div className="authbox__actions">
            {!auth.isPasswordRecovery && mode !== "forgot" && (
              <>
                <button
                  type="button"
                  className={`themechip${mode === "login" ? " themechip--active" : ""}`}
                  aria-pressed={mode === "login"}
                  disabled={busy}
                  onClick={() => changeMode("login")}
                >
                  {copy.login}
                </button>
                <button
                  type="button"
                  className={`themechip${mode === "signup" ? " themechip--active" : ""}`}
                  aria-pressed={mode === "signup"}
                  disabled={busy}
                  onClick={() => changeMode("signup")}
                >
                  {copy.signup}
                </button>
              </>
            )}
            {!auth.isPasswordRecovery && mode === "forgot" && (
              <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => changeMode("login")}>
                {copy.backToLogin}
              </button>
            )}
            <button type="submit" className="btn btn--primary btn--small" disabled={busy}>
              {busy ? copy.working : auth.isPasswordRecovery
                ? copy.updatePassword
                : mode === "forgot"
                  ? copy.sendReset
                  : mode === "login"
                    ? copy.logIn
                    : copy.createAccount}
            </button>
          </div>
          {!auth.isPasswordRecovery && mode === "login" && (
            <button type="button" className="link" disabled={busy} onClick={() => changeMode("forgot")}>
              {copy.forgotPassword}
            </button>
          )}
        </form>
      )}
      {feedback && (
        <p
          className={feedback.kind === "error" ? "form-error" : "backend-note"}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}

function formatWorkflowTime(iso: string, locale: "en" | "fr"): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BackendWorkflowPanel({
  workflow,
  loading,
  error,
}: {
  workflow: ContributorWorkflowState;
  loading: boolean;
  error: string;
}) {
  const { locale, t } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  const empty = workflow.contributions.length === 0 && workflow.seedPackets.length === 0;

  return (
    <section className="youpage__section" aria-labelledby="backend-workflow-title">
      <h2 className="youpage__subtitle" id="backend-workflow-title">
        {copy.backendSubmissions}
      </h2>
      <p className="youpage__hint">{copy.backendSubmissionsHint}</p>
      {loading && <p className="backend-note" role="status">{isFr ? "Chargement…" : "Loading…"}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && empty && (
        <p className="reviewpage__emptyhint">{copy.noBackendSubmissions}</p>
      )}

      {workflow.contributions.length > 0 && (
        <div>
          <h3>{copy.contributions} ({workflow.contributions.length})</h3>
          {workflow.contributions.map((contribution) => {
            const href = safeHttpUrl(contribution.url);
            return (
              <article className="rcard" key={contribution.id}>
                <header className="rcard__head">
                  <span className="rcard__type">
                    {t.common.contributionLabels[contribution.type]}
                  </span>
                  <span className={`rcard__verdict rcard__verdict--${contribution.status}`}>
                    {workflowStatusLabel(locale, contribution.status)}
                  </span>
                  <span className="rcard__sampletag">
                    {workflowProvenanceLabel(locale, contribution.provenance)}
                  </span>
                </header>
                {contribution.topic_title && (
                  contribution.topic_slug ? (
                    <Link className="rcard__topic" to={`/debates/${contribution.topic_slug}`}>
                      {contribution.topic_title}
                    </Link>
                  ) : (
                    <p className="rcard__topic">{contribution.topic_title}</p>
                  )
                )}
                {contribution.title && <h4>{contribution.title}</h4>}
                {contribution.target_object_id && (
                  <p className="rcard__target">
                    {t.common.labels.on}: {contribution.target_object_id}
                  </p>
                )}
                <p className="rcard__body">{contribution.body}</p>
                {href && (
                  <a className="rcard__url" href={href} target="_blank" rel="noreferrer">
                    {contribution.url} ↗
                  </a>
                )}
                {contribution.url && !href && (
                  <p className="form-error">{isFr ? "URL enregistrée invalide" : "Invalid stored URL"}</p>
                )}
                {contribution.proposed_label && (
                  <p className="rcard__target">
                    {t.common.labels.proposedLabel}: {t.common.evidenceLabels[contribution.proposed_label]}
                  </p>
                )}
                <p className="rcard__target">
                  {copy.objectId}: {contribution.id} · {copy.createdAt}: {formatWorkflowTime(contribution.created_at, locale)}
                </p>
                {contribution.merged_revision_id && (
                  <p className="backend-note">
                    {copy.mergedRevision}: {contribution.merged_revision_id}
                    {contribution.topic_slug && (
                      <> · <Link className="link" to={`/debates/${contribution.topic_slug}`}>
                        {isFr ? "ouvrir la révision publiée" : "open published revision"}
                      </Link></>
                    )}
                  </p>
                )}
                {contribution.review_visibility === "restricted" ? (
                  <p className="backend-note">{copy.rationaleRestricted}</p>
                ) : contribution.review ? (
                  <p className="rcard__rationale">{contribution.review.rationale}</p>
                ) : (
                  <p className="backend-note">{copy.reviewPending}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {workflow.seedPackets.length > 0 && (
        <div>
          <h3>{copy.seedPackets} ({workflow.seedPackets.length})</h3>
          {workflow.seedPackets.map((packet) => (
            <article className="rcard" key={packet.id}>
              <header className="rcard__head">
                <span className="rcard__type">{isFr ? "dossier de recherche" : "research seed packet"}</span>
                <span className={`rcard__verdict rcard__verdict--${packet.status}`}>
                  {workflowStatusLabel(locale, packet.status)}
                </span>
                <span className="rcard__sampletag">
                  {workflowProvenanceLabel(locale, packet.provenance)}
                </span>
              </header>
              <h4>{packet.topic_question}</h4>
              <p>{packet.initial_position}</p>
              {packet.initial_arguments.length > 0 && (
                <ol>
                  {packet.initial_arguments.map((argument, index) => (
                    <li key={`${packet.id}-argument-${index}`}>{argument}</li>
                  ))}
                </ol>
              )}
              {packet.source_inputs.map((source, index) => {
                const href = safeHttpUrl(source.url);
                return (
                  <p className="rcard__target" key={`${packet.id}-source-${index}`}>
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer">{source.url} ↗</a>
                    ) : (
                      source.url ?? (isFr ? "Source sans URL" : "Source without URL")
                    )}
                    {source.note ? ` · ${source.note}` : ""}
                  </p>
                );
              })}
              {packet.generated_revision_id && (
                <p className="backend-note">
                  {isFr ? "Brouillon généré" : "Generated draft"}: {packet.generated_revision_id}
                </p>
              )}
              {packet.error_message && <p className="form-error" role="alert">{packet.error_message}</p>}
              <p className="rcard__target">
                {copy.objectId}: {packet.id} · {copy.updatedAt}: {formatWorkflowTime(packet.updated_at, locale)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function You() {
  const { locale, t } = useI18n();
  const debates = getDebates(locale);
  const auth = useAuth();
  const profile = useProfile();
  const store = useStore();
  const [backendWorkflow, setBackendWorkflow] = useState<ContributorWorkflowState>({
    contributions: [],
    seedPackets: [],
  });
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  // Standardised "X — Parallax" title format. The title-standardisation pass
  // replaces this with usePageTitle(t.meta.titleYou) once t.meta exists in both
  // dictionaries (see requested_i18n_keys); using the existing key keeps tsc green.
  usePageTitle(`${t.interactive.you.eyebrow} — Parallax`);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setBackendWorkflow({ contributions: [], seedPackets: [] });
      setBackendError("");
      setBackendLoading(Boolean(isSupabaseConfigured && auth.user));
    });
    if (!isSupabaseConfigured || !auth.user) {
      return () => {
        cancelled = true;
      };
    }
    loadMySupabaseWorkflow(auth.user.id)
      .then(
        (workflow) => {
          if (cancelled) return;
          setBackendWorkflow(workflow);
          setBackendLoading(false);
        },
        (error: unknown) => {
          if (cancelled) return;
          setBackendError(
            workflowErrorMessage(error, workflowCopy(locale).backendLoadFailed),
          );
          setBackendLoading(false);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [auth.user, locale]);

  const hasActivity =
    Object.keys(profile.quiz).length > 0 ||
    Object.keys(profile.steelman).length > 0 ||
    Object.keys(profile.perception).length > 0 ||
    store.contributions.length > 0 ||
    backendWorkflow.contributions.length > 0 ||
    backendWorkflow.seedPackets.length > 0;

  // aggregate values across debates
  const aggregated: { name: string; score: number }[] = [];
  for (const [topicId, result] of Object.entries(profile.quiz)) {
    const debate = debates.find((d) => d.topic.id === topicId);
    if (!debate) continue;
    for (const [vid, n] of Object.entries(result.value_scores)) {
      const name = debate.values.find((v) => v.id === vid)?.name ?? vid;
      const existing = aggregated.find((a) => a.name === name);
      if (existing) existing.score += n;
      else aggregated.push({ name, score: n });
    }
  }
  aggregated.sort((a, b) => b.score - a.score);
  const maxScore = aggregated[0]?.score ?? 1;

  const myContributions = store.contributions;

  return (
    <main id="main" className="page youpage" tabIndex={-1}>
      <header className="youpage__head">
        <p className="section__eyebrow">{t.interactive.you.eyebrow}</p>
        <h1 className="section__title section__title--big">
          {t.interactive.you.titleLine}
          <br />
          <em>{t.interactive.you.titleEm}</em>
        </h1>
        <p className="section__lede">{t.interactive.you.lede}</p>
      </header>

      <AuthPanel />

      {isSupabaseConfigured && auth.user && (
        <>
          <BackendWorkflowPanel
            workflow={backendWorkflow}
            loading={backendLoading}
            error={backendError}
          />
          <MyClaimDossiers topicId={DOSSIER_PILOT_TOPIC_ID} />
        </>
      )}

      {!hasActivity ? (
        <div className="youpage__empty">
          <p className="youpage__emptytitle">{t.interactive.you.emptyTitle}</p>
          <p>{t.interactive.you.emptyBody}</p>

          <ul className="youpage__preview" aria-label={t.interactive.you.previewLabel}>
            <li className="libcard libcard--est">
              <span className="libcard__state">{t.interactive.you.valuesTitle}</span>
              <p>{t.interactive.you.previewValues}</p>
            </li>
            <li className="libcard libcard--con">
              <span className="libcard__state">{t.interactive.you.badgeLabel}</span>
              <p>{t.interactive.you.previewBadges}</p>
            </li>
            <li className="libcard libcard--val">
              <span className="libcard__state">{t.interactive.perception.eyebrow}</span>
              <p>{t.interactive.you.previewDelta}</p>
            </li>
          </ul>

          <Link to="/debates" className="btn btn--primary">
            {t.interactive.you.emptyCta}
          </Link>
        </div>
      ) : (
        <>
          {aggregated.length > 0 && (
            <section className="youpage__section">
              <h2 className="youpage__subtitle">{t.interactive.you.valuesTitle}</h2>
              <p className="youpage__hint">{t.interactive.you.valuesHint}</p>
              <div className="youpage__values">
                {aggregated.map((v) => (
                  <div key={v.name} className="quiz__valuerow">
                    <span className="quiz__valuename">{v.name}</span>
                    <span className="quiz__valuebar">
                      <i style={{ width: `${(v.score / maxScore) * 100}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="youpage__section">
            <h2 className="youpage__subtitle">{t.interactive.you.debatesTitle}</h2>
            <div className="youpage__grid">
              {debates.map((debate) => {
                const quiz = profile.quiz[debate.topic.id];
                const badges = profile.steelman[debate.topic.id] ?? {};
                const perception = profile.perception[debate.topic.id];
                const touched =
                  quiz || Object.keys(badges).length > 0 || perception;
                const match = quiz
                  ? debate.positions.find(
                      (p) => p.id === quiz.match_position_id,
                    )
                  : undefined;
                const delta =
                  perception?.before !== undefined &&
                  perception?.after !== undefined
                    ? perception.after - perception.before
                    : undefined;

                return (
                  <Link
                    key={debate.topic.id}
                    to={`/debates/${slugOf(debate)}`}
                    className={`ycard${touched ? "" : " ycard--untouched"}`}
                  >
                    <h3 className="ycard__question">{debate.topic.question}</h3>

                    {match ? (
                      <p className="ycard__match">
                        {t.interactive.you.closestPosition}{" "}
                        <b>
                          {
                            POSITION_LETTERS[
                              debate.positions.findIndex(
                                (p) => p.id === match.id,
                              )
                            ]
                          }
                        </b>{" "}
                        — {match.title}
                      </p>
                    ) : (
                      <p className="ycard__match ycard__match--none">
                        {t.interactive.you.quizNotTaken}
                      </p>
                    )}

                    <div className="ycard__badges">
                      {debate.positions.map((p, i) => {
                        const b = badges[p.id];
                        return (
                          <span
                            key={p.id}
                            className={`ycard__badge${
                              b?.passed
                                ? " ycard__badge--earned"
                                : b
                                  ? " ycard__badge--tried"
                                  : ""
                            }`}
                            title={
                              b?.passed
                                ? t.interactive.you.badgePassed
                                : b
                                  ? t.interactive.you.badgeAttempt(b.correct, b.total)
                                  : t.interactive.you.badgeNotAttempted
                            }
                          >
                            {POSITION_LETTERS[i]}
                            {b?.passed ? " ✓" : ""}
                          </span>
                        );
                      })}
                      <span className="ycard__badgelabel">
                        {t.interactive.you.badgeLabel}
                      </span>
                    </div>

                    {(() => {
                      const done = debate.positions.filter(
                        (p) => badges[p.id]?.passed,
                      ).length;
                      const total = debate.positions.length;
                      return (
                        <p
                          className={`ycard__steward${
                            total > 0 && done === total ? " ycard__steward--ok" : ""
                          }`}
                        >
                          {total > 0 && done === total
                            ? t.features.stewardEligible
                            : t.features.stewardHint(done, total)}
                        </p>
                      );
                    })()}

                    {delta !== undefined && (
                      <p
                        className={`ycard__delta sonder-ydelta sonder-ydelta--${
                          delta > 0 ? "up" : delta < 0 ? "down" : "held"
                        }`}
                      >
                        {delta > 0
                          ? t.interactive.you.deltaUp(delta)
                          : delta === 0
                            ? t.interactive.you.deltaHeld
                            : t.interactive.you.deltaDown(delta)}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {myContributions.length > 0 && (
            <section className="youpage__section">
              <h2 className="youpage__subtitle">
                {t.interactive.you.contributionsTitle}
              </h2>
              <p className="youpage__hint">
                {t.interactive.you.contributionsSummary(
                  myContributions.length,
                  myContributions.filter((c) => c.status === "accepted").length,
                  myContributions.filter((c) => c.status === "rejected").length,
                  myContributions.filter((c) => c.status === "submitted").length,
                )}
                <Link to="/review" className="link">
                  {t.interactive.you.reviewQueueLink}
                </Link>
              </p>
            </section>
          )}

          <div className="youpage__foot">
            <button
              className="reviewpage__reset"
              onClick={() => {
                if (window.confirm(t.interactive.you.resetConfirm))
                  resetProfile();
              }}
            >
              {t.interactive.you.reset}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
