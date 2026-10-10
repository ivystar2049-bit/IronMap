import { C } from "../lib/theme";

export default function Chip({ children, tone }) {
  return (
    <span style={{
      fontSize: 12, padding: "3px 9px", borderRadius: 999,
      background: tone || C.raised, color: C.text, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}
