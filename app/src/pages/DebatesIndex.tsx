import { useEffect, useMemo, useRef, useState } from "react";
import { themeOf } from "../data";
import { claimState, debateShape } from "../data/state";
import { DebateCard } from "../components/DebateCard";
import { ProposeTopic } from "../components/ProposeTopic";
import { useI18n } from "../i18n";
import { useDebates } from "../lib/backend";
import { useCountUp, usePageTitle } from "../lib/ui";

type View = "all" | "contested" | "values" | "recent";

export default function DebatesIndex() {
  const { locale, t } = useI18n();
  const { debates, source, loading, error } = useDebates(locale);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const [view, setView] = useState<View>("all");
  const [proposeOpen, setProposeOpen] = useState(false);
  usePageTitle(t.meta.titleDebates);

  // ---- Corpus ledger: the larger, real totals (claims/sources/evidence) and
  // the aggregate epistemic shape. One source of truth (claimState) shared with
  // every card's spine, so the masthead never disagrees with its cards.
  const ledger = useMemo(() => {
    let claims = 0;
    let sources = 0;
    let links = 0;
    let established = 0;
    let contested = 0;
    let values = 0;
    for (const d of debates) {
      claims += d.claims.length;
      sources += d.sources.length;
      links += d.evidence_links.length;
      for (const c of d.claims) {
        const s = claimState(d, c);
        if (s === "established") established += 1;
        else if (s === "contested") contested += 1;
        else values += 1;
      }
    }
    return {
      debates: debates.length,
      claims,
      sources,
      links,
      established,
      contested,
      values,
      total: established + contested + values,
    };
  }, [debates]);

  // Count-up arms once on intersection; reduced-motion snaps to final (handled
  // inside useCountUp). The static default — should JS never run — is the final
  // number, because we pass the resolved total as the count-up target.
  const mastheadRef = useRef<HTMLElement | null>(null);
  // Lazy initial state: reduced-motion readers start "counted" at mount (the
  // count-up snaps to the resolved total), so the effect's only job is to arm
  // the observer for motion users — it never sets state synchronously.
  const [counting, setCounting] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (counting) return;
    const el = mastheadRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setCounting(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [counting]);

  const nClaims = useCountUp(ledger.claims, counting);
  const nSources = useCountUp(ledger.sources, counting);
  const nLinks = useCountUp(ledger.links, counting);
  const nQuestions = useCountUp(ledger.debates, counting);

  const corpusSegments = [
    { state: "established", n: ledger.established },
    { state: "contested", n: ledger.contested },
    { state: "values", n: ledger.values },
  ].filter((s) => s.n > 0);

  const themes = useMemo(
    () => [...new Set(debates.map((d) => themeOf(d.topic.id, locale)).filter(Boolean))],
    [debates, locale],
  );

  // VIEW is the librarian's axis (not a search box): each view yields a visibly
  // different ordering of the same corpus. Text search is a secondary field.
  const views: { id: View; label: string }[] = [
    { id: "all", label: t.atlas.views.all },
    { id: "contested", label: t.atlas.views.contested },
    { id: "values", label: t.atlas.views.values },
    { id: "recent", label: t.atlas.views.recent },
  ];

  const sorted = useMemo(() => {
    const list = [...debates];
    if (view === "contested") {
      list.sort((a, b) => debateShape(b).contested - debateShape(a).contested);
    } else if (view === "values") {
      list.sort((a, b) => debateShape(b).values - debateShape(a).values);
    } else if (view === "recent") {
      list.sort(
        (a, b) =>
          new Date(b.revision.published_at).getTime() -
          new Date(a.revision.published_at).getTime(),
      );
    }
    return list;
  }, [debates, view]);

  const filtered = sorted.filter((d) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      d.topic.question.toLowerCase().includes(q) ||
      d.topic.summary.toLowerCase().includes(q) ||
      d.positions.some((p) => p.title.toLowerCase().includes(q));
    const matchesTheme = !theme || themeOf(d.topic.id, locale) === theme;
    return matchesQuery && matchesTheme;
  });

  const isEmpty = filtered.length === 0;

  const clearFilters = () => {
    setQuery("");
    setTheme(null);
    setView("all");
  };

  return (
    <main className="page indexpage">
      <header className="indexpage__head atlas__head">
        <p className="section__eyebrow">{t.debatesIndex.eyebrow}</p>
        <h1 className="section__title section__title--big atlas__title">
          {t.debatesIndex.titleLine} <em>{t.debatesIndex.titleEm}</em>
        </h1>
        <p className="section__lede atlas__lede">{t.debatesIndex.lede}</p>
        <p className="backend-note">
          {loading
            ? "Loading Supabase debates..."
            : source === "supabase"
              ? "Supabase-backed public debates are active locally."
              : error ?? "Fixture fallback is active."}
        </p>
      </header>

      {/* ————— Ledger masthead: a young library keeping its own books ————— */}
      <section
        className="atlas-ledger"
        ref={mastheadRef}
        aria-label={t.atlas.ledger.aria}
      >
        <p className="atlas-ledger__creed">{t.atlas.ledger.creed}</p>
        <dl className="atlas-ledger__grid">
          <div className="atlas-ledger__stat">
            <dd className="atlas-ledger__n">{nClaims}</dd>
            <dt className="atlas-ledger__label">
              {t.atlas.ledger.claims(ledger.claims)}
            </dt>
          </div>
          <div className="atlas-ledger__stat">
            <dd className="atlas-ledger__n">{nSources}</dd>
            <dt className="atlas-ledger__label">
              {t.atlas.ledger.sources(ledger.sources)}
            </dt>
          </div>
          <div className="atlas-ledger__stat">
            <dd className="atlas-ledger__n atlas-ledger__n--oxide">{nLinks}</dd>
            <dt className="atlas-ledger__label">
              {t.atlas.ledger.links(ledger.links)}
            </dt>
          </div>
          <div className="atlas-ledger__stat">
            <dd className="atlas-ledger__n">{nQuestions}</dd>
            <dt className="atlas-ledger__label">
              {t.atlas.ledger.questions(ledger.debates)}
            </dt>
          </div>
        </dl>

        {/* Corpus spine — the same proportional instrument as each card. */}
        <div
          className="atlas-spine atlas-spine--corpus"
          aria-label={t.atlas.spineAria}
        >
          <div
            className="atlas-spine__bar"
            role="img"
            aria-label={t.atlas.spineSummary(
              ledger.established,
              ledger.contested,
              ledger.values,
            )}
          >
            {corpusSegments.map((s) => (
              <span
                key={s.state}
                className={`atlas-spine__seg atlas-spine__seg--${s.state}`}
                style={{ flexGrow: s.n }}
                aria-label={t.atlas.legend[s.state as keyof typeof t.atlas.legend](
                  s.n,
                )}
                title={t.atlas.legend[s.state as keyof typeof t.atlas.legend](
                  s.n,
                )}
              />
            ))}
          </div>
          <ul className="atlas-spine__legend atlas-spine__legend--corpus">
            <li className="atlas-spine__key">
              <i className="dot dot--supports_claim" aria-hidden="true" />
              {t.atlas.legend.established(ledger.established)}
            </li>
            <li className="atlas-spine__key">
              <i className="dot dot--partially_supports_claim" aria-hidden="true" />
              {t.atlas.legend.contested(ledger.contested)}
            </li>
            <li className="atlas-spine__key">
              <i className="dot dot--unclear" aria-hidden="true" />
              {t.atlas.legend.values(ledger.values)}
            </li>
          </ul>
        </div>
        <p className="atlas-ledger__note">{t.atlas.ledger.settledNote}</p>
      </section>

      {/* ————— VIEW axis + secondary search/theme filters ————— */}
      <div className="atlas-controls">
        <div
          className="atlas-views"
          role="tablist"
          aria-label={t.atlas.viewAria}
        >
          {views.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              className={`atlas-view${view === v.id ? " atlas-view--active" : ""}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="indexpage__tools atlas-tools">
          <input
            className="field__input indexpage__search"
            placeholder={t.features.searchPh}
            aria-label={t.features.searchPh}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="indexpage__themes">
            <button
              className={`themechip${theme === null ? " themechip--active" : ""}`}
              aria-pressed={theme === null}
              onClick={() => setTheme(null)}
            >
              {t.features.allThemes}
            </button>
            {themes.map((th) => (
              <button
                key={th}
                className={`themechip${theme === th ? " themechip--active" : ""}`}
                aria-pressed={theme === th}
                onClick={() => setTheme(theme === th ? null : th)}
              >
                {th}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="indexpage__empty">
          <p>{t.debatesIndex.emptyTitle}</p>
          <p className="indexpage__emptyhint">{t.debatesIndex.emptyBody}</p>
          <button className="btn btn--ghost" onClick={clearFilters}>
            {t.debatesIndex.emptyClear}
          </button>
        </div>
      ) : (
        <div className="indexpage__grid">
          {filtered.map((d, i) => (
            <DebateCard key={d.topic.id} debate={d} index={i} />
          ))}

          <button
            className="dcard dcard--ghost dcard--soon"
            onClick={() => setProposeOpen(true)}
          >
            <div className="dcard__head">
              <span className="dcard__no">№ {t.debatesIndex.next}</span>
              <span className="dcard__soon">{t.debatesIndex.notOpen}</span>
            </div>
            <h3 className="dcard__question">{t.debatesIndex.proposeTitle}</h3>
            <p className="dcard__summary">{t.debatesIndex.proposeSummary}</p>
            <div className="dcard__foot">
              <span>{t.debatesIndex.proposeHint}</span>
              <span className="dcard__go">{t.debatesIndex.proposeAction}</span>
            </div>
          </button>
        </div>
      )}

      <p className="indexpage__note">
        {t.debatesIndex.noteStart} <b>{t.debatesIndex.noteStrong}</b>{" "}
        {t.debatesIndex.noteEnd}
      </p>

      <ProposeTopic open={proposeOpen} onClose={() => setProposeOpen(false)} />
    </main>
  );
}
