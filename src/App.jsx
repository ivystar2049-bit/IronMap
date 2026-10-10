import { useState, useEffect, useRef, useMemo } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { C, display, body } from "./lib/theme";
import { MUSCLES, EXERCISES } from "./data/exercises";
import { equipmentById } from "./data/equipment";
import { weeklyVolumes, volumesBetween, weeklyTrend, countWorkingSets, completion, suggestFor, WEEK_MS } from "./lib/volume";
import { REGIONS } from "./lib/muscleGroups";
import { storage } from "./lib/storage";
import { DEFAULT_SETTINGS, clampSettings } from "./lib/settings";
import { ownedSetFrom, filterAvailable } from "./lib/availability";
import { sortSessions, lastSessionFor, suggestionsFor, plateauFor } from "./lib/progression";
import { lastTrainedDays, coldMuscles } from "./lib/recommend";
import {
  SCHEMA_VERSION, migrateCustomExercises, seedEquipmentProfile,
  normaliseProfile, looksLikeExistingUser,
} from "./lib/migrate";
import LogScreen from "./components/LogScreen";
import BodyScreen from "./components/BodyScreen";
import HistoryScreen from "./components/HistoryScreen";
import BottomNav from "./components/BottomNav";
import ExercisePicker from "./components/ExercisePicker";
import SettingsPanel from "./components/SettingsPanel";
import ExerciseManager from "./components/ExerciseManager";
import EquipmentPanel from "./components/EquipmentPanel";
import EquipmentOnboarding from "./components/EquipmentOnboarding";

const sessionKey = (s) => s.finished || s.date;

