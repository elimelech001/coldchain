import { useState } from "react";
import { Plus, X } from "lucide-react";
import { C } from "../tokens.js";
import CustomSelect from "../components/CustomSelect.jsx";

export default function AddModal({ onClose, onSave, existingIds, knownStores }) {
  const STORE_OPTS = [...knownStores, "Other"];
  const [form, setForm] = useState({
    id: "", store: STORE_OPTS[0] || "Other", storeCustom: "",
    model: "", target: "", stock: "",
    install: new Date().toISOString().slice(0, 10),
    technicianName: "", managerName: "", managerPhone: "",
    vendor: "", sla: "4h", warranty: "valid", warrantyEnds: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  function validate() {
    const e = {};
    if (!form.id.trim()) e.id = "Required";
    else if (!/^[A-Z]{2}-\d{2}$/.test(form.id.trim())) e.id = "Format: XX-00 (e.g. BK-01)";
    else if (existingIds.has(form.id.trim())) e.id = "Unit ID already exists";
    if (!form.model.trim()) e.model = "Required";
    if (form.target === "" || isNaN(Number(form.target))) e.target = "Enter a number";
    if (form.stock === "" || isNaN(Number(form.stock))) e.stock = "Enter a number";
    if (!form.install) e.install = "Required";
    if (form.store === "Other" && !form.storeCustom.trim()) e.store = "Enter a store name";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setSaveError("");
    const storeValue = form.store === "Other" ? form.storeCustom.trim() : form.store;
    try {
      await onSave({
        id: form.id.trim().toUpperCase(),
        store: storeValue,
        model: form.model.trim(),
        target: Number(form.target),
        stock: Number(form.stock),
        install: form.install,
        technicianName: form.technicianName.trim(),
        storeManager: { name: form.managerName.trim(), phone: form.managerPhone.trim() },
        vendor: form.vendor.trim(),
        sla: form.sla,
        warranty: form.warranty,
        warrantyEnds: form.warrantyEnds,
      });
    } catch (err) {
      setSaveError(err.message || "Failed to add unit");
      setSaving(false);
    }
  }

  const INP = {
    width: "100%", background: C.panel2, border: `1px solid ${C.line}`,
    borderRadius: 8, padding: "8px 10px", color: C.ink, fontSize: 13,
    boxSizing: "border-box", outline: "none", marginTop: 4,
  };
  const LBL = { fontSize: 12, color: C.dim, display: "block", marginBottom: 14 };
  const ERR = { fontSize: 11, color: C.red, marginLeft: 6 };

  const storeOptions = STORE_OPTS.map(s => ({ value: s, label: s }));
  const slaOptions = [{ value: "4h", label: "4 hours" }, { value: "6h", label: "6 hours" }];
  const warrantyOptions = ["valid","expiring","void"].map(w => ({ value: w, label: w }));

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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} color={C.frost} />
            <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Add New Unit</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.line}`, color: C.dim, cursor: "pointer", borderRadius: 8, padding: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>Required fields</div>

        <label style={LBL}>
          Unit ID (e.g. BK-01) {errors.id && <span style={ERR}>{errors.id}</span>}
          <input
            value={form.id} onChange={e => set("id", e.target.value.toUpperCase())}
            placeholder="XX-00" style={{ ...INP, fontFamily: "var(--mono)", borderColor: errors.id ? C.red : C.line }}
          />
        </label>

        <label style={LBL}>
          Store {errors.store && <span style={ERR}>{errors.store}</span>}
          <div style={{ marginTop: 4 }}>
            <CustomSelect value={form.store} onChange={v => set("store", v)} options={storeOptions} />
          </div>
        </label>

        {form.store === "Other" && (
          <label style={LBL}>
            Store Name
            <input value={form.storeCustom} onChange={e => set("storeCustom", e.target.value)} placeholder="City — Location" style={INP} />
          </label>
        )}

        <label style={LBL}>
          Model {errors.model && <span style={ERR}>{errors.model}</span>}
          <input value={form.model} onChange={e => set("model", e.target.value)} placeholder="e.g. True T-49 Reach-in" style={{ ...INP, borderColor: errors.model ? C.red : C.line }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <label style={LBL}>
            Target Temp (°C) {errors.target && <span style={ERR}>{errors.target}</span>}
            <input type="number" step="0.5" value={form.target} onChange={e => set("target", e.target.value)} style={{ ...INP, borderColor: errors.target ? C.red : C.line }} />
          </label>
          <label style={LBL}>
            Stock Value ($) {errors.stock && <span style={ERR}>{errors.stock}</span>}
            <input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} style={{ ...INP, borderColor: errors.stock ? C.red : C.line }} />
          </label>
        </div>

        <label style={LBL}>
          Install Date {errors.install && <span style={ERR}>{errors.install}</span>}
          <input type="date" value={form.install} onChange={e => set("install", e.target.value)} style={{ ...INP, borderColor: errors.install ? C.red : C.line }} />
        </label>

        <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14, marginTop: 4 }}>Optional</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <label style={LBL}>Technician<input value={form.technicianName} onChange={e => set("technicianName", e.target.value)} style={INP} /></label>
          <label style={LBL}>Vendor<input value={form.vendor} onChange={e => set("vendor", e.target.value)} style={INP} /></label>
          <label style={LBL}>Manager Name<input value={form.managerName} onChange={e => set("managerName", e.target.value)} style={INP} /></label>
          <label style={LBL}>Manager Phone<input value={form.managerPhone} onChange={e => set("managerPhone", e.target.value)} style={INP} /></label>
          <label style={LBL}>
            SLA
            <div style={{ marginTop: 4 }}>
              <CustomSelect value={form.sla} onChange={v => set("sla", v)} options={slaOptions} />
            </div>
          </label>
          <label style={LBL}>
            Warranty
            <div style={{ marginTop: 4 }}>
              <CustomSelect value={form.warranty} onChange={v => set("warranty", v)} options={warrantyOptions} />
            </div>
          </label>
        </div>

        {form.warranty !== "void" && (
          <label style={LBL}>
            Warranty End Date
            <input type="date" value={form.warrantyEnds} onChange={e => set("warrantyEnds", e.target.value)} style={INP} />
          </label>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          {saveError && <span style={{ fontSize: 12, color: C.red, flex: 1 }}>{saveError}</span>}
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C.line}`, color: C.dim,
            borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            background: C.frost, border: "none", color: "#fff",
            borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700,
            cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
            boxShadow: "0 1px 3px rgba(8,145,178,.3)",
          }}>{saving ? "Adding…" : "Add Unit"}</button>
        </div>
      </div>
    </div>
  );
}
