import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useMatch } from "react-router-dom";
import { RefreshCw, Bell } from "lucide-react";
import { C, STATUS, STATUS_ORDER } from "../tokens.js";
import { fetchFridges, patchFridge, createFridge, deleteFridge } from "../api/client.js";
import { advise, spoilWindow, stockAtRisk, statusCounts } from "../logic.js";

import AppHeader from "../components/AppHeader.jsx";
import AppFooter from "../components/AppFooter.jsx";
import FiltersBar from "../components/FiltersBar.jsx";
import FridgeCard from "../components/FridgeCard.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";

import PlaybookRunner from "../modals/PlaybookRunner.jsx";
import EditModal from "../modals/EditModal.jsx";
import AddModal from "../modals/AddModal.jsx";
import DeleteConfirmDialog from "../modals/DeleteConfirmDialog.jsx";
import RuinedModal from "../modals/RuinedModal.jsx";
import RuinedToast from "../modals/RuinedToast.jsx";

export default function DashboardPage() {
  const navigate = useNavigate();
  const unitMatch = useMatch("/units/:id");

  const [fridges, setFridges]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [events, setEvents]       = useState([]);
  const [escalated, setEscalated] = useState(new Set());
  const criticalSince = useRef({});
  const eventIdRef    = useRef(0);
  const fridgesRef    = useRef([]);

  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStore, setFilterStore]   = useState("all");
  const [sortMode, setSortMode]         = useState("urgency");

  const [ruinedIds, setRuinedIds]       = useState(new Set());
  const [ruinedAlert, setRuinedAlert]   = useState(null);
  const [ruinedModal, setRuinedModal]   = useState(null);
  const ruinCheckedRef                  = useRef(new Set());

  const [editTarget, setEditTarget]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [lastUpdated, setLastUpdated]   = useState(null);

  useEffect(() => { fridgesRef.current = fridges; }, [fridges]);

  const addEvent = useCallback((unitId, message, type = "info") => {
    setEvents(prev => [
      { id: ++eventIdRef.current, ts: Date.now(), unitId, message, type },
      ...prev.slice(0, 49),
    ]);
  }, []);

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

  const openFridge = useMemo(() => {
    if (!unitMatch) return null;
    return fridges.find(f => f.id === unitMatch.params.id) || null;
  }, [unitMatch, fridges]);

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
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-shadow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.4); }
          50%       { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
        @keyframes slide-in-right {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        input::placeholder { color: #94A3B8; }
        button { font-family: inherit; }
      `}</style>

      {ruinedAlert && (
        <RuinedToast
          fridge={ruinedAlert.fridge}
          onDismiss={() => setRuinedAlert(null)}
          onOpenModal={() => { setRuinedModal(ruinedAlert); setRuinedAlert(null); }}
        />
      )}

      <AppHeader
        fridgesCount={fridges.length}
        loading={loading}
        escalatedCount={escalatedActive.length}
        lastUpdated={lastUpdated}
        onAddUnit={() => setShowAddModal(true)}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>

        {!loading && atRisk > 0 && (
          <div style={{ marginBottom: 12, textAlign: "right" }}>
            <span style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em" }}>Stock at risk: </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: C.amber }}>${atRisk.toLocaleString()}</span>
          </div>
        )}

        {escalatedActive.length > 0 && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: 10,
            background: C.redDeep, border: `1px solid #FECACA`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Bell size={16} color={C.red} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
              Escalation — {escalatedActive.join(", ")} {escalatedActive.length === 1 ? "has" : "have"} been unacknowledged for 45+ seconds. Regional ops notified.
            </span>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.dim, margin: "40px 0", justifyContent: "center" }}>
            <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span>Loading fleet data…</span>
          </div>
        )}

        {error && !loading && (
          <div style={{
            margin: "20px 0", padding: 16, borderRadius: 12,
            background: C.redDeep, border: `1px solid #FECACA`,
            color: C.red, fontSize: 13,
          }}>
            Failed to load fleet data — {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.entries(counts).map(([k, v]) =>
                STATUS[k] ? (
                  <div key={k} style={{
                    flex: "1 1 120px", padding: "14px 16px", borderRadius: 12,
                    background: STATUS[k].bg, border: `1px solid ${STATUS[k].border}`,
                    boxShadow: "0 1px 3px rgba(15,23,42,.04)",
                  }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 800, color: STATUS[k].c, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{STATUS[k].label}</div>
                  </div>
                ) : null
              )}
            </div>

            <FiltersBar
              searchQuery={searchQuery} onSearch={setSearchQuery}
              filterStatus={filterStatus} onFilterStatus={setFilterStatus}
              filterStore={filterStore} onFilterStore={setFilterStore}
              storeOptions={storeOptions}
              sortMode={sortMode} onSort={setSortMode}
              resultCount={displayedFridges.length}
              totalCount={fridges.length}
            />

            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                  {displayedFridges.map(f => (
                    <FridgeCard
                      key={f.id}
                      f={f}
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
                  Click any unit to open its incident view. Execute each response step individually, or mark it as already handled.
                </p>
              </div>

              <ActivityFeed events={events} />
            </div>

            <AppFooter fridges={fridges} />
          </>
        )}
      </div>

      {openFridge && (
        <PlaybookRunner
          f={openFridge}
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
