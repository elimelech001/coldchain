import { useState, useEffect, useMemo } from "react";
import {
  Thermometer, AlertTriangle, CheckCircle2, Clock, Wrench, Truck,
  PackageX, ShieldCheck, ShieldAlert, Snowflake, Activity, DollarSign,
  ChevronRight, X, Send, MapPin, TrendingDown, History, RefreshCw,
} from "lucide-react";
import { fetchFridges } from "./api/client.js";

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
};

const STATUS = {
  healthy: { c: C.mint, label: "Healthy", bg: "rgba(52,211,153,.12)" },
  warning: { c: C.amber, label: "Warning", bg: "rgba(245,184,71,.12)" },
  critical: { c: C.red, label: "Critical", bg: "rgba(251,107,107,.14)" },
  offline: { c: C.dim, label: "Offline", bg: "rgba(138,160,188,.12)" },
};

/* Exported so tests can use it as mock fetch data without hitting the network. */
export const FRIDGES = [
  {
    id: "BK-01", store: "Brooklyn — Atlantic Ave", model: "Carrier ZX-900 Walk-in",
    target: -18, temp: -17.4, status: "healthy", compressor: 98, door: "closed",
    install: "2023-04-12", warranty: "valid", warrantyEnds: "2026-04-12",
    vendor: "Carrier Service NE", sla: "4h", failures: 0,
    stock: 9200, repairTotal: 0, replaceCost: 14000,
    history: [{ d: "2024-11-02", t: "Routine service", who: "Carrier Service NE", note: "Filters cleaned, gas topped" }],
  },
  {
    id: "BK-03", store: "Brooklyn — Atlantic Ave", model: "True T-49 Reach-in",
    target: 4, temp: 9.8, status: "warning", compressor: 71, door: "ajar",
    install: "2021-06-30", warranty: "expiring", warrantyEnds: "2026-07-15",
    vendor: "ColdFix Contractors", sla: "6h", failures: 2,
    stock: 3100, repairTotal: 2400, replaceCost: 6500,
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
    stock: 8700, repairTotal: 0, replaceCost: 14000, history: [],
  },
  {
    id: "NJ-04", store: "Newark — Ironbound", model: "True GDM-49 Display",
    target: 3, temp: 3.4, status: "healthy", compressor: 89, door: "closed",
    install: "2022-11-20", warranty: "valid", warrantyEnds: "2025-11-20",
    vendor: "Carrier Service NE", sla: "4h", failures: 1,
    stock: 2600, repairTotal: 700, replaceCost: 5200,
    history: [{ d: "2025-03-14", t: "Lighting ballast", who: "Carrier Service NE", note: "LED retrofit — $700" }],
  },
  {
    id: "NJ-07", store: "Newark — Ironbound", model: "Hoshizaki F-2000 Freezer",
    target: -20, temp: -19.6, status: "offline", compressor: null, door: "—",
    install: "2021-01-10", warranty: "expiring", warrantyEnds: "2026-08-01",
    vendor: "ColdFix Contractors", sla: "6h", failures: 1,
    stock: 4800, repairTotal: 850, replaceCost: 7000,
    history: [{ d: "2025-09-22", t: "Sensor calibration", who: "ColdFix Contractors", note: "Probe replaced — $850" }],
  },
];

import { advise, spoilWindow, playbook as basePlaybook, stockAtRisk, statusCounts, sortByUrgency } from "./logic.js";

const STEP_ICONS = { dispatch: Wrench, relocate: PackageX, hold: Truck, warranty: ShieldCheck };
const playbook = (f) => basePlaybook(f).map((s) => ({ ...s, icon: STEP_ICONS[s.key] }));

