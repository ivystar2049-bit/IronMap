import { useMemo, useState } from "react";
import { X, Search, Dumbbell as DumbbellIcon, EyeOff, Snowflake } from "lucide-react";
import { C, display } from "../lib/theme";
import { MUSCLES } from "../data/exercises";
import { PICKER_CATEGORIES, pickerCategoryFor, groupForExercise, groupColor, equipmentLabel } from "../data/equipment";
import { isAvailable, missingLabels, hasProfile } from "../lib/availability";
import { card } from "../lib/styleHelpers";
import ColdRows from "./ColdRows";

function Thumb({ ex, color, dimmed }) {
  const [errored, setErrored] = useState(false);
  if (ex.imageUrl && !errored) {
    return (
      <img src={ex.imageUrl} alt="" onError={() => setErrored(true)}
        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, opacity: dimmed ? 0.4 : 1 }} />
    );
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.raised, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: dimmed ? 0.4 : 1 }}>
      <DumbbellIcon size={20} color={color} />
    </div>
  );
}

export default function ExercisePicker({ exercises, ownedSet, eqById = {}, coldRows, coldTarget, onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(null); // null = All, or "cold" for the Coldest view
  const [showUnavailable, setShowUnavailable] = useState(false);
  const showingCold = group === "cold";

  const profileSet = hasProfile(ownedSet);

  /* Chips only for categories that have something you could actually pick
     (or, with unavailable shown, anything at all). Flipping home/gym changes
     this set, so a chip that vanishes falls back to All below. */
  const categories = useMemo(() => {
    const present = new Set(
      exercises.filter((e) => showUnavailable || isAvailable(e, ownedSet)).map(pickerCategoryFor),
    );
    return PICKER_CATEGORIES.filter((c) => present.has(c.id));
  }, [exercises, ownedSet, showUnavailable]);
  const activeGroup = group === "cold" || categories.some((c) => c.id === group) ? group : null;

  const { shown, hiddenCount } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = exercises
      .filter((e) => !activeGroup || pickerCategoryFor(e) === activeGroup)
      .filter((e) => {
        if (!q) return true;
        if (e.name.toLowerCase().includes(q)) return true;
        if ([...e.p, ...e.s].some((m) => MUSCLES[m]?.toLowerCase().includes(q))) return true;
        // equipment is searchable too, so "trap bar" finds its exercises
        return (e.equipment ?? []).some((id) => equipmentLabel(id, eqById).toLowerCase().includes(q));
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const available = matches.filter((e) => isAvailable(e, ownedSet));
    const unavailable = matches.filter((e) => !isAvailable(e, ownedSet));
    return {
      shown: showUnavailable ? [...available, ...unavailable] : available,
      hiddenCount: unavailable.length,
    };
  }, [exercises, query, activeGroup, ownedSet, eqById, showUnavailable]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,15,0.75)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
      <div style={{ background: C.surface, width: "100%", maxHeight: "86%", display: "flex", flexDirection: "column", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        <div style={{ padding: 16, paddingBottom: 0 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: display, fontSize: 24, textTransform: "uppercase", letterSpacing: 1 }}>Add exercise</div>
            <button onClick={onClose} style={{ background: C.raised, border: "none", borderRadius: 10, width: 40, height: 40, color: C.text, cursor: "pointer" }}><X size={18} /></button>
          </div>

          {!showingCold && (
            <div className="flex items-center" style={{ background: C.raised, borderRadius: 12, padding: "10px 12px", gap: 8, marginBottom: 12 }}>
              <Search size={16} color={C.muted} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercises, muscles or kit…"
                style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 15, flex: 1, fontFamily: "inherit" }}
              />
            </div>
          )}

          <div className="flex" style={{ gap: 8, overflowX: "auto", paddingBottom: 12 }}>
            <button onClick={() => setGroup(null)} style={filterChip(activeGroup === null, C.accent)}>All</button>
            {/* Jumps straight to the same Coldest right now suggestions as the
                session screen, so picking a neglected muscle's exercise doesn't
                mean backing out of the picker to go check that panel first. */}
            {coldRows?.length > 0 && (
              <button onClick={() => setGroup("cold")} className="flex items-center" style={{ ...filterChip(showingCold, C.accent), gap: 5 }}>
                <Snowflake size={13} /> Coldest
              </button>
            )}
            {categories.map((g) => (
              <button key={g.id} onClick={() => setGroup(g.id)} style={filterChip(activeGroup === g.id, g.color)}>{g.label}</button>
            ))}
          </div>

          {/* Only offer the escape hatch when a profile is actually filtering
              something — otherwise it's a control that does nothing. */}
          {!showingCold && profileSet && hiddenCount > 0 && (
            <button
              onClick={() => setShowUnavailable((v) => !v)}
              className="flex items-center"
              style={{ gap: 6, background: "transparent", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: "0 0 10px" }}
            >
              <EyeOff size={13} />
              {showUnavailable
                ? "Hide exercises you don't have kit for"
                : `Show ${hiddenCount} needing kit you don't have`}
            </button>
          )}
        </div>

        <div style={{ overflowY: "auto", padding: "0 16px 16px" }}>
          {showingCold ? (
            <ColdRows rows={coldRows} target={coldTarget} onOpenExercise={onPick} />
          ) : shown.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 14, padding: "24px 0", textAlign: "center" }}>No exercises match.</div>
          ) : (
            shown.map((e) => {
              const available = isAvailable(e, ownedSet);
              const gid = groupForExercise(e, eqById);
              const color = groupColor(gid);
              const missing = available ? [] : missingLabels(e, ownedSet, eqById);
              return (
                <button
                  key={e.id}
                  onClick={() => onPick(e.id)}
                  style={{ ...card(8), width: "100%", opacity: available ? 1 : 0.55 }}
                  className="flex items-center"
                >
                  <Thumb ex={e} color={color} dimmed={!available} />
                  <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: display, fontSize: 18, color: C.text }}>{e.name}</div>
                    <div className="flex items-center" style={{ gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color, fontWeight: 600 }}>
                        {(e.equipment ?? []).map((id) => equipmentLabel(id, eqById)).join(" + ") || "No kit"}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted }}>· {e.p.map((m) => MUSCLES[m]).join(", ")}</span>
                      {e.custom && <span style={{ fontSize: 10, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 999, padding: "1px 6px" }}>Custom</span>}
                    </div>
                    {missing.length > 0 && (
                      <div style={{ fontSize: 11, color: C.accent, marginTop: 3 }}>Needs {missing.join(" + ")}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function filterChip(active, color) {
  return {
    flexShrink: 0,
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? color : C.line}`,
    background: active ? color + "26" : "transparent",
    color: active ? color : C.muted,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}
