/* ============================================================
   Exercise library + muscle map — edit this file to tune the
   app to your own kit. p = primary muscle credit (1.0 set),
   s = secondary muscle credit (0.5 set).

   Each exercise carries three separate concerns that used to be
   conflated into one `equip` string:

     equipment  ids from data/equipment.js; the user must own EVERY
                one for the exercise to be available to them.
                [] means it needs nothing at all (e.g. Plank).
     load       "external" | "bodyweight" — whether there's a weight
                to log. Independent of equipment: a Pull-Up needs a
                bar but carries no external load.
     logType    "reps" | "time" — carries and holds are logged in
                seconds. Volume counts them as working sets either
                way, since credit is per set, not per rep.
     secs       default duration for logType "time" (optional).
   ============================================================ */

import { EQUIPMENT, DEFAULT_WEIGHT_STEP } from "./equipment";
import { GYM_EXERCISES } from "./exercisesGym";

// Canonical muscle groups
export const MUSCLES = {
  chest:       "Chest",
  front_delts: "Front delts",
  side_delts:  "Side delts",
  rear_delts:  "Rear delts",
  traps:       "Traps",
  biceps:      "Biceps",
  triceps:     "Triceps",
  forearms:    "Forearms",
  abs:         "Abs",
  obliques:    "Obliques",
  upper_back:  "Upper back",
  lats:        "Lats",
  mid_back:    "Mid back",
  lower_back:  "Lower back",
  quads:       "Quads",
  hamstrings:  "Hamstrings",
  glutes:      "Glutes",
  calves:      "Calves",
};

/* Maps the pre-v1 single `equip` string onto equipment ids, for migrating
   custom exercises saved by older versions. See lib/migrate.js. */
export const LEGACY_EQUIP_MAP = {
  Cable:      { equipment: ["cable_machine"], load: "external" },
  Barbell:    { equipment: ["barbell"],       load: "external" },
  Dumbbell:   { equipment: ["dumbbells"],     load: "external" },
  Bodyweight: { equipment: [],                load: "bodyweight" },
};

export const DEFAULT_SECS = 30;

