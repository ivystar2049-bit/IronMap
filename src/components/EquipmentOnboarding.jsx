import { useState } from "react";
import { Check } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { bigBtn } from "../lib/styleHelpers";
import EquipmentSelector from "./EquipmentSelector";

/* One screen, shown once, before a new user first reaches the exercise
   picker. Skippable: skipping leaves the profile unset, which the
   availability rule treats as "show everything" rather than locking anyone
   out of an empty library. Re-editable later from Settings. */
export default function EquipmentOnboarding({ onDone, onSkip }) {
  const [profile, setProfile] = useState({ owned: [], custom: [] });
  const count = profile.owned.length;

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 30, display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 24px)", flex: 1 }}>
        <div style={{ fontFamily: display, fontSize: 32, letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
          WELCOME TO IRON<span style={{ color: C.accent }}>MAP</span>
        </div>
        <div style={{ color: C.muted, fontSize: 14, fontFamily: body, marginBottom: 22, lineHeight: 1.45 }}>
          What kit do you have? IronMap only ever suggests exercises you can actually do with it.
          You can change this any time in Settings.
        </div>

        <EquipmentSelector profile={profile} onChange={setProfile} />
      </div>

      <div style={{ padding: 16, paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)", borderTop: `1px solid ${C.line}`, background: C.surface }}>
        <button onClick={() => onDone(profile)} disabled={count === 0} style={{ ...bigBtn(count ? C.accent : C.raised, count ? "#14171C" : C.muted), cursor: count ? "pointer" : "default" }}>
          <Check size={20} style={{ marginRight: 8 }} />
          {count ? `Continue with ${count} item${count === 1 ? "" : "s"}` : "Select your kit"}
        </button>
        <button onClick={onSkip} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: body, width: "100%", padding: "12px 0 0" }}>
          Skip — show me everything
        </button>
      </div>
    </div>
  );
}
