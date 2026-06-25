import { C } from "../tokens.js";

export default function AppFooter({ fridges }) {
  const sla4h = fridges.filter(f => f.sla === "4h" && f.status !== "offline").length;
  const sla6h = fridges.filter(f => f.sla === "6h" && f.status !== "offline").length;
  return (
    <footer style={{
      marginTop: 40, borderTop: `1px solid ${C.line}`,
      padding: "16px 0 24px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: 11, color: C.dim,
    }}>
      <span>v1.0.0 · build 2026.06</span>
      <span>SLA: {sla4h} within 4h · {sla6h} within 6h</span>
      <span>Powered by RavTech</span>
    </footer>
  );
}