export const EXERCISES = [
  // Cable / functional trainer
  { id: "cable_row", name: "Seated Cable Row", equipment: ["cable_machine"], load: "external", logType: "reps", w: 35, p: ["lats", "mid_back"], s: ["biceps", "rear_delts"] },
  { id: "lat_pulldown", name: "Lat Pulldown", equipment: ["cable_machine"], load: "external", logType: "reps", w: 40, p: ["lats"], s: ["biceps", "mid_back"] },
  { id: "cable_fly", name: "Cable Chest Fly", equipment: ["cable_machine"], load: "external", logType: "reps", w: 15, p: ["chest"], s: ["front_delts"] },
  { id: "cable_press", name: "Cable Chest Press", equipment: ["cable_machine"], load: "external", logType: "reps", w: 25, p: ["chest"], s: ["front_delts", "triceps"] },
  { id: "pushdown", name: "Triceps Pushdown", equipment: ["cable_machine"], load: "external", logType: "reps", w: 25, p: ["triceps"], s: [] },
  { id: "cable_curl", name: "Cable Biceps Curl", equipment: ["cable_machine"], load: "external", logType: "reps", w: 20, p: ["biceps"], s: ["forearms"] },
  { id: "face_pull", name: "Face Pull", equipment: ["cable_machine"], load: "external", logType: "reps", w: 20, p: ["rear_delts", "upper_back"], s: ["mid_back"] },
  { id: "cable_lat_raise", name: "Cable Lateral Raise", equipment: ["cable_machine"], load: "external", logType: "reps", w: 7, p: ["side_delts"], s: [] },
  { id: "pallof", name: "Pallof Press", equipment: ["cable_machine"], load: "external", logType: "reps", w: 15, p: ["obliques"], s: ["abs"] },
  { id: "woodchop", name: "Cable Woodchop", equipment: ["cable_machine"], load: "external", logType: "reps", w: 15, p: ["obliques"], s: ["abs"] },
  { id: "cable_crunch", name: "Cable Crunch", equipment: ["cable_machine"], load: "external", logType: "reps", w: 30, p: ["abs"], s: [] },
  { id: "cable_pull_through", name: "Cable Pull-Through", equipment: ["cable_machine"], load: "external", logType: "reps", w: 30, p: ["glutes"], s: ["hamstrings"] },

  // Barbell
  { id: "back_squat", name: "Back Squat", equipment: ["barbell", "squat_rack"], load: "external", logType: "reps", w: 60, p: ["quads", "glutes"], s: ["hamstrings", "lower_back"] },
  { id: "rdl", name: "Romanian Deadlift", equipment: ["barbell"], load: "external", logType: "reps", w: 60, p: ["hamstrings", "glutes"], s: ["lower_back"] },
  { id: "deadlift", name: "Deadlift", equipment: ["barbell"], load: "external", logType: "reps", w: 80, p: ["glutes", "hamstrings", "lower_back"], s: ["mid_back", "quads"] },
  { id: "bench", name: "Bench Press", equipment: ["barbell", "bench"], load: "external", logType: "reps", w: 50, p: ["chest"], s: ["front_delts", "triceps"] },
  { id: "ohp", name: "Overhead Press", equipment: ["barbell"], load: "external", logType: "reps", w: 35, p: ["front_delts"], s: ["side_delts", "triceps"] },
  { id: "bb_row", name: "Barbell Row", equipment: ["barbell"], load: "external", logType: "reps", w: 50, p: ["mid_back", "lats"], s: ["biceps", "rear_delts"] },
  { id: "bb_shrug", name: "Barbell Shrug", equipment: ["barbell"], load: "external", logType: "reps", w: 60, p: ["traps"], s: [] },
  { id: "hip_thrust", name: "Hip Thrust", equipment: ["barbell", "bench"], load: "external", logType: "reps", w: 70, p: ["glutes"], s: ["hamstrings"] },

  // Dumbbell
  { id: "db_bench", name: "DB Bench Press", equipment: ["dumbbells", "bench"], load: "external", logType: "reps", w: 22, p: ["chest"], s: ["front_delts", "triceps"] },
  { id: "db_ohp", name: "DB Shoulder Press", equipment: ["dumbbells"], load: "external", logType: "reps", w: 18, p: ["front_delts"], s: ["side_delts", "triceps"] },
  { id: "db_row", name: "DB Row", equipment: ["dumbbells", "bench"], load: "external", logType: "reps", w: 24, p: ["lats", "mid_back"], s: ["biceps"] },
  { id: "db_rdl", name: "DB Romanian Deadlift", equipment: ["dumbbells"], load: "external", logType: "reps", w: 24, p: ["hamstrings", "glutes"], s: ["lower_back"] },
  { id: "db_lunge", name: "DB Walking Lunge", equipment: ["dumbbells"], load: "external", logType: "reps", w: 20, p: ["quads", "glutes"], s: ["hamstrings"] },
  { id: "db_split_squat", name: "DB Bulgarian Split Squat", equipment: ["dumbbells", "bench"], load: "external", logType: "reps", w: 20, p: ["quads", "glutes"], s: ["hamstrings"] },
  { id: "db_lat_raise", name: "DB Lateral Raise", equipment: ["dumbbells"], load: "external", logType: "reps", w: 10, p: ["side_delts"], s: [] },
  { id: "db_curl", name: "DB Biceps Curl", equipment: ["dumbbells"], load: "external", logType: "reps", w: 16, p: ["biceps"], s: ["forearms"] },
  { id: "db_wrist_curl", name: "DB Wrist Curl", equipment: ["dumbbells"], load: "external", logType: "reps", w: 10, p: ["forearms"], s: [] },
  { id: "db_calf", name: "DB Calf Raise", equipment: ["dumbbells"], load: "external", logType: "reps", w: 24, p: ["calves"], s: [] },

  // Trap bar
  { id: "trap_deadlift", name: "Trap Bar Deadlift", equipment: ["trap_bar"], load: "external", logType: "reps", w: 60, p: ["quads", "glutes"], s: ["hamstrings", "lower_back", "traps", "forearms"] },
  { id: "trap_carry", name: "Trap Bar Farmer's Carry", equipment: ["trap_bar"], load: "external", logType: "time", w: 40, secs: 40, p: ["forearms", "traps"], s: ["obliques", "abs", "upper_back"] },
  { id: "trap_split_squat", name: "Trap Bar Split Squat", equipment: ["trap_bar"], load: "external", logType: "reps", w: 30, p: ["quads", "glutes"], s: ["hamstrings"] },

  // Sandbag
  { id: "sandbag_carry", name: "Sandbag Carry", equipment: ["sandbag"], load: "external", logType: "time", w: 20, secs: 40, p: ["forearms", "traps"], s: ["abs", "obliques", "upper_back"] },
  { id: "sandbag_s2s", name: "Sandbag Shoulder-to-Shoulder", equipment: ["sandbag"], load: "external", logType: "reps", w: 20, p: ["front_delts"], s: ["obliques", "abs", "traps"] },
  { id: "sandbag_clean_press", name: "Sandbag Clean & Press", equipment: ["sandbag"], load: "external", logType: "reps", w: 20, p: ["front_delts", "quads"], s: ["glutes", "traps", "triceps", "lower_back"] },

  // Battle ropes
  { id: "rope_alt_waves", name: "Battle Rope Alternating Waves", equipment: ["battle_ropes"], load: "bodyweight", logType: "time", w: 0, secs: 30, p: ["front_delts"], s: ["side_delts", "biceps", "forearms", "abs"] },
  { id: "rope_double_waves", name: "Battle Rope Double Waves", equipment: ["battle_ropes"], load: "bodyweight", logType: "time", w: 0, secs: 30, p: ["front_delts", "upper_back"], s: ["abs", "forearms", "biceps"] },

  // Bodyweight
  { id: "pull_up", name: "Pull-Up", equipment: ["pullup_bar"], load: "bodyweight", logType: "reps", w: 0, p: ["lats"], s: ["biceps", "mid_back"] },
  { id: "pull_up_wide", name: "Wide-Grip Pull-Up", equipment: ["pullup_bar"], load: "bodyweight", logType: "reps", w: 0, p: ["lats"], s: ["rear_delts", "mid_back"] },
  { id: "pull_up_neutral", name: "Neutral-Grip Pull-Up", equipment: ["pullup_bar"], load: "bodyweight", logType: "reps", w: 0, p: ["lats", "biceps"], s: ["forearms", "mid_back"] },
  { id: "step_up", name: "Bench Step-Up", equipment: ["bench"], load: "bodyweight", logType: "reps", w: 0, p: ["quads", "glutes"], s: ["hamstrings"] },
  { id: "plank", name: "Plank", equipment: [], load: "bodyweight", logType: "time", w: 0, secs: 45, p: ["abs"], s: ["obliques"] },

  ...GYM_EXERCISES,
];

/* Smallest increment the weight stepper should move for this exercise: the
   finest step among the kit it uses, since that's the limiting factor. A DB
   bench press needs dumbbells and a bench, and the dumbbells are what you
   actually load, so it inherits their 0.5kg. */
const STEP_BY_EQUIPMENT_ID = Object.fromEntries(
  EQUIPMENT.filter((e) => e.step != null).map((e) => [e.id, e.step])
);

export function weightStepFor(ex, customEquipment = []) {
  const custom = Object.fromEntries(
    customEquipment.filter((e) => e.step != null).map((e) => [e.id, e.step])
  );
  const steps = (ex?.equipment ?? [])
    .map((id) => custom[id] ?? STEP_BY_EQUIPMENT_ID[id])
    .filter((s) => s != null);
  return steps.length ? Math.min(...steps) : DEFAULT_WEIGHT_STEP;
}

export const isBodyweight = (ex) => ex?.load === "bodyweight";
export const isTimed = (ex) => ex?.logType === "time";
export const defaultSecsFor = (ex) => ex?.secs ?? DEFAULT_SECS;
