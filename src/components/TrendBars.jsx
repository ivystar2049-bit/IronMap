import { C, display } from "../lib/theme";
import { ragColor } from "../lib/volume";

/* Week-by-week completion, oldest on the left. Plain CSS columns — the
   project ships no chart dependency and shouldn't gain one for four bars. */
const CHART_H = 64;

export default function TrendBars({ weeks }) {
  return (
    <div className="flex" style={{ gap: 10, alignItems: "flex-end" }}>
      {weeks.map((w, i) => {
        const shown = Math.round(w.pct * 100);
        const color = ragColor(w.pct);
        const isNow = i === weeks.length - 1;
        return (
          <div key={w.weeksAgo} className="flex flex-col items-center" style={{ flex: 1 }}>
            <span style={{ fontFamily: display, fontSize: 13, color, marginBottom: 4 }}>{shown}%</span>
            <div style={{ width: "100%", height: CHART_H, background: C.line, borderRadius: 4, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
              <div
                style={{
                  width: "100%",
                  // keep a sliver visible at 0% so the bar reads as "empty", not missing
                  height: `${Math.max(3, Math.min(100, shown))}%`,
                  background: color,
                  borderRadius: 4,
                  opacity: isNow ? 1 : 0.75,
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: isNow ? C.text : C.muted, marginTop: 5, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: display }}>
              {isNow ? "Now" : `W-${w.weeksAgo}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
