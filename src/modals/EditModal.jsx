import { useState } from "react";
import { Edit3, X, Trash2 } from "lucide-react";
import { C, STATUS } from "../tokens.js";
import CustomSelect from "../components/CustomSelect.jsx";

export default function EditModal({ fridge, onClose, onSave, onDeleteRequest }) {
  const [form, setForm] = useState({
    target: fridge.target,
    status: fridge.status,
    compressor: fridge.compressor ?? "",
    door: fridge.door,
    stock: fridge.stock,
    technicianName: fridge.technicianName || "",
    sla: fridge.sla || "4h",
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(fridge.id, {
        target: Number(form.target),
        status: form.status,
        compressor: form.compressor === "" ? null : Number(form.compressor),
        door: form.door,
        stock: Number(form.stock),
        technicianName: form.technicianName,
        sla: form.sla,
      });
    } finally {
      setSaving(false);
    }
  }

  const INP = {
    width: "100%", background: C.panel2, border: `1px solid ${C.line}`,
    borderRadius: 8, padding: "8px 10px", color: C.ink, fontSize: 13,
    boxSizing: "border-box", outline: "none", marginTop: 4,
  };
  const LBL = { fontSize: 12, color: C.dim, display: "block", marginBottom: 14 };

  const statusOptions = ["healthy","warning","critical","offline"].map(s => ({
    value: s, label: STATUS[s]?.label || s,
  }));
  const doorOptions = ["closed","ajar","—"].map(d => ({ value: d, label: d }));
  const slaOptions = [{ value: "4h", label: "4 hours" }, { value: "6h", label: "6 hours" }];

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
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18,
        boxShadow: "0 20px 60px rgba(15,23,42,.15)",
        width: "min(580px, 100%)", padding: 24, color: C.ink, marginTop: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Edit3 size={16} color={C.frost} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 800, color: C.frost }}>{fridge.id}</span>
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{fridge.model} · {fridge.store}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.line}`, color: C.dim, cursor: "pointer", borderRadius: 8, padding: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <label style={LBL}>
            Target Temp (°C)
            <input type="number" step="0.5" value={form.target} onChange={e => set("target", e.target.value)} style={INP} />
          </label>
          <label style={LBL}>
            Status
            <div style={{ marginTop: 4 }}>
              <CustomSelect value={form.status} onChange={v => set("status", v)} options={statusOptions} />
            </div>
          </label>
          <label style={LBL}>
            Compressor (%)
            <input type="number" min="0" max="100" value={form.compressor} onChange={e => set("compressor", e.target.value)} style={INP} />
          </label>
          <label style={LBL}>
            Door State
            <div style={{ marginTop: 4 }}>
              <CustomSelect value={form.door} onChange={v => set("door", v)} options={doorOptions} />
            </div>
          </label>
          <label style={LBL}>
            Stock Value ($)
            <input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} style={INP} />
          </label>
          <label style={LBL}>
            SLA
            <div style={{ marginTop: 4 }}>
              <CustomSelect value={form.sla} onChange={v => set("sla", v)} options={slaOptions} />
            </div>
          </label>
        </div>
        <label style={{ ...LBL, marginBottom: 0 }}>
          Technician Name
          <input value={form.technicianName} onChange={e => set("technicianName", e.target.value)} style={INP} />
        </label>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <button
            onClick={() => { onDeleteRequest(fridge.id); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: C.redDeep, border: `1px solid #FECACA`,
              color: C.red, borderRadius: 8, padding: "8px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Trash2 size={13} /> Delete Unit
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              background: "none", border: `1px solid ${C.line}`, color: C.dim,
              borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              background: C.frost, border: "none", color: "#fff",
              borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700,
              cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
              boxShadow: "0 1px 3px rgba(8,145,178,.3)",
            }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