export default function App() {
  const [tab, setTab] = useState("log");
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null); // {date, entries:[{exId, sets:[{w,r}]}]}
  const [sessionOpen, setSessionOpen] = useState(false); // viewing the live session vs the Home dashboard
  const [loaded, setLoaded] = useState(false);
  const [picker, setPicker] = useState(false);
  const [activeEx, setActiveEx] = useState(null); // exId being logged
  const [selMuscle, setSelMuscle] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null); // "gaps" | "muscle" | null
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [customExercises, setCustomExercises] = useState([]);
  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [equipment, setEquipment] = useState(null); // { owned:[], custom:[] } | null = not set up yet
  const [showEquipment, setShowEquipment] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [coldOpen, setColdOpen] = useState(true); // cold panel starts expanded; absent key = open

  // history browse/edit state
  const [historyKey, setHistoryKey] = useState(null); // which past session is open
  const [historyActiveEx, setHistoryActiveEx] = useState(null);
  const [historyPicker, setHistoryPicker] = useState(false);

  // load
  useEffect(() => {
    (async () => {
      let sessionsLoaded = null;
      let settingsLoaded = null;
      try {
        const s = await storage.get("ironmap:sessions");
        // Sorted on load too — stored arrays predate the sort in persistSessions.
        if (s) { sessionsLoaded = sortSessions(JSON.parse(s.value)); setSessions(sessionsLoaded); }
      } catch (e) { console.error("IronMap: failed to load sessions", e); }
      try {
        const c = await storage.get("ironmap:current");
        if (c) setCurrent(JSON.parse(c.value));
      } catch (e) { console.error("IronMap: failed to load current session", e); }
      try {
        const st = await storage.get("ironmap:settings");
        if (st) { settingsLoaded = JSON.parse(st.value); setSettings(clampSettings(settingsLoaded)); }
      } catch (e) { console.error("IronMap: failed to load settings", e); }
      let loadedCustoms = null;
      try {
        const ce = await storage.get("ironmap:customExercises");
        if (ce) loadedCustoms = JSON.parse(ce.value);
      } catch (e) { console.error("IronMap: failed to load custom exercises", e); }
      try {
        const cp = await storage.get("ironmap:coldPanel");
        if (cp) setColdOpen(JSON.parse(cp.value) !== false);
      } catch (e) { console.error("IronMap: failed to load cold panel state", e); }

      /* --- schema migration (v0 -> v1: equip string becomes equipment[]) ---
         Sessions are untouched: they only ever stored {exId, sets}, never
         equipment, so no logged history is at risk here. */
      let loadedEquipment = null;
      try {
        const eq = await storage.get("ironmap:equipment");
        if (eq) loadedEquipment = normaliseProfile(JSON.parse(eq.value));
      } catch (e) { console.error("IronMap: failed to load equipment profile", e); }

      let version = 0;
      try {
        const v = await storage.get("ironmap:schemaVersion");
        if (v) version = Number(JSON.parse(v.value)) || 0;
      } catch (e) { console.error("IronMap: failed to load schema version", e); }

      if (version < SCHEMA_VERSION) {
        const migratedCustoms = migrateCustomExercises(loadedCustoms);
        if (loadedCustoms) {
          loadedCustoms = migratedCustoms;
          try { await storage.set("ironmap:customExercises", JSON.stringify(migratedCustoms)); }
          catch (e) { console.error("IronMap: failed to save migrated custom exercises", e); }
        }
        /* Existing users get a profile seeded from the equipment the old
           built-in library implied, so nothing they could previously do
           disappears. A genuinely fresh install is left with no profile so
           onboarding shows instead. */
        if (!loadedEquipment) {
          const existing = looksLikeExistingUser({
            sessions: sessionsLoaded, customExercises: loadedCustoms, settings: settingsLoaded,
          });
          if (existing) {
            loadedEquipment = seedEquipmentProfile();
            try { await storage.set("ironmap:equipment", JSON.stringify(loadedEquipment)); }
            catch (e) { console.error("IronMap: failed to seed equipment profile", e); }
          }
        }
        try { await storage.set("ironmap:schemaVersion", JSON.stringify(SCHEMA_VERSION)); }
        catch (e) { console.error("IronMap: failed to save schema version", e); }
      }

      if (loadedCustoms) setCustomExercises(loadedCustoms);
      if (loadedEquipment) setEquipment(loadedEquipment);
      else setShowOnboarding(true);
      setLoaded(true);
    })();
  }, []);

  /* Sorted on the way in so "most recent" is true everywhere downstream:
     finishWorkout prepends, but editing a session's date in History doesn't
     move it, so insertion order drifts from chronology. Sorting at this one
     seam fixes lastSessionFor, the Home "Last session" line and the History
     list together. */
  const persistSessions = async (next) => {
    const sorted = sortSessions(next);
    setSessions(sorted);
    try { await storage.set("ironmap:sessions", JSON.stringify(sorted)); } catch (e) { console.error("IronMap: failed to save sessions", e); }
  };
  const persistCurrent = async (next) => {
    setCurrent(next);
    try {
      if (next) await storage.set("ironmap:current", JSON.stringify(next));
      else await storage.delete("ironmap:current");
    } catch (e) { console.error("IronMap: failed to save current session", e); }
  };
  const toggleColdPanel = async () => {
    const next = !coldOpen;
    setColdOpen(next);
    try { await storage.set("ironmap:coldPanel", JSON.stringify(next)); } catch (e) { console.error("IronMap: failed to save cold panel state", e); }
  };
  const persistSettings = async (next) => {
    setSettings(next);
    try { await storage.set("ironmap:settings", JSON.stringify(next)); } catch (e) { console.error("IronMap: failed to save settings", e); }
  };
  const persistCustomExercises = async (next) => {
    setCustomExercises(next);
    try { await storage.set("ironmap:customExercises", JSON.stringify(next)); } catch (e) { console.error("IronMap: failed to save custom exercises", e); }
  };
  const addCustomExercise = (ex) => persistCustomExercises([...customExercises, ex]);
  const deleteCustomExercise = (id) => persistCustomExercises(customExercises.filter((e) => e.id !== id));

  const persistEquipment = async (next) => {
    setEquipment(next);
    try { await storage.set("ironmap:equipment", JSON.stringify(next)); } catch (e) { console.error("IronMap: failed to save equipment", e); }
  };

  const allExercises = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);
  const allExById = useMemo(() => Object.fromEntries(allExercises.map((e) => [e.id, e])), [allExercises]);

  const customEquipment = equipment?.custom ?? [];
  const eqById = useMemo(() => equipmentById(customEquipment), [customEquipment]);
  const ownedSet = useMemo(() => ownedSetFrom(equipment), [equipment]);
  const gymMode = !!equipment?.gym;
  /* The home/gym switch only means something once a home kit exists —
     with no profile everything is already shown. */
  const showPlaceSwitch = gymMode || (equipment?.owned?.length ?? 0) > 0;
  const setGymMode = (gym) => persistEquipment({ ...(equipment ?? { owned: [], custom: [] }), gym });
  const exerciseCount = useMemo(() => filterAvailable(allExercises, ownedSet).length, [allExercises, ownedSet]);

  /* Dashboard derivations. Memoised because the 4-week trend re-scans every
     session five times over; recomputing that on every keystroke-level
     render (as the old single-line version did) is wasteful. */
  const weights = { primary: settings.primaryWeight, secondary: settings.secondaryWeight };
  const { vols, dashboard, cold } = useMemo(() => {
    const now = Date.now();
    const weekVols = weeklyVolumes(sessions, allExById, weights, now);
    const monthVols = volumesBetween(sessions, allExById, weights, now - 4 * WEEK_MS, now);
    const trend = weeklyTrend(sessions, allExById, weights, 4, now);
    const allMuscles = Object.keys(MUSCLES);

    // 4 weeks of training should hit 4x the weekly per-muscle target
    const weekTarget = settings.setsLow;
    const monthTarget = settings.setsLow * 4;

    const regionsFor = (v, target) =>
      REGIONS.map((r) => ({ ...r, pct: completion(v, r.muscles, target) }));

    /* One ranking drives both the session panel and Body > Gaps to close, so
       the two can never disagree about what's most neglected. */
    const cold = coldMuscles(weekVols, lastTrainedDays(sessions, allExById, now), weekTarget);

    return {
      vols: weekVols,
      cold,
      dashboard: {
        week: {
          workingSets: countWorkingSets(sessions, now - WEEK_MS, now),
          pct: completion(weekVols, allMuscles, weekTarget),
          regions: regionsFor(weekVols, weekTarget),
          onTarget: allMuscles.filter((m) => weekVols[m] >= weekTarget).length,
          total: allMuscles.length,
        },
        month: {
          workingSets: countWorkingSets(sessions, now - 4 * WEEK_MS, now),
          pct: completion(monthVols, allMuscles, monthTarget),
          regions: regionsFor(monthVols, monthTarget),
        },
        trend: trend.map((t) => ({ weeksAgo: t.weeksAgo, pct: completion(t.vols, allMuscles, weekTarget) })),
      },
    };
  }, [sessions, allExById, settings.primaryWeight, settings.secondaryWeight, settings.setsLow]);

  // ----- live workout actions -----
  const finishingRef = useRef(false);
  const startWorkout = () => {
    finishingRef.current = false;
    setSessionOpen(true);
    persistCurrent({ date: new Date().toISOString(), entries: [] });
  };
  const resumeWorkout = () => setSessionOpen(true);
  const saveDraft = () => { setActiveEx(null); setSessionOpen(false); };
  const cancelWorkout = () => {
    persistCurrent(null);
    setActiveEx(null);
    setSessionOpen(false);
  };

  const entryFor = (exId) => current?.entries.find((e) => e.exId === exId);

  const logSet = (exId, w, r) => {
    const exists = current.entries.some((x) => x.exId === exId);
    const entries = exists
      ? current.entries.map((e) => (e.exId === exId ? { ...e, sets: [...e.sets, { w, r }] } : e))
      : [...current.entries, { exId, sets: [{ w, r }] }];
    persistCurrent({ ...current, entries });
  };
  const undoSet = (exId) => {
    const entries = current.entries
      .map((e) => (e.exId === exId ? { ...e, sets: e.sets.slice(0, -1) } : e))
      .filter((e) => e.sets.length > 0);
    persistCurrent({ ...current, entries });
  };
  const deleteEntry = (exId) => {
    persistCurrent({ ...current, entries: current.entries.filter((e) => e.exId !== exId) });
    setActiveEx(null);
  };
  const moveEntry = (exId, direction) => {
    const idx = current.entries.findIndex((e) => e.exId === exId);
    const swapWith = idx + direction;
    if (idx < 0 || swapWith < 0 || swapWith >= current.entries.length) return;
    const entries = [...current.entries];
    [entries[idx], entries[swapWith]] = [entries[swapWith], entries[idx]];
    persistCurrent({ ...current, entries });
  };
  const finishWorkout = () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (current && current.entries.length) {
      persistSessions([{ ...current, finished: new Date().toISOString() }, ...sessions]);
    }
    persistCurrent(null);
    setActiveEx(null);
    setSessionOpen(false);
    setTab("body");
  };

  const lastSession = (exId) => lastSessionFor(exId, sessions);

  /* Everything the logger needs to offer overload chips. Only the live
     session gets these: in History you're editing a past workout, so
     "progress from last time" would compare against a *newer* session and
     suggest nonsense — SessionDetail deliberately shows the plain last-time
     line instead. */
  const progressionFor = (exId) => {
    const last = lastSession(exId);
    return {
      last,
      suggestions: suggestionsFor(
        allExById[exId], last?.best,
        { low: settings.repsLow, high: settings.repsHigh },
        customEquipment
      ),
      plateau: plateauFor(exId, sessions),
    };
  };

  // ----- history browse/edit actions -----
  const updateHistorySession = (updater) => {
    persistSessions(sessions.map((s) => (sessionKey(s) === historyKey ? updater(s) : s)));
  };
  const openHistorySession = (key) => setHistoryKey(key);
  const closeHistorySession = () => { setHistoryKey(null); setHistoryActiveEx(null); setHistoryPicker(false); };
  const updateHistoryDate = (ymd) => {
    updateHistorySession((s) => {
      const d = new Date(s.date);
      const [y, m, day] = ymd.split("-").map(Number);
      d.setFullYear(y, m - 1, day);
      return { ...s, date: d.toISOString() };
    });
  };
  const logHistorySet = (exId, w, r) => {
    updateHistorySession((s) => {
      const exists = s.entries.some((e) => e.exId === exId);
      const entries = exists
        ? s.entries.map((e) => (e.exId === exId ? { ...e, sets: [...e.sets, { w, r }] } : e))
        : [...s.entries, { exId, sets: [{ w, r }] }];
      return { ...s, entries };
    });
  };
  const undoHistorySet = (exId) => {
    updateHistorySession((s) => ({
      ...s,
      entries: s.entries.map((e) => (e.exId === exId ? { ...e, sets: e.sets.slice(0, -1) } : e)).filter((e) => e.sets.length > 0),
    }));
  };
  const deleteHistoryEntry = (exId) => {
    updateHistorySession((s) => ({ ...s, entries: s.entries.filter((e) => e.exId !== exId) }));
    setHistoryActiveEx(null);
  };
  const deleteHistorySession = (key) => {
    persistSessions(sessions.filter((s) => sessionKey(s) !== key));
    closeHistorySession();
  };

  if (!loaded) {
    return (
      <div style={{ background: C.bg, color: C.muted, minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: body }}>
        Loading…
      </div>
    );
  }

  /* Gaps to close is the same ranking as the session panel — under target,
     ordered by how cold. It lists every one of them, including muscles the
     user currently owns no kit for; the panel drops those, since it exists to
     be acted on. */
  const neglected = cold;

  /* Top few cold muscles that the user can actually do something about,
     paired with the exercises to do it. filterAvailable is the same rule the
     picker uses, so the panel can never name an exercise the picker hides. */
  const usableExercises = filterAvailable(allExercises, ownedSet);
  const coldRows = cold
    .map((c) => ({ ...c, exercises: suggestFor(c.m, usableExercises, 2) }))
    .filter((c) => c.exercises.length > 0)
    .slice(0, 6);

  const historySession = historyKey ? sessions.find((s) => sessionKey(s) === historyKey) : null;

  /* Tapping a region jumps to the Body screen with that region's weakest
     muscle selected, so the user lands on its "Do more of" suggestions. */
  const openRegion = (regionId) => {
    const region = REGIONS.find((r) => r.id === regionId);
    if (!region) return;
    const weakest = [...region.muscles].sort((a, b) => (vols[a] || 0) - (vols[b] || 0))[0];
    setSelMuscle(weakest);
    setTab("body");
    setFocusTarget("muscle");
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: body, color: C.text, position: "relative", overflow: "hidden" }}>
      {/* header */}
      <div className="flex items-center justify-between" style={{ padding: "16px 16px 4px" }}>
        <div style={{ fontFamily: display, fontSize: 30, letterSpacing: 1, fontWeight: 700 }}>
          IRON<span style={{ color: C.accent }}>MAP</span>
        </div>
        <div className="flex items-center" style={{ gap: 12 }}>
          {current && (
            <span style={{ color: C.accent, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontFamily: display }}>● Live session</span>
          )}
          <button onClick={() => setShowSettings(true)} aria-label="Settings"
            style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", padding: 4, display: "flex" }}>
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {tab === "log" && (
        <LogScreen
          current={current}
          sessionOpen={sessionOpen}
          activeEx={activeEx}
          sessions={sessions}
          dashboard={dashboard}
          exById={allExById}
          onStartWorkout={startWorkout}
          showPlaceSwitch={showPlaceSwitch}
          gymMode={gymMode}
          onSetGymMode={setGymMode}
          exerciseCount={exerciseCount}
          onResumeWorkout={resumeWorkout}
          onOpenExercise={setActiveEx}
          onOpenPicker={() => setPicker(true)}
          onFinishWorkout={finishWorkout}
          onCancelWorkout={cancelWorkout}
          onSaveDraft={saveDraft}
          entryFor={entryFor}
          progressionFor={progressionFor}
          onLog={logSet}
          onUndo={undoSet}
          onDeleteEntry={deleteEntry}
          onMoveEntry={moveEntry}
          onBackFromExercise={() => setActiveEx(null)}
          coldRows={coldRows}
          coldTarget={settings.setsLow}
          coldOpen={coldOpen}
          onToggleCold={toggleColdPanel}
          onGoToHistory={() => setTab("history")}
          onGoToGaps={() => { setTab("body"); setFocusTarget("gaps"); }}
          onOpenRegion={openRegion}
          repsTarget={{ low: settings.repsLow, high: settings.repsHigh }}
          eqById={eqById}
          customEquipment={customEquipment}
        />
      )}
      {tab === "body" && (
        <BodyScreen
          vols={vols}
          neglected={neglected}
          selMuscle={selMuscle}
          onPickMuscle={setSelMuscle}
          targets={{ low: settings.setsLow, high: settings.setsHigh }}
          exercises={allExercises}
          ownedSet={ownedSet}
          focusTarget={focusTarget}
          onFocusHandled={() => setFocusTarget(null)}
        />
      )}
      {tab === "history" && (
        <HistoryScreen
          sessions={sessions}
          exById={allExById}
          allExercises={allExercises}
          repsTarget={{ low: settings.repsLow, high: settings.repsHigh }}
          lastSession={lastSession}
          onResetAll={() => persistSessions([])}
          session={historySession}
          onSelectSession={openHistorySession}
          onCloseSession={closeHistorySession}
          onUpdateDate={updateHistoryDate}
          onDeleteSession={deleteHistorySession}
          activeEx={historyActiveEx}
          onOpenExercise={setHistoryActiveEx}
          onBackFromExercise={() => setHistoryActiveEx(null)}
          onLog={logHistorySet}
          onUndo={undoHistorySet}
          onDeleteEntry={deleteHistoryEntry}
          picker={historyPicker}
          onOpenPicker={() => setHistoryPicker(true)}
          onClosePicker={() => setHistoryPicker(false)}
          eqById={eqById}
          ownedSet={ownedSet}
          customEquipment={customEquipment}
        />
      )}

      <BottomNav tab={tab} onChange={(k) => { setTab(k); setActiveEx(null); }} />

      {picker && (
        <ExercisePicker
          exercises={allExercises}
          ownedSet={ownedSet}
          eqById={eqById}
          coldRows={coldRows}
          coldTarget={settings.setsLow}
          onClose={() => setPicker(false)}
          onPick={(exId) => { setPicker(false); setActiveEx(exId); }}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={persistSettings}
          onClose={() => setShowSettings(false)}
          customExerciseCount={customExercises.length}
          onOpenExerciseManager={() => { setShowSettings(false); setShowExerciseManager(true); }}
          ownedCount={ownedSet.size}
          onOpenEquipment={() => { setShowSettings(false); setShowEquipment(true); }}
        />
      )}

      {showExerciseManager && (
        <ExerciseManager
          customExercises={customExercises}
          onAdd={addCustomExercise}
          onDelete={deleteCustomExercise}
          onClose={() => setShowExerciseManager(false)}
          customEquipment={customEquipment}
          eqById={eqById}
        />
      )}

      {showEquipment && (
        <EquipmentPanel
          profile={equipment ?? { owned: [], custom: [] }}
          onChange={persistEquipment}
          onClose={() => setShowEquipment(false)}
        />
      )}

      {showOnboarding && (
        <EquipmentOnboarding
          onDone={(profile) => { persistEquipment(profile); setShowOnboarding(false); }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
