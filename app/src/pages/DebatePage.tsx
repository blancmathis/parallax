import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LocaleLink as Link } from "../i18n/links";
import type {
  Claim,
  ClaimType,
  DebateFixture,
  EvidenceLabel,
  Position,
  Source,
  SourceExcerpt,
} from "../types";
import { POSITION_LETTERS, debateBySlug, getDebates } from "../data";
import { claimState, claimSharedBy, type ClaimState } from "../data/state";
import { toast } from "../lib/toast-store";
import {
  copyLink,
  useReveal,
  usePageTitle,
  useReadingProgress,
} from "../lib/ui";
import { useI18n } from "../i18n";
import { DebateCard } from "../components/DebateCard";
import { safeHttpUrl } from "../lib/url";

const EVIDENCE_LEGEND: EvidenceLabel[] = [
  "supports_claim",
  "partially_supports_claim",
  "contradicts_claim",
  "does_not_support_claim",
  "unclear",
];

/* ————— confidence meter ————— */

function ConfidenceMeter({ value }: { value: number }) {
  const { t } = useI18n();
  const filled = Math.max(1, Math.round(value * 5));
  const bucket =
    value >= 0.75 ? "high" : value >= 0.45 ? "med" : "low";
  const aria = `${t.common.labels.confidence} ${value.toFixed(2)} · ${t.common.confidenceBuckets[bucket]}`;
  return (
    <span className="confmeter" title={aria} aria-label={aria} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`confmeter__seg${i < filled ? " confmeter__seg--on" : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className="confmeter__bucket" aria-hidden="true">
        {t.common.confidenceBuckets[bucket]}
      </span>
    </span>
  );
}

function SourceTrace({
  source,
  excerpt,
}: {
  source: Source;
  excerpt?: SourceExcerpt;
}) {
  const { locale } = useI18n();
  const hash = source.content_hash;
  const provisional =
    locale === "fr"
      ? "Provenance provisoire : aucun artefact haché et inspectable n'est enregistré."
      : "Provisional provenance: no hashed, inspectable artefact is recorded.";

  if (!excerpt) {
    return <p className="evcard__foot">{provisional}</p>;
  }

  return (
    <details className="evcard__trace" open>
      <summary>
        {locale === "fr" ? "Passage source exact" : "Exact source passage"}
      </summary>
      <blockquote>{excerpt.text}</blockquote>
      <p className="evcard__foot">
        {excerpt.locator} · {locale === "fr" ? "extrait par" : "extracted by"}{" "}
        {excerpt.extracted_by}
      </p>
      <p className="evcard__foot">
        {hash
          ? `${locale === "fr" ? "Artefact" : "Artefact"}: ${hash}`
          : provisional}
      </p>
    </details>
  );
}

/* ————— claim row ————— */

function ClaimRow({
  debate,
  claim,
  anchorId,
  sharedWith,
}: {
  debate: DebateFixture;
  claim: Claim;
  anchorId: string;
  sharedWith?: string[];
}) {
  const [open, setOpen] = useState(
    () => window.location.hash.slice(1) === anchorId,
  );
  const [linked] = useState(open);
  const { locale, t } = useI18n();
  const links = debate.evidence_links.filter((l) => l.claim_id === claim.id);

  useEffect(() => {
    if (linked)
      document.getElementById(anchorId)?.scrollIntoView({ block: "center" });
  }, [linked, anchorId]);

  const state = claimState(debate, claim);
  const stateClass = state === "provisional" ? "contested" : state;

  return (
    <div
      id={anchorId}
      className={`claim claim--st-${stateClass}${open ? " claim--open" : ""}${linked ? " claim--flash" : ""}`}
    >
      <div className="claim__rowwrap">
        <button
          className="claim__row"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="claim__text">
            {claim.text}
            <span className="claim__types">
              {claim.claim_type.map((ct) => (
                <span key={ct} className="claimtype">
                  {t.common.claimTypes[ct as ClaimType]}
                </span>
              ))}
              {sharedWith && sharedWith.length > 0 && (
                <span className="claimtype claimtype--shared">
                  {t.debatePage.sharedClaim(sharedWith.join(" · "))}
                </span>
              )}
              {state === "provisional" && (
                <span className="claimtype claimtype--shared">
                  {locale === "fr" ? "provisoire · non établi" : "provisional · not established"}
                </span>
              )}
            </span>
          </span>
          <span className="claim__evidence">
            {links.map((l) => (
              <span key={l.id} className="claim__dotwrap">
                <i className={`dot dot--${l.label}`} aria-hidden="true" />
                <span className="sr-only">
                  {t.common.evidenceLabels[l.label]}
                </span>
              </span>
            ))}
            {t.common.counts.sourceCount(links.length)}
            <span className="claim__chevron" aria-hidden="true">
              ›
            </span>
          </span>
        </button>
        <button
          type="button"
          className="claim__copy"
          aria-label={t.interactive.debate.claimCopyTitle}
          onClick={(e) => {
            e.stopPropagation();
            copyLink(anchorId).then(
              (ok) => ok && toast(t.interactive.debate.claimLinkCopied),
            );
          }}
        >
          <span aria-hidden="true">⧉</span>
        </button>
      </div>

      {open && (
        <div className="evdrawer">
          {links.length === 0 ? (
            <article className="evcard evcard--empty">
              <p className="evcard__rationale">{t.debatePage.evidenceEmpty}</p>
              <p className="evcard__foot">{t.common.labels.noSourceYet}</p>
            </article>
          ) : (
            links.map((link) => {
              const source = debate.sources.find((s) => s.id === link.source_id);
              const excerpt = debate.source_excerpts?.find(
                (item) => item.id === link.source_excerpt_id,
              );
              return (
                <article key={link.id} className="evcard">
                  <header className="evcard__head">
                    <span className={`evlabel evlabel--${link.label}`}>
                      {t.common.evidenceLabels[link.label]}
                    </span>
                    {source && (
                      <a
                        className="evcard__source"
                        href={safeHttpUrl(source.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.publisher} ↗
                      </a>
                    )}
                  </header>
                  <p className="evcard__rationale">{link.rationale}</p>
                  {source && <SourceTrace source={source} excerpt={excerpt} />}
                  <footer className="evcard__foot">
                    {t.common.labels.confidence}{" "}
                    <ConfidenceMeter value={link.confidence} /> ·{" "}
                    {t.common.reviewStatusLabels[link.review_status]}
                    {source ? ` · ${source.quality_notes}` : ""}
                  </footer>
                </article>
              );
            })
          )}
          <p className="evdrawer__note">{t.debatePage.evidenceNote}</p>
        </div>
      )}
    </div>
  );
}

/* ————— argument meta ————— */

function argMeta(
  debate: DebateFixture,
  claimIds: string[],
  t: ReturnType<typeof useI18n>["t"],
): string {
  const claims = claimIds
    .map((id) => debate.claims.find((c) => c.id === id))
    .filter((c): c is Claim => Boolean(c));
  if (claims.length === 0) return "";
  const contested = claims.filter(
    (c) => claimState(debate, c) === "contested",
  ).length;
  // dominant evidence label across the argument's claims
  const tally = new Map<EvidenceLabel, number>();
  for (const c of claims) {
    for (const l of debate.evidence_links.filter((e) => e.claim_id === c.id)) {
      tally.set(l.label, (tally.get(l.label) ?? 0) + 1);
    }
  }
  let dominant: EvidenceLabel | null = null;
  let best = 0;
  for (const [label, n] of tally) {
    if (n > best) {
      best = n;
      dominant = label;
    }
  }
  return t.debatePage.argMeta(
    claims.length,
    contested,
    dominant ? t.common.evidenceLabels[dominant] : t.common.labels.noSourceYet,
  );
}

/* ————— reading flow ————— */

function Reading({
  debate,
  position,
  sharedClaims,
}: {
  debate: DebateFixture;
  position: Position;
  sharedClaims: Map<string, string[]>;
}) {
  const { t } = useI18n();
  const args = debate.arguments.filter((a) => a.position_id === position.id);
  const tradeoff = debate.tradeoffs.find((tr) => tr.position_id === position.id);
  const values = debate.values.filter((v) =>
    v.position_ids.includes(position.id),
  );
  const letter = POSITION_LETTERS[
    debate.positions.findIndex((p) => p.id === position.id)
  ];

  return (
    <div className="reading" key={position.id}>
      <p className="reading__eyebrow">
        {t.debatePage.readingEyebrow(letter)}
      </p>
      <h2 className="reading__title">{position.title}</h2>

      {values.length > 0 && (
        <div className="reading__values">
          {values.map((v) => (
            <span key={v.id} className="valuechip">
              {v.name}
            </span>
          ))}
        </div>
      )}

      <figure className="steelman">
        <figcaption className="steelman__label">
          {t.debatePage.steelmanLabel}
        </figcaption>
        <p>{position.steelman}</p>
      </figure>

      {args.length > 0 && (
        <>
          <h3 className="reading__sub">{t.debatePage.restsOn}</h3>
          <p className="reading__hint">{t.debatePage.restsHint}</p>

          <ol className="arglist">
            {args.map((arg) => (
              <li key={arg.id} className="arglist__item">
                <div className="arglist__head">
                  <span className={`dir dir--${arg.direction}`}>
                    {t.common.directionLabels[arg.direction]}
                  </span>
                  <span className="arglist__summary">{arg.summary}</span>
                </div>
                {arg.claim_ids.length > 0 && (
                  <p className="arglist__meta">
                    {argMeta(debate, arg.claim_ids, t)}
                  </p>
                )}
                {arg.claim_ids.map((claimId) => {
                  const claim = debate.claims.find((c) => c.id === claimId);
                  return claim ? (
                    <ClaimRow
                      key={`${arg.id}-${claim.id}`}
                      debate={debate}
                      claim={claim}
                      anchorId={`${arg.id}-${claim.id}`}
                      sharedWith={sharedClaims.get(claim.id)}
                    />
                  ) : null;
                })}
              </li>
            ))}
          </ol>
        </>
      )}

      {tradeoff && (
        <>
          <h3 className="reading__sub">{t.debatePage.asksAccept}</h3>
          <div className="ledger">
            <div className="ledger__cell">
              <span className="ledger__key ledger__key--gain">{t.debatePage.youGain}</span>
              <p>{tradeoff.gain}</p>
            </div>
            <div className="ledger__cell">
              <span className="ledger__key ledger__key--cost">{t.debatePage.youPay}</span>
              <p>{tradeoff.cost}</p>
            </div>
            <div className="ledger__cell">
              <span className="ledger__key ledger__key--risk">{t.debatePage.youRisk}</span>
              <p>{tradeoff.risk}</p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

/* ————— values matrix ————— */

function ValuesMatrix({ debate }: { debate: DebateFixture }) {
  const { t } = useI18n();
  const positions = debate.positions;
  const cols = positions.length;

  return (
    <div className="matrix" style={{ ["--poscols" as string]: cols }}>
      <div className="matrix__row matrix__row--head">
        <span />
        {positions.map((p, i) => (
          <span
            key={p.id}
            className="matrix__poshead"
          >
            {(POSITION_LETTERS[i] ?? "+")}
          </span>
        ))}
      </div>
      {debate.values.map((v) => (
        <div key={v.id} className="matrix__row">
          <div className="matrix__value">
            <span className="matrix__name">{v.name}</span>
            <span className="matrix__desc">{v.description}</span>
            <span className="matrix__tension">
              {t.debatePage.inTensionWith} {v.tension_with.join(", ")}
            </span>
          </div>
          {positions.map((p) => (
            <span
              key={p.id}
              className="matrix__cell"
            >
              {v.position_ids.includes(p.id) ? (
                <i className="matrix__dot" />
              ) : (
                <i className="matrix__nodot" />
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ————— fault-line map ————— */

/**
 * A claim, resolved to its primary lane (evidence-state, the ONE primary axis)
 * and its orthogonal cross-position signal (which positions cite it).
 * Strength (claimState) and citation (claimSharedBy) are independent axes and
 * must not be conflated: a "both sides cite this" badge is a secondary mark
 * inside the Settled lane, never a lane of its own.
 */
type MappedClaim = {
  claim: Claim;
  state: ClaimState;
  /** position letters that cite this claim, when cited by more than one */
  sharedWith: string[];
  /** evidence labels attached, for the row's ev-dots */
  labels: EvidenceLabel[];
};

const LANE_ORDER: ClaimState[] = [
  "established",
  "contested",
  "provisional",
  "values",
];

function FaultLineMap({
  debate,
  onJumpToClaim,
}: {
  debate: DebateFixture;
  onJumpToClaim: (claimId: string) => void;
}) {
  const { locale, t } = useI18n();
  const reveal = useReveal<HTMLDivElement>();
  const shared = claimSharedBy(debate);

  // Resolve every claim to (state, sharedWith, labels) once so the lanes
  // match the fixture-derived StateStrip counts above them.
  const mapped: MappedClaim[] = debate.claims.map((claim) => ({
    claim,
    state: claimState(debate, claim),
    sharedWith: shared.get(claim.id) ?? [],
    labels: debate.evidence_links
      .filter((l) => l.claim_id === claim.id)
      .map((l) => l.label),
  }));

  const lanes: Record<ClaimState, MappedClaim[]> = {
    established: mapped.filter((m) => m.state === "established"),
    contested: mapped.filter((m) => m.state === "contested"),
    provisional: mapped.filter((m) => m.state === "provisional"),
    values: mapped.filter((m) => m.state === "values"),
  };

  // "Common ground first": the green facts BOTH sides stand on. Lead with the
  // cross-position count; degrade to the overall settled count when the
  // both-sides subset is thin, so the hook never depends on absent data.
  const settledShared = lanes.established.filter(
    (m) => m.sharedWith.length > 0,
  );
  const commonGround =
    settledShared.length > 0
      ? t.debatePage.faultCommonGround(settledShared.length)
      : t.debatePage.faultCommonGroundFallback(lanes.established.length);

  const laneMeta: Record<
    ClaimState,
    { label: string; caption: string; count: number }
  > = {
    established: {
      label: t.debatePage.faultLaneSettled,
      caption: t.debatePage.faultLaneSettledCaption,
      count: lanes.established.length,
    },
    contested: {
      label: t.debatePage.faultLaneContested,
      caption: t.debatePage.faultLaneContestedCaption,
      count: lanes.contested.length,
    },
    provisional: {
      label: locale === "fr" ? "Provisoire / inconnu" : "Provisional / unknown",
      caption:
        locale === "fr"
          ? "Non relu indépendamment ou preuve indisponible — aucun verdict de vérité."
          : "Not independently reviewed or evidence unavailable — no truth verdict.",
      count: lanes.provisional.length,
    },
    values: {
      label: t.debatePage.faultLaneValues,
      caption: t.debatePage.faultLaneValuesCaption,
      count: lanes.values.length,
    },
  };

  return (
    <div className="faultline__map" ref={reveal}>
      <p className="faultline__commonground">
        <i className="faultline__cgdot" aria-hidden="true" />
        {commonGround}
      </p>

      {LANE_ORDER.map((state) => {
        const rows = lanes[state];
        const meta = laneMeta[state];
        return (
          <section
            key={state}
            className={`faultline__lane faultline__lane--${state === "provisional" ? "contested" : state}`}
          >
            <header className="faultline__lanehead">
              <span className="faultline__lanelabel">
                {meta.label}
                <span className="faultline__lanecount">{meta.count}</span>
              </span>
              <span className="faultline__lanecaption">{meta.caption}</span>
            </header>

            {rows.length === 0 ? (
              <p className="faultline__empty">
                {state === "contested"
                  ? t.debatePage.faultEmptyContested
                  : state === "provisional"
                    ? locale === "fr"
                      ? "Aucune affirmation provisoire."
                      : "No provisional claims."
                  : state === "values"
                    ? t.debatePage.faultEmptyValues
                    : t.debatePage.faultEmptySettled}
              </p>
            ) : (
              <ul className="faultline__rows">
                {rows.map(({ claim, sharedWith, labels }) => (
                  <li key={claim.id} className="faultline__row">
                    <button
                      type="button"
                      className="faultline__chip"
                      onClick={() => onJumpToClaim(claim.id)}
                    >
                      <span className="faultline__chiptext">{claim.text}</span>
                      <span className="faultline__chipmeta">
                        {state === "established" && sharedWith.length > 0 && (
                          <span className="faultline__bothsides">
                            {t.debatePage.faultBothSides(
                              sharedWith.join(" · "),
                            )}
                          </span>
                        )}
                        <span className="faultline__evdots">
                          {labels.length === 0 ? (
                            <span className="faultline__novsrc">
                              {t.common.labels.noSourceYet}
                            </span>
                          ) : (
                            labels.map((label, i) => (
                              <span
                                key={i}
                                className="faultline__evdot"
                              >
                                <i
                                  className={`dot dot--${label}`}
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  {t.common.evidenceLabels[label]}
                                </span>
                              </span>
                            ))
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <p className="faultline__legend">{t.debatePage.faultSettledNote}</p>
    </div>
  );
}

/* ————— evidence legend ————— */

function EvidenceLegend() {
  const { t } = useI18n();
  return (
    <div className="evlegend">
      <span className="evlegend__eyebrow">{t.common.labels.evidence}</span>
      <div className="evlegend__pills">
        {EVIDENCE_LEGEND.map((label) => (
          <span key={label} className={`evlabel evlabel--${label}`}>
            {t.common.evidenceLabels[label]}
          </span>
        ))}
      </div>
      <p className="evlegend__note">{t.debatePage.legendCaption}</p>
    </div>
  );
}

/* ————— page ————— */

export default function DebatePage() {
  const { slug } = useParams();
  const { locale, t } = useI18n();
  const debate = debateBySlug(slug ?? "", locale);
  const debates = getDebates(locale);
  const progress = useReadingProgress();
  usePageTitle(
    debate ? `${debate.topic.question} — Parallax` : "Parallax",
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!debate) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const positions = debate.positions;
      setSelectedId((prev) => {
        const cur = positions.findIndex(
          (p) => p.id === (prev ?? positions[0].id),
        );
        const next =
          e.key === "ArrowRight"
            ? Math.min(cur + 1, positions.length - 1)
            : Math.max(cur - 1, 0);
        return positions[next].id;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debate]);

  if (!debate) {
    return (
      <main className="page notfound">
        <h1 className="section__title">{t.debatePage.notFound}</h1>
        <Link to="/debates" className="btn btn--ghost">
          {t.debatePage.back}
        </Link>
      </main>
    );
  }

  const allPositions = debate.positions;
  const position =
    allPositions.find((p) => p.id === selectedId) ?? allPositions[0];

  const sharedClaims = claimSharedBy(debate);

  const others = debates
    .filter((d) => d.topic.id !== debate.topic.id)
    .slice(0, 2);

  const revision = debate.revision.revision_number;

  const choose = (id: string) => {
    setSelectedId(id);
    document
      .getElementById("reading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fault-line chip → the claim in the reading section. A claim can be cited by
  // several arguments/positions; jump to the first that references it, select
  // that position so its drawer mounts, then scroll the anchor into view.
  const jumpToClaim = (claimId: string) => {
    const owner = debate.arguments.find((a) =>
      a.claim_ids.includes(claimId),
    );
    if (!owner) return;
    const ownerPos = debate.positions.find((p) => p.id === owner.position_id);
    if (ownerPos) setSelectedId(ownerPos.id);
    const anchorId = `${owner.id}-${claimId}`;
    // Let the selected position (and its drawer) mount before scrolling.
    requestAnimationFrame(() => {
      const el = document.getElementById(anchorId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("claim--flash");
    });
  };

  const share = () => {
    if (navigator.share) {
      navigator
        .share({ title: debate.topic.question, url: window.location.href })
        .catch(() => {});
    } else {
      copyLink().then((ok) => ok && toast(t.interactive.debate.debateLinkCopied));
    }
  };

  return (
    <main className="page">
      <div className="progressbar" aria-hidden="true">
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
      {/* — hero — */}
      <section className="hero hero--debate">
        <p className="hero__kicker">
          <Link to="/debates" className="hero__back">
            {t.debatePage.back}
          </Link>
          · {t.common.labels.publicPolicy}
        </p>
        <h1 className="hero__question">{debate.topic.question}</h1>
        <p className="hero__summary">{debate.topic.summary}</p>
        <div className="hero__statusrow">
          <div className="hero__status">
            <span>{t.debatePage.heroStatus(revision, debate.sources.length)}</span>
          </div>
          <div className="hero__actions">
            <button className="sharebtn" onClick={share}>
              {t.interactive.debate.share}
            </button>
          </div>
        </div>
        <span className="stamp">{t.common.labels.unreviewedStamp}</span>
      </section>

      {/* — state of the debate — */}
      <section className="statewrap">
        <div className="statestrip">
          <span className="statestrip__eyebrow">{t.features.stateEyebrow}</span>
          <span className="statestrip__chip statestrip__chip--est">
            <i />
            {t.features.stateEstablished(
              debate.claims.filter((c) => claimState(debate, c) === "established").length,
            )}
          </span>
          <span className="statestrip__chip statestrip__chip--con">
            <i />
            {t.features.stateContested(
              debate.claims.filter((c) => claimState(debate, c) === "contested").length,
            )}
          </span>
          <span className="statestrip__chip statestrip__chip--con">
            <i />
            {locale === "fr"
              ? `${debate.claims.filter((c) => claimState(debate, c) === "provisional").length} provisoire(s) / inconnue(s)`
              : `${debate.claims.filter((c) => claimState(debate, c) === "provisional").length} provisional / unknown`}
          </span>
          <span className="statestrip__chip statestrip__chip--val">
            <i />
            {t.features.stateValues(
              debate.claims.filter((c) => claimState(debate, c) === "values").length,
            )}
          </span>
          <span className="statestrip__note">{t.features.stateNote}</span>
        </div>
        <EvidenceLegend />
      </section>

      {/* — the fault-line map — */}
      <section className="faultline" id="faultline">
        <p className="section__eyebrow">{t.debatePage.faultEyebrow}</p>
        <h2 className="section__title">
          {t.debatePage.faultTitle}
          <br />
          <em>{t.debatePage.faultEm}</em>
        </h2>
        <p className="section__lede">{t.debatePage.faultLede}</p>
        <FaultLineMap debate={debate} onJumpToClaim={jumpToClaim} />
      </section>

      {/* — chooser — */}
      <section className="chooser" id="positions">
        <p className="section__eyebrow">{t.debatePage.step1}</p>
        <h2 className="section__title">
          {t.common.counts.seriousAnswers(allPositions.length)}
          <br />
          <em>{t.debatePage.chooserEm}</em>
        </h2>

        <div className="chooser__grid">
          {allPositions.map((p, i) => (
            <button
              key={p.id}
              className={`poscard${p.id === position.id ? " poscard--active" : ""}`}
              onClick={() => choose(p.id)}
              aria-pressed={p.id === position.id}
            >
              <span className="poscard__letter">{(POSITION_LETTERS[i] ?? "+")}</span>
              <span className="poscard__title">{p.title}</span>
              <span className="poscard__summary">{p.short_summary}</span>
              <span className="poscard__cta">
                {p.id === position.id
                  ? t.debatePage.readingBelow
                  : t.debatePage.readThisView}
              </span>
            </button>
          ))}
        </div>
        <p className="chooser__note">{t.debatePage.chooserNote}</p>
      </section>

      {/* — reading — */}
      <section className="readingwrap" id="reading">
        <div
          className="switcher"
          role="group"
          aria-label={t.debatePage.positionAria}
        >
          {allPositions.map((p, i) => {
            return (
              <button
                key={p.id}
                aria-pressed={p.id === position.id}
                className={`switcher__pill${
                  p.id === position.id ? " switcher__pill--active" : ""
                }`}
                onClick={() => setSelectedId(p.id)}
              >
                <b aria-hidden="true">{(POSITION_LETTERS[i] ?? "+")}</b>
                <span>{p.title.split("—")[0].trim()}</span>
              </button>
            );
          })}
        </div>

        <Reading
          debate={debate}
          position={position}
          sharedClaims={sharedClaims}
        />
      </section>

      {/* — why we disagree — */}
      <section className="disagree" id="disagree">
        <p className="section__eyebrow">{t.debatePage.step2}</p>
        <h2 className="section__title">
          {t.debatePage.disagreeTitle}
          <br />
          <em>{t.debatePage.disagreeEm}</em>
        </h2>
        <p className="section__lede">{t.debatePage.disagreeLede}</p>
        <ValuesMatrix debate={debate} />
      </section>

      {/* — show the work — */}
      <section className="work" id="work">
        <p className="section__eyebrow">{t.debatePage.workEyebrow}</p>
        <h2 className="section__title">
          {t.debatePage.workTitle}
          <br />
          <em>{t.debatePage.workEm}</em>
        </h2>

        <details className="fold">
          <summary>
            {t.debatePage.allSources}{" "}
            <span className="fold__count">
              {debate.sources.length}
            </span>
          </summary>
          <div className="fold__body">
            {debate.sources.map((s) => (
              <div key={s.id} className="source">
                <a
                  className="source__title"
                  href={safeHttpUrl(s.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.title} ↗
                </a>
                <span className="source__meta">
                  {s.publisher} · {t.common.sourceTypes[s.source_type]} ·{" "}
                  {t.common.labels.retrieved} {s.retrieved_at}{" "}
                  ·{" "}
                  <b className={`retrieval--${s.retrieval_status}`}>
                    {t.common.retrievalStatuses[s.retrieval_status]}
                  </b>
                </span>
                <span className="source__notes">{s.quality_notes}</span>
                <span className="source__notes">
                  {s.content_hash
                    ? `${locale === "fr" ? "Artefact vérifiable" : "Verifiable artefact"}: ${s.content_hash}`
                    : locale === "fr"
                      ? "Artefact non haché : provenance provisoire."
                      : "Unhashed artefact: provisional provenance."}
                </span>
              </div>
            ))}
          </div>
        </details>

        <details className="fold">
          <summary>{t.debatePage.howToRead}</summary>
          <div className="fold__body fold__body--prose">
            <p>{t.debatePage.howToReadP1}</p>
            <p>
              {t.debatePage.howToReadP2Start}{" "}
              <b>{t.common.evidenceLabels.supports_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.partially_supports_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.contradicts_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.does_not_support_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.unclear}</b>. {t.debatePage.howToReadP2End}
            </p>
            <p>{t.debatePage.howToReadP3}</p>
          </div>
        </details>
      </section>

      {/* — continue — */}
      <section className="preview continueband">
        <p className="section__eyebrow">{t.debatePage.continueEyebrow}</p>
        <h2 className="section__title">{t.debatePage.continueTitle}</h2>
        {others.length > 0 && (
          <div className="preview__grid preview__grid--pair">
            {others.map((d, i) => (
              <DebateCard key={d.topic.id} debate={d} index={i} />
            ))}
          </div>
        )}
        <p className="preview__more">
          <Link to="/debates" className="btn btn--ghost">
            {t.common.actions.allDebates}
          </Link>
        </p>
      </section>

    </main>
  );
}
