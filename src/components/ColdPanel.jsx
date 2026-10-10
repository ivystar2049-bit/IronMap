import { Snowflake, ChevronDown, ChevronUp } from "lucide-react";
import { C, display } from "../lib/theme";
import { card } from "../lib/styleHelpers";
import ColdRows from "./ColdRows";

/* What's been neglected, at the moment you're deciding what to train.
   Entirely optional — it collapses, and every existing way of building a
   session still works without touching it.

   Rows arrive pre-filtered to exercises the user's equipment profile allows,
   and any cold muscle left with nothing they can perform is dropped upstream:
   a suggestion you can't act on is noise in a panel whose whole point is
   acting. Body > Gaps to close still lists it, because there the point is
   knowing. */
export default function ColdPanel({ rows, target, open, onToggle, onOpenExercise }) {
  if (!rows?.length) return null;
  return (
    <div style={{ ...card(), cursor: "default", padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between"
        style={{ width: "100%", background: "transparent", border: "none", padding: 14, cursor: "pointer", color: C.text }}
      >
        <span className="flex items-center" style={{ gap: 6, fontFamily: display, fontSize: 15, letterSpacing: 2, textTransform: "uppercase", color: C.muted }}>
          <Snowflake size={14} color={C.accent} /> Coldest right now
        </span>
        {open ? <ChevronUp size={18} color={C.muted} /> : <ChevronDown size={18} color={C.muted} />}
      </button>

      {open && (
        <div style={{ padding: "0 14px 12px", maxHeight: 420, overflowY: "auto" }}>
          <ColdRows rows={rows} target={target} onOpenExercise={onOpenExercise} />
        </div>
      )}
    </div>
  );
}
