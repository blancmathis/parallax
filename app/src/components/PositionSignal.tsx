import { useState, type CSSProperties } from "react";
import type { DebateFixture, PositionShare, SignalPhase } from "../types";
import { useI18n } from "../i18n";
import { castSignal, useProfile } from "../lib/profile";
import { castPositionSignal, usePositionAggregate } from "../lib/backend";
import { letterOf } from "../data";

/**
 * The aggregate position signal (D15) — vote-then-reveal, a landscape not a
 * leaderboard, a priority not a fact, before→after. Demo picks stay in
 * localStorage. In signed-in backend mode the private actor-bound ballot is
 * stored so it can be revised, while only k-anonymized aggregate bands are
 * public. Distribution is rendered in fixed A,B,C order — never ranked.
 */

const UNDECIDED = "__undecided__";

const prefersNoMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wire/storage id for a position — mode-stable letter form ("pos_a"). */
const pidOf = (debate: DebateFixture, positionId: string): string =>
  `pos_${letterOf(debate, positionId).toLowerCase()}`;

const midOf = (s: PositionShare | undefined): number =>
  s && s.share_lo != null && s.share_hi != null
    ? (s.share_lo + s.share_hi) / 2
    : 0;

interface Opt {
  id: string; // "pos_a" | "__undecided__"
  label: string;
  letter: string; // "A" | "·"
}

function optionsFor(debate: DebateFixture, undecidedLabel: string): Opt[] {
  return [
    ...debate.positions.map((p) => ({
      id: pidOf(debate, p.id),
      label: p.title,
      letter: letterOf(debate, p.id),
    })),
    { id: UNDECIDED, label: undecidedLabel, letter: "·" },
  ];
}

