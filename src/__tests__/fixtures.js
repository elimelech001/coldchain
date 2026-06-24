// Test fixtures — one unit per archetype the logic must handle.

export const healthyUnit = {
  id: "QN-05", store: "Queens — Astoria", model: "Carrier ZX-900 Walk-in",
  target: -18, temp: -18.2, status: "healthy", compressor: 95, door: "closed",
  install: "2024-09-01", warranty: "valid", warrantyEnds: "2027-09-01",
  vendor: "Carrier Service NE", sla: "4h", failures: 0,
  stock: 8700, repairTotal: 0, replaceCost: 14000, history: [],
};

export const warningRepairableUnit = {
  id: "BK-03", store: "Brooklyn — Atlantic Ave", model: "True T-49 Reach-in",
  target: 4, temp: 9.8, status: "warning", compressor: 71, door: "ajar",
  install: "2021-06-30", warranty: "expiring", warrantyEnds: "2026-07-15",
  vendor: "ColdFix Contractors", sla: "6h", failures: 2,
  stock: 3100, repairTotal: 2400, replaceCost: 6500, history: [],
};

export const criticalReplaceUnit = {
  id: "QN-02", store: "Queens — Astoria", model: "Hoshizaki F-2000 Freezer",
  target: -20, temp: -6.1, status: "critical", compressor: 22, door: "closed",
  install: "2020-02-14", warranty: "void", warrantyEnds: "2024-02-14",
  vendor: "ColdFix Contractors", sla: "6h", failures: 4,
  stock: 5400, repairTotal: 4100, replaceCost: 7000, history: [],
};

export const offlineUnit = {
  id: "NJ-07", store: "Newark — Ironbound", model: "Hoshizaki F-2000 Freezer",
  target: -20, temp: -19.6, status: "offline", compressor: null, door: "—",
  install: "2021-01-10", warranty: "expiring", warrantyEnds: "2026-08-01",
  vendor: "ColdFix Contractors", sla: "6h", failures: 1,
  stock: 4800, repairTotal: 850, replaceCost: 7000, history: [],
};

export const allUnits = [
  healthyUnit, warningRepairableUnit, criticalReplaceUnit, offlineUnit,
];

// A fixed "now" so age-based scoring is deterministic in tests.
export const FIXED_NOW = new Date("2026-06-24T00:00:00Z");
