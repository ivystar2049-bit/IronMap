import { useState } from "react";
import { Dumbbell, Plus, Check, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Save, X, PlayCircle, TrendingUp, Home, Building2 } from "lucide-react";
import { C, display, body, NAV_H } from "../lib/theme";
import StatCard from "./StatCard";
import ExerciseLogger from "./ExerciseLogger";
import RegionRow from "./RegionRow";
import ColdPanel from "./ColdPanel";
import TrendBars from "./TrendBars";
import { ragColor } from "../lib/volume";
import { card, bigBtn, dangerBtn } from "../lib/styleHelpers";

function SectionHeader({ children, right }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: display, fontSize: 15, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{children}</span>
      {right}
    </div>
  );
}

export default function LogScreen({
  current, sessionOpen, activeEx, sessions, dashboard, exById,
  onStartWorkout, onResumeWorkout, onOpenExercise, onOpenPicker, onFinishWorkout,
  onCancelWorkout, onSaveDraft,
  entryFor, progressionFor, onLog, onUndo, onDeleteEntry, onMoveEntry, onBackFromExercise,
  onGoToHistory, onGoToGaps, onOpenRegion, repsTarget, eqById, customEquipment,
  coldRows, coldTarget, coldOpen, onToggleCold,
  showPlaceSwitch, gymMode, onSetGymMode, exerciseCount,
}) {
  const [reordering, setReordering] = useState(false);
  const showingSession = current && sessionOpen;
  const { week, month, trend } = dashboard;

  /* The logger pins its own action bar and owns its bottom spacing, so the
     screen's usual nav clearance would just stack dead scroll beneath it. */
  const inLogger = showingSession && activeEx;
  /* The session view (Add exercise / Save / Cancel / Finish) pins its own
     action bar too, for the same reason: with a tall Coldest right now panel
     open, those buttons could otherwise end up below the fold, unreachable
     without scrolling the whole page past the panel. */
  const inSessionView = showingSession && !activeEx;
  const SESSION_BAR_H = 236;
  return (
    <div style={{ padding: 16, paddingBottom: inLogger ? 0 : inSessionView ? SESSION_BAR_H + NAV_H : 96 }}>
      {!showingSession ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <SectionHeader
              right={
                <span style={{ fontFamily: display, fontSize: 20, color: ragColor(week.pct) }}>
                  {Math.round(week.pct * 100)}%
                </span>
              }
            >
              Last 7 days
            </SectionHeader>
            <div className="flex" style={{ gap: 12 }}>
              <StatCard big={week.workingSets} label="working sets" onClick={onGoToHistory} />
              <StatCard
                big={week.onTarget}
                sub={`/ ${week.total}`}
                label="muscles on target"
                tone={ragColor(week.onTarget / week.total)}
                onClick={onGoToGaps}
              />
            </div>
          </div>

          {current ? (
            <>
              <button onClick={onResumeWorkout} style={bigBtn(C.accent)}>
                <PlayCircle size={22} style={{ marginRight: 10 }} /> Resume workout
              </button>
              <div style={{ marginTop: 10, color: C.muted, fontSize: 13, fontFamily: body, textAlign: "center" }}>
                Draft in progress · {current.entries.length} exercise{current.entries.length === 1 ? "" : "s"} · {current.entries.reduce((a, e) => a + e.sets.length, 0)} sets
              </div>
            </>
          ) : (
            <>
              {showPlaceSwitch && (
                <div style={{ marginBottom: 12 }}>
                  <div className="flex" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 4, gap: 4 }}>
                    {[{ gym: false, label: "At home", Icon: Home }, { gym: true, label: "At the gym", Icon: Building2 }].map(({ gym, label, Icon }) => {
                      const on = gymMode === gym;
                      return (
                        <button key={label} onClick={() => onSetGymMode(gym)} aria-pressed={on}
                          className="flex items-center justify-center"
                          style={{ flex: 1, gap: 6, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: body, fontSize: 14, fontWeight: 600,
                            background: on ? C.accent : "transparent", color: on ? "#14171C" : C.muted }}>
                          <Icon size={16} /> {label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 6, color: C.muted, fontSize: 12, fontFamily: body, textAlign: "center" }}>
                    {exerciseCount} exercises available{gymMode ? " (everything)" : " (your home kit)"}
                  </div>
                </div>
              )}
              <button onClick={onStartWorkout} style={bigBtn(C.accent)}>
                <Dumbbell size={22} style={{ marginRight: 10 }} /> Start workout
              </button>
            </>
          )}
          {sessions[0] && (
            <div style={{ marginTop: 12, color: C.muted, fontSize: 13, fontFamily: body, textAlign: "center" }}>
              Last session: {new Date(sessions[0].date).toLocaleDateString()} · {sessions[0].entries.reduce((a, e) => a + e.sets.length, 0)} sets
            </div>
          )}

          <div style={{ ...card(), marginTop: 22, cursor: "default" }}>
            <SectionHeader>By region · last 7 days</SectionHeader>
            {week.regions.map((r) => (
              <RegionRow key={r.id} label={r.label} pct={r.pct} onClick={() => onOpenRegion(r.id)} />
            ))}
          </div>

          <div style={{ ...card(), marginTop: 14, cursor: "default" }}>
            <SectionHeader
              right={
                <span style={{ fontFamily: display, fontSize: 20, color: ragColor(month.pct) }}>
                  {Math.round(month.pct * 100)}%
                </span>
              }
            >
              <TrendingUp size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
              Last 4 weeks
            </SectionHeader>
            <div style={{ margin: "4px 0 16px" }}>
              <TrendBars weeks={trend} />
            </div>
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
              {month.regions.map((r) => (
                <RegionRow key={r.id} label={r.label} pct={r.pct} compact onClick={() => onOpenRegion(r.id)} />
              ))}
            </div>
          </div>
        </>
      ) : activeEx ? (
        <ExerciseLogger
          ex={exById[activeEx]}
          entry={entryFor(activeEx)}
          {...progressionFor(activeEx)}
          onLog={(w, r) => onLog(activeEx, w, r)}
          onUndo={() => onUndo(activeEx)}
          onDelete={() => onDeleteEntry(activeEx)}
          onBack={onBackFromExercise}
          onSaveAndNext={onOpenPicker}
          onSaveAndFinish={onFinishWorkout}
          repsTarget={repsTarget}
          customEquipment={customEquipment}
        />
      ) : (
        <>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: display, fontSize: 26, color: C.text, textTransform: "uppercase", letterSpacing: 1 }}>Session</div>
            <div className="flex items-center" style={{ gap: 12 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>{current.entries.reduce((a, e) => a + e.sets.length, 0)} sets</span>
              {current.entries.length > 1 && (
                <button onClick={() => setReordering((r) => !r)}
                  className="flex items-center" style={{ gap: 4, background: reordering ? C.accentDim : C.raised, border: "none", borderRadius: 999, padding: "5px 10px", color: reordering ? C.accent : C.muted, fontSize: 12, cursor: "pointer" }}>
                  <ArrowUpDown size={12} /> {reordering ? "Done" : "Reorder"}
                </button>
              )}
            </div>
          </div>
          {current.entries.length === 0 && (
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 14, fontFamily: body }}>Empty session. Add your first exercise below.</div>
          )}
          {current.entries.map((e, i) => {
            const ex = exById[e.exId];
            if (!ex) return null;
            if (reordering) {
              return (
                <div key={e.exId} style={card()} className="flex items-center justify-between">
                  <div>
                    <div style={{ fontFamily: display, fontSize: 20, color: C.text }}>{ex.name}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{e.sets.map((s) => `${s.w > 0 ? s.w + "kg×" : ""}${s.r}`).join("  ·  ")}</div>
                  </div>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <button onClick={() => onMoveEntry(e.exId, -1)} disabled={i === 0}
                      style={{ background: C.raised, border: "none", borderRadius: 8, width: 32, height: 32, color: i === 0 ? C.line : C.text, cursor: i === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronUp size={18} />
                    </button>
                    <button onClick={() => onMoveEntry(e.exId, 1)} disabled={i === current.entries.length - 1}
                      style={{ background: C.raised, border: "none", borderRadius: 8, width: 32, height: 32, color: i === current.entries.length - 1 ? C.line : C.text, cursor: i === current.entries.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronDown size={18} />
                    </button>
                  </div>
                </div>
              );
            }
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
          {/* Suggestions only — never in the way of starting or running a
              session. Everything below still works untouched if it's ignored. */}
          <ColdPanel
            rows={coldRows}
            target={coldTarget}
            open={coldOpen}
            onToggle={onToggleCold}
            onOpenExercise={onOpenExercise}
          />

          {/* Pinned above the tab bar, same as the exercise logger's Log set
              bar — otherwise a long session or an expanded Coldest right now
              panel pushes these below the fold. */}
          <div style={{
            position: "fixed", left: 0, right: 0,
            bottom: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
            background: C.bg, borderTop: `1px solid ${C.line}`,
            padding: "10px 16px 12px",
          }}>
            <button onClick={onOpenPicker} style={bigBtn(C.raised, C.text)}>
              <Plus size={20} style={{ marginRight: 8 }} /> Add exercise
            </button>

            <div className="flex" style={{ gap: 10, marginTop: 12 }}>
              <button onClick={onSaveDraft} style={{ ...bigBtn(C.raised, C.text), flex: 1, fontSize: 14 }}>
                <Save size={16} style={{ marginRight: 6 }} /> Save as draft
              </button>
              <button
                onClick={() => { if (confirm("Discard this workout? All logged sets will be lost.")) onCancelWorkout(); }}
                style={{ ...dangerBtn(14), flex: 1 }}
              >
                <X size={16} style={{ marginRight: 6 }} /> Cancel
              </button>
            </div>

            <button onClick={onFinishWorkout} style={{ ...bigBtn("transparent", C.accent), border: `1.5px solid ${C.accent}`, marginTop: 10 }}>
              <Check size={20} style={{ marginRight: 8 }} /> Finish workout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
