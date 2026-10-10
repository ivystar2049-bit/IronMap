/* Body regions used for the Home dashboard rollups. Between them these cover
   every key in MUSCLES (data/exercises.js) exactly once — 18 muscles across
   6 regions — so the region averages account for the whole body with no
   muscle double-counted or dropped. */

export const REGIONS = [
  { id: "chest",     label: "Chest",     muscles: ["chest"] },
  { id: "back",      label: "Back",      muscles: ["traps", "upper_back", "lats", "mid_back", "lower_back"] },
  { id: "shoulders", label: "Shoulders", muscles: ["front_delts", "side_delts", "rear_delts"] },
  { id: "arms",      label: "Arms",      muscles: ["biceps", "triceps", "forearms"] },
  { id: "core",      label: "Core",      muscles: ["abs", "obliques"] },
  { id: "legs",      label: "Legs",      muscles: ["quads", "hamstrings", "glutes", "calves"] },
];
