import { EQUIPMENT, equipmentLabel } from "../data/equipment";

/* The one availability rule, per the brief: an exercise is available if the
   user owns EVERY tag it requires. Implemented once here and shared by the
   picker, the Body-tab gap suggestions, and anything added later — do not
   re-derive this per screen.

   An empty or absent profile deliberately means "show everything" rather
   than "show nothing": a new user who skips onboarding, or someone who
   hasn't set up yet, must not be met with an empty exercise library. */

/* "At a commercial gym" owns everything — built-in and custom — without
   touching the saved home kit, so flipping it off puts you straight back. */
export function ownedSetFrom(profile) {
  if (profile?.gym) {
    return new Set([...EQUIPMENT, ...(profile.custom ?? [])].map((e) => e.id));
  }
  return new Set(profile?.owned ?? []);
}

export function hasProfile(ownedSet) {
  return ownedSet instanceof Set && ownedSet.size > 0;
}

export function isAvailable(ex, ownedSet) {
  if (!hasProfile(ownedSet)) return true;
  const required = ex.equipment ?? [];
  return required.every((tag) => ownedSet.has(tag));
}

/* Equipment ids the user is missing for this exercise, for the greyed-out
   row's "needs …" label. Empty when the exercise is available. */
export function missingFor(ex, ownedSet) {
  if (!hasProfile(ownedSet)) return [];
  return (ex.equipment ?? []).filter((tag) => !ownedSet.has(tag));
}

export function missingLabels(ex, ownedSet, byId) {
  return missingFor(ex, ownedSet).map((id) => equipmentLabel(id, byId));
}

export function filterAvailable(exercises, ownedSet) {
  return exercises.filter((ex) => isAvailable(ex, ownedSet));
}
