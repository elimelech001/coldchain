import { C } from "../tokens.js";

export default function DeleteConfirmDialog({ fridge, onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 200,
      }}
      onClick={onCancel}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16,
        boxShadow: "0 20px 60px rgba(15,23,42,.15)",
        width: "min(380px, 90vw)", padding: 24, color: C.ink,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: C.ink }}>
          Delete <span style={{ fontFamily: "var(--mono)", color: C.frost }}>{fridge.id}</span>?
        </div>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 24, lineHeight: 1.5 }}>
          This will permanently remove the unit from the fleet. This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: "none", border: `1px solid ${C.line}`, color: C.dim,
            borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: C.redDeep, border: `1px solid #FECACA`, color: C.red,
            borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>Delete Unit</button>
        </div>
      </div>
    </div>
  );
}
