export function hexLerp(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const r = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return "#" + r.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// lighten/darken a hex color toward white/black by fraction t (0-1) — used
// for the subtle core-to-edge shading of a muscle's radial-gradient glow.
export function lighten(hex, t) {
  return hexLerp(hex, "#FFFFFF", t);
}

export function darken(hex, t) {
  return hexLerp(hex, "#000000", t);
}
