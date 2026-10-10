import { C, display } from "../lib/theme";

/* Overload suggestions. These only pre-fill the steppers — none of them logs
   a set, so tapping one can't record anything by accident. The `recommended`
   chip is the next move under double progression; the others stay live so the
   range is a nudge rather than a rail.

   Not built on Chip.jsx: that's a non-interactive <span> used for muscle
   labels, and these need to be real buttons with a touch target. */
export default function SuggestionChips({ suggestions, onPick }) {
  if (!suggestions?.length) return null;
  return (
    <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => onPick(s)}
          style={{
            fontFamily: display, fontSize: 16, letterSpacing: 0.5,
            padding: "8px 14px", borderRadius: 999, cursor: "pointer",
            background: s.recommended ? C.accentDim : C.raised,
            color: s.recommended ? C.accent : C.text,
            border: `1px solid ${s.recommended ? C.accent : "transparent"}`,
            whiteSpace: "nowrap",
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
