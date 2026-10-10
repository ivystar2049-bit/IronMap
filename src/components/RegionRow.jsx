import { ChevronRight } from "lucide-react";
import { C, display } from "../lib/theme";
import { ragColor, ragLabel } from "../lib/volume";

/* One body-region rollup: name, RAG-coloured progress bar, % to target.
   Progress bar matches the house style used by BodyScreen's "Gaps to close"
   (4px, C.line track, radius 2, fill clamped to 100%). */
export default function RegionRow({ label, pct, onClick, compact = false }) {
  const color = ragColor(pct);
  const shown = Math.round(pct * 100);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      aria-label={onClick ? `${label}: ${shown}% of target, ${ragLabel(pct)}` : undefined}
      style={{
        display: "block", width: "100%", textAlign: "left", background: "transparent",
        border: "none", padding: compact ? "7px 0" : "9px 0",
        cursor: onClick ? "pointer" : "default", color: C.text, fontFamily: "inherit",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
        <span style={{ fontFamily: display, fontSize: compact ? 15 : 16, letterSpacing: 0.5 }}>{label}</span>
        <span className="flex items-center" style={{ gap: 4 }}>
          <span style={{ fontFamily: display, fontSize: compact ? 15 : 16, color }}>{shown}%</span>
          {onClick && <ChevronRight size={14} color={C.muted} />}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, shown)}%`, background: color, borderRadius: 2 }} />
      </div>
    </Tag>
  );
}
