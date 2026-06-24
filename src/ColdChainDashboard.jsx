import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Thermometer, AlertTriangle, CheckCircle2, Clock, Wrench, Truck,
  PackageX, ShieldCheck, ShieldAlert, Snowflake, Activity, DollarSign,
  ChevronRight, X, MapPin, TrendingDown, History, RefreshCw,
  SkipForward, Loader2, Bell, Plus, Search, Trash2, Edit3, AlertOctagon,
} from "lucide-react";
import { fetchFridges, patchFridge, createFridge, deleteFridge } from "./api/client.js";

/* ───────────────────────── Design tokens ───────────────────────── */
const C = {
  bg: "#0B1220",
  panel: "#121C2E",
  panel2: "#0E1726",
  line: "#22324A",
  ink: "#E8EEF6",
  dim: "#8AA0BC",
  frost: "#5BD6E6",
  mint: "#34D399",
  amber: "#F5B847",
  red: "#FB6B6B",
  redDeep: "#3a1620",
  blue: "#60a5fa",
};

const STATUS = {
  healthy:   { c: C.mint,  label: "Healthy",   bg: "rgba(52,211,153,.12)" },
  warning:   { c: C.amber, label: "Warning",   bg: "rgba(245,184,71,.12)" },
  critical:  { c: C.red,   label: "Critical",  bg: "rgba(251,107,107,.14)" },
  offline:   { c: C.dim,   label: "Offline",   bg: "rgba(138,160,188,.12)" },
  resolving: { c: C.blue,  label: "Resolving", bg: "rgba(96,165,250,.12)" },
};

const STATUS_ORDER = { critical: 0, warning: 1, offline: 2, healthy: 3, resolving: 4 };

const EVENT_COLOR = {
  critical:   C.red,
  warning:    C.amber,
  action:     C.blue,
  resolved:   C.mint,
  escalation: C.red,
  info:       C.dim,
};

/* Exported so tests can use it as mock fetch data without hitting the network. */
export const FRIDGES = [
  {
    id: "BK-01", store: "Brooklyn — Atlantic Ave", model: "Carrier ZX-900 Walk-in",
    target: -18, temp: -17.4, status: "healthy", compressor: 98, door: "closed",
    install: "2023-04-12", warranty: "valid", warrantyEnds: "2026-04-12",
    vendor: "Carrier Service NE", sla: "4h", failures: 0,
    stock: 9200, repairTotal: 0, replaceCost: 14000,
    technicianName: "Mike Torres", storeManager: { name: "Sarah Kim", phone: "718-555-0142" },
    history: [{ d: "2024-11-02", t: "Routine service", who: "Carrier Service NE", note: "Filters cleaned, gas topped" }],
  },
  {
    id: "BK-03", store: "Brooklyn — Atlantic Ave", model: "True T-49 Reach-in",
    target: 4, temp: 9.8, status: "warning", compressor: 71, door: "ajar",
    install: "2021-06-30", warranty: "expiring", warrantyEnds: "2026-07-15",
    vendor: "ColdFix Contractors", sla: "6h", failures: 2,
    stock: 3100, repairTotal: 2400, replaceCost: 6500,
    technicianName: "Danny Ruiz", storeManager: { name: "Sarah Kim", phone: "718-555-0142" },
    history: [
      { d: "2026-01-18", t: "Compressor short-cycling", who: "ColdFix Contractors", note: "Relay replaced — $1,300" },
      { d: "2025-08-09", t: "Door gasket leak", who: "ColdFix Contractors", note: "Gasket swap — $1,100" },
    ],
  },
  {
    id: "QN-02", store: "Queens — Astoria", model: "Hoshizaki F-2000 Freezer",
    target: -20, temp: -6.1, status: "critical", compressor: 22, door: "closed",
    install: "2020-02-14", warranty: "void", warrantyEnds: "2024-02-14",
    vendor: "ColdFix Contractors", sla: "6h", failures: 4,
    stock: 5400, repairTotal: 4100, replaceCost: 7000,
    technicianName: "Danny Ruiz", storeManager: { name: "Marcus Webb", phone: "718-555-0391" },
    history: [
      { d: "2026-04-21", t: "Compressor failure", who: "ColdFix Contractors", note: "Rebuild — $1,600" },
      { d: "2025-12-03", t: "Fan motor seized", who: "ColdFix Contractors", note: "Motor replaced — $900" },
      { d: "2025-06-17", t: "Refrigerant leak", who: "ColdFix Contractors", note: "Reseal + recharge — $1,000" },
      { d: "2024-10-28", t: "Thermostat fault", who: "ColdFix Contractors", note: "Controller swap — $600" },
    ],
  },
  {
    id: "QN-05", store: "Queens — Astoria", model: "Carrier ZX-900 Walk-in",
    target: -18, temp: -18.2, status: "healthy", compressor: 95, door: "closed",
    install: "2024-09-01", warranty: "valid", warrantyEnds: "2027-09-01",
    vendor: "Carrier Service NE", sla: "4h", failures: 0,
    stock: 8700, repairTotal: 0, replaceCost: 14000,
    technicianName: "Mike Torres", storeManager: { name: "Marcus Webb", phone: "718-555-0391" },
    history: [],
  },
  {
    id: "NJ-04", store: "Newark — Ironbound", model: "True GDM-49 Display",
    target: 3, temp: 3.4, status: "healthy", compressor: 89, door: "closed",
    install: "2022-11-20", warranty: "valid", warrantyEnds: "2025-11-20",
    vendor: "Carrier Service NE", sla: "4h", failures: 1,
    stock: 2600, repairTotal: 700, replaceCost: 5200,
    technicianName: "Linda Cho", storeManager: { name: "Darius Okon", phone: "973-555-0274" },
    history: [{ d: "2025-03-14", t: "Lighting ballast", who: "Carrier Service NE", note: "LED retrofit — $700" }],
  },
  {
    id: "NJ-07", store: "Newark — Ironbound", model: "Hoshizaki F-2000 Freezer",
    target: -20, temp: -19.6, status: "offline", compressor: null, door: "—",
    install: "2021-01-10", warranty: "expiring", warrantyEnds: "2026-08-01",
    vendor: "ColdFix Contractors", sla: "6h", failures: 1,
    stock: 4800, repairTotal: 850, replaceCost: 7000,
    technicianName: "Danny Ruiz", storeManager: { name: "Darius Okon", phone: "973-555-0274" },
    history: [{ d: "2025-09-22", t: "Sensor calibration", who: "ColdFix Contractors", note: "Probe replaced — $850" }],
  },
];

