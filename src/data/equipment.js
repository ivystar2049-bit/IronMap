/* ============================================================
   Equipment master list — edit this to add kit to the built-in
   catalogue. Users can also add their own equipment at runtime
   (stored in localStorage under ironmap:equipment), and custom
   entries behave identically to these everywhere.
   ============================================================ */

/* Groups organise the settings checklist AND drive the exercise picker's
   filter chips and colours. Keeping it to a handful of groups means that
   chip row stays a fixed, scannable length however much kit someone owns.
   Colours moved here from the old categoryColors.js, which was keyed by
   the four legacy `equip` strings. */
export const EQUIPMENT_GROUPS = [
  { id: "free_weights", label: "Free weights",              color: "#34D399" },
  { id: "machines",     label: "Cable & machines",          color: "#3B82F6" },
  { id: "bars",         label: "Bars",                      color: "#A78BFA" },
  { id: "conditioning", label: "Bodyweight & conditioning", color: "#F472B6" },
];

export const GROUP_BY_ID = Object.fromEntries(EQUIPMENT_GROUPS.map((g) => [g.id, g]));

/* `step` is the smallest weight increment that piece of kit allows, in kg.
   Omit it to inherit DEFAULT_WEIGHT_STEP. Adjustable dumbbells go in 0.5kg;
   a barbell's smallest jump is a pair of 1.25kg plates. */
export const DEFAULT_WEIGHT_STEP = 2.5;

export const EQUIPMENT = [
  // Free weights
  { id: "dumbbells",     label: "Dumbbells",     group: "free_weights", step: 0.5 },
  { id: "barbell",       label: "Barbell",       group: "free_weights" },
  { id: "bench",         label: "Bench",         group: "free_weights" },
  { id: "squat_rack",    label: "Squat rack",    group: "free_weights" },
  { id: "kettlebell",    label: "Kettlebell",    group: "free_weights", step: 2 },
  { id: "sandbag",       label: "Sandbag",       group: "free_weights", step: 2.5 },
  { id: "medicine_ball", label: "Medicine ball", group: "free_weights", step: 2 },

  // Cable & machines
  { id: "cable_machine", label: "Cable machine", group: "machines" },
  { id: "gym_machines",  label: "Selectorized / plate-loaded machines", group: "machines" },
  { id: "smith_machine", label: "Smith machine", group: "machines" },

  // Bars
  { id: "trap_bar",      label: "Trap bar",      group: "bars" },
  { id: "ez_bar",        label: "EZ bar",        group: "bars" },
  { id: "pullup_bar",    label: "Pull-up bar",   group: "bars" },
  { id: "safety_bar",    label: "Safety squat bar", group: "bars" },
  { id: "landmine",      label: "Landmine",      group: "bars" },
  { id: "dip_station",   label: "Dip / captain's chair station", group: "bars" },
  { id: "back_extension", label: "Back extension / GHD bench", group: "bars" },

  // Bodyweight & conditioning
  { id: "battle_ropes",  label: "Battle ropes",  group: "conditioning" },
  { id: "plyo_box",      label: "Plyo box",      group: "conditioning" },
  { id: "ab_wheel",      label: "Ab wheel",      group: "conditioning" },
  { id: "resistance_band", label: "Resistance band", group: "conditioning" },
];

/* Combine the built-in catalogue with the user's own additions. Custom
   equipment is stored as { id, label, group } and is indistinguishable
   from built-in kit downstream. */
export function allEquipment(customEquipment = []) {
  return [...EQUIPMENT, ...customEquipment];
}

export function equipmentById(customEquipment = []) {
  return Object.fromEntries(allEquipment(customEquipment).map((e) => [e.id, e]));
}

/* Exercises store equipment ids; these turn them into something showable. */
export function equipmentLabel(id, byId) {
  return byId[id]?.label ?? id;
}

/* An exercise's display group — used for its colour and which picker chip
   it falls under. Taken from its first tag, since that's the defining piece
   of kit (a DB bench press is a free-weight move that happens to need a
   bench). Exercises needing nothing at all (e.g. Plank) read as
   conditioning rather than falling through to grey. */
export function groupForExercise(ex, byId) {
  const first = ex.equipment?.[0];
  return (first && byId[first]?.group) || "conditioning";
}

/* The picker's filter chips. Finer than EQUIPMENT_GROUPS (which also drive
   the settings checklist and colours) because a commercial gym's ~300
   exercises need more than four buckets to scan. An exercise lands in the
   bucket of its first tag, same rule as groupForExercise; the picker only
   shows buckets that currently contain something, so a home-kit user still
   sees a short row. Kit not listed here (custom equipment) falls into
   "Other". */
export const PICKER_CATEGORIES = [
  { id: "barbell",  label: "Barbell",       color: "#34D399", kit: ["barbell", "bench", "squat_rack", "trap_bar", "ez_bar", "safety_bar", "landmine"] },
  { id: "dumbbell", label: "Dumbbells",     color: "#34D399", kit: ["dumbbells"] },
  { id: "kettle",   label: "Kettlebell & other weights", color: "#34D399", kit: ["kettlebell", "sandbag", "medicine_ball"] },
  { id: "cable",    label: "Cable",         color: "#3B82F6", kit: ["cable_machine"] },
  { id: "machine",  label: "Machines & Smith", color: "#3B82F6", kit: ["gym_machines", "smith_machine"] },
  { id: "bars",     label: "Pull-up & dip bars", color: "#A78BFA", kit: ["pullup_bar", "dip_station", "back_extension"] },
  { id: "bodyweight", label: "Bodyweight", color: "#F472B6", kit: [] },
  { id: "bands",    label: "Bands & conditioning", color: "#F472B6", kit: ["resistance_band", "plyo_box", "battle_ropes", "ab_wheel"] },
  { id: "other",    label: "Other",         color: "#8A94A3", kit: null },
];

const CATEGORY_BY_KIT = Object.fromEntries(
  PICKER_CATEGORIES.flatMap((c) => (c.kit ?? []).map((k) => [k, c.id])),
);

export function pickerCategoryFor(ex) {
  const first = ex.equipment?.[0];
  if (!first) return "bodyweight";
  return CATEGORY_BY_KIT[first] ?? "other";
}

export function groupColor(groupId) {
  return GROUP_BY_ID[groupId]?.color ?? "#8A94A3";
}

export function exerciseColor(ex, byId) {
  return groupColor(groupForExercise(ex, byId));
}
