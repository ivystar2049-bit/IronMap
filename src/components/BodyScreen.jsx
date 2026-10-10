import { useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { MUSCLES } from "../data/exercises";
import { heat, status, suggestFor } from "../lib/volume";
import { filterAvailable } from "../lib/availability";
import { lastTrainedLabel } from "../lib/recommend";
import BodyMap from "./BodyMap";
import Chip from "./Chip";
import { card } from "../lib/styleHelpers";

export default function BodyScreen({ vols, neglected, selMuscle, onPickMuscle, targets, exercises, ownedSet, focusTarget, onFocusHandled }) {
  /* Suggestions must never name an exercise the user can't do — the same
     availability rule the picker uses. */
  const usable = filterAvailable(exercises, ownedSet);
  const gapsRef = useRef(null);
  const muscleRef = useRef(null);

  /* "gaps" scrolls to the neglected list (Home's summary card); "muscle"
     scrolls to the selected muscle's card, which is where the "Do more of"
     suggestions live (Home's region rows). */
  useEffect(() => {
    if (!focusTarget) return;
    const el = focusTarget === "muscle" ? muscleRef.current : gapsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    onFocusHandled?.();
  }, [focusTarget, onFocusHandled]);

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div style={{ fontFamily: display, fontSize: 15, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Last 7 days</div>
      <div className="flex" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
        <BodyMap side="front" vols={vols} onPick={onPickMuscle} selected={selMuscle} />
        <BodyMap side="back" vols={vols} onPick={onPickMuscle} selected={selMuscle} />
      </div>

      {/* legend */}
      <div className="flex items-center justify-center" style={{ gap: 8, margin: "6px 0 18px" }}>
        <span style={{ fontSize: 11, color: C.muted }}>Ignored</span>
        <div style={{ height: 8, width: 120, borderRadius: 4, background: "linear-gradient(90deg,#2A313B,#B4791A,#F97316,#EF4444)" }} />
        <span style={{ fontSize: 11, color: C.muted }}>Hammered</span>
      </div>

      {selMuscle && (
        <div ref={muscleRef} style={{ ...card(), cursor: "default", scrollMarginTop: 16 }}>
          <div className="flex items-center justify-between">
            <div style={{ fontFamily: display, fontSize: 24, color: C.text }}>{MUSCLES[selMuscle]}</div>
            <Chip tone={C.raised}>{status(vols[selMuscle], targets.low, targets.high).label}</Chip>
          </div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            {vols[selMuscle].toFixed(1)} sets in the last 7 days · target {targets.low}–{targets.high}
          </div>
          {vols[selMuscle] < targets.low && (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: C.accent, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Do more of</div>
              <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
                {suggestFor(selMuscle, usable, 3).map((e) => <Chip key={e.id}>{e.name}</Chip>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={gapsRef} style={{ fontFamily: display, fontSize: 18, color: C.text, textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px", scrollMarginTop: 16 }}>
        <Flame size={16} color={C.accent} style={{ verticalAlign: -2, marginRight: 6 }} />
        Gaps to close
      </div>
      {neglected.length === 0 ? (
        <div style={{ color: C.good, fontSize: 14, fontFamily: body }}>Everything's on target. Nice balance.</div>
      ) : (
        /* Ordered by the same cold score the session panel uses, so the two
           can't disagree about what's most neglected. Unlike the panel, this
           keeps muscles the user owns no kit for — here the point is knowing,
           not acting, and silently dropping them would hide a real gap. */
        neglected.map(({ m, v, days }) => {
          const pct = Math.round((v / targets.low) * 100);
          const picks = suggestFor(m, usable, 2);
          return (
            <div key={m} style={{ ...card(), cursor: "default" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: display, fontSize: 18, color: C.text }}>{MUSCLES[m]}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{lastTrainedLabel(days)}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                    {picks.length ? picks.map((e) => e.name).join(" · ") : "Nothing in your kit trains this"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {/* heat() bottoms out at cold steel — legible over the body
                      map, all but invisible on a card, and now that rows are
                      ordered by coldness the zero ones sit at the top. */}
                  <div style={{ fontFamily: display, fontSize: 22, color: v > 0 ? heat(v) : C.muted }}>
                    {v.toFixed(1)}<span style={{ fontSize: 13, color: C.muted }}>/{targets.low}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{pct}% to target</div>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: C.line, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: heat(v), borderRadius: 2 }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
