import { C, display } from "../lib/theme";
import { card } from "../lib/styleHelpers";

export default function StatCard({ big, label, sub, subTone, tone, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} style={{ ...card(), flex: 1, cursor: onClick ? "pointer" : "default", marginBottom: 0 }}>
      <div className="flex items-center" style={{ gap: 6 }}>
        <span style={{ fontFamily: display, fontSize: 40, lineHeight: 1, color: tone || C.text }}>{big}</span>
        {sub != null && (
          <span style={{ fontFamily: display, fontSize: 17, lineHeight: 1, color: subTone || C.muted }}>{sub}</span>
        )}
      </div>
      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>{label}</div>
    </Tag>
  );
}
