import { useState } from "react";
import { X, Plus, Trash2, ChevronLeft } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { MUSCLES } from "../data/exercises";
import { EQUIPMENT_GROUPS, EQUIPMENT, groupColor, exerciseColor } from "../data/equipment";
import { makeExerciseId } from "../lib/customExercise";
import { card, bigBtn } from "../lib/styleHelpers";

const EMPTY_FORM = {
  name: "", equipment: [], load: "external", logType: "reps",
  primary: [], secondary: [], imageUrl: "", videoUrl: "",
};

function toggleChip(active, color) {
  return {
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? color : C.line}`,
    background: active ? color + "26" : "transparent",
    color: active ? color : C.muted,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function inputStyle() {
  return {
    width: "100%", background: C.raised, border: `1px solid ${C.line}`, borderRadius: 12,
    padding: "12px 14px", color: C.text, fontSize: 15, fontFamily: body, outline: "none",
  };
}

function AddForm({ onCancel, onSave, customEquipment = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const togglePrimary = (m) => {
    const primary = form.primary.includes(m) ? form.primary.filter((x) => x !== m) : [...form.primary, m];
    const secondary = form.secondary.filter((x) => x !== m);
    set({ primary, secondary });
  };
  const toggleEquipment = (id) => {
    const equipment = form.equipment.includes(id)
      ? form.equipment.filter((x) => x !== id)
      : [...form.equipment, id];
    set({ equipment });
  };
  const toggleSecondary = (m) => {
    if (form.primary.includes(m)) return;
    const secondary = form.secondary.includes(m) ? form.secondary.filter((x) => x !== m) : [...form.secondary, m];
    set({ secondary });
  };

  const isValid = form.name.trim().length > 0 && form.primary.length > 0;

  const save = () => {
    if (!isValid) return;
    onSave({
      id: makeExerciseId(form.name),
      name: form.name.trim(),
      equipment: form.equipment,
      load: form.load,
      logType: form.logType,
      w: 0,
      p: form.primary,
      s: form.secondary,
      imageUrl: form.imageUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      custom: true,
    });
  };

  return (
    <div style={{ overflowY: "auto", padding: 16 }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ background: C.raised, border: "none", borderRadius: 10, width: 36, height: 36, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={18} /></button>
        <div style={{ fontFamily: display, fontSize: 22, textTransform: "uppercase", letterSpacing: 1 }}>New exercise</div>
      </div>

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Name</div>
      <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Incline DB Press" style={{ ...inputStyle(), marginBottom: 16 }} />

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Equipment needed</div>
      <div style={{ color: C.muted, fontSize: 11, marginBottom: 8, fontFamily: body }}>
        Pick every item this needs. Leave empty if it needs none. Only people who own all of it will be suggested this exercise.
      </div>
      {EQUIPMENT_GROUPS.map((g) => {
        const items = [
          ...EQUIPMENT.filter((e) => e.group === g.id),
          ...customEquipment.filter((c) => c.group === g.id),
        ];
        if (!items.length) return null;
        return (
          <div key={g.id} style={{ marginBottom: 10 }}>
            <div style={{ color: g.color, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5, fontWeight: 600 }}>{g.label}</div>
            <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
              {items.map((item) => (
                <button key={item.id} onClick={() => toggleEquipment(item.id)}
                  style={toggleChip(form.equipment.includes(item.id), groupColor(g.id))}>{item.label}</button>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 6px" }}>Logged as</div>
      <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => set({ logType: "reps" })} style={toggleChip(form.logType === "reps", C.accent)}>Reps</button>
        <button onClick={() => set({ logType: "time" })} style={toggleChip(form.logType === "time", C.accent)}>Time (seconds)</button>
        <button onClick={() => set({ load: "external" })} style={toggleChip(form.load === "external", C.good)}>Has weight</button>
        <button onClick={() => set({ load: "bodyweight" })} style={toggleChip(form.load === "bodyweight", C.good)}>Bodyweight</button>
      </div>

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Primary muscles</div>
      <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(MUSCLES).map(([id, label]) => (
          <button key={id} onClick={() => togglePrimary(id)} style={toggleChip(form.primary.includes(id), C.accent)}>{label}</button>
        ))}
      </div>

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Secondary muscles (optional)</div>
      <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(MUSCLES).filter(([id]) => !form.primary.includes(id)).map(([id, label]) => (
          <button key={id} onClick={() => toggleSecondary(id)} style={toggleChip(form.secondary.includes(id), C.good)}>{label}</button>
        ))}
      </div>

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Image URL (optional)</div>
      <input value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://…" style={{ ...inputStyle(), marginBottom: 16 }} />

      <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tutorial video URL (optional)</div>
      <input value={form.videoUrl} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://youtube.com/…" style={{ ...inputStyle(), marginBottom: 20 }} />

      <button onClick={save} disabled={!isValid} style={{ ...bigBtn(isValid ? C.accent : C.raised, isValid ? "#14171C" : C.muted), cursor: isValid ? "pointer" : "not-allowed" }}>
        <Plus size={20} style={{ marginRight: 8 }} /> Save exercise
      </button>
      {!isValid && <div style={{ color: C.muted, fontSize: 12, marginTop: 8, textAlign: "center" }}>A name and at least one primary muscle are required.</div>}
    </div>
  );
}

export default function ExerciseManager({ customExercises, onAdd, onDelete, onClose, customEquipment = [], eqById = {} }) {
  const [adding, setAdding] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,15,0.75)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
      <div style={{ background: C.surface, width: "100%", maxHeight: "86%", display: "flex", flexDirection: "column", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        {adding ? (
          <AddForm
            onCancel={() => setAdding(false)}
            onSave={(ex) => { onAdd(ex); setAdding(false); }}
            customEquipment={customEquipment}
          />
        ) : (
          <div style={{ overflowY: "auto", padding: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: display, fontSize: 24, textTransform: "uppercase", letterSpacing: 1 }}>Your exercises</div>
              <button onClick={onClose} style={{ background: C.raised, border: "none", borderRadius: 10, width: 40, height: 40, color: C.text, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <button onClick={() => setAdding(true)} style={{ ...bigBtn(C.raised, C.text), marginBottom: 16 }}>
              <Plus size={20} style={{ marginRight: 8 }} /> Add exercise
            </button>

            {customExercises.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 14, fontFamily: body }}>No custom exercises yet. Add one to see it in the picker.</div>
            ) : (
              customExercises.map((e) => (
                <div key={e.id} style={{ ...card(8), cursor: "default" }} className="flex items-center justify-between">
                  <div>
                    <div style={{ fontFamily: display, fontSize: 18, color: C.text }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: exerciseColor(e, eqById) }}>{(e.equipment ?? []).map((id) => eqById[id]?.label ?? id).join(" + ") || "No kit"}</div>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Delete "${e.name}"? Past logged sets for it will no longer show details.`)) onDelete(e.id); }}
                    style={{ background: "transparent", border: "none", color: C.danger, cursor: "pointer", padding: 8 }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
