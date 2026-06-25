import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { C, EVENT_COLOR } from "../tokens.js";
import { relativeTime } from "../utils.js";

export default function ActivityFeed({ events }) {
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
      borderRadius: 14,
      position: "sticky", top: 76, alignSelf: "flex-start",
      maxHeight: "calc(100vh - 120px)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(15,23,42,.06)",
    }}>
      <style>{`
        .activity-scroll::-webkit-scrollbar { width: 4px; }
        .activity-scroll::-webkit-scrollbar-track { background: transparent; }
        .activity-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        .activity-scroll::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>

      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${C.line}`,
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: C.dim,
      }}>
        <Bell size={13} /> Activity
      </div>

      {events.length === 0 ? (
        <div style={{ fontSize: 12, color: C.dim, textAlign: "center", padding: "20px 16px" }}>
          Monitoring fleet…
        </div>
      ) : (
        <div
          className="activity-scroll"
          style={{
            flex: 1, overflowY: "auto", padding: "10px 12px",
            scrollbarWidth: "thin", scrollbarColor: `${C.line} transparent`,
          }}
        >
          {events.map(e => (
            <div key={e.id} style={{
              display: "flex", flexDirection: "column", gap: 3,
              padding: "7px 10px 7px 10px",
              borderRadius: 8, marginBottom: 6,
              background: C.panel2,
              borderLeft: `3px solid ${EVENT_COLOR[e.type] || C.dim}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                  color: EVENT_COLOR[e.type] || C.dim,
                }}>{e.unitId}</span>
                <span style={{ fontSize: 10, color: C.dim }}>{relativeTime(e.ts)}</span>
              </div>
              <div style={{
                fontSize: 12, lineHeight: 1.45,
                color: e.type === "escalation" ? C.red : C.ink,
              }}>
                {e.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
