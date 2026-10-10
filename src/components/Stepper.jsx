import { Plus, Minus } from "lucide-react";
import { C, display } from "../lib/theme";

/* Snaps to the nearest multiple of `step` rather than just adding/subtracting
   it from whatever `value` already is — otherwise a value that's ever off
   the equipment's grid (e.g. seeded from an old session logged under a
   different step) stays off it forever, since step ± step preserves the
   offset instead of correcting it. */
function snap(value, step) {
  return Math.max(0, +(Math.round(value / step) * step).toFixed(2));
}

export default function Stepper({ label, value, onChange, step, unit }) {
  const btn = {
    width: 56, height: 56, borderRadius: 14, border: "none",
    background: C.raised, color: C.text, fontSize: 26, fontFamily: display,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  };
  return (
    <div className="flex-1">
      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div className="flex items-center" style={{ gap: 10 }}>
        <button style={btn} onClick={() => onChange(snap(value - step, step))}><Minus size={22} /></button>
        <div style={{ flex: 1, textAlign: "center", fontFamily: display, fontSize: 40, lineHeight: 1, color: C.text }}>
          {value}<span style={{ fontSize: 15, color: C.muted, marginLeft: 3 }}>{unit}</span>
        </div>
        <button style={btn} onClick={() => onChange(snap(value + step, step))}><Plus size={22} /></button>
      </div>
    </div>
  );
}
