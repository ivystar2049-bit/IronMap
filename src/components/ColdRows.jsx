import { C, display, body } from "../lib/theme";
import { MUSCLES } from "../data/exercises";
import { heat } from "../lib/volume";
import { lastTrainedLabel } from "../lib/recommend";

/* The muscle/exercise list shared by ColdPanel (the session screen) and
   ExercisePicker's Coldest chip (the Add exercise modal) — same rows, same
   "tap an exercise to open it" behaviour, two different chrome around it. */
export default function ColdRows({ rows, target, onOpenExercise }) {
  return rows.map(({ m, v, days, exercises }) => (
    <div key={m} style={{ marginBottom: 12 }}>
      <div className="flex items-baseline justify-between">
        <span style={{ fontFamily: display, fontSize: 19, color: C.text }}>{MUSCLES[m]}</span>
        <span style={{ fontSize: 12, color: C.muted, fontFamily: body }}>
          {/* heat() bottoms out at cold steel, which is legible over the
              body map but vanishes on a card — fall back to muted at zero. */}
          <span style={{ color: v > 0 ? heat(v) : C.muted }}>{v.toFixed(1)}</span>/{target} sets · {lastTrainedLabel(days)}
        </span>
      </div>
      <div className="flex" style={{ gap: 6, flexWrap: "wrap", marginTop: 6 }}>
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onOpenExercise(ex.id)}
            style={{
              fontFamily: display, fontSize: 15, letterSpacing: 0.5,
              padding: "7px 12px", borderRadius: 999, cursor: "pointer",
              background: C.raised, color: C.text, border: "none", whiteSpace: "nowrap",
            }}
          >
            {ex.name}
          </button>
        ))}
      </div>
    </div>
  ));
}
