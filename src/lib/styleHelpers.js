import { C, display } from "./theme";

export function card(mb = 12) {
  return {
    background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
    padding: 14, marginBottom: mb, width: "100%", textAlign: "left", cursor: "pointer",
    color: C.text,
  };
}

/* Actions that throw work away: cancelling a session, deleting one, wiping
   history. An outline rather than a filled block, so it reads as serious
   without competing with the primary action sitting next to it. */
export function dangerBtn(fontSize = 15) {
  return { ...bigBtn("transparent", C.danger), border: `1px solid ${C.danger}`, fontSize };
}

export function bigBtn(bg, color = "#14171C") {
  return {
    width: "100%", padding: "18px", borderRadius: 16, border: "none",
    background: bg, color, fontFamily: display, fontSize: 20, letterSpacing: 1,
    textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  };
}
