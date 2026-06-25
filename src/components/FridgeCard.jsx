import { Activity, Snowflake, History, TrendingDown, Wrench, ChevronRight, Edit3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { C } from "../tokens.js";
import Badge from "./Badge.jsx";
import TempDial from "./TempDial.jsx";
import { advise } from "../logic.js";

export default function FridgeCard({ f, onEdit, isEscalated, isRuined }) {
  const navigate = useNavigate();
  const location = useLocation();
  const adv = advise(f);

  function handleOpen() {
    navigate(`/units/${f.id}`, { state: { backgroundLocation: location } });
  }

  return (
    <button
      onClick={handleOpen}
      aria-label={`${f.id} — ${f.store}, ${f.model}, status: ${f.status}`}
      style={{
        textAlign: "left", cursor: "pointer", width: "100%",
        background: C.panel,
        border: `1px solid ${isRuined || isEscalated ? C.red : f.status === "critical" ? "#FECACA" : C.line}`,
        borderRadius: 14, padding: 16, color: C.ink,
        display: "flex", flexDirection: "column", gap: 12,
        transition: "box-shadow 180ms ease, transform 180ms ease",
        boxShadow: "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)",
        animation: isEscalated ? "pulse-shadow 1.5s ease-in-out infinite" : "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,.10), 0 2px 4px rgba(15,23,42,.06)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)";
        e.currentTarget.style.transform = "";
      }}
    >
      {isRuined && (
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: ".06em",
          color: C.red, background: C.redDeep, border: `1px solid #FECACA`,
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
