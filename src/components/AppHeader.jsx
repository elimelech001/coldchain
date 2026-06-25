import { Thermometer, Bell, Plus } from "lucide-react";
import { C } from "../tokens.js";
import { relativeTime } from "../utils.js";

export default function AppHeader({ fridgesCount, loading, escalatedCount, lastUpdated, onAddUnit }) {
  return (
    <header style={{
      background: C.panel, borderBottom: `1px solid ${C.line}`,
      padding: "0 24px", height: 60,
      display: "flex", alignItems: "center", gap: 14,
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 4px rgba(15,23,42,.06)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg,#ECFEFF,#E0F2FE)",
        border: `1px solid ${C.frost}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Thermometer size={20} color={C.frost} />
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.01em", color: C.ink }}>ColdChain Ops</div>
        <div style={{ fontSize: 11, color: C.dim }}>RavTech Operations</div>
      </div>

      {lastUpdated && (
        <div style={{ fontSize: 11, color: C.dim, marginLeft: 8 }}>
          Last updated {relativeTime(lastUpdated)}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {!loading && (
        <div style={{
          fontSize: 12, color: C.frost, background: "#ECFEFF",
          border: `1px solid ${C.frost}44`, borderRadius: 20,
          padding: "4px 12px", fontWeight: 700,
        }}>
          {fridgesCount} units
        </div>
      )}

      <div style={{ position: "relative" }}>
        <Bell size={18} color={escalatedCount > 0 ? C.red : C.dim} />
        {escalatedCount > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -6,
            background: C.red, color: "#fff", fontSize: 9, fontWeight: 800,
            borderRadius: 10, padding: "1px 4px", lineHeight: 1.4,
          }}>{escalatedCount}</span>
        )}
      </div>

      <button
        onClick={onAddUnit}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: C.frost, border: "none",
          color: "#fff", borderRadius: 8, padding: "7px 14px",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 1px 3px rgba(8,145,178,.3)",
        }}
      >
        <Plus size={14} /> Add Unit
      </button>

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: C.panel2, border: `1px solid ${C.line}`,
        borderRadius: 20, padding: "5px 12px 5px 6px",
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "#ECFEFF", border: `1px solid ${C.frost}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: C.frost,
        }}>R</div>
        <span style={{ fontSize: 12, color: C.dim }}>RavTech Ops</span>
      </div>
    </header>
  );
}
