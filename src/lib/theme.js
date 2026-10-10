export const C = {
  bg: "#14171C",
  surface: "#1E232B",
  raised: "#272E38",
  line: "#333B46",
  text: "#EDEFF2",
  muted: "#8A94A3",
  accent: "#FF6B35",     // molten iron
  accentDim: "#7A3A1E",
  cold: "#2A313B",
  good: "#F59E0B",
  /* Destructive actions. Its own token rather than rag.red below, which is
     scoped to progress ratings — here red means "this throws work away",
     there it means "neglected". */
  danger: "#E5484D",
  /* Reversible-but-easy-to-miss actions (Undo). Orange, not red: red is
     reserved for things that throw work away. */
  warn: "#F08A24",

  /* Progress-vs-target rating, used by the Home dashboard only. Kept as its
     own triple rather than redefining `good` (which is amber and already
     means "positive" elsewhere), and deliberately separate from the body
     map's heat scale — there red means "hammered", here it means
     "neglected". Also distinct from the equipment group palette in
     data/equipment.js. */
  rag: {
    red:   "#E5484D",
    amber: "#F59E0B",
    green: "#3DD68C",
  },
};

/* Height of the fixed BottomNav, excluding the safe-area inset it adds below
   itself. Derived from its own padding + icon + label (12 + 22 + 3 + 13 + 16).
   Anything else that pins itself to the bottom of the viewport has to sit
   above the nav, so the number needs a single home — if BottomNav's padding
   changes, change this with it. */
export const NAV_H = 66;

export const display = "'Barlow Condensed', 'Oswald', system-ui, sans-serif";
export const body = "system-ui, -apple-system, 'Segoe UI', sans-serif";
