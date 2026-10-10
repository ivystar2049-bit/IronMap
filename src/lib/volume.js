import { MUSCLES } from "../data/exercises";
import { C } from "./theme";
import { hexLerp } from "./color";

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_WEIGHTS = { primary: 1.0, secondary: 0.5 };

/* Muscle-credit volume for sessions falling in [fromMs, toMs). Sessions are
   bucketed by parsing `date` rather than by array position — history date
   edits don't re-sort `sessions`, so index order can drift from chronology.
   The half-open upper bound is what keeps weekly buckets from overlapping. */
/* Defensive about shape: this runs inside a useMemo during render, outside
   any try/catch, so one malformed stored session would white-screen the
   whole app rather than degrading. Storage is never schema-validated on
   load, so treat anything unexpected as "contributes nothing". */
export function volumesBetween(sessions, exById, weights = DEFAULT_WEIGHTS, fromMs = -Infinity, toMs = Infinity) {
  const vol = {};
  Object.keys(MUSCLES).forEach((m) => (vol[m] = 0));
  if (!Array.isArray(sessions)) return vol;
  sessions.forEach((s) => {
    if (!s || !Array.isArray(s.entries)) return;
    const t = new Date(s.date).getTime();
    if (!Number.isFinite(t) || t < fromMs || t >= toMs) return;
    s.entries.forEach((entry) => {
      const ex = exById[entry?.exId];
      if (!ex || !Array.isArray(entry.sets)) return;
      const setCount = entry.sets.length;
      (ex.p ?? []).forEach((m) => { if (m in vol) vol[m] += setCount * weights.primary; });
      (ex.s ?? []).forEach((m) => { if (m in vol) vol[m] += setCount * weights.secondary; });
    });
  });
  return vol;
}

export function weeklyVolumes(sessions, exById, weights = DEFAULT_WEIGHTS, now = Date.now()) {
  return volumesBetween(sessions, exById, weights, now - WEEK_MS, now);
}

/* Per-week muscle volumes, oldest first. weeks[weeks.length - 1] is the
   current (in-progress) week. */
export function weeklyTrend(sessions, exById, weights = DEFAULT_WEIGHTS, weeks = 4, now = Date.now()) {
  return Array.from({ length: weeks }, (_, i) => {
    const weeksAgo = weeks - 1 - i;
    const to = now - weeksAgo * WEEK_MS;
    return { from: to - WEEK_MS, to, weeksAgo, vols: volumesBetween(sessions, exById, weights, to - WEEK_MS, to) };
  });
}

/* True count of working sets performed — one logged set counts once, unlike
   the muscle-credit sums above where a single set can credit several
   muscles at different weights. */
export function countWorkingSets(sessions, fromMs = -Infinity, toMs = Infinity) {
  let n = 0;
  sessions.forEach((s) => {
    const t = new Date(s.date).getTime();
    if (!Number.isFinite(t) || t < fromMs || t >= toMs) return;
    s.entries.forEach((entry) => (n += entry.sets.length));
  });
  return n;
}

/* How complete a set of muscles is against a per-muscle target, as 0..1.
   Each muscle is capped at 100% *before* averaging, so hammering one muscle
   can't mask four untrained ones in the same region. */
export function completion(vols, muscleKeys, target) {
  if (!muscleKeys.length || target <= 0) return 0;
  const total = muscleKeys.reduce((a, m) => a + Math.min((vols[m] || 0) / target, 1), 0);
  return total / muscleKeys.length;
}

/* Progress-vs-target rating. Amber sits near the target rather than
   halfway, so anything well short of target reads progressively redder. */
export function ragColor(pct) {
  const p = Math.max(0, Math.min(1, pct));
  return p < 0.75
    ? hexLerp(C.rag.red, C.rag.amber, p / 0.75)
    : hexLerp(C.rag.amber, C.rag.green, (p - 0.75) / 0.25);
}

export function ragLabel(pct) {
  if (pct >= 1) return "On target";
  if (pct >= 0.75) return "Near target";
  if (pct > 0) return "Building";
  return "Untrained";
}

// thermal scale: cold steel -> amber -> orange -> red
export function heat(v) {
  if (!v || v <= 0) return C.cold;
  const stops = [
    [0.01, "#3B4658"],
    [4, "#7C5A2C"],
    [8, "#B4791A"],
    [12, "#F59E0B"],
    [16, "#F97316"],
    [22, "#EF4444"],
    [30, "#DC2626"],
  ];
  if (v >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [v0, c0] = stops[i], [v1, c1] = stops[i + 1];
    if (v >= v0 && v <= v1) return hexLerp(c0, c1, (v - v0) / (v1 - v0));
  }
  return C.cold;
}

export function status(v, low, high) {
  if (v < low) return { label: "Under", color: C.muted };
  if (v <= high) return { label: "On target", color: C.good };
  return { label: "High", color: C.accent };
}

/* Exercises that train a muscle, best first. Returns objects rather than the
   names it used to: the cold panel makes these tappable, which needs the id.
   Primary movers rank ahead of exercises that only hit it as a secondary, so
   a short list stays useful — but secondaries are included, because seven
   muscles have exactly one primary exercise in the default kit and fewer
   still on a narrow equipment profile. */
export function suggestFor(muscle, exercises, count = 2) {
  const rank = (e) => (e.p?.includes(muscle) ? 0 : e.s?.includes(muscle) ? 1 : 2);
  return exercises
    .map((e) => ({ e, r: rank(e) }))
    .filter((x) => x.r < 2)
    .sort((a, b) => a.r - b.r)   // stable, so library order breaks ties
    .slice(0, count)
    .map((x) => ({ id: x.e.id, name: x.e.name }));
}
