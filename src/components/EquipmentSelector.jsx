import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { C, display, body } from "../lib/theme";
import { EQUIPMENT_GROUPS, EQUIPMENT } from "../data/equipment";

/* The grouped equipment checklist, shared by the Settings panel and the
   first-run onboarding screen so both stay in step. Purely controlled —
   the caller owns the profile and decides when to persist. */

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export default function EquipmentSelector({ profile, onChange }) {
  const owned = new Set(profile.owned ?? []);
  const custom = profile.custom ?? [];
  const [adding, setAdding] = useState("");
  const [addGroup, setAddGroup] = useState(EQUIPMENT_GROUPS[0].id);

  const toggle = (id) => {
    const next = new Set(owned);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ ...profile, owned: [...next] });
  };

  const addCustom = () => {
    const label = adding.trim();
    if (!label) return;
    const id = `custom_eq_${slug(label)}`;
    // adding the same thing twice just ticks it rather than duplicating
    if (custom.some((c) => c.id === id) || EQUIPMENT.some((e) => e.id === id)) {
      if (!owned.has(id)) toggle(id);
      setAdding("");
      return;
    }
    onChange({
      ...profile,
      custom: [...custom, { id, label, group: addGroup }],
      owned: [...owned, id],
    });
    setAdding("");
  };

  const removeCustom = (id) => {
    onChange({
      ...profile,
      custom: custom.filter((c) => c.id !== id),
      owned: (profile.owned ?? []).filter((o) => o !== id),
    });
  };

  return (
    <div>
      {EQUIPMENT_GROUPS.map((g) => {
        const items = [
          ...EQUIPMENT.filter((e) => e.group === g.id),
          ...custom.filter((c) => c.group === g.id),
        ];
        if (!items.length) return null;
        return (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ color: g.color, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>
              {g.label}
            </div>
            <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
              {items.map((item) => {
                const on = owned.has(item.id);
                const isCustom = custom.some((c) => c.id === item.id);
                return (
                  <span key={item.id} className="flex items-center" style={{ gap: 4 }}>
                    <button
                      onClick={() => toggle(item.id)}
                      aria-pressed={on}
                      className="flex items-center"
                      style={{
                        gap: 6, padding: "9px 13px", borderRadius: 999,
                        border: `1px solid ${on ? g.color : C.line}`,
                        background: on ? g.color + "26" : "transparent",
                        color: on ? g.color : C.muted,
                        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {on && <Check size={13} />}
                      {item.label}
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => removeCustom(item.id)}
                        aria-label={`Remove ${item.label}`}
                        style={{ background: "transparent", border: "none", color: C.danger, cursor: "pointer", padding: 2, display: "flex" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
        <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
          Add your own
        </div>
        <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
          <input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
            placeholder="e.g. Landmine, Rings, Sled"
            style={{ flex: 1, background: C.raised, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 13px", color: C.text, fontSize: 15, fontFamily: body, outline: "none" }}
          />
          <button
            onClick={addCustom}
            disabled={!adding.trim()}
            className="flex items-center"
            style={{
              gap: 5, background: adding.trim() ? C.accent : C.raised,
              color: adding.trim() ? "#14171C" : C.muted,
              border: "none", borderRadius: 12, padding: "0 15px",
              fontFamily: display, fontSize: 15, letterSpacing: 0.5,
              cursor: adding.trim() ? "pointer" : "default",
            }}
          >
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
          {EQUIPMENT_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setAddGroup(g.id)}
              style={{
                padding: "5px 10px", borderRadius: 999, fontSize: 11, cursor: "pointer",
                border: `1px solid ${addGroup === g.id ? g.color : C.line}`,
                background: addGroup === g.id ? g.color + "26" : "transparent",
                color: addGroup === g.id ? g.color : C.muted,
                fontFamily: "inherit",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
