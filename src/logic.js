// Pure business logic for the ColdChain dashboard.
// Kept free of React so it can be unit-tested directly.

export const STATUS_ORDER = { critical: 0, warning: 1, offline: 2, healthy: 3 };

// Repair-vs-replace scoring → a clear recommendation.
export function advise(f, now = new Date()) {
  const ratio = f.repairTotal / f.replaceCost;
  const ageYears = (now - new Date(f.install)) / 3.15e10;
  let score = 0;
  if (f.failures >= 4) score += 3;
  else if (f.failures >= 2) score += 1;
  if (ratio >= 0.5) score += 3;
  else if (ratio >= 0.3) score += 1;
  if (ageYears >= 5) score += 2;
  else if (ageYears >= 3) score += 1;
  if (f.warranty === "void") score += 2;
  else if (f.warranty === "expiring") score += 1;
  const replace = score >= 5;
  return {
    replace,
    score,
    ratio,
    ageYears,
    text: replace
      ? `Replace — ${f.failures} failures, repairs at ${Math.round(ratio * 100)}% of replacement cost, ${f.warranty} warranty.`
      : `Repair — economics still favor servicing this unit (repairs at ${Math.round(ratio * 100)}% of replacement cost).`,
  };
}

// Spoilage countdown: how long until product is at risk once cold is lost.
export function spoilWindow(f) {
  const drift = Math.abs(f.temp - f.target);
  if (f.status === "healthy") return null;
  const hours = Math.max(0.5, 6 - drift * 0.5).toFixed(1);
  return { hours, value: f.stock };
}

// Total dollar value of stock sitting in failing units.
export function stockAtRisk(fridges) {
  return fridges
    .filter((f) => f.status === "critical" || f.status === "warning")
    .reduce((s, f) => s + f.stock, 0);
}

// Count units by status.
export function statusCounts(fridges) {
  const c = { critical: 0, warning: 0, healthy: 0, offline: 0 };
  fridges.forEach((f) => {
    c[f.status]++;
  });
  return c;
}

// Sort so the units needing attention come first.
export function sortByUrgency(fridges) {
  return [...fridges].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );
}

// The ordered set of automated response steps for an incident.
export function playbook(f) {
  const tech = f.technicianName ? `${f.technicianName} @ ${f.vendor}` : f.vendor;
  const mgr = f.storeManager;
  return [
    {
      key: "dispatch",
      label: `Dispatch technician — ${f.vendor}`,
      detail: `${tech} paged — unit ${f.id}, ${f.store}, full fault log attached. SLA ${f.sla}.`,
    },
    {
      key: "relocate",
      label: "Alert store manager to relocate perishables",
      detail: mgr
        ? `${mgr.name} (${f.store}) notified at ${mgr.phone} — move ~$${f.stock.toLocaleString()} of stock to nearest backup unit.`
        : `Move ~$${f.stock.toLocaleString()} of stock to nearest backup unit.`,
    },
    {
      key: "hold",
      label: "Hold inbound deliveries to this unit",
      detail: mgr
        ? `${mgr.name} and receiving team notified — inbound routing to ${f.id} paused until unit is cleared.`
        : `Routing paused so new product isn't sent to a failing fridge.`,
    },
    {
      key: "warranty",
      label: "Check warranty & log incident",
      detail: `Warranty: ${f.warranty}. Incident opened in audit log for compliance.`,
    },
  ];
}
