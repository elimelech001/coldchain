import { STATUS } from "../tokens.js";

export default function Badge({ status }) {
  const s = STATUS[status] || STATUS.offline;
  return (
    <span style={{
      color: s.c, background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}
