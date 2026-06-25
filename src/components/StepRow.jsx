import { CheckCircle2, Clock, Loader2, SkipForward } from "lucide-react";
import { C } from "../tokens.js";
import { relativeTime } from "../utils.js";

export default function StepRow({ step, state, onExecute, onSkip }) {
  const Icon  = step.icon;
  const { status, confirmedAt } = state;
  const isDone    = status === "confirmed" || status === "skipped";
  const isSkipped = status === "skipped";

  return (
    <div style={{
      display: "flex", gap: 12, padding: 12, borderRadius: 10,
      background: isDone && !isSkipped ? "#F0FDF4" : C.panel2,
      border: `1px solid ${isDone && !isSkipped ? "#BBF7D0" : C.line}`,
      transition: "all .3s",
      opacity: isSkipped ? 0.55 : 1,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isDone ? (isSkipped ? C.line + "44" : "rgba(5,150,105,.12)") : C.line + "55",
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
              background: C.frost, border: "none", color: "#fff",
              borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 1px 2px rgba(8,145,178,.25)",
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