/* ————— the ballot (shared by before + after) ————— */
function Ballot({
  title,
  options,
  current,
  busy,
  ctaLabel,
  busyLabel,
  privacyLabel,
  onCommit,
}: {
  title: string;
  options: Opt[];
  current: string | null | undefined;
  busy: boolean;
  ctaLabel: string;
  busyLabel: string;
  privacyLabel: string;
  onCommit: (id: string | null) => void;
}) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string | null>(current ?? null);
  const has = picked !== null;
  return (
    <div className="possig__ballot">
      <p className="possig__eyebrow">{t.positionSignal.eyebrow}</p>
      <h3 className="possig__title">{title}</h3>
      <p className="possig__hint">{t.positionSignal.pickFirst}</p>
      <div className="possig__chips" role="radiogroup" aria-label={title}>
        {options.map((o) => {
          const active = picked === (o.id === UNDECIDED ? UNDECIDED : o.id);
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`possig__chip${active ? " possig__chip--mine" : ""}${
                o.id === UNDECIDED ? " possig__chip--undecided" : ""
              }`}
              onClick={() => setPicked(o.id)}
            >
              <span className="possig__chipletter" aria-hidden="true">
                {o.letter}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn btn--primary possig__cast"
        disabled={!has || busy}
        onClick={() => onCommit(picked === UNDECIDED ? null : picked)}
      >
        {busy ? busyLabel : ctaLabel}
      </button>
      <p className="possig__privacy">{privacyLabel}</p>
    </div>
  );
}

/* ————— the revealed landscape + shift ————— */
function Landscape({ debate, source }: { debate: DebateFixture; source: string }) {
  const { locale, t } = useI18n();
  const ts = t.positionSignal;
  const profile = useProfile();
  const { aggregate } = usePositionAggregate(debate.topic.id, locale);
  const mine = profile.signal[debate.topic.id] ?? {};
  const options = optionsFor(debate, ts.undecided);

  if (!aggregate) return null;

  const sharesFor = (phase: SignalPhase): Map<string, PositionShare> => {
    const m = new Map<string, PositionShare>();
    aggregate.distribution
      .filter((d) => d.phase === phase)
      .forEach((d) => m.set(d.position_id, d));
    return m;
  };
  const after = sharesFor("after");
  const before = sharesFor("before");
  const reduced = prefersNoMotion();

  const confidence =
    aggregate.confidence === "settled"
      ? ts.confidenceSettled
      : aggregate.confidence === "forming"
        ? ts.confidenceForming
        : ts.confidenceEmerging;

  // population shift per option (after_mid − before_mid), in points. Only count
  // options whose share is shown in BOTH phases — a withheld/missing cell folds
  // to 0 and would fabricate a large delta against a real value.
  const comparable = (s: PositionShare | undefined): s is PositionShare =>
    !!s && !s.withheld && s.share_lo != null && s.share_hi != null;
  const shifts = options
    .map((o) => ({ o, a: after.get(o.id), b: before.get(o.id) }))
    .filter((x) => comparable(x.a) && comparable(x.b))
    .map((x) => ({ o: x.o, pts: Math.round(midOf(x.a) - midOf(x.b)) }))
    .filter((s) => s.pts !== 0);

  const personalShift =
    mine.before !== undefined && mine.after !== undefined
      ? mine.before === mine.after
        ? ts.shiftYouHeld
        : ts.shiftYouMoved
      : null;

  return (
    <div className="possig__reveal" role="status" aria-live="polite">
      <h3 className="possig__revealtitle" tabIndex={-1}>
        {ts.revealTitle}
      </h3>
      <p className="possig__hint">{ts.notLeaderboard}</p>

      <div
        className={`possig__landscape${reduced ? "" : " possig__landscape--armed"}`}
        role="img"
        aria-label={ts.notLeaderboard}
      >
        {options.map((o, i) => {
          const s = after.get(o.id);
          const isMine = mine.after === o.id || (mine.after == null && o.id === UNDECIDED);
          const pct = midOf(s);
          const withheld = !s || s.withheld;
          return (
            <div
              key={o.id}
              className={`possig__row${isMine ? " possig__row--mine" : ""}`}
            >
              <span className="possig__rowlabel">
                <span className="possig__bandletter" aria-hidden="true">
                  {o.letter}
                </span>
                {o.label}
                {isMine && <span className="possig__mark">{ts.youMark}</span>}
              </span>
              <span className="possig__track">
                <span
                  className={`possig__band${withheld ? " possig__band--withheld" : ""}`}
                  style={
                    {
                      width: `${withheld ? 6 : pct}%`,
                      "--w": `${withheld ? 6 : pct}%`,
                      "--i": i,
                    } as CSSProperties
                  }
                />
              </span>
              <span className="possig__bandpct">
                {withheld || !s
                  ? ts.withheld
                  : ts.pctBand(s.share_lo ?? 0, s.share_hi ?? 0)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="possig__confidence">{confidence}</p>
      <p className="possig__priority">{ts.priorityNote}</p>

      <div className="possig__shift">
        <h4 className="possig__shifttitle">{ts.shiftTitle}</h4>
        {shifts.length === 0 ? (
          <p className="possig__shiftempty">{ts.shiftEmpty}</p>
        ) : (
          <>
            <p className="possig__shiftlede">{ts.shiftLede}</p>
            <ul className="possig__shiftlist">
              {shifts.map((s) => (
                <li key={s.o.id}>{ts.shiftDelta(s.pts, s.o.letter)}</li>
              ))}
            </ul>
            {personalShift && (
              <p className="possig__shiftyou">{personalShift}</p>
            )}
            <p className="possig__shiftdignity">{ts.shiftDignity}</p>
          </>
        )}
      </div>

      {aggregate.is_demo && <p className="possig__demoflag">{ts.demoNote}</p>}
      {source === "supabase" && !aggregate.is_demo && (
        <p className="possig__privacy">{ts.privacy}</p>
      )}
    </div>
  );
}

/** Entry ballot — captures the reader's BEFORE pick (under the quiz). */
export function PositionSignalBefore({
  debate,
  source,
}: {
  debate: DebateFixture;
  source: string;
}) {
  const { t } = useI18n();
  const ts = t.positionSignal;
  const profile = useProfile();
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState(false);
  const mine = profile.signal[debate.topic.id] ?? {};
  if (mine.before !== undefined) return null; // baseline captured

  const options = optionsFor(debate, ts.undecided);
  return (
    <div className="possig possig--before">
      <Ballot
        title={ts.beforeTitle}
        options={options}
        current={null}
        busy={busy}
        ctaLabel={ts.cast}
        busyLabel={ts.casting}
        privacyLabel={
          source === "supabase" ? ts.privacy : ts.privacyLocal
        }
        onCommit={async (id) => {
          setBusy(true);
          setGate(false);
          try {
            if (source !== "supabase") {
              castSignal(debate.topic.id, "before", id);
              return;
            }
            const res = await castPositionSignal({
              topic_id: debate.topic.id,
              phase: "before",
              position_id: id,
            });
            if (!res.synced) setGate(true);
          } catch {
            setGate(true);
          } finally {
            setBusy(false);
          }
        }}
      />
      {gate && (
        <p className="possig__gate" role="alert" aria-live="assertive">
          {ts.syncFailure}
        </p>
      )}
    </div>
  );
}

/** Exit card — captures the AFTER pick, then reveals the landscape + shift. */
export function PositionSignal({
  debate,
  source,
}: {
  debate: DebateFixture;
  source: string;
}) {
  const { t } = useI18n();
  const ts = t.positionSignal;
  const profile = useProfile();
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState(false);
  const mine = profile.signal[debate.topic.id] ?? {};
  const revealed = mine.after !== undefined;
  const options = optionsFor(debate, ts.undecided);

  return (
    <div className="possig possig--after">
      {!revealed ? (
        <Ballot
          title={ts.afterTitle}
          options={options}
          current={null}
          busy={busy}
          ctaLabel={ts.cast}
          busyLabel={ts.casting}
          privacyLabel={
            source === "supabase" ? ts.privacy : ts.privacyLocal
          }
          onCommit={async (id) => {
            setBusy(true);
            setGate(false);
            try {
              if (source !== "supabase") {
                castSignal(debate.topic.id, "after", id);
                return;
              }
              const res = await castPositionSignal({
                topic_id: debate.topic.id,
                phase: "after",
                position_id: id,
                from_position: mine.after ?? null,
              });
              if (!res.synced) setGate(true);
            } catch {
              setGate(true);
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : (
        <Landscape debate={debate} source={source} />
      )}
      {/* A signed-out cast against the real backend never sets mine.after, so the
          ballot stays up — the gate note must render alongside it, not only after
          a (never-reached) reveal. */}
      {gate && (
        <p className="possig__gate" role="alert" aria-live="assertive">
          {ts.syncFailure}
        </p>
      )}
    </div>
  );
}
