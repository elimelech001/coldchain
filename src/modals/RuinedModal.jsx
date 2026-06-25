import { AlertOctagon, X } from "lucide-react";
import { C, STATUS } from "../tokens.js";
import { relativeTime } from "../utils.js";

export default function RuinedModal({ fridge, onClose, onConfirmWriteOff, recentEvents }) {
  const drift = (fridge.temp - fridge.target).toFixed(1);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: 24, zIndex: 150, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid #FECACA`, borderRadius: 18,
        boxShadow: "0 20px 60px rgba(15,23,42,.15)",
        width: "min(620px, 100%)", padding: 24, color: C.ink, marginTop: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertOctagon size={22} color={C.red} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: C.frost }}>{fridge.id}</span>
            </div>
            <div style={{ color: C.dim, fontSize: 13, marginTop: 4 }}>{fridge.store} · {fridge.model}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.line}`, color: C.dim, cursor: "pointer", borderRadius: 8, padding: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          padding: 14, borderRadius: 12, background: C.redDeep, border: `1px solid #FECACA`,
          marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
        }}>
          <AlertOctagon size={20} color={C.red} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.red }}>Stock Likely Ruined</div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Immediate action required — spoilage threshold exceeded</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            ["Current Temp", `${fridge.temp.toFixed(1)}°C`, C.red],
            ["Target Temp", `${fridge.target}°C`, C.dim],
            ["Drift", `+${drift}°C`, C.red],
            ["Stock Value", `$${fridge.stock.toLocaleString()}`, C.amber],
            ["Spoil Window", "EXCEEDED", C.red],
            ["Status", fridge.status, STATUS[fridge.status]?.c || C.dim],
          ].map(([label, value, color]) => (
            <div key={label} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color, textTransform: "capitalize" }}>{value}</div>
            </div>
          ))}
        </div>

        {recentEvents.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Recent Activity</div>
            {recentEvents.map(e => (
              <div key={e.id} style={{ fontSize: 12, color: C.ink, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.dim, marginRight: 8 }}>{relativeTime(e.ts)}</span>{e.message}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Suggested Actions</div>
          {[
            `Notify store manager — ${fridge.storeManager?.name || "contact on file"} (${fridge.storeManager?.phone || "—"})`,
            "Document temperature logs for insurance claim",
            `Contact vendor ${fridge.vendor} for emergency service (SLA: ${fridge.sla})`,
            "Log write-off in accounting system",
          ].map((action, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
              <span style={{ color: C.frost, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{action}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C.line}`, color: C.dim,
            borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer",
          }}>Close</button>
          <button onClick={() => onConfirmWriteOff(fridge.id)} style={{
            background: C.redDeep, border: `1px solid #FECACA`, color: C.red,
            borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            Confirm Write-off (${fridge.stock.toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
}
