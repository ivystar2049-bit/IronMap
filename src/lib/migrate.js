import { LEGACY_EQUIP_MAP } from "../data/exercises";

/* First migration this app has ever had, so it also introduces the version
   marker. Runs once on load, before any state is set.

   Logged sessions are deliberately NOT touched: they only ever stored
   {exId, sets:[{w,r}]} and never carried equipment, so there is nothing in
   history to convert. The only stored data using the old `equip` string is
   ironmap:customExercises. */

export const SCHEMA_VERSION = 1;

/* Equipment implied by the pre-v1 built-in library (the 35 exercises that
   existed when everything was Cable / Barbell / Dumbbell / Bodyweight).
   Seeded for existing users so they keep exactly the availability they had.
   Deliberately excludes trap bar, sandbag and battle ropes — that's new kit
   nobody has been assumed to own. */
export const LEGACY_SEED_EQUIPMENT = [
  "cable_machine",
  "barbell",
  "squat_rack",
  "bench",
  "dumbbells",
  "pullup_bar",
];

/* A custom exercise saved by an older version, e.g.
   { equip: "Dumbbell", ... } -> { equipment: ["dumbbells"], load: "external", logType: "reps" } */
export function migrateCustomExercise(ex) {
  if (!ex || typeof ex !== "object") return ex;
  if (Array.isArray(ex.equipment)) return ex; // already migrated

  const mapped = LEGACY_EQUIP_MAP[ex.equip] ?? { equipment: [], load: "external" };
  const { equip, ...rest } = ex;
  return {
    ...rest,
    equipment: mapped.equipment,
    load: mapped.load,
    logType: ex.logType ?? "reps",
  };
}

export function migrateCustomExercises(list) {
  return Array.isArray(list) ? list.map(migrateCustomExercise) : [];
}

/* Whether this install has pre-existing data — i.e. someone who was already
   using the app, rather than a first run. Drives whether we seed a profile
   or leave it absent so onboarding shows. */
export function looksLikeExistingUser({ sessions, customExercises, settings }) {
  return (
    (Array.isArray(sessions) && sessions.length > 0) ||
    (Array.isArray(customExercises) && customExercises.length > 0) ||
    (settings != null)
  );
}

export function seedEquipmentProfile() {
  return { owned: [...LEGACY_SEED_EQUIPMENT], custom: [] };
}

/* Normalise whatever is in storage into a valid profile shape. */
export function normaliseProfile(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    gym: raw.gym === true,
    owned: Array.isArray(raw.owned) ? raw.owned.filter((x) => typeof x === "string") : [],
    custom: Array.isArray(raw.custom)
      ? raw.custom.filter((c) => c && typeof c.id === "string" && typeof c.label === "string")
      : [],
  };
}
