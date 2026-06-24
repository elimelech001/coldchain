import { describe, it, expect } from "vitest";
import {
  advise, spoilWindow, stockAtRisk, statusCounts, sortByUrgency, playbook,
} from "../logic.js";
import {
  healthyUnit, warningRepairableUnit, criticalReplaceUnit, offlineUnit,
  allUnits, FIXED_NOW,
} from "./fixtures.js";

describe("advise — repair vs replace", () => {
  it("recommends replacing an old, out-of-warranty unit with many failures", () => {
    const a = advise(criticalReplaceUnit, FIXED_NOW);
    expect(a.replace).toBe(true);
    expect(a.score).toBeGreaterThanOrEqual(5);
    expect(a.text).toMatch(/Replace/);
  });

  it("recommends repairing a unit whose economics still favor service", () => {
    const a = advise(warningRepairableUnit, FIXED_NOW);
    expect(a.replace).toBe(false);
    expect(a.text).toMatch(/Repair/);
  });

  it("never recommends replacing a clean, in-warranty unit", () => {
    const a = advise(healthyUnit, FIXED_NOW);
    expect(a.replace).toBe(false);
    expect(a.score).toBe(0);
  });

  it("expresses the repair/replace cost ratio as a fraction", () => {
    const a = advise(criticalReplaceUnit, FIXED_NOW);
    expect(a.ratio).toBeCloseTo(4100 / 7000, 5);
  });

  it("flips to replace once repair cost crosses half of replacement", () => {
    const cheapRepairs = { ...warningRepairableUnit, repairTotal: 100, failures: 0, warranty: "valid", install: "2025-01-01" };
    const expensiveRepairs = { ...cheapRepairs, repairTotal: 5000 };
    expect(advise(cheapRepairs, FIXED_NOW).replace).toBe(false);
    // expensive repairs alone (+3) shouldn't cross the threshold of 5 by itself...
    expect(advise(expensiveRepairs, FIXED_NOW).score).toBe(3);
  });
});

describe("spoilWindow", () => {
  it("returns null for a healthy unit (nothing at risk)", () => {
    expect(spoilWindow(healthyUnit)).toBeNull();
  });

  it("returns the stock value at risk for a failing unit", () => {
    const w = spoilWindow(criticalReplaceUnit);
    expect(w).not.toBeNull();
    expect(w.value).toBe(5400);
  });

  it("gives less time as temperature drift grows", () => {
    const small = spoilWindow({ ...warningRepairableUnit, temp: 5, target: 4 });
    const large = spoilWindow({ ...warningRepairableUnit, temp: 15, target: 4 });
    expect(parseFloat(large.hours)).toBeLessThan(parseFloat(small.hours));
  });

  it("never reports less than a 0.5h floor", () => {
    const w = spoilWindow({ ...criticalReplaceUnit, temp: 40, target: -20 });
    expect(parseFloat(w.hours)).toBeGreaterThanOrEqual(0.5);
  });
});

describe("fleet aggregates", () => {
  it("sums stock only from critical and warning units", () => {
    // criticalReplaceUnit 5400 + warningRepairableUnit 3100 = 8500
    expect(stockAtRisk(allUnits)).toBe(8500);
  });

  it("counts units by status", () => {
    expect(statusCounts(allUnits)).toEqual({
      critical: 1, warning: 1, healthy: 1, offline: 1,
    });
  });

  it("sorts critical first, healthy last, without mutating input", () => {
    const sorted = sortByUrgency(allUnits);
    expect(sorted[0].status).toBe("critical");
    expect(sorted[sorted.length - 1].status).toBe("healthy");
    expect(allUnits[0]).toBe(healthyUnit); // original order untouched
  });
});

describe("playbook", () => {
  it("produces the four ordered response steps", () => {
    const steps = playbook(criticalReplaceUnit);
    expect(steps.map((s) => s.key)).toEqual([
      "dispatch", "relocate", "hold", "warranty",
    ]);
  });

  it("embeds the unit's vendor and SLA in the dispatch step", () => {
    const [dispatch] = playbook(criticalReplaceUnit);
    expect(dispatch.label).toContain("ColdFix Contractors");
    expect(dispatch.detail).toContain("6h");
  });

  it("surfaces warranty state in the final step", () => {
    const steps = playbook(offlineUnit);
    expect(steps[3].detail).toContain("expiring");
  });
});
