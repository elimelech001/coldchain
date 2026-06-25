import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, MapPin, X, ShieldCheck, ShieldAlert, DollarSign,
  Wrench, PackageX, Truck,
} from "lucide-react";
import { C, STATUS } from "../tokens.js";
import Badge from "../components/Badge.jsx";
import StepRow from "../components/StepRow.jsx";
import { advise, spoilWindow, playbook as basePlaybook } from "../logic.js";
import { patchFridge } from "../api/client.js";

const STEP_ICONS = { dispatch: Wrench, relocate: PackageX, hold: Truck, warranty: ShieldCheck };
const playbook = (f) => basePlaybook(f).map(s => ({ ...s, icon: STEP_ICONS[s.key] }));

const CONFIRM_MSG = {
  dispatch: (f) => `${f.technicianName || f.vendor} confirmed — on route, ETA ${f.sla}`,
  relocate: (f) => `${f.storeManager?.name || "Store manager"} confirmed — stock being relocated`,
  hold:     (f) => `${f.storeManager?.name || "Receiving team"} confirmed — deliveries held`,
  warranty: (f) => `Incident #${f.id} logged in audit trail`,
};

export default function PlaybookRunner({ f, onResolve, addEvent, onClearEscalation }) {
  const navigate = useNavigate();
  const steps = useMemo(() => playbook(f), [f]);
  const [stepStates, setStepStates] = useState(() =>
    steps.map(() => ({ status: "idle", confirmedAt: null }))
  );
  const timers = useRef([]);
  const escalationCleared = useRef(false);
  const resolvedFired = useRef(false);

  const adv   = advise(f);
  const spoil = spoilWindow(f);

  const allDone = stepStates.every(s => s.status === "confirmed" || s.status === "skipped");
  const anyConfirmed = stepStates.some(s => s.status === "confirmed");

  useEffect(() => {
    if (allDone && anyConfirmed && !resolvedFired.current) {
      resolvedFired.current = true;
      patchFridge(f.id, { status: "resolving" })
        .then(() => {
          onResolve(f.id);
          addEvent(f.id, `${f.id} — incident closed · status → Resolving`, "resolved");
        })
        .catch(() => {});
    }
  }, [allDone, anyConfirmed]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function setStep(key, patch) {
    setStepStates(prev => prev.map((s, i) =>
      steps[i].key === key ? { ...s, ...patch } : s
    ));
  }

  function handleExecute(key) {
    if (!escalationCleared.current) {
      escalationCleared.current = true;
      onClearEscalation(f.id);
    }
    setStep(key, { status: "executing" });
    const step = steps.find(s => s.key === key);
    addEvent(f.id, step.detail, "action");

    const t1 = setTimeout(() => {
      setStep(key, { status: "awaiting" });
      const delay = 8000 + Math.random() * 4000;
      const t2 = setTimeout(() => {
        const now = Date.now();
        setStep(key, { status: "confirmed", confirmedAt: now });
        const msg = CONFIRM_MSG[key]?.(f) ?? "Step confirmed";
        addEvent(f.id, msg, "resolved");
      }, delay);
      timers.current.push(t2);
    }, 1500);
    timers.current.push(t1);
  }

  function handleSkip(key) {
    const step = steps.find(s => s.key === key);
    setStep(key, { status: "skipped" });
    addEvent(f.id, `${f.id} — "${step?.label}" marked as already handled`, "info");
  }

  function handleClose() {
    navigate(-1);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: 24, zIndex: 50, overflowY: "auto",
      }}
      onClick={handleClose}
    >
      <div
        data-testid="incident-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18,
          boxShadow: "0 20px 60px rgba(15,23,42,.15), 0 8px 24px rgba(15,23,42,.10)",
          width: "min(680px, 100%)", padding: 24, color: C.ink, marginTop: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: C.frost }}>{f.id}</span>
              <Badge status={f.status} />
            </div>
            <div style={{ color: C.dim, fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={13} /> {f.store} · {f.model}
            </div>
          </div>
          <button onClick={handleClose} aria-label="Close incident view"
            style={{ background: "none", border: `1px solid ${C.line}`, color: C.dim, cursor: "pointer", borderRadius: 8, padding: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {spoil && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: f.status === "critical" ? "#FEF2F2" : "#FFFBEB",
            border: `1px solid ${f.status === "critical" ? "#FECACA" : "#FDE68A"}`,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <AlertTriangle size={22} color={f.status === "critical" ? C.red : C.amber} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>~${spoil.value.toLocaleString()} of stock at risk</div>
              <div style={{ fontSize: 12, color: C.dim }}>
                Est. {spoil.hours}h until product crosses food-safety threshold
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>
              Response playbook
            </h3>
            {allDone && anyConfirmed && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.mint, fontSize: 13, fontWeight: 700 }}>
                <CheckCircle2 size={15} /> All steps resolved
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((s, i) => (
              <StepRow key={s.key} step={s} state={stepStates[i]} onExecute={handleExecute} onSkip={handleSkip} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 12, background: C.panel2, border: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim, marginBottom: 8 }}>
              {f.warranty === "valid"
                ? <ShieldCheck size={15} color={C.mint} />
                : <ShieldAlert size={15} color={f.warranty === "void" ? C.red : C.amber} />}
              Warranty
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, textTransform: "capitalize",
              color: f.warranty === "valid" ? C.mint : f.warranty === "void" ? C.red : C.amber,
            }}>
              {f.warranty}
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>through {f.warrantyEnds}</div>
          </div>
          <div style={{
            padding: 14, borderRadius: 12,
            background: adv.replace ? "#FEF2F2" : "#F0FDF4",
            border: `1px solid ${adv.replace ? "#FECACA" : "#BBF7D0"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim, marginBottom: 8 }}>
              <DollarSign size={15} color={adv.replace ? C.red : C.mint} /> Repair vs replace
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: adv.replace ? C.red : C.mint }}>
              {adv.replace ? "Replace unit" : "Repair viable"}
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{adv.text}</div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>
            Fault & service history
          </h3>
          {f.history.length === 0 ? (
            <div style={{ fontSize: 13, color: C.dim, padding: 12 }}>No prior incidents — unit has run clean since install.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {f.history.map((h, i) => (
                <div key={i} style={{
                  display: "flex", gap: 14, padding: "10px 0",
                  borderBottom: i < f.history.length - 1 ? `1px solid ${C.line}` : "none",
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: C.frost, width: 88, flexShrink: 0 }}>{h.d}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{h.t}</div>
                    <div style={{ fontSize: 12, color: C.dim }}>{h.note} · {h.who}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
