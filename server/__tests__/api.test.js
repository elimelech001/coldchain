// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app, { resetFridges } from "../index.js";

// Reset in-memory state before every test so PATCH tests can't pollute others.
beforeEach(() => resetFridges());

// ─── GET /api/fridges ────────────────────────────────────────────────────────

describe("GET /api/fridges", () => {
  it("returns HTTP 200 with an array of all 6 units", async () => {
    const res = await request(app).get("/api/fridges");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(6);
  });

  it("each unit has the required fields", async () => {
    const res = await request(app).get("/api/fridges");
    const required = ["id", "store", "model", "status", "temp", "target", "stock"];
    res.body.forEach((f) => {
      required.forEach((field) => expect(f).toHaveProperty(field));
    });
  });

  it("filters to only critical units when ?status=critical", async () => {
    const res = await request(app).get("/api/fridges?status=critical");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((f) => f.status === "critical")).toBe(true);
  });

  it("filters to only warning units when ?status=warning", async () => {
    const res = await request(app).get("/api/fridges?status=warning");
    expect(res.body.every((f) => f.status === "warning")).toBe(true);
  });

  it("returns an empty array for an unrecognised status value", async () => {
    const res = await request(app).get("/api/fridges?status=unknown");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ─── GET /api/fridges/:id ────────────────────────────────────────────────────

describe("GET /api/fridges/:id", () => {
  it("returns the requested fridge by id", async () => {
    const res = await request(app).get("/api/fridges/QN-02");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("QN-02");
    expect(res.body.status).toBe("critical");
    expect(res.body.store).toMatch(/Astoria/);
  });

  it("returns 404 with an error message for an unknown id", async () => {
    const res = await request(app).get("/api/fridges/XX-99");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("includes fault history array on the fridge", async () => {
    const res = await request(app).get("/api/fridges/QN-02");
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.history.length).toBeGreaterThan(0);
  });
});

// ─── GET /api/stats ──────────────────────────────────────────────────────────

describe("GET /api/stats", () => {
  it("returns HTTP 200", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(200);
  });

  it("returns the correct status counts for the seed fleet", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.body.counts).toEqual({
      critical: 1,
      warning: 1,
      healthy: 3,
      offline: 1,
    });
  });

  it("returns the total unit count", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.body.total).toBe(6);
  });

  it("returns stockAtRisk = 8500 (critical 5400 + warning 3100)", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.body.stockAtRisk).toBe(8500);
  });
});

// ─── GET /api/alerts ─────────────────────────────────────────────────────────

describe("GET /api/alerts", () => {
  it("returns only critical and warning units", async () => {
    const res = await request(app).get("/api/alerts");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((f) => ["critical", "warning"].includes(f.status))).toBe(true);
  });

  it("puts the critical unit before the warning unit", async () => {
    const res = await request(app).get("/api/alerts");
    const statuses = res.body.map((f) => f.status);
    expect(statuses.indexOf("critical")).toBeLessThan(statuses.indexOf("warning"));
  });

  it("embeds spoilWindow on each alert", async () => {
    const res = await request(app).get("/api/alerts");
    res.body.forEach((f) => expect(f).toHaveProperty("spoilWindow"));
    // critical unit has a real spoil window, not null
    const critical = res.body.find((f) => f.status === "critical");
    expect(critical.spoilWindow).not.toBeNull();
    expect(critical.spoilWindow).toHaveProperty("hours");
    expect(critical.spoilWindow).toHaveProperty("value");
  });

  it("embeds advise (repair/replace recommendation) on each alert", async () => {
    const res = await request(app).get("/api/alerts");
    res.body.forEach((f) => {
      expect(f).toHaveProperty("advise");
      expect(f.advise).toHaveProperty("replace");
      expect(f.advise).toHaveProperty("score");
    });
    // QN-02 (critical, 4 failures, void warranty) should recommend replace
    const qn02 = res.body.find((f) => f.id === "QN-02");
    expect(qn02.advise.replace).toBe(true);
  });
});

// ─── POST /api/fridges/:id/playbook ──────────────────────────────────────────

describe("POST /api/fridges/:id/playbook", () => {
  it("returns HTTP 200 with unitId and steps array", async () => {
    const res = await request(app).post("/api/fridges/QN-02/playbook");
    expect(res.status).toBe(200);
    expect(res.body.unitId).toBe("QN-02");
    expect(Array.isArray(res.body.steps)).toBe(true);
  });

  it("returns exactly 4 steps in the correct order", async () => {
    const res = await request(app).post("/api/fridges/QN-02/playbook");
    expect(res.body.steps.map((s) => s.key)).toEqual([
      "dispatch",
      "relocate",
      "hold",
      "warranty",
    ]);
  });

  it("embeds the unit's vendor and SLA in the dispatch step", async () => {
    const res = await request(app).post("/api/fridges/QN-02/playbook");
    const dispatch = res.body.steps[0];
    expect(dispatch.label).toContain("ColdFix Contractors");
    expect(dispatch.detail).toContain("6h");
  });

  it("embeds the stock value in the relocate step", async () => {
    const res = await request(app).post("/api/fridges/QN-02/playbook");
    const relocate = res.body.steps[1];
    expect(relocate.detail).toContain("5,400"); // $5,400 formatted
  });

  it("surfaces the warranty state in the final step", async () => {
    const res = await request(app).post("/api/fridges/QN-02/playbook");
    const warrantyStep = res.body.steps[3];
    expect(warrantyStep.detail).toContain("void");
  });

  it("returns 404 for an unknown unit id", async () => {
    const res = await request(app).post("/api/fridges/XX-00/playbook");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ─── PATCH /api/fridges/:id ───────────────────────────────────────────────────

describe("PATCH /api/fridges/:id", () => {
  it("updates the temperature and returns the modified unit", async () => {
    const res = await request(app)
      .patch("/api/fridges/BK-01")
      .send({ temp: -15.0 });
    expect(res.status).toBe(200);
    expect(res.body.temp).toBe(-15.0);
    expect(res.body.id).toBe("BK-01");
  });

  it("persists the change — a subsequent GET reflects the new temp", async () => {
    await request(app).patch("/api/fridges/BK-01").send({ temp: -10.5 });
    const res = await request(app).get("/api/fridges/BK-01");
    expect(res.body.temp).toBe(-10.5);
  });

  it("can update status, compressor, and door fields", async () => {
    const res = await request(app)
      .patch("/api/fridges/QN-05")
      .send({ status: "warning", compressor: 55, door: "ajar" });
    expect(res.body.status).toBe("warning");
    expect(res.body.compressor).toBe(55);
    expect(res.body.door).toBe("ajar");
  });

  it("silently ignores unknown / disallowed fields", async () => {
    const res = await request(app)
      .patch("/api/fridges/BK-01")
      .send({ temp: -17.0, secret: "injected", id: "HACKED" });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("secret");
    expect(res.body.id).toBe("BK-01"); // id must not change
  });

  it("returns 404 for an unknown unit id", async () => {
    const res = await request(app).patch("/api/fridges/XX-00").send({ temp: 0 });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
