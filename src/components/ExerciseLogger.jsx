import { useState } from "react";
import { Check, ExternalLink, Trash2, SkipForward, Flag, Undo2 } from "lucide-react";
import { C, display, body, NAV_H } from "../lib/theme";
import { MUSCLES, weightStepFor, isBodyweight, isTimed, defaultSecsFor } from "../data/exercises";
import { tutorialUrlFor, tutorialLabelFor } from "../lib/tutorial";
import Chip from "./Chip";
import Stepper from "./Stepper";
import SuggestionChips from "./SuggestionChips";
import { bigBtn } from "../lib/styleHelpers";

/* onSaveAndNext / onSaveAndFinish are optional: SessionDetail reuses this
   component to edit a *past* workout, where "finish workout" is meaningless,
   so it passes neither and the buttons don't render. Neither one logs a set
   — sets come only from "Log set", so tapping these after logging your last
   set can't record a phantom extra one. */
export default function ExerciseLogger({ ex, entry, last, suggestions, plateau, onLog, onUndo, onDelete, onBack, onSaveAndNext, onSaveAndFinish, repsTarget, customEquipment = [] }) {
  const timed = isTimed(ex);
  /* Prefer what you've already done in this session: re-opening an exercise
     mid-workout used to remount and reseed from the *previous* session,
     silently throwing away the weight you'd just been using. Falling back to
     the best set of last time rather than its last one, since that's what
     the suggestion chips progress from. */
  const seed = entry?.sets?.length ? entry.sets[entry.sets.length - 1] : last?.best;
  const [w, setW] = useState(seed ? seed.w : ex.w);
  /* The second stepper is reps or seconds depending on the exercise. Both
     are stored in the same `r` field — the unit is derived from the
     exercise at display time, so no set data needed migrating. */
  const [r, setR] = useState(seed ? seed.r : (timed ? defaultSecsFor(ex) : repsTarget.low));
  const [imgErrored, setImgErrored] = useState(false);
  const isBW = isBodyweight(ex);
  /* Clears the pinned bar so the last of the content can still be scrolled
     into view. Both parents drop their own bottom padding while the logger is
     open, so this is the only bottom spacing in play. */
  const barH = onSaveAndNext || onSaveAndFinish ? 144 : 88;
  return (
    <div style={{ paddingBottom: `calc(${barH + NAV_H}px + env(safe-area-inset-bottom))` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", fontFamily: body, padding: 0 }}>← Back</button>
        <button
          onClick={() => { if (confirm(`Remove ${ex.name} from this session? Any logged sets will be lost.`)) onDelete(); }}
          className="flex items-center" style={{ gap: 4, background: "transparent", border: "none", color: C.danger, fontSize: 13, cursor: "pointer", padding: 0 }}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Only a real image earns the space. The old fallback was a 112px grey
          box holding a dumbbell icon, which every built-in exercise rendered
          (none has an imageUrl) — it pushed Log set under the fold and told
          you nothing the title beneath it didn't. */}
      {ex.imageUrl && !imgErrored && (
        <img src={ex.imageUrl} alt="" onError={() => setImgErrored(true)}
          style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 14, marginBottom: 12 }} />
      )}

      <div style={{ fontFamily: display, fontSize: 28, color: C.text, lineHeight: 1 }}>{ex.name}</div>
      <div className="flex" style={{ gap: 6, flexWrap: "wrap", margin: "8px 0 4px" }}>
        {ex.p.map((m) => <Chip key={m} tone={C.accentDim}>{MUSCLES[m]}</Chip>)}
        {ex.s.map((m) => <Chip key={m}>{MUSCLES[m]}</Chip>)}
      </div>
      <a href={tutorialUrlFor(ex)} target="_blank" rel="noopener noreferrer"
        className="flex items-center" style={{ gap: 5, color: C.muted, fontSize: 12, textDecoration: "none", marginBottom: 6, width: "fit-content" }}>
        <ExternalLink size={12} /> {tutorialLabelFor(ex)}
      </a>
      {last && (suggestions?.length ? (
        /* Every set of last time, not just one, so you can see whether you
           faded across the session before deciding to add weight. */
        <div style={{ marginTop: 10 }}>
          <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Last time · {new Date(last.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <div className="flex" style={{ gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {last.sets.map((s, i) => {
              // Reference identity, so exactly one pill is marked even with duplicate sets.
              const best = s === last.best;
              return (
                <span key={i} style={{
                  fontFamily: display, fontSize: 16, padding: "5px 11px", borderRadius: 10,
                  background: C.raised, color: best ? C.text : C.muted,
                  border: `1px solid ${best ? C.line : "transparent"}`,
                }}>
                  {s.w > 0 ? `${s.w}×` : ""}{s.r}{timed ? "s" : ""}
                </span>
              );
            })}
          </div>
          <SuggestionChips suggestions={suggestions} onPick={(s) => { setW(s.w); setR(s.r); }} />
          {plateau && (
            <div style={{ color: C.muted, fontSize: 12, marginTop: 10, lineHeight: 1.4 }}>
              No increase for {plateau.sessions} sessions — a different rep range, a slower tempo or
              a change of movement can get things moving again.
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 10 }}>
          Last time: {last.best.w > 0 ? `${last.best.w}kg × ` : ""}{last.best.r}{timed ? "s" : ""}
        </div>
      ))}

      <div className="flex" style={{ gap: 12, margin: "14px 0" }}>
        {!isBW && <Stepper label="Weight" value={w} onChange={setW} step={weightStepFor(ex, customEquipment)} unit="kg" />}
        {/* Rep target rides in the label rather than on its own line below —
            same information, one fewer row between you and Log set. */}
        {timed
          ? <Stepper label="Time" value={r} onChange={setR} step={5} unit="s" />
          : <Stepper label={`Reps (${repsTarget.low}–${repsTarget.high})`} value={r} onChange={setR} step={1} unit="" />}
      </div>

      {entry && entry.sets.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Sets this session</span>
            <button onClick={onUndo} className="flex items-center" style={{ gap: 5, background: C.warn + "1F", border: `1px solid ${C.warn}`, borderRadius: 999, padding: "5px 12px", color: C.warn, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Undo2 size={14} /> Undo last
            </button>
          </div>
          <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
            {entry.sets.map((s, i) => (
              <span key={i} style={{ fontFamily: display, fontSize: 16, padding: "6px 12px", borderRadius: 10, background: C.raised, color: C.text }}>
                {s.w > 0 ? `${s.w}×` : ""}{s.r}{timed ? "s" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pinned above the tab bar. Log set is the one control you touch on
          every single set, and it used to sit ~500px down the page — a long
          exercise name, four sets logged last time, the plateau note or a
          larger system font size were each enough to push it under the fold
          mid-workout. Pinning makes that structurally impossible rather than
          merely unlikely. */}
      <div style={{
        position: "fixed", left: 0, right: 0,
        bottom: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
        background: C.bg, borderTop: `1px solid ${C.line}`,
        padding: "10px 16px 12px",
      }}>
        <button onClick={() => onLog(isBW ? 0 : w, r)} style={bigBtn(C.accent)}>
          <Check size={20} style={{ marginRight: 8 }} /> Log set
        </button>
        {(onSaveAndNext || onSaveAndFinish) && (
          <div className="flex" style={{ gap: 10, marginTop: 8 }}>
            {onSaveAndNext && (
              <button onClick={onSaveAndNext} style={{ ...bigBtn(C.raised, C.text), flex: 1, fontSize: 14, padding: 12 }}>
                <SkipForward size={15} style={{ marginRight: 6 }} /> Next exercise
              </button>
            )}
            {onSaveAndFinish && (
              <button onClick={onSaveAndFinish} style={{ ...bigBtn("transparent", C.accent), flex: 1, fontSize: 14, padding: 12, border: `1.5px solid ${C.accent}` }}>
                <Flag size={15} style={{ marginRight: 6 }} /> Finish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
