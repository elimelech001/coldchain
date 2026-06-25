import { C } from "../tokens.js";

export default function TempDial({ f }) {
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
