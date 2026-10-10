import { ChevronRight, RotateCcw } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { card, dangerBtn } from "../lib/styleHelpers";
import SessionDetail from "./SessionDetail";

export default function HistoryScreen({
  sessions, exById, allExercises, repsTarget, lastSession, onResetAll,
  session, onSelectSession, onCloseSession, onUpdateDate, onDeleteSession,
  activeEx, onOpenExercise, onBackFromExercise, onLog, onUndo, onDeleteEntry,
  picker, onOpenPicker, onClosePicker, eqById, ownedSet, customEquipment,
}) {
  if (session) {
    return (
      <SessionDetail
        session={session}
        exById={exById}
        allExercises={allExercises}
        repsTarget={repsTarget}
        lastSession={lastSession}
        activeEx={activeEx}
        onOpenExercise={onOpenExercise}
        onBackFromExercise={onBackFromExercise}
        onLog={onLog}
        onUndo={onUndo}
        onDeleteEntry={onDeleteEntry}
        onUpdateDate={onUpdateDate}
        onDeleteSession={() => onDeleteSession(session.finished || session.date)}
        onClose={onCloseSession}
        picker={picker}
        onOpenPicker={onOpenPicker}
        onClosePicker={onClosePicker}
        eqById={eqById}
        ownedSet={ownedSet}
        customEquipment={customEquipment}
      />
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div style={{ fontFamily: display, fontSize: 26, color: C.text, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>History</div>
      {sessions.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14, fontFamily: body }}>No sessions yet. Log one and it'll show up here.</div>
      ) : (
        sessions.map((s) => (
          <button key={s.finished || s.date} onClick={() => onSelectSession(s.finished || s.date)} style={card()} className="flex items-center justify-between">
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: display, fontSize: 20, color: C.text }}>{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                {s.entries.map((e) => exById[e.exId]?.name).join(" · ")}
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ color: C.muted, fontSize: 12 }}>{s.entries.reduce((a, e) => a + e.sets.length, 0)} sets</span>
              <ChevronRight size={18} color={C.muted} />
            </div>
          </button>
        ))
      )}
      {sessions.length > 0 && (
        <button
          onClick={() => { if (confirm("Clear all logged sessions?")) onResetAll(); }}
          style={{ ...dangerBtn(), marginTop: 16 }}
        >
          <RotateCcw size={16} style={{ marginRight: 8 }} /> Reset all data
        </button>
      )}
    </div>
  );
}
