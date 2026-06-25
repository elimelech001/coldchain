import { Search } from "lucide-react";
import { C, STATUS } from "../tokens.js";
import CustomSelect from "./CustomSelect.jsx";

export default function FiltersBar({
  searchQuery, onSearch,
  filterStatus, onFilterStatus,
  filterStore, onFilterStore, storeOptions,
  sortMode, onSort,
  resultCount, totalCount,
}) {
  const STATUSES = ["all", "critical", "warning", "healthy", "offline"];
  const isFiltered = searchQuery || filterStatus !== "all" || filterStore !== "all";

  const storeSelectOptions = storeOptions.map(s => ({
    value: s,
    label: s === "all" ? "All Stores" : s.split(" —")[0],
  }));

  const sortOptions = [
    { value: "urgency", label: "Sort: Urgency" },
    { value: "temp",    label: "Sort: Temp Drift" },
    { value: "stock",   label: "Sort: Stock Value" },
  ];

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
                background: active && st ? st.bg : active ? "#ECFEFF" : "none",
                border: `1px solid ${active && st ? st.c : active ? C.frost : C.line}`,
                color: active && st ? st.c : active ? C.frost : C.dim,
                textTransform: "capitalize",
              }}
            >{s === "all" ? "All" : STATUS[s]?.label || s}</button>
          );
        })}
      </div>

      <CustomSelect
        value={filterStore}
        onChange={onFilterStore}
        options={storeSelectOptions}
      />

      <CustomSelect
        value={sortMode}
        onChange={onSort}
        options={sortOptions}
      />

      {isFiltered && (
        <span style={{ fontSize: 11, color: C.dim }}>
          {resultCount} of {totalCount} unit{totalCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