import { advise, spoilWindow, playbook as basePlaybook, stockAtRisk, statusCounts } from "./logic.js";

const STEP_ICONS = { dispatch: Wrench, relocate: PackageX, hold: Truck, warranty: ShieldCheck };
const playbook = (f) => basePlaybook(f).map((s) => ({ ...s, icon: STEP_ICONS[s.key] }));

const CONFIRM_MSG = {
  dispatch: (f) => `${f.technicianName || f.vendor} confirmed — on route, ETA ${f.sla}`,
  relocate: (f) => `${f.storeManager?.name || "Store manager"} confirmed — stock being relocated`,
  hold:     (f) => `${f.storeManager?.name || "Receiving team"} confirmed — deliveries held`,
  warranty: (f) => `Incident #${f.id} logged in audit trail`,
};

/* ───────────────────────── Helpers ───────────────────────── */
function relativeTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/* ───────────────────────── Components ───────────────────────── */
function Badge({ status }) {
  const s = STATUS[status] || STATUS.offline;
  return (
    <span style={{
      color: s.c, background: s.bg, border: `1px solid ${s.c}33`,
      fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

function TempDial({ f }) {
  const drift = f.temp - f.target;
  const ok   = Math.abs(drift) < 2;
  const warn = Math.abs(drift) >= 2 && Math.abs(drift) < 6;
  const col  = f.status === "offline" ? C.dim : ok ? C.mint : warn ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 30, fontWeight: 800, color: col, lineHeight: 1 }}>
        {f.status === "offline" ? "—" : `${f.temp.toFixed(1)}°`}
      </span>
      <span style={{ color: C.dim, fontSize: 12, fontFamily: "var(--mono)" }}>
        target {f.target}°C
      </span>
    </div>
  );
}

function FridgeCard({ f, onOpen, isEscalated, onEdit, isRuined }) {
  const adv = advise(f);
  return (
    <button
      onClick={() => onOpen(f.id)}
      aria-label={`${f.id} — ${f.store}, ${f.model}, status: ${f.status}`}
      style={{
        textAlign: "left", cursor: "pointer", width: "100%",
        background: C.panel,
        border: `1px solid ${isRuined ? C.red : isEscalated ? C.red : f.status === "critical" ? C.red + "55" : C.line}`,
        borderRadius: 14, padding: 16, color: C.ink,
        display: "flex", flexDirection: "column", gap: 12,
        transition: "transform .12s",
        animation: isEscalated ? "pulse-shadow 1.5s ease-in-out infinite" : "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
    >
      {isRuined && (
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: ".06em",
          color: C.red, background: C.redDeep, border: `1px solid ${C.red}55`,
          borderRadius: 5, padding: "3px 8px", alignSelf: "flex-start",
        }}>STOCK RUINED</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: C.frost, fontWeight: 700 }}>{f.id}</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{f.model}</div>
        </div>
        <Badge status={f.status} />
      </div>
      <TempDial f={f} />
      <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.dim, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Activity size={13} /> {f.compressor == null ? "—" : `${f.compressor}%`}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Snowflake size={13} /> {f.door}
        </span>
        {f.failures > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: f.failures >= 4 ? C.red : C.amber }}>
            <History size={13} /> {f.failures} faults
          </span>
        )}
      </div>
      {(f.status === "critical" || f.status === "warning") && (
        <div style={{
          marginTop: 2, fontSize: 11, fontWeight: 700,
          color: adv.replace ? C.red : C.amber,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {adv.replace ? <TrendingDown size={13} /> : <Wrench size={13} />}
          {adv.replace ? "Recommend replace" : "Repair viable"}
          <ChevronRight size={13} style={{ marginLeft: "auto", color: C.dim }} />
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={e => { e.stopPropagation(); onEdit(f.id); }}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onEdit(f.id); } }}
        style={{
          background: "none", border: `1px solid ${C.line}`, color: C.dim,
          borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start",
        }}
      >
        <Edit3 size={11} /> Edit
      </div>
    </button>
  );
}

