import { X, Building2 } from "lucide-react";
import { C, display, body } from "../lib/theme";
import EquipmentSelector from "./EquipmentSelector";

export default function EquipmentPanel({ profile, onChange, onClose }) {
  const count = profile.owned?.length ?? 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,15,0.75)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
      <div style={{ background: C.surface, width: "100%", maxHeight: "86%", overflowY: "auto", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: display, fontSize: 24, textTransform: "uppercase", letterSpacing: 1 }}>Your equipment</div>
          <button onClick={onClose} style={{ background: C.raised, border: "none", borderRadius: 10, width: 40, height: 40, color: C.text, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <button
          onClick={() => onChange({ ...profile, gym: !profile.gym })}
          aria-pressed={!!profile.gym}
          className="flex items-center"
          style={{
            width: "100%", gap: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
            padding: 14, marginBottom: 16, borderRadius: 14,
            border: `1px solid ${profile.gym ? C.accent : C.line}`,
            background: profile.gym ? C.accent + "26" : "transparent",
            color: C.text,
          }}
        >
          <Building2 size={22} color={profile.gym ? C.accent : C.muted} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontFamily: display, fontSize: 18, letterSpacing: 0.5 }}>
              At a commercial gym{profile.gym ? " · on" : ""}
            </span>
            <span style={{ display: "block", color: C.muted, fontSize: 12, fontFamily: body, marginTop: 2 }}>
              Unlocks every exercise. Your home kit below is kept — switch off to go back to it.
            </span>
          </span>
        </button>

        <div style={{ color: C.muted, fontSize: 12, fontFamily: body, marginBottom: 18 }}>
          {count === 0
            ? "Nothing selected — every exercise is shown. Tick what you own to narrow suggestions down to what you can actually do."
            : "Exercises are suggested only when you own everything they need. Changes save as you tap."}
        </div>

        <EquipmentSelector profile={profile} onChange={onChange} />
      </div>
    </div>
  );
}
