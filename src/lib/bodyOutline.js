/* Shared humanoid silhouette — identical for front and back views (a body's
   outline doesn't change, only the muscle overlay does). Authored for the
   right half only; BodyMap mirrors non-centered pieces via SVG transform
   around CX. viewBox is 0 0 200 400.

   Proportions: deltoids cap the shoulder at the widest point, the ribcage
   tucks in sharply below the armpit, and the arm hangs outboard and angles
   slightly away — so a clear wedge of background shows down each side. */

export const CX = 100;
export const VIEW_W = 200;
export const VIEW_H = 400;

export const HEAD = { cx: CX, cy: 30, rx: 17, ry: 21 };
export const NECK = { d: "M90,46 L90,60 L110,60 L110,46 Z" };

// right half, open contour: neck → shoulder → armpit → waist → hip
const TORSO_RIGHT =
  "M110,52 C121,54 130,58 136,68 C139,74 138,82 134,88 C129,96 126,104 125,116 C123,130 119,140 117,152 C115,166 118,180 122,192 C124,199 125,204 125,208";

export const TORSO = { d: TORSO_RIGHT, center: false };

export const HIP_LINE = {
  // crotch curve, drawn once (already spans the centerline)
  d: "M125,208 Q100,224 75,208",
  center: true,
};

/* Closed torso (right contour + mirrored left, joined across the hips) used
   as a filled mass beneath the muscle overlay so untargeted areas of the
   trunk read as flesh rather than empty space. */
export const TORSO_MASS = {
  d: `${TORSO_RIGHT} Q100,224 75,208 C75,204 76,199 78,192 C82,180 85,166 83,152 C81,140 77,130 75,116 C74,104 71,96 66,88 C62,82 61,74 64,68 C70,58 79,54 90,52 Z`,
  center: true,
};

export const ARM = {
  // right arm: upper arm → elbow → forearm → hand, angled slightly outward
  // so it clears the ribcage instead of running parallel against it.
  d: "M147,80 C155,84 159,96 159,114 C159,130 158,144 157,155 C156,164 162,170 163,182 C164,196 162,210 158,220 C157,226 161,232 160,242 C159,252 155,258 150,258 C145,258 142,252 142,242 C142,232 146,226 145,220 C141,210 139,196 140,182 C141,170 146,164 145,155 C144,144 141,130 141,114 C141,96 141,84 147,80 Z",
  center: false,
};

export const LEG = {
  // right leg, hip → knee → calf → ankle → foot
  d: "M124,204 C132,211 135,229 134,249 C133,271 129,289 127,303 C125,319 123,337 121,353 C119,367 117,377 113,383 C107,385 102,381 101,372 C101,355 103,337 103,319 C103,299 102,277 103,257 C104,237 105,217 109,205 C114,201 120,201 124,204 Z",
  center: false,
};
