import { type ReactNode } from "react";
import { LocaleLink as Link } from "../i18n/links";
import { getDebates } from "../data";
import { DebateCard } from "../components/DebateCard";
import { useI18n } from "../i18n";
import { usePageTitle } from "../lib/ui";

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
  usePageTitle(t.meta.titleHome);
  const totalClaims = debates.reduce((n, d) => n + d.claims.length, 0);
  const totalSources = debates.reduce((n, d) => n + d.sources.length, 0);
  const totalLinks = debates.reduce((n, d) => n + d.evidence_links.length, 0);

  return (
    <main>
      {/* ——— hero ——— */}
      <section className="lhero lhero--reading">
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

          <p className="preview__note">{t.landing.draftNote}</p>
        </div>
      </section>

      {/* ——— debates preview ——— */}
      <section className="preview preview--reading">
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

      <section className="pillars">
        <div className="page">
          <h2 className="section__title">{t.common.nav.method}</h2>
          <p className="pillars__lede">{t.landing.methodSummary}</p>
          <Link to="/method" className="link pillars__link">
            {t.landing.hero.secondaryCta}
          </Link>
        </div>
      </section>

      {/* ——— invitation (touch this) ——— */}
      <section className="invite">
        <div className="page">
          <p className="section__eyebrow">{t.landing.reviewers.eyebrow}</p>
          <h2 className="section__title">
            {t.landing.reviewers.headline}
            <br />
            <em>{t.landing.reviewers.headlineEm}</em>
          </h2>
          <p className="section__lede">{t.landing.reviewers.body}</p>
          <div className="invite__actions">
            <a href="https://github.com/blancmathis/parallax/blob/main/docs/relecture/README.md" className="btn btn--primary">
              {t.landing.reviewers.cta}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
