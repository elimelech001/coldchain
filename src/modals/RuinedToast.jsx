import { useEffect } from "react";
import { AlertOctagon, X } from "lucide-react";
import { C } from "../tokens.js";

export default function RuinedToast({ fridge, onDismiss, onOpenModal }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 30000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", top: 76, right: 16, zIndex: 200,
      width: 360, background: C.panel,
      border: `1px solid #FECACA`, borderRadius: 12, padding: 16,
      boxShadow: "0 8px 24px rgba(220,38,38,.12), 0 2px 8px rgba(15,23,42,.08)",
      animation: "slide-in-right 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <AlertOctagon size={18} color={C.red} />
        <span style={{ fontSize: 14, fontWeight: 800, color: C.red }}>STOCK SPOILED</span>
        <button onClick={onDismiss} style={{ marginLeft: "auto", background: "none", border: "none", color: C.dim, cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ fontSize: 13, color: C.ink, marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--mono)", color: C.frost }}>{fridge.id}</span> at {fridge.store}
      </div>
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>
        ${fridge.stock.toLocaleString()} product likely ruined — temperature threshold exceeded
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onOpenModal}
          style={{
            flex: 1, background: C.redDeep, border: `1px solid #FECACA`,
            color: C.red, borderRadius: 7, padding: "7px 12px", fontSize: 12,
            fontWeight: 700, cursor: "pointer",
          }}
        >View Details</button>
        <button
          onClick={onDismiss}
          style={{
            background: "none", border: `1px solid ${C.line}`, color: C.dim,
            borderRadius: 7, padding: "7px 12px", fontSize: 12, cursor: "pointer",
          }}
        >Dismiss</button>
      </div>
    </div>
  );
}
