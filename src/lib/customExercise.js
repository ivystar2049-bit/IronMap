function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function makeExerciseId(name) {
  return `custom_${slugify(name) || "exercise"}_${Date.now().toString(36)}`;
}
