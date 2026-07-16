import { LocaleLink as Link } from "../i18n/links";
import { useI18n } from "../i18n";
import { usePageTitle } from "../lib/ui";

/** Strip a baked-in "N - " / "N — " numeric prefix from a seed section title. */
function stripNumber(title: string): string {
  return title.replace(/^\s*\d+\s*[-—]\s*/, "");
}

export default function Method() {
  const { t } = useI18n();
  usePageTitle(t.meta.titleMethod);

  // Canonical three-filters order: facts -> comprehension/steelman -> values,
  // then the on-the-record review that protects all three. The seed array is
  // authored as steelman(0) / sources(1) / values(2) / review(3); we read it
  // in canonical order and renumber at render so it matches the Landing pillars.
  const order = [1, 0, 2, 3];

  return (
    <main className="page method">
      <header className="method__head">
        <p className="section__eyebrow">{t.method.eyebrow}</p>
        <h1 className="section__title section__title--big">
          {t.method.titleStart} <em>Parallax.</em>
        </h1>
        <p className="section__lede method__mission">{t.method.mission}</p>
        <p className="method__how">{t.method.lede}</p>
      </header>

      <section className="method__section method__section--filters">
        <p className="section__eyebrow">{t.method.filtersEyebrow}</p>
        <p className="method__filterslede">{t.method.filtersLede}</p>
      </section>

      <section className="method__section method__lifecycle">
        <p className="section__eyebrow">{t.method.lifecycle.eyebrow}</p>
        <h2 className="method__sourcestitle">{t.method.lifecycle.title}</h2>
        <p className="method__sourceslede">{t.method.lifecycle.intro}</p>
        <ol className="topicflow">
          {t.method.lifecycle.steps.map((s) => (
            <li
              key={s.key}
              className={`topicflow__step topicflow__step--${s.key}`}
            >
              <span className="topicflow__n" aria-hidden="true">
                {s.n}
              </span>
              <div className="topicflow__body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                {s.key === "evidence" && (
                  <span
                    className="topicflow__viz topicflow__viz--dots"
                    aria-hidden="true"
                  >
                    <i className="dot dot--supports_claim" />
                    <i className="dot dot--partially_supports_claim" />
                    <i className="dot dot--contradicts_claim" />
                    <i className="dot dot--unclear" />
                  </span>
                )}
                {s.key === "state" && (
                  <span
                    className="topicflow__viz topicflow__viz--state"
                    aria-hidden="true"
                  >
                    <i className="topicflow__seg topicflow__seg--est" />
                    <i className="topicflow__seg topicflow__seg--con" />
                    <i className="topicflow__seg topicflow__seg--val" />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="topicflow__note">{t.method.lifecycle.recursionNote}</p>
      </section>

      {order.map((idx, i) => {
        const s = t.method.sections[idx];
        const isSources = idx === 1;
        return (
          <section key={s.title} className="method__section">
            <h2>
              <span className="method__num" aria-hidden="true">
                {i + 1}
              </span>
              {stripNumber(s.title)}
            </h2>
            <p>{s.body}</p>
            {isSources && (
              <>
                <div className="method__labels">
                  {t.method.labels.map((l) => (
                    <div key={l.cls} className="method__labelrow">
                      <span className={`evlabel evlabel--${l.cls}`}>
                        {l.name}
                      </span>
                      <span>{l.desc}</span>
                    </div>
                  ))}
                </div>
                <p>{t.method.noVerified}</p>
              </>
            )}
          </section>
        );
      })}

      <section className="method__section method__section--sources">
        <p className="section__eyebrow">{t.method.sources.eyebrow}</p>
        <h2 className="method__sourcestitle">{t.method.sources.title}</h2>
        <p className="method__sourceslede">{t.method.sources.lede}</p>
        <div className="method__sourcegrid">
          {t.method.sources.points.map((p) => (
            <div key={p.title} className="method__sourcepoint">
              <h4>{p.title}</h4>
              <p>{p.body}</p>
            </div>
          ))}
        </div>

        <div className="method__sourceflow">
          <p className="section__eyebrow">{t.method.sources.flowTitle}</p>
          <ol className="srcflow">
            {t.method.sources.flow.map((f) => (
              <li key={f.step} className="srcflow__step">
                <span className="srcflow__n" aria-hidden="true">
                  {f.step}
                </span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="method__sourcelib">{t.method.sources.libraryLine}</p>
        </div>

        <p className="method__sourcekey">{t.method.sources.keyline}</p>
      </section>

      <section className="method__section">
        <h2>{t.features.engineTitle}</h2>
        <p>{t.features.engineLede}</p>
        <ol className="engine">
          {t.features.engineItems.map((item) => (
            <li key={item.title} className="engine__item">
              <b>{item.title}</b>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="method__section method__section--ai">
        <h2>{t.method.aiTitle}</h2>
        <div className="method__twocol">
          <div className="method__twocol-col">
            <h4 className="ok">{t.method.proposes}</h4>
            <ul>
              {t.method.proposesItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="method__twocol-col">
            <h4 className="no">{t.method.neverSilently}</h4>
            <ul>
              {t.method.neverItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="method__airule">{t.method.aiSourceRule}</p>
        <p className="method__note">{t.method.note}</p>
      </section>

      <div className="method__cta">
        <Link to="/debates" className="btn btn--primary">
          {t.method.cta}
        </Link>
      </div>
    </main>
  );
}
