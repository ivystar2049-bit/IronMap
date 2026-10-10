import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { card, bigBtn, dangerBtn } from "../lib/styleHelpers";
import ExerciseLogger from "./ExerciseLogger";
import ExercisePicker from "./ExercisePicker";

function toYmd(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function SessionDetail({
  session, exById, allExercises, repsTarget, lastSession,
  activeEx, onOpenExercise, onBackFromExercise,
  onLog, onUndo, onDeleteEntry,
  onUpdateDate, onDeleteSession, onClose,
  picker, onOpenPicker, onClosePicker, eqById, ownedSet, customEquipment,
}) {
  return (
    /* Same as LogScreen: the logger pins its own bar and owns its bottom
       spacing while it's open. */
    <div style={{ padding: 16, paddingBottom: activeEx ? 0 : 96 }}>
      {activeEx ? (
        <ExerciseLogger
          ex={exById[activeEx]}
          entry={session.entries.find((e) => e.exId === activeEx)}
          /* No `suggestions` here on purpose: you're editing a past workout,
             so "progress from last time" would compare against a newer
             session. The logger falls back to the plain last-time line. */
          last={lastSession(activeEx)}
          onLog={(w, r) => onLog(activeEx, w, r)}
          onUndo={() => onUndo(activeEx)}
          onDelete={() => onDeleteEntry(activeEx)}
          onBack={onBackFromExercise}
          repsTarget={repsTarget}
          customEquipment={customEquipment}
        />
      ) : (
        <>
          <button onClick={onClose} className="flex items-center" style={{ gap: 4, background: "transparent", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", fontFamily: body, padding: 0, marginBottom: 14 }}>
            <ChevronLeft size={16} /> History
          </button>

          <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Date</div>
          <input
            type="date"
            value={toYmd(session.date)}
            onChange={(e) => e.target.value && onUpdateDate(e.target.value)}
            style={{ background: C.raised, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 15, fontFamily: body, marginBottom: 20, colorScheme: "dark" }}
          />

          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: display, fontSize: 18, color: C.text, textTransform: "uppercase", letterSpacing: 1 }}>Exercises</div>
            <span style={{ color: C.muted, fontSize: 13 }}>{session.entries.reduce((a, e) => a + e.sets.length, 0)} sets</span>
          </div>

          {session.entries.length === 0 && (
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 14, fontFamily: body }}>No exercises. Add one below.</div>
          )}
          {session.entries.map((e) => {
            const ex = exById[e.exId];
            if (!ex) return null;
            return (
              <button key={e.exId} onClick={() => onOpenExercise(e.exId)} style={card()} className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: display, fontSize: 20, color: C.text }}>{ex.name}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{e.sets.map((s) => `${s.w > 0 ? s.w + "kg×" : ""}${s.r}`).join("  ·  ")}</div>
                </div>
                <ChevronRight size={20} color={C.muted} />
              </button>
            );
          })}

          <button onClick={onOpenPicker} style={bigBtn(C.raised, C.text)}>
            <Plus size={20} style={{ marginRight: 8 }} /> Add exercise
          </button>

          <button
            onClick={() => { if (confirm("Delete this entire session? This can't be undone.")) onDeleteSession(); }}
            style={{ ...dangerBtn(), marginTop: 20 }}
          >
            <Trash2 size={16} style={{ marginRight: 8 }} /> Delete session
          </button>

          {picker && (
            <ExercisePicker
              exercises={allExercises}
              ownedSet={ownedSet}
              eqById={eqById}
              onClose={onClosePicker}
              onPick={(exId) => { onClosePicker(); onOpenExercise(exId); }}
            />
          )}
        </>
      )}
    </div>
  );
}
