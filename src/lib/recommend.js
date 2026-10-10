import { MUSCLES } from "../data/exercises";

/* Days after which a muscle counts as fully stale. Matches the 7-day window
   the weekly volumes and the body map already use, so "cold" means the same
   span of time everywhere in the app. */
export const COLD_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/* Days since each muscle was last trained, Infinity for never. One pass over
   sessions for all 18 muscles rather than 18 passes, and it can stop early
   because sortSessions (lib/progression.js) guarantees newest-first order.

   A muscle counts as trained whether it was primary or secondary — the same
   basis volume credits on. Defensive about shape for the same reason
   volumesBetween is: stored data is never schema-validated and this runs
   during render. */
export function lastTrainedDays(sessions, exById, now = Date.now()) {
  const out = {};
  const keys = Object.keys(MUSCLES);
  keys.forEach((m) => (out[m] = Infinity));
  if (!Array.isArray(sessions)) return out;

  let remaining = keys.length;
  for (const s of sessions) {
    if (!remaining) break;
    if (!s || !Array.isArray(s.entries)) continue;
    const t = new Date(s.date).getTime();
    if (!Number.isFinite(t)) continue;
    const days = Math.max(0, (now - t) / DAY_MS);
    for (const entry of s.entries) {
      const ex = exById[entry?.exId];
      if (!ex || !Array.isArray(entry.sets) || !entry.sets.length) continue;
      for (const m of [...(ex.p ?? []), ...(ex.s ?? [])]) {
        if (out[m] === Infinity) { out[m] = days; remaining--; }
      }
    }
  }
  return out;
}

/* How cold a muscle is, 0..1.

   deficit   = how far under the weekly target (0 at target, 1 untouched)
   staleness = how long since it was trained (0 today, 1 at a week or never)

   Multiplying by deficit is what encodes the brief's *and*: a muscle at
   target scores 0 however long ago you trained it. The 0.5 floor is why this
   isn't a pure product — one set logged this morning shouldn't make a muscle
   sitting at 1/10 look warm. Recency modulates the deficit, it can't
   override it. */
export function coldScore(vol, days, target) {
  if (!(target > 0)) return 0;
  const deficit = 1 - Math.min((vol || 0) / target, 1);
  const staleness = Math.min((days ?? Infinity) / COLD_DAYS, 1);
  return deficit * (0.5 + 0.5 * staleness);
}

/* Longest-ago first, Infinity (never) ahead of everything. Subtraction would
   give NaN for Infinity - Infinity and corrupt the sort, so compare instead. */
const byDaysDesc = (a, b) => (a.days === b.days ? 0 : a.days > b.days ? -1 : 1);

/* Coldest muscles first. Only ever returns muscles under target, since
   score > 0 requires a deficit.

   Scores tie often on a sparse history — staleness saturates at COLD_DAYS, so
   "nine days ago" and "never" both score maximum. Raw days-since breaks those
   ties with the one piece of information the score threw away, and volume then
   muscle key make it fully deterministic, so the order never jitters between
   renders. */
export function coldMuscles(vols, lastDays, target, limit = Infinity) {
  return Object.keys(MUSCLES)
    .map((m) => {
      const v = vols?.[m] ?? 0;
      const days = lastDays?.[m] ?? Infinity;
      return { m, v, days, score: coldScore(v, days, target) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || byDaysDesc(a, b) || a.v - b.v || a.m.localeCompare(b.m))
    .slice(0, limit);
}

/* "12 days ago" / "never". Whole days, because nothing here is precise enough
   to justify hours. */
export function lastTrainedLabel(days) {
  if (!Number.isFinite(days)) return "never trained";
  const d = Math.floor(days);
  if (d === 0) return "trained today";
  if (d === 1) return "trained yesterday";
  return `trained ${d} days ago`;
}
