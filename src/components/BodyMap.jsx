import { C, display } from "../lib/theme";
import { FRONT, BACK } from "../lib/bodyMapShapes";
import { VIEW_W, VIEW_H, HEAD, NECK, TORSO, TORSO_MASS, HIP_LINE, ARM, LEG } from "../lib/bodyOutline";
import { heat } from "../lib/volume";
import { lighten, darken } from "../lib/color";

// mirrors a shape around CX without hand-mirroring path coordinates
const MIRROR_TRANSFORM = `translate(${VIEW_W},0) scale(-1,1)`;

function Glow({ id, color }) {
  return (
    <radialGradient id={id} cx="35%" cy="30%" r="75%">
      <stop offset="0%" stopColor={lighten(color, 0.22)} />
      <stop offset="55%" stopColor={color} />
      <stop offset="100%" stopColor={darken(color, 0.18)} />
    </radialGradient>
  );
}

function MuscleShape({ shape, fill, isSelected, onClick }) {
  // every muscle carries a dark outline so adjacent groups stay legible as
  // separate shapes rather than merging into one mass; selection swaps it
  // for a bright stroke.
  const common = {
    fill, onClick, style: { cursor: "pointer" },
    stroke: isSelected ? C.text : "#0E1116",
    strokeWidth: isSelected ? 1.75 : 0.9,
    strokeLinejoin: "round",
  };
  const el = shape.rect
    ? <rect x={shape.rect.x} y={shape.rect.y} width={shape.rect.w} height={shape.rect.h} rx={shape.rect.rx} {...common} />
    : <path d={shape.d} {...common} />;
  if (shape.center) return el;
  return (
    <>
      {el}
      <g transform={MIRROR_TRANSFORM}>{el}</g>
    </>
  );
}

export default function BodyMap({ side, vols, onPick, selected }) {
  const map = side === "front" ? FRONT : BACK;
  const gradients = [];
  const shapes = [];

  Object.entries(map).forEach(([muscle, shapeList]) => {
    const fillColor = heat(vols[muscle] || 0);
    const gradId = `bm-${side}-${muscle}`;
    gradients.push(<Glow key={gradId} id={gradId} color={fillColor} />);
    shapeList.forEach((shape, i) => {
      shapes.push(
        <MuscleShape
          key={`${muscle}-${i}`}
          shape={shape}
          fill={`url(#${gradId})`}
          isSelected={selected === muscle}
          onClick={() => onPick(muscle)}
        />
      );
    });
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ maxWidth: 165 }}>
        <defs>{gradients}</defs>

        {/* body mass: filled limbs sit under the muscle overlay so untargeted
            areas read as flesh rather than empty space */}
        <g fill="#232A34" stroke="none">
          <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
          <path d={NECK.d} />
          <path d={TORSO_MASS.d} />
          <path d={ARM.d} />
          <g transform={MIRROR_TRANSFORM}><path d={ARM.d} /></g>
          <path d={LEG.d} />
          <g transform={MIRROR_TRANSFORM}><path d={LEG.d} /></g>
        </g>

        {/* silhouette outline */}
        <g fill="none" stroke="#3A4250" strokeWidth={1.25} strokeLinejoin="round">
          <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
          <path d={NECK.d} />
          <path d={TORSO.d} />
          <g transform={MIRROR_TRANSFORM}><path d={TORSO.d} /></g>
          <path d={HIP_LINE.d} />
          <path d={ARM.d} />
          <g transform={MIRROR_TRANSFORM}><path d={ARM.d} /></g>
          <path d={LEG.d} />
          <g transform={MIRROR_TRANSFORM}><path d={LEG.d} /></g>
        </g>

        {shapes}
      </svg>
      <span style={{ fontFamily: display, letterSpacing: 1, color: C.muted, fontSize: 13, textTransform: "uppercase" }}>
        {side}
      </span>
    </div>
  );
}
