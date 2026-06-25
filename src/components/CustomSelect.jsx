import { useRef, useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { C } from "../tokens.js";

export default function CustomSelect({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); }
    if (e.key === "Escape") setOpen(false);
  }

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          height: 36, background: C.panel,
          border: `1px solid ${open ? C.frost : C.line}`,
          borderRadius: 8, padding: "0 10px 0 12px",
          color: selected ? C.ink : C.dim,
          fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
          boxShadow: open ? `0 0 0 3px rgba(8,145,178,.12)` : "none",
          transition: "border-color .15s, box-shadow .15s",
          outline: "none",
        }}
      >
        {selected ? selected.label : placeholder}
        <ChevronDown
          size={14}
          color={C.dim}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 40,
          minWidth: "100%", background: C.panel,
          border: `1px solid ${C.line}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.06)",
          maxHeight: 240, overflowY: "auto",
          scrollbarWidth: "thin", scrollbarColor: `${C.line} transparent`,
        }}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "8px 12px",
                  background: isSelected ? "#ECFEFF" : "transparent",
                  color: isSelected ? C.frost : C.ink,
                  fontSize: 13, fontWeight: isSelected ? 600 : 400,
                  border: "none", cursor: "pointer", textAlign: "left",
                  borderRadius: 0,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.panel2; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                {opt.label}
                {isSelected && <Check size={13} color={C.frost} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