function ActivityFeed({ events }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 15000);
    return () => clearInterval(t);
  }, []);
  void tick;

  return (
    <div style={{
      width: 272, flexShrink: 0,
      background: C.panel, border: `1px solid ${C.line}`,
      borderRadius: 14, padding: 16,
      position: "sticky", top: 76, alignSelf: "flex-start",
      maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: C.dim,
        flexShrink: 0,
      }}>
        <Bell size={13} /> Activity
      </div>

      {events.length === 0 ? (
        <div style={{ fontSize: 12, color: C.dim, textAlign: "center", padding: "20px 0" }}>
          Monitoring fleet…
        </div>
      ) : (
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map(e => (
            <div key={e.id} style={{ paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                  color: EVENT_COLOR[e.type] || C.dim,
                  background: (EVENT_COLOR[e.type] || C.dim) + "18",
                  padding: "1px 6px", borderRadius: 4,
                }}>{e.unitId}</span>
                <span style={{ fontSize: 10, color: C.dim }}>{relativeTime(e.ts)}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: e.type === "escalation" ? C.red : C.ink }}>
                {e.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Single step row with its own state machine ─── */
function StepRow({ step, state, onExecute, onSkip }) {
  const Icon  = step.icon;
  const { status, confirmedAt } = state;
  const isDone    = status === "confirmed" || status === "skipped";
  const isSkipped = status === "skipped";

  return (
    <div style={{
      display: "flex", gap: 12, padding: 12, borderRadius: 10,
      background: isDone && !isSkipped ? "rgba(52,211,153,.07)" : C.panel2,
      border: `1px solid ${isDone && !isSkipped ? C.mint + "33" : C.line}`,
      transition: "all .3s",
      opacity: isSkipped ? 0.5 : 1,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isDone ? (isSkipped ? C.line + "44" : C.mint + "22") : C.line + "55",
      }}>
        {status === "confirmed"  && <CheckCircle2 size={17} color={C.mint} />}
        {status === "executing"  && <Loader2 size={17} color={C.frost} style={{ animation: "spin 1s linear infinite" }} />}
        {status === "awaiting"   && <Clock size={17} color={C.amber} />}
        {status === "skipped"    && <SkipForward size={17} color={C.dim} />}
        {status === "idle"       && <Icon size={16} color={C.frost} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          textDecoration: isSkipped ? "line-through" : "none",
          color: isSkipped ? C.dim : C.ink,
        }}>
          {step.label}
        </div>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 2, lineHeight: 1.4 }}>
          {status === "awaiting"  ? "Awaiting response…" :
           status === "confirmed" ? `Confirmed ${confirmedAt ? relativeTime(confirmedAt) : ""}` :
           status === "skipped"   ? "Skipped — handled outside system" :
           step.detail}
        </div>
      </div>

      {status === "idle" && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={() => onExecute(step.key)}
            style={{
              background: "none", border: `1px solid ${C.frost}77`, color: C.frost,
              borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
            Execute
          </button>
          <button
            onClick={() => onSkip(step.key)}
            aria-label={`Skip ${step.label}`}
            title="Already handled"
            style={{
              background: "none", border: `1px solid ${C.line}`, color: C.dim,
              borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center",
            }}>
            <SkipForward size={13} />
          </button>
        </div>
      )}
      {status === "executing" && (
        <span style={{ fontSize: 11, color: C.dim, alignSelf: "center", flexShrink: 0 }}>Sending…</span>
      )}
      {status === "awaiting" && (
        <span style={{ fontSize: 11, color: C.amber, alignSelf: "center", flexShrink: 0 }}>Pending</span>
      )}
    </div>
  );
}

/* ─── Incident modal with per-step playbook ─── */
function PlaybookRunner({ f, onClose, onResolve, addEvent, onClearEscalation }) {
  const steps = useMemo(() => playbook(f), [f]);
  const [stepStates, setStepStates] = useState(() =>
    steps.map(() => ({ status: "idle", confirmedAt: null }))
  );
  const timers          = useRef([]);
  const escalationCleared = useRef(false);
  const resolvedFired   = useRef(false);

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

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,9,16,.72)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: 24, zIndex: 50, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        data-testid="incident-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18,
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
          <button onClick={onClose} aria-label="Close incident view"
            style={{ background: "none", border: "none", color: C.dim, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {spoil && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: f.status === "critical" ? C.redDeep : "rgba(245,184,71,.1)",
            border: `1px solid ${f.status === "critical" ? C.red + "55" : C.amber + "55"}`,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <AlertTriangle size={22} color={f.status === "critical" ? C.red : C.amber} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>~${spoil.value.toLocaleString()} of stock at risk</div>
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
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize", color: f.warranty === "valid" ? C.mint : f.warranty === "void" ? C.red : C.amber }}>
              {f.warranty}
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>through {f.warrantyEnds}</div>
          </div>
          <div style={{
            padding: 14, borderRadius: 12,
            background: adv.replace ? C.redDeep : "rgba(52,211,153,.06)",
            border: `1px solid ${adv.replace ? C.red + "44" : C.mint + "33"}`,
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
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{h.t}</div>
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

/* ───────────────────────── New components ───────────────────────── */

function AppHeader({ fridgesCount, loading, escalatedCount, lastUpdated, onAddUnit }) {
  return (
    <header style={{
      background: C.panel, borderBottom: `1px solid ${C.line}`,
      padding: "0 24px", height: 60,
      display: "flex", alignItems: "center", gap: 14,
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg,#0E2C36,#0B1220)",
        border: `1px solid ${C.frost}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Thermometer size={20} color={C.frost} />
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.01em" }}>ColdChain Ops</div>
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
          fontSize: 12, color: C.frost, background: C.frost + "18",
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
          background: C.frost + "18", border: `1px solid ${C.frost}66`,
          color: C.frost, borderRadius: 8, padding: "7px 14px",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
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
          background: C.frost + "33", border: `1px solid ${C.frost}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: C.frost,
        }}>R</div>
        <span style={{ fontSize: 12, color: C.dim }}>RavTech Ops</span>
      </div>
    </header>
  );
}

function AppFooter({ fridges }) {
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

function FiltersBar({ searchQuery, onSearch, filterStatus, onFilterStatus, filterStore, onFilterStore, storeOptions, sortMode, onSort, resultCount, totalCount }) {
  const STATUSES = ["all", "critical", "warning", "healthy", "offline"];
  const isFiltered = searchQuery || filterStatus !== "all" || filterStore !== "all";

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
        <Search size={13} color={C.dim} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by unit, store, or model…"
          style={{
            width: "100%", background: C.panel, border: `1px solid ${C.line}`,
            borderRadius: 8, padding: "8px 10px 8px 30px", color: C.ink, fontSize: 13,
            boxSizing: "border-box", outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STATUSES.map(s => {
          const active = filterStatus === s;
          const st = STATUS[s];
          return (
            <button
              key={s}
              onClick={() => onFilterStatus(s)}
              style={{
                fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                background: active && st ? st.bg : active ? C.frost + "18" : "none",
                border: `1px solid ${active && st ? st.c : active ? C.frost : C.line}`,
                color: active && st ? st.c : active ? C.frost : C.dim,
                textTransform: "capitalize",
              }}
            >{s === "all" ? "All" : STATUS[s]?.label || s}</button>
          );
        })}
      </div>

      <select
        value={filterStore}
        onChange={e => onFilterStore(e.target.value)}
        style={{
          background: C.panel, border: `1px solid ${C.line}`,
          color: filterStore !== "all" ? C.ink : C.dim,
          borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer", outline: "none",
        }}
      >
        {storeOptions.map(s => (
          <option key={s} value={s}>{s === "all" ? "All Stores" : s.split(" —")[0]}</option>
        ))}
      </select>

      <select
        value={sortMode}
        onChange={e => onSort(e.target.value)}
        style={{
          background: C.panel, border: `1px solid ${C.line}`, color: C.ink,
          borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer", outline: "none",
        }}
      >
        <option value="urgency">Sort: Urgency</option>
        <option value="temp">Sort: Temp Drift</option>
        <option value="stock">Sort: Stock Value</option>
      </select>

      {isFiltered && (
        <span style={{ fontSize: 11, color: C.dim }}>
          {resultCount} of {totalCount} unit{totalCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function RuinedToast({ fridge, onDismiss, onOpenModal }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 30000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", top: 76, right: 16, zIndex: 200,
      width: 360, background: C.redDeep,
      border: `1px solid ${C.red}`, borderRadius: 12, padding: 16,
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
            flex: 1, background: C.red + "22", border: `1px solid ${C.red}66`,
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

function RuinedModal({ fridge, onClose, onConfirmWriteOff, recentEvents }) {
  const drift = (fridge.temp - fridge.target).toFixed(1);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,9,16,.8)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: 24, zIndex: 150, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.red}55`, borderRadius: 18,
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
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          padding: 14, borderRadius: 12, background: C.redDeep, border: `1px solid ${C.red}55`,
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
            background: C.red + "22", border: `1px solid ${C.red}66`, color: C.red,
            borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            Confirm Write-off (${fridge.stock.toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ fridge, onClose, onSave, onDeleteRequest }) {
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
  const SEL = { ...INP, cursor: "pointer" };
  const LBL = { fontSize: 12, color: C.dim, display: "block", marginBottom: 14 };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,9,16,.8)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: 24, zIndex: 150, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18,
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
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <label style={LBL}>
            Target Temp (°C)
            <input type="number" step="0.5" value={form.target} onChange={e => set("target", e.target.value)} style={INP} />
          </label>
          <label style={LBL}>
            Status
            <select value={form.status} onChange={e => set("status", e.target.value)} style={SEL}>
              {["healthy","warning","critical","offline"].map(s => (
                <option key={s} value={s}>{STATUS[s]?.label || s}</option>
              ))}
            </select>
          </label>
          <label style={LBL}>
            Compressor (%)
            <input type="number" min="0" max="100" value={form.compressor} onChange={e => set("compressor", e.target.value)} style={INP} />
          </label>
          <label style={LBL}>
            Door State
            <select value={form.door} onChange={e => set("door", e.target.value)} style={SEL}>
              {["closed","ajar","—"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label style={LBL}>
            Stock Value ($)
            <input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} style={INP} />
          </label>
          <label style={LBL}>
            SLA
            <select value={form.sla} onChange={e => set("sla", e.target.value)} style={SEL}>
              <option value="4h">4 hours</option>
              <option value="6h">6 hours</option>
            </select>
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
              background: C.redDeep, border: `1px solid ${C.red}55`,
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
              background: C.frost + "22", border: `1px solid ${C.frost}66`, color: C.frost,
              borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700,
              cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
            }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onSave, existingIds, knownStores }) {
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
  const SEL = { ...INP, cursor: "pointer" };
  const LBL = { fontSize: 12, color: C.dim, display: "block", marginBottom: 14 };
  const ERR = { fontSize: 11, color: C.red, marginLeft: 6 };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,9,16,.8)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: 24, zIndex: 150, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18,
        width: "min(580px, 100%)", padding: 24, color: C.ink, marginTop: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} color={C.frost} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>Add New Unit</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer" }}>
            <X size={20} />
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
          <select value={form.store} onChange={e => set("store", e.target.value)} style={{ ...SEL, borderColor: errors.store ? C.red : C.line }}>
            {STORE_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
            <select value={form.sla} onChange={e => set("sla", e.target.value)} style={SEL}>
              <option value="4h">4 hours</option>
              <option value="6h">6 hours</option>
            </select>
          </label>
          <label style={LBL}>
            Warranty
            <select value={form.warranty} onChange={e => set("warranty", e.target.value)} style={SEL}>
              {["valid","expiring","void"].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
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
            background: C.frost + "22", border: `1px solid ${C.frost}66`, color: C.frost,
            borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700,
            cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
          }}>{saving ? "Adding…" : "Add Unit"}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ fridge, onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,9,16,.7)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 200,
      }}
      onClick={onCancel}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16,
        width: "min(380px, 90vw)", padding: 24, color: C.ink,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
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
            background: C.redDeep, border: `1px solid ${C.red}66`, color: C.red,
            borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>Delete Unit</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Main dashboard ───────────────────────── */
export default function ColdChainDashboard() {
  const [fridges, setFridges]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [openId, setOpenId]       = useState(null);
  const [events, setEvents]       = useState([]);
  const [escalated, setEscalated] = useState(new Set());
  const criticalSince = useRef({});
  const eventIdRef    = useRef(0);
  const fridgesRef    = useRef([]);

  // Filters & search
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStore, setFilterStore]   = useState("all");
  const [sortMode, setSortMode]         = useState("urgency");

  // Ruined stock
  const [ruinedIds, setRuinedIds]       = useState(new Set());
  const [ruinedAlert, setRuinedAlert]   = useState(null);
  const [ruinedModal, setRuinedModal]   = useState(null);
  const ruinCheckedRef                  = useRef(new Set());

  // Edit / Add / Delete
  const [editTarget, setEditTarget]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Timestamp
  const [lastUpdated, setLastUpdated]   = useState(null);

  useEffect(() => { fridgesRef.current = fridges; }, [fridges]);

  const addEvent = useCallback((unitId, message, type = "info") => {
    setEvents(prev => [
      { id: ++eventIdRef.current, ts: Date.now(), unitId, message, type },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Fetch
  useEffect(() => {
    let alive = true;
    function load() {
      fetchFridges()
        .then(data => {
          if (alive) {
            setFridges(data);
            setError(null);
            setLoading(false);
            setLastUpdated(Date.now());
          }
        })
        .catch(err => { if (alive) { setError(err.message); setLoading(false); } });
    }
    load();
    const poll = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(poll); };
  }, []);

  // Temperature drift
  useEffect(() => {
    if (!fridges.length) return;
    const t = setInterval(() => {
      const drifting = fridgesRef.current
        .filter(f => f.status === "critical" || f.status === "warning")
        .map(f => ({
          id: f.id, status: f.status, currentTemp: f.temp,
          delta: +(Math.random() * 0.2 + 0.15).toFixed(1),
        }));
      if (!drifting.length) return;
      drifting.forEach(({ id, status, currentTemp, delta }) =>
        addEvent(id, `${id} — temp now ${+(currentTemp + delta).toFixed(1)}°C (+${delta}°)`, status)
      );
      setFridges(prev => prev.map(f => {
        const d = drifting.find(x => x.id === f.id);
        return d ? { ...f, temp: +(f.temp + d.delta).toFixed(1) } : f;
      }));
    }, 4000);
    return () => clearInterval(t);
  }, [!!fridges.length, addEvent]);

  // Escalation
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      fridgesRef.current.forEach(f => {
        if (f.status !== "critical") return;
        if (!criticalSince.current[f.id]) criticalSince.current[f.id] = now;
        const elapsed = (now - criticalSince.current[f.id]) / 1000;
        if (elapsed > 45) {
          setEscalated(prev => {
            if (prev.has(f.id)) return prev;
            addEvent(f.id, `${f.id} — no response in 45s · escalating to regional ops`, "escalation");
            return new Set([...prev, f.id]);
          });
        }
      });
    }, 5000);
    return () => clearInterval(t);
  }, [addEvent]);

  // Ruined stock detection — drift >= 12°C above target on a critical unit
  useEffect(() => {
    if (!fridges.length) return;
    const t = setInterval(() => {
      fridgesRef.current.forEach(f => {
        if (ruinCheckedRef.current.has(f.id)) return;
        if (ruinedIds.has(f.id)) return;
        const drift = f.temp - f.target;
        if (f.status === "critical" && drift >= 12) {
          ruinCheckedRef.current.add(f.id);
          setRuinedAlert({ fridge: f });
          addEvent(f.id, `STOCK SPOILED — ${f.id} at ${f.store}: $${f.stock.toLocaleString()} product likely ruined`, "escalation");
        }
      });
    }, 5000);
    return () => clearInterval(t);
  }, [!!fridges.length, addEvent, ruinedIds]);

  // Derived state
  const displayedFridges = useMemo(() => {
    let list = [...fridges];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(f =>
        f.id.toLowerCase().includes(q) ||
        f.store.toLowerCase().includes(q) ||
        f.model.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter(f => f.status === filterStatus);
    if (filterStore !== "all")  list = list.filter(f => f.store === filterStore);
    if (sortMode === "urgency") list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    else if (sortMode === "temp")  list.sort((a, b) => Math.abs(b.temp - b.target) - Math.abs(a.temp - a.target));
    else if (sortMode === "stock") list.sort((a, b) => b.stock - a.stock);
    return list;
  }, [fridges, searchQuery, filterStatus, filterStore, sortMode]);

  const storeOptions = useMemo(() =>
    ["all", ...new Set(fridges.map(f => f.store))],
  [fridges]);

  const counts  = useMemo(() => statusCounts(fridges), [fridges]);
  const atRisk  = useMemo(() => stockAtRisk(fridges), [fridges]);
  const openFridge = useMemo(() => (openId ? fridges.find(f => f.id === openId) : null), [openId, fridges]);

  const escalatedActive = useMemo(
    () => [...escalated].filter(id => fridges.find(f => f.id === id && f.status === "critical")),
    [escalated, fridges]
  );

  function handleResolve(id) {
    setFridges(prev => prev.map(f => f.id === id ? { ...f, status: "resolving" } : f));
    setEscalated(prev => { const n = new Set(prev); n.delete(id); return n; });
    delete criticalSince.current[id];
  }

  function handleClearEscalation(id) {
    delete criticalSince.current[id];
    setEscalated(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleEditSave(id, formData) {
    const updated = await patchFridge(id, formData);
    setFridges(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
    addEvent(id, `${id} — unit details updated`, "info");
    setEditTarget(null);
  }

  async function handleAddSave(formData) {
    const newFridge = await createFridge(formData);
    setFridges(prev => [...prev, newFridge]);
    addEvent(newFridge.id, `${newFridge.id} — new unit added at ${newFridge.store}`, "info");
    setShowAddModal(false);
  }

  async function handleDelete(id) {
    await deleteFridge(id);
    setFridges(prev => prev.filter(f => f.id !== id));
    addEvent(id, `${id} — unit removed from fleet`, "info");
    setDeleteTarget(null);
  }

  function handleConfirmWriteOff(fridgeId) {
    const f = fridges.find(x => x.id === fridgeId);
    setRuinedIds(prev => new Set([...prev, fridgeId]));
    addEvent(fridgeId, `${fridgeId} — stock write-off confirmed: $${f?.stock?.toLocaleString()} logged`, "escalation");
    setRuinedModal(null);
  }

  return (
    <div style={{
      "--mono": "ui-monospace, 'SF Mono', 'Roboto Mono', monospace",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: C.bg, minHeight: "100vh", color: C.ink,
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-shadow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,107,107,.5); }
          50%       { box-shadow: 0 0 0 8px rgba(251,107,107,0); }
        }
        @keyframes slide-in-right {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        select option { background: #121C2E; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>

      {/* Ruined stock toast — fixed, above everything */}
      {ruinedAlert && (
        <RuinedToast
          fridge={ruinedAlert.fridge}
          onDismiss={() => setRuinedAlert(null)}
          onOpenModal={() => { setRuinedModal(ruinedAlert); setRuinedAlert(null); }}
        />
      )}

      {/* Sticky header — full width */}
      <AppHeader
        fridgesCount={fridges.length}
        loading={loading}
        escalatedCount={escalatedActive.length}
        lastUpdated={lastUpdated}
        onAddUnit={() => setShowAddModal(true)}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>

        {/* Stock-at-risk summary */}
        {!loading && atRisk > 0 && (
          <div style={{ marginBottom: 12, textAlign: "right" }}>
            <span style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em" }}>Stock at risk: </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: C.amber }}>${atRisk.toLocaleString()}</span>
          </div>
        )}

        {/* Escalation banner */}
        {escalatedActive.length > 0 && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: 10,
            background: C.redDeep, border: `1px solid ${C.red}77`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Bell size={16} color={C.red} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
              Escalation — {escalatedActive.join(", ")} {escalatedActive.length === 1 ? "has" : "have"} been unacknowledged for 45+ seconds. Regional ops notified.
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.dim, margin: "40px 0", justifyContent: "center" }}>
            <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span>Loading fleet data…</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            margin: "20px 0", padding: 16, borderRadius: 12,
            background: C.redDeep, border: `1px solid ${C.red}44`,
            color: C.red, fontSize: 13,
          }}>
            Failed to load fleet data — {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Status strip */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.entries(counts).map(([k, v]) =>
                STATUS[k] ? (
                  <div key={k} style={{
                    flex: "1 1 120px", padding: "12px 16px", borderRadius: 12,
                    background: STATUS[k].bg, border: `1px solid ${STATUS[k].c}33`,
                  }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800, color: STATUS[k].c }}>{v}</div>
                    <div style={{ fontSize: 12, color: C.dim }}>{STATUS[k].label}</div>
                  </div>
                ) : null
              )}
            </div>

            {/* Filters & search */}
            <FiltersBar
              searchQuery={searchQuery} onSearch={setSearchQuery}
              filterStatus={filterStatus} onFilterStatus={setFilterStatus}
              filterStore={filterStore} onFilterStore={setFilterStore}
              storeOptions={storeOptions}
              sortMode={sortMode} onSort={setSortMode}
              resultCount={displayedFridges.length}
              totalCount={fridges.length}
            />

            {/* Grid + activity feed */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                  {displayedFridges.map(f => (
                    <FridgeCard
                      key={f.id}
                      f={f}
                      onOpen={setOpenId}
                      onEdit={id => setEditTarget(fridges.find(x => x.id === id))}
                      isEscalated={escalated.has(f.id)}
                      isRuined={ruinedIds.has(f.id)}
                    />
                  ))}
                </div>
                {displayedFridges.length === 0 && (
                  <div style={{ color: C.dim, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                    No units match the current filters.
                  </div>
                )}
                <p style={{ color: C.dim, fontSize: 12, marginTop: 24, textAlign: "center" }}>
                  Tap any unit to open its incident view. Execute each response step individually, or mark it as already handled.
                </p>
              </div>

              <ActivityFeed events={events} />
            </div>

            <AppFooter fridges={fridges} />
          </>
        )}
      </div>

      {/* Modals */}
      {openFridge && (
        <PlaybookRunner
          f={openFridge}
          onClose={() => setOpenId(null)}
          onResolve={handleResolve}
          addEvent={addEvent}
          onClearEscalation={handleClearEscalation}
        />
      )}
      {ruinedModal && (
        <RuinedModal
          fridge={ruinedModal.fridge}
          onClose={() => setRuinedModal(null)}
          onConfirmWriteOff={handleConfirmWriteOff}
          recentEvents={events.filter(e => e.unitId === ruinedModal.fridge.id).slice(0, 5)}
        />
      )}
      {editTarget && (
        <EditModal
          fridge={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
          onDeleteRequest={id => setDeleteTarget(fridges.find(f => f.id === id))}
        />
      )}
      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
          existingIds={new Set(fridges.map(f => f.id))}
          knownStores={storeOptions.filter(s => s !== "all")}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          fridge={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  );
}
