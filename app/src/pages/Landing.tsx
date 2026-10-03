import { useEffect, useRef, useState, type ReactNode } from "react";
import { LocaleLink as Link } from "../i18n/links";
import { getDebates, slugOf } from "../data";
import { DebateCard } from "../components/DebateCard";
import { useI18n } from "../i18n";
import { useCountUp, usePageTitle } from "../lib/ui";

// Optional controlled contact channel. Omitting it removes contact CTAs instead
// of publishing a placeholder or an inbox the project does not control.
const CONTACT_EMAIL =
  (import.meta.env?.VITE_CONTACT_EMAIL as string | undefined)?.trim() || null;
const CONTACT_MAILTO = CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : null;

/**
 * The Convergence. Reduced-motion-safe arming for the hero schematic.
 *
 * The static stylesheet authors the *resolved* end-state (dots colored,
 * sightlines solid, eyes acquired). The grey/unfocused "before" state lives
 * ONLY on `.schematic--armed`, which is applied here exclusively when
 * `(prefers-reduced-motion: no-preference)` matches — so reduced-motion users
 * never see the unfocused diagram. On intersection we add `.schematic--armed`
 * + (next frame) `.schematic--converged` to drive the resolve transition back
 * to the static default.
 */
function useConvergence<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Belt-and-suspenders: never arm under reduced motion. The element stays at
    // its resolved static default — a fully legible, colored diagram.
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      return;
    }
    // Apply the unfocused "before" state up front so the resolve has somewhere
    // to travel from; the CSS transition only exists inside the no-preference
    // media query, so this is inert for reduced motion either way.
    el.classList.add("schematic--armed");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Next frame so the browser registers the armed start state first.
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                e.target.classList.add("schematic--converged"),
              ),
            );
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.4, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Stat({ n, label }: { n: number; label: string }) {
  const [start, setStart] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setStart(true),
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const value = useCountUp(n, start);
  return (
    <div ref={ref} className="stat">
      <span className="stat__n">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={`reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const { locale, t } = useI18n();
  const debates = getDebates(locale);
  const schematicRef = useConvergence<HTMLDivElement>();
  usePageTitle(t.meta.titleHome);
  const totalClaims = debates.reduce((n, d) => n + d.claims.length, 0);
  const totalSources = debates.reduce((n, d) => n + d.sources.length, 0);
  const totalLinks = debates.reduce((n, d) => n + d.evidence_links.length, 0);

  // Canonical three-filters order: facts (sources) -> comprehension (steelman) -> values.
  // The i18n items ship as [steelman, sources, values]; reorder to sources/steelman/values
  // so the pillars read as an ordered funnel matching the Method, and renumber by position.
  const pillarOrder = [1, 0, 2];
  const pillars = pillarOrder
    .map((i) => t.landing.pillars.items[i])
    .filter(Boolean);

  // Deep-link the conversion CTA to the debate shown in the hero schematic
  // (smartphones in schools — the most genuinely divisive seed), falling back
  // to the all-debates index if that seed is not present.
  const featured =
    debates.find((d) => d.topic.id === "topic_smartphones_schools") ?? debates[0];
  const featuredHref = featured ? `/debates/${slugOf(featured)}` : "/debates";

  return (
    <main>
      {/* ——— hero ——— */}
      <section className="lhero">
        <div className="page">
          <Reveal>
            <p className="lhero__kicker">{t.landing.hero.kicker}</p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="lhero__title">
              {t.landing.hero.titleLine}
              <br />
              <em>{t.landing.hero.titleEm}</em>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="lhero__lede">{t.landing.hero.lede}</p>
          </Reveal>
          <Reveal delay={210}>
            <div className="lhero__actions">
              <Link to="/debates" className="btn btn--primary">
                {t.landing.hero.primaryCta}
              </Link>
              <Link to="/method" className="btn btn--ghost">
                {t.landing.hero.secondaryCta}
              </Link>
            </div>
          </Reveal>

          {/* schematic — "two sightlines, one object". The Convergence. */}
          <Reveal delay={300}>
            <div
              ref={schematicRef}
              className="schematic"
              role="img"
              aria-label={t.landing.schematic.ariaLabel}
            >
              {/* the parallax mark — two offset circles — as a quiet crest above
                  the dossier; the old corner-to-centre sightlines were dropped
                  (they crossed the cards as an X and crossed out the legend). */}
              <svg
                className="schematic__mark"
                viewBox="0 0 64 64"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="37" cy="32" r="13" className="schematic__mark-fill" />
                <circle cx="26" cy="32" r="13" className="schematic__mark-ring" />
              </svg>

              <div className="schematic__topic">
                <span className="schematic__label">{t.landing.schematic.topicLabel}</span>
                {t.landing.schematic.topic}
              </div>
              <div className="schematic__branches">
                <div className="schematic__pos">
                  <span className="schematic__label">{t.landing.schematic.positionALabel}</span>
                  {t.landing.schematic.positionA}
                  <div className="schematic__claims">
                    <span className="schematic__claim">
                      {t.landing.schematic.claim} <i className="dot dot--supports_claim" />
                      <i className="dot dot--partially_supports_claim" />
                    </span>
                    <span className="schematic__claim">
                      {t.landing.schematic.claim} <i className="dot dot--supports_claim" />
                    </span>
                  </div>
                </div>
                <div className="schematic__pos">
                  <span className="schematic__label">{t.landing.schematic.positionBLabel}</span>
                  {t.landing.schematic.positionB}
                  <div className="schematic__claims">
                    <span className="schematic__claim">
                      {t.landing.schematic.claim} <i className="dot dot--supports_claim" />
                      <i className="dot dot--partially_supports_claim" />
                    </span>
                    {/* the contradicts dot — the red the Convergence resolves to */}
                    <span className="schematic__claim">
                      {t.landing.schematic.claim} <i className="dot dot--contradicts_claim" />
                    </span>
                  </div>
                </div>
                <div className="schematic__pos">
                  <span className="schematic__label">{t.landing.schematic.positionCLabel}</span>
                  {t.landing.schematic.positionC}
                  <div className="schematic__claims">
                    <span className="schematic__claim">
                      {t.landing.schematic.claim} <i className="dot dot--supports_claim" />
                    </span>
                    <span className="schematic__claim">
                      {t.landing.schematic.claim} <i className="dot dot--unclear" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="schematic__evidence">
                <span className="schematic__label">{t.landing.schematic.evidenceLabel}</span>
                <span className="schematic__legend">
                  <span className="schematic__chip">
                    <i className="dot dot--supports_claim" />
                    {t.landing.schematic.legendSupports}
                  </span>
                  <span className="schematic__chip">
                    <i className="dot dot--partially_supports_claim" />
                    {t.landing.schematic.legendPartial}
                  </span>
                  <span className="schematic__chip">
                    <i className="dot dot--contradicts_claim" />
                    {t.landing.schematic.legendContradicts}
                  </span>
                  <span className="schematic__chip">
                    <i className="dot dot--unclear" />
                    {t.landing.schematic.legendUnclear}
                  </span>
                </span>
                <span className="schematic__gloss">{t.landing.schematic.legendGloss}</span>
              </div>
              <div className="schematic__values">
                <span className="schematic__label">{t.landing.schematic.valuesLabel}</span>
                {t.landing.schematic.values}
              </div>
            </div>
          </Reveal>
          <Reveal delay={380}>
            <p className="lhero__origin">{t.features.nameOrigin}</p>
          </Reveal>
        </div>
      </section>

      {/* ——— ticker ——— */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="ticker__group">
              {t.landing.ticker.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ——— problem (the wound, led first) ——— */}
      <section className="problem">
        <div className="page">
          <p className="section__eyebrow">{t.landing.problem.eyebrow}</p>
          <div className="problem__grid">
            <h2 className="problem__statement">
              {t.landing.problem.titleLine1} <em>{t.landing.problem.titleEm1}</em>.
              <br />
              {t.landing.problem.titleLine2} <em>{t.landing.problem.titleEm2}</em>.
            </h2>
            <div className="problem__text">
              <p className="problem__lede">{t.landing.problem.lede}</p>
              <p>{t.landing.problem.p1}</p>
              <p>
                {t.landing.problem.p2Prefix} <b>{t.landing.problem.p2Lead}</b>{" "}
                {t.landing.problem.p2}
              </p>
            </div>
          </div>
          <p className="problem__pull">{t.landing.problem.pullLine}</p>
        </div>
      </section>

      {/* ——— stats ——— */}
      <section className="stats">
        <div className="page">
          <div className="stats__grid stats__grid--three">
            <Stat n={debates.length} label={t.features.statsDebates} />
            <Stat n={totalClaims} label={t.features.statsClaims} />
            <Stat n={totalSources} label={t.features.statsSources} />
          </div>
          <p className="stats__chip">{t.landing.stats.chip}</p>
          <p className="stats__creed">{t.landing.stats.creed}</p>
          <p className="stats__creedsub">{t.landing.stats.creedSub}</p>
        </div>
      </section>

      {/* ——— pillars (the three filters) ——— */}
      <section className="pillars">
        <div className="page">
          <p className="section__eyebrow">{t.landing.pillars.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.pillars.titleLine}{" "}
            <em>{t.landing.pillars.titleEm}</em>
          </h2>
          <p className="pillars__lede">{t.landing.pillars.lede}</p>
          <div className="pillars__grid">
            {pillars.map((pillar, i) => (
              <article key={pillar.title} className="pillar">
                <span className="pillar__no">{`0${i + 1}`}</span>
                <h3>{pillar.title}</h3>
                <p>
                  <em className="pillar__cause">{pillar.cause}</em> {pillar.body}
                </p>
              </article>
            ))}
          </div>
          <Link to={featuredHref} className="link pillars__link">
            {t.landing.pillars.filtersLink}
          </Link>
        </div>
      </section>

      {/* ——— invitation (touch this) ——— */}
      <section className="invite">
        <div className="page">
          <p className="section__eyebrow">{t.landing.invite.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.invite.headline}
            <br />
            <em>{t.landing.invite.headlineEm}</em>
          </h2>
          <p className="section__lede">{t.landing.invite.body}</p>
          <div className="invite__actions">
            <Link to={featuredHref} className="btn btn--primary">
              {t.landing.invite.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ——— why now ——— */}
      <section className="whynow">
        <div className="page">
          <p className="section__eyebrow">{t.landing.whyNow.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.whyNow.headline}
            <br />
            <em>{t.landing.whyNow.headlineEm}</em>
          </h2>
          <div className="whynow__grid">
            {t.landing.whyNow.items.map((it, i) => (
              <article key={it.title} className="whynow__item">
                <span className="whynow__no">{`0${i + 1}`}</span>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ——— humans + AI (the dual mission) ——— */}
      <section className="aimission">
        <div className="page">
          <p className="section__eyebrow">{t.landing.ai.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.ai.titleLine}
            <br />
            <em>{t.landing.ai.titleEm}</em>
          </h2>
          <p className="section__lede">{t.landing.ai.lede}</p>
          <div className="aimission__grid">
            <article className="aimission__card">
              <span className="aimission__step">{t.landing.ai.buildStep}</span>
              <h3>{t.landing.ai.buildTitle}</h3>
              <p>{t.landing.ai.buildBody}</p>
            </article>
            <article className="aimission__card">
              <span className="aimission__step">{t.landing.ai.alignStep}</span>
              <h3>{t.landing.ai.alignTitle}</h3>
              <p>{t.landing.ai.alignBody}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ——— library ——— */}
      <section className="library">
        <div className="page">
          <p className="section__eyebrow">{t.features.libraryEyebrow}</p>
          <h2 className="section__title">
            {t.features.libraryTitle}
            <br />
            <em>{t.features.libraryTitleEm}</em>
          </h2>
          <p className="library__thesis">{t.features.libThesis}</p>
          <p className="section__lede">{t.features.libraryLede}</p>
          <div className="library__grid">
            <article className="libcard libcard--est">
              <span className="libcard__state">{t.features.libEstablished}</span>
              <p>{t.features.libEstablishedDesc}</p>
            </article>
            <article className="libcard libcard--con">
              <span className="libcard__state">{t.features.libContested}</span>
              <p>{t.features.libContestedDesc}</p>
            </article>
            <article className="libcard libcard--val">
              <span className="libcard__state">{t.features.libValues}</span>
              <p>{t.features.libValuesDesc}</p>
            </article>
          </div>
          <p className="library__note">{t.features.libProtoNote}</p>
        </div>
      </section>

      {/* ——— debates preview ——— */}
      <section className="preview">
        <div className="page">
          <p className="section__eyebrow">{t.landing.preview.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.preview.title}
            <br />
            <em>{t.common.counts.previewStats(totalClaims, totalSources, totalLinks)}</em>
          </h2>
          <p className="preview__note">{t.landing.preview.note}</p>
          <div className="preview__grid">
            {debates.map((d, i) => (
              <DebateCard key={d.topic.id} debate={d} index={i} />
            ))}
          </div>
          <div className="preview__more">
            <Link to="/debates" className="btn btn--ghost">
              {t.landing.preview.allDebates}
            </Link>
          </div>
        </div>
      </section>

      {/* ——— built to outlast its founder (governance + funding) ——— */}
      <section className="founder">
        <div className="page">
          <p className="section__eyebrow">{t.landing.founder.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.founder.headline}
            <br />
            <em>{t.landing.founder.headlineEm}</em>
          </h2>
          <p className="founder__line">{t.landing.founder.founderLine}</p>
          <p className="founder__insight">{t.landing.founder.insight}</p>
          <div className="founder__grid">
            {t.landing.founder.cards.map((c) => (
              <article key={c.title} className="founder__card">
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </article>
            ))}
          </div>
          <p className="founder__funding">{t.landing.founder.fundingLine}</p>
          {CONTACT_MAILTO ? (
            <div className="founder__actions">
              <a className="btn btn--primary" href={CONTACT_MAILTO}>
                {t.landing.founder.cta}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {/* ——— trust band ——— */}
      <section className="trust">
        <div className="page trust__inner">
          <h2 className="trust__title">
            {t.landing.trust.titleStart} <em>{t.landing.trust.titleEm}</em>
          </h2>
          <div className="trust__cols">
            {t.landing.trust.cols.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                <p>{col.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— classrooms ——— */}
      <section className="classrooms">
        <div className="page classrooms__inner">
          <div className="classrooms__copy">
            <p className="section__eyebrow">{t.features.classroomsEyebrow}</p>
            <h2 className="section__title">{t.features.classroomsTitle}</h2>
            <p className="section__lede">{t.features.classroomsBody}</p>
          </div>
          {CONTACT_MAILTO ? (
            <div className="classrooms__cta">
              <a className="btn btn--ghost" href={CONTACT_MAILTO}>
                {t.features.classroomsCta}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {/* ——— movement close (the call to belong) ——— */}
      <section className="close">
        <div className="page">
          <p className="section__eyebrow">{t.landing.close.eyebrow}</p>
          <h2 className="close__title">
            {t.landing.close.headline}
            <br />
            <em>{t.landing.close.headlineEm}</em>
          </h2>
          <p className="close__body">{t.landing.close.body}</p>
          <p className="close__belong">{t.landing.close.callToBelong}</p>
          <div className="close__actions">
            <Link to={featuredHref} className="btn btn--primary">
              {t.landing.close.cta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
