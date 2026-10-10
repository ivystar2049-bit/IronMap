import { Home, Activity, History as HistoryIcon } from "lucide-react";
// Height comes out at NAV_H (lib/theme.js) — keep the two in step.
import { C, display } from "../lib/theme";

const TABS = [
  { k: "log", icon: Home, label: "Home" },
  { k: "body", icon: Activity, label: "Body" },
  { k: "history", icon: HistoryIcon, label: "History" },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <div className="flex" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map(({ k, icon: Icon, label }) => (
        <button key={k} onClick={() => onChange(k)}
          className="flex-1 flex flex-col items-center"
          style={{ padding: "12px 0 16px", background: "transparent", border: "none", cursor: "pointer", color: tab === k ? C.accent : C.muted }}>
          <Icon size={22} />
          <span style={{ fontSize: 11, marginTop: 3, fontFamily: display, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
        </button>
      ))}
    </div>
  );
}