/* ───────────────────────── Components ───────────────────────── */
function Badge({ status }) {
  const s = STATUS[status];
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
  const ok = Math.abs(drift) < 2;
  const warn = Math.abs(drift) >= 2 && Math.abs(drift) < 6;
  const col = f.status === "offline" ? C.dim : ok ? C.mint : warn ? C.amber : C.red;
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

function FridgeCard({ f, onOpen }) {
  const adv = advise(f);
  return (
    <button
      onClick={() => onOpen(f)}
      aria-label={`${f.id} — ${f.store}, ${f.model}, status: ${f.status}`}
      style={{
        textAlign: "left", cursor: "pointer", width: "100%",
        background: C.panel, border: `1px solid ${f.status === "critical" ? C.red + "55" : C.line}`,
        borderRadius: 14, padding: 16, color: C.ink, display: "flex", flexDirection: "column",
        gap: 12, transition: "transform .12s, border-color .12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = C.frost + "66"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = f.status === "critical" ? C.red + "55" : C.line; }}
    >
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
    </button>
  );
}

function PlaybookRunner({ f, onClose }) {
  const steps = useMemo(() => playbook(f), [f]);
  const [done, setDone] = useState(steps.map(() => false));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const idx = done.findIndex(d => !d);
    if (idx === -1) { setRunning(false); return; }
    const t = setTimeout(() => setDone(p => p.map((d, i) => i === idx ? true : d)), 700);
    return () => clearTimeout(t);
  }, [running, done]);

  const adv = advise(f);
  const spoil = spoilWindow(f);
  const allDone = done.every(Boolean);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(5,9,16,.72)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 24, zIndex: 50,
      overflowY: "auto",
    }} onClick={onClose}>
      <div data-testid="incident-modal" onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18,
        width: "min(680px, 100%)", padding: 24, color: C.ink, marginTop: 20,
      }}>
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
          <button onClick={onClose} aria-label="Close incident view" style={{ background: "none", border: "none", color: C.dim, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* At-risk banner */}
        {spoil && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: f.status === "critical" ? C.redDeep : "rgba(245,184,71,.1)",
            border: `1px solid ${f.status === "critical" ? C.red + "55" : C.amber + "55"}`,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <AlertTriangle size={22} color={f.status === "critical" ? C.red : C.amber} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                ~${spoil.value.toLocaleString()} of stock at risk
              </div>
              <div style={{ fontSize: 12, color: C.dim }}>
                Est. {spoil.hours}h until product crosses food-safety threshold
              </div>
            </div>
          </div>
        )}

        {/* Response playbook */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>
            Response playbook
          </h3>
          <button onClick={() => setRunning(true)} disabled={running || allDone} style={{
            background: allDone ? "rgba(52,211,153,.15)" : C.frost,
            color: allDone ? C.mint : "#04121A", border: "none", borderRadius: 8,
            padding: "7px 14px", fontWeight: 700, fontSize: 13,
            cursor: running || allDone ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {allDone ? <><CheckCircle2 size={15} /> Resolved</> : running ? <><Clock size={15} /> Running…</> : <><Send size={15} /> Run playbook</>}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isDone = done[i];
            return (
              <div key={i} style={{
                display: "flex", gap: 12, padding: 12, borderRadius: 10,
                background: isDone ? "rgba(52,211,153,.07)" : C.panel2,
                border: `1px solid ${isDone ? C.mint + "33" : C.line}`,
                transition: "all .3s",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? C.mint + "22" : C.line + "55",
                }}>
                  {isDone ? <CheckCircle2 size={17} color={C.mint} /> : <Icon size={16} color={C.frost} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warranty + recommendation */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 12, background: C.panel2, border: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim, marginBottom: 8 }}>
              {f.warranty === "valid" ? <ShieldCheck size={15} color={C.mint} /> : <ShieldAlert size={15} color={f.warranty === "void" ? C.red : C.amber} />}
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

        {/* History log */}
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

/* ───────────────────────── Main dashboard ───────────────────────── */
export default function ColdChainDashboard() {
  const [fridges, setFridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let alive = true;

    function load() {
      fetchFridges()
        .then((data) => { if (alive) { setFridges(data); setError(null); setLoading(false); } })
        .catch((err) => { if (alive) { setError(err.message); setLoading(false); } });
    }

    load();
    const poll = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(poll); };
  }, []);

  const counts = useMemo(() => statusCounts(fridges), [fridges]);
  const atRisk = useMemo(() => stockAtRisk(fridges), [fridges]);
  const sorted = useMemo(() => sortByUrgency(fridges), [fridges]);

  return (
    <div style={{
      "--mono": "ui-monospace, 'SF Mono', 'Roboto Mono', monospace",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: C.bg, minHeight: "100vh", color: C.ink, padding: "28px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#0E2C36,#0B1220)",
            border: `1px solid ${C.frost}44`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Thermometer size={22} color={C.frost} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>ColdChain</h1>
            <div style={{ fontSize: 12, color: C.dim }}>
              Refrigeration fleet · 3 stores ·{" "}
              {loading ? "…" : `${fridges.length} units`}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em" }}>Stock at risk</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800, color: atRisk > 0 ? C.amber : C.mint }}>
              ${atRisk.toLocaleString()}
            </div>
          </div>
        </header>

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.dim, margin: "40px 0", justifyContent: "center" }}>
            <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span>Loading fleet data…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            margin: "20px 0", padding: 16, borderRadius: 12,
            background: C.redDeep, border: `1px solid ${C.red}44`,
            color: C.red, fontSize: 13,
          }}>
            Failed to load fleet data — {error}
          </div>
        )}

        {/* Status strip */}
        {!loading && !error && (
          <div style={{ display: "flex", gap: 10, margin: "20px 0 24px", flexWrap: "wrap" }}>
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} style={{
                flex: "1 1 140px", padding: "12px 16px", borderRadius: 12,
                background: STATUS[k].bg, border: `1px solid ${STATUS[k].c}33`,
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800, color: STATUS[k].c }}>{v}</div>
                <div style={{ fontSize: 12, color: C.dim }}>{STATUS[k].label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Fleet grid */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
            {sorted.map(f => <FridgeCard key={f.id} f={f} onOpen={setOpen} />)}
          </div>
        )}

        {!loading && !error && (
          <p style={{ color: C.dim, fontSize: 12, marginTop: 24, textAlign: "center" }}>
            Tap any unit to open its incident view, run the response playbook, and see history, warranty & the repair-vs-replace call.
          </p>
        )}
      </div>

      {open && <PlaybookRunner f={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
