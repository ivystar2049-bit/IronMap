import { X, RotateCcw, Dumbbell, ChevronRight, Wrench } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { DEFAULT_SETTINGS, clampSettings } from "../lib/settings";
import Stepper from "./Stepper";
import { card } from "../lib/styleHelpers";

export default function SettingsPanel({ settings, onChange, onClose, onOpenExerciseManager, customExerciseCount, onOpenEquipment, ownedCount = 0 }) {
  const set = (patch) => onChange(clampSettings({ ...settings, ...patch }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,15,0.75)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
      <div style={{ background: C.surface, width: "100%", maxHeight: "82%", overflowY: "auto", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: display, fontSize: 24, textTransform: "uppercase", letterSpacing: 1 }}>Settings</div>
          <button onClick={onClose} style={{ background: C.raised, border: "none", borderRadius: 10, width: 40, height: 40, color: C.text, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Weekly sets per muscle</div>
        <div className="flex" style={{ gap: 12, marginBottom: 6 }}>
          <Stepper label="Low target" value={settings.setsLow} step={1} unit="sets"
            onChange={(v) => set({ setsLow: v })} />
          <Stepper label="High target" value={settings.setsHigh} step={1} unit="sets"
            onChange={(v) => set({ setsHigh: v })} />
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 20, fontFamily: body }}>
          Below the low target a muscle shows as neglected; above the high target it's flagged as overworked.
        </div>

        <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Reps per set target</div>
        <div className="flex" style={{ gap: 12, marginBottom: 6 }}>
          <Stepper label="Low target" value={settings.repsLow} step={1} unit="reps"
            onChange={(v) => set({ repsLow: v })} />
          <Stepper label="High target" value={settings.repsHigh} step={1} unit="reps"
            onChange={(v) => set({ repsHigh: v })} />
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 20, fontFamily: body }}>
          Used as the default rep count when you log an exercise for the first time.
        </div>

        <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Set weighting</div>
        <div className="flex" style={{ gap: 12, marginBottom: 6 }}>
          <Stepper label="Primary muscle" value={settings.primaryWeight} step={0.1} unit="×"
            onChange={(v) => set({ primaryWeight: v })} />
          <Stepper label="Secondary muscle" value={settings.secondaryWeight} step={0.1} unit="×"
            onChange={(v) => set({ secondaryWeight: v })} />
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 20, fontFamily: body }}>
          How many sets a muscle is credited with per working set — {settings.primaryWeight}× when it's the primary mover, {settings.secondaryWeight}× when it's just assisting.
        </div>

        <div style={{ color: C.muted, fontSize: 12, marginBottom: 20, fontFamily: body, fontStyle: "italic" }}>
          Coming soon: bonus scoring for sets and reps you push above these targets.
        </div>

        <button onClick={onOpenEquipment} style={{ ...card(), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <Wrench size={18} color={C.accent} />
            <span style={{ fontFamily: display, fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>Your equipment</span>
          </div>
          <div className="flex items-center" style={{ gap: 6, color: C.muted, fontSize: 13 }}>
            {ownedCount === 0 ? "All shown" : ownedCount} <ChevronRight size={16} />
          </div>
        </button>

        <button onClick={onOpenExerciseManager} style={{ ...card(), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <Dumbbell size={18} color={C.accent} />
            <span style={{ fontFamily: display, fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>Your exercises</span>
          </div>
          <div className="flex items-center" style={{ gap: 6, color: C.muted, fontSize: 13 }}>
            {customExerciseCount} <ChevronRight size={16} />
          </div>
        </button>

        <button
          onClick={() => onChange(DEFAULT_SETTINGS)}
          style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px", width: "100%", color: C.muted, fontFamily: display, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <RotateCcw size={16} style={{ marginRight: 8 }} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
