import { useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import { POSITION_LETTERS, getDebates, slugOf } from "../data";
import { useI18n } from "../i18n";
import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { resetProfile, useProfile } from "../lib/profile";
import { useStore } from "../lib/store";
import { usePageTitle } from "../lib/ui";

function AuthPanel() {
  const auth = useAuth();
  const [email, setEmail] = useState("user@example.test");
  const [password, setPassword] = useState("Parallax123!");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (!isSupabaseConfigured) {
    return (
      <section className="authbox">
        <p className="authbox__eyebrow">Auth</p>
        <p>Supabase is not configured; local prototype mode is active.</p>
      </section>
    );
  }

  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") await auth.signIn(email.trim(), password);
      else await auth.signUp(email.trim(), password);
      await auth.refreshProfile();
      setMessage(mode === "login" ? "Logged in." : "Account created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="authbox">
      <div>
        <p className="authbox__eyebrow">Supabase auth</p>
        {auth.user ? (
          <>
            <h2 className="youpage__subtitle">{auth.profile?.display_name ?? auth.user.email}</h2>
            <p className="youpage__hint">
              {auth.user.email} · role: <b>{auth.profile?.role ?? "loading"}</b>
            </p>
          </>
        ) : (
          <>
            <h2 className="youpage__subtitle">Sign in for backend workflows</h2>
            <p className="youpage__hint">
              Local seeds: user@example.test, reviewer@example.test, admin@example.test.
            </p>
          </>
        )}
      </div>

      {auth.user ? (
        <div className="authbox__actions">
          <button className="btn btn--ghost btn--small" onClick={auth.refreshProfile}>
            Refresh session
          </button>
          <button className="btn btn--primary btn--small" onClick={auth.signOut}>
            Log out
          </button>
        </div>
      ) : (
        <div className="authbox__form">
          <input
            className="field__input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-label="Email"
          />
          <input
            className="field__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-label="Password"
          />
          <div className="authbox__actions">
            <button
              className={`themechip${mode === "login" ? " themechip--active" : ""}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`themechip${mode === "signup" ? " themechip--active" : ""}`}
              onClick={() => setMode("signup")}
            >
              Signup
            </button>
            <button className="btn btn--primary btn--small" disabled={busy} onClick={submit}>
              {busy ? "Working..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </div>
        </div>
      )}
      {message && <p className="backend-note">{message}</p>}
    </section>
  );
}

export default function You() {
  const { locale, t } = useI18n();
  const debates = getDebates(locale);
  const profile = useProfile();
  const store = useStore();
  // Standardised "X — Parallax" title format. The title-standardisation pass
  // replaces this with usePageTitle(t.meta.titleYou) once t.meta exists in both
  // dictionaries (see requested_i18n_keys); using the existing key keeps tsc green.
  usePageTitle(`${t.interactive.you.eyebrow} — Parallax`);

  const hasActivity =
    Object.keys(profile.quiz).length > 0 ||
    Object.keys(profile.steelman).length > 0 ||
    Object.keys(profile.perception).length > 0 ||
    store.contributions.length > 0;

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
