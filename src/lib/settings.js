// User-tunable training targets. Persisted separately from workout data so
// resetting history doesn't wipe preferences.
export const DEFAULT_SETTINGS = {
  setsLow: 10,   // sets/muscle/week — below this, a muscle shows as "neglected"
  setsHigh: 20,  // sets/muscle/week — above this, a muscle shows as "high"
  repsLow: 8,    // default target rep range per set (also seeds the reps
  repsHigh: 12,  // stepper when an exercise has no logged history yet)
  primaryWeight: 1.0,   // set-count credit a primary muscle earns per set
  secondaryWeight: 0.5, // set-count credit a secondary muscle earns per set
};

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function clampSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...raw };
  s.setsLow = Math.max(1, Math.round(s.setsLow));
  s.setsHigh = Math.max(s.setsLow + 1, Math.round(s.setsHigh));
  s.repsLow = Math.max(1, Math.round(s.repsLow));
  s.repsHigh = Math.max(s.repsLow + 1, Math.round(s.repsHigh));
  s.primaryWeight = Math.min(3, Math.max(0, round1(s.primaryWeight)));
  s.secondaryWeight = Math.min(3, Math.max(0, round1(s.secondaryWeight)));
  return s;
}
