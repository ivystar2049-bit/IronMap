import { isBodyweight, isTimed, weightStepFor } from "../data/exercises";

/* Seconds added by the time suggestion — matches the Time stepper's step, so
   tapping the chip and tapping + once are the same move. */
export const TIME_STEP = 5;

/* How many sessions of an exercise with no improvement before we say so. */
export const PLATEAU_SESSIONS = 3;

const round1 = (n) => +n.toFixed(1);
// 2.5 -> "2.5", 42.0 -> "42"
const fmt = (n) => String(round1(n));

/* Is `a` a better set than `b`? Heavier wins; at equal weight, more reps (or
   seconds) wins. Deliberately lexicographic rather than tonnage or an e1RM
   formula: those rate 40kg×12 above 60kg×5, which isn't how you'd choose the
   next working weight. */
export function isBetter(a, b) {
  if (!a) return false;
  if (!b) return true;
  if (a.w !== b.w) return a.w > b.w;
  return a.r > b.r;
}

/* The set to progress from. Not the *last* set — you fade across a session,
   so 40×10, 40×9, 40×8 should suggest building on the 10, not the 8. */
export function bestSet(sets) {
  if (!Array.isArray(sets) || !sets.length) return null;
  return sets.reduce((best, s) => (isBetter(s, best) ? s : best), null);
}

/* Newest first. Sessions are stored in insertion order, but editing a
   session's date in History doesn't move it, so array position can't be
   trusted — everything that means "most recent" has to sort by parsed date.
   `finished` breaks ties for two sessions logged the same day; unparseable
   dates sink to the end rather than throwing. */
export function sortSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  const ms = (v) => {
    const n = new Date(v).getTime();
    return Number.isFinite(n) ? n : -Infinity;
  };
  return [...sessions].sort(
    (a, b) => ms(b?.date) - ms(a?.date) || ms(b?.finished ?? b?.date) - ms(a?.finished ?? a?.date)
  );
}

/* Walks sessions newest-first, so it assumes `sortSessions` has been applied.
   Defensive about shape for the same reason volumesBetween is: stored data is
   never schema-validated on load and this runs during render. */
function eachEntry(exId, sessions, visit) {
  if (!Array.isArray(sessions)) return;
  for (const s of sessions) {
    if (!s || !Array.isArray(s.entries)) continue;
    const e = s.entries.find((x) => x?.exId === exId);
    if (e && Array.isArray(e.sets) && e.sets.length && visit(s, e) === false) return;
  }
}

/* The most recent session containing this exercise, with every set of it —
   the logger shows the lot so you can see whether you faded before deciding
   to add weight. */
export function lastSessionFor(exId, sessions) {
  let found = null;
  eachEntry(exId, sessions, (s, e) => {
    found = { date: s.date, sets: e.sets, best: bestSet(e.sets) };
    return false;
  });
  return found;
}

/* One-tap chips that pre-fill the steppers. Never auto-applied — the steppers
   seed from history exactly as they did before, and these only move them if
   tapped.

   Double progression: add reps until the top of the user's target range, then
   add weight and drop back to the bottom. `recommended` marks that next move;
   every other chip stays tappable, so the range is a nudge, not a rail. */
export function suggestionsFor(ex, best, repsTarget, customEquipment = []) {
  if (!ex || !best) return [];
  const bw = isBodyweight(ex);
  const step = weightStepFor(ex, customEquipment);
  const out = [{ id: "repeat", label: "Repeat", w: best.w, r: best.r }];

  /* Timed work has no equivalent of a rep range in settings, so time is
     always the recommended move and loaded carries just also offer weight. */
  if (isTimed(ex)) {
    out.push({ id: "time", label: `+${TIME_STEP}s`, w: best.w, r: best.r + TIME_STEP, recommended: true });
    if (!bw) out.push({ id: "weight", label: `+${fmt(step)}kg`, w: round1(best.w + step), r: best.r });
    return out;
  }

  // Bodyweight has no weight to add, so reps stay the move however high they get.
  const atTop = best.r >= repsTarget.high;
  out.push({ id: "rep", label: "+1 rep", w: best.w, r: best.r + 1, recommended: !atTop || bw });
  if (!bw) {
    const w = round1(best.w + step);
    out.push(
      atTop
        ? { id: "weight", label: `${fmt(w)}kg × ${repsTarget.low}`, w, r: repsTarget.low, recommended: true }
        : { id: "weight", label: `+${fmt(step)}kg`, w, r: best.r }
    );
  }
  return out;
}

/* Flags PLATEAU_SESSIONS sessions running where none beat the one before it.
   Informational only. Because "better" is weight-then-reps, the double
   progression move 40×12 -> 42.5×8 reads as an improvement, so following the
   app's own suggestion can never trip its plateau detector. */
export function plateauFor(exId, sessions, n = PLATEAU_SESSIONS) {
  const bests = [];
  eachEntry(exId, sessions, (_s, e) => {
    bests.push(bestSet(e.sets));
    return bests.length < n;
  });
  if (bests.length < n) return null;
  for (let i = 0; i < n - 1; i++) {
    if (isBetter(bests[i], bests[i + 1])) return null;
  }
  return { sessions: n };
}
