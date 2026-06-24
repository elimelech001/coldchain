import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  advise, spoilWindow, stockAtRisk, statusCounts, sortByUrgency, playbook,
} from "../src/logic.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(__dir, "data/fridges.json"), "utf8"));

// In-memory store — intentionally resets on restart (demo backend).
let fridges = structuredClone(seed);

// Exported so tests can restore clean state before each test.
export function resetFridges() {
  fridges = structuredClone(seed);
}

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/fridges — full fleet, optionally filtered by ?status=
app.get("/api/fridges", (req, res) => {
  const { status } = req.query;
  const result = status ? fridges.filter((f) => f.status === status) : fridges;
  res.json(result);
});

// GET /api/fridges/:id — single unit
app.get("/api/fridges/:id", (req, res) => {
  const fridge = fridges.find((f) => f.id === req.params.id);
  if (!fridge) return res.status(404).json({ error: `Unit ${req.params.id} not found` });
  res.json(fridge);
});

// GET /api/stats — fleet-wide counts and stock-at-risk total
app.get("/api/stats", (_req, res) => {
  res.json({
    counts: statusCounts(fridges),
    stockAtRisk: stockAtRisk(fridges),
    total: fridges.length,
  });
});

// GET /api/alerts — critical + warning units, urgency-sorted, with enriched fields
app.get("/api/alerts", (_req, res) => {
  const alerts = sortByUrgency(fridges).filter(
    (f) => f.status === "critical" || f.status === "warning"
  );
  res.json(
    alerts.map((f) => ({ ...f, spoilWindow: spoilWindow(f), advise: advise(f) }))
  );
});

// POST /api/fridges/:id/playbook — return the 4 ordered response steps
app.post("/api/fridges/:id/playbook", (req, res) => {
  const fridge = fridges.find((f) => f.id === req.params.id);
  if (!fridge) return res.status(404).json({ error: `Unit ${req.params.id} not found` });
  res.json({ unitId: fridge.id, steps: playbook(fridge) });
});

// POST /api/fridges — add a new unit
const REQUIRED_FIELDS = ["id", "store", "model", "target", "stock", "install"];
app.post("/api/fridges", (req, res) => {
  const body = req.body;
  const missing = REQUIRED_FIELDS.filter((k) => body[k] == null || body[k] === "");
  if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  if (fridges.some((f) => f.id === body.id)) return res.status(409).json({ error: `Unit ${body.id} already exists` });
  const newFridge = {
    id: body.id,
    store: body.store,
    model: body.model,
    target: Number(body.target),
    temp: Number(body.target),
    status: "healthy",
    compressor: 100,
    door: "closed",
    install: body.install,
    warranty: body.warranty ?? "valid",
    warrantyEnds: body.warrantyEnds ?? "",
    vendor: body.vendor ?? "",
    sla: body.sla ?? "4h",
    failures: 0,
    stock: Number(body.stock),
    repairTotal: 0,
    replaceCost: 0,
    technicianName: body.technicianName ?? "",
    storeManager: body.storeManager ?? { name: "", phone: "" },
    history: [],
  };
  fridges.push(newFridge);
  res.status(201).json(newFridge);
});

// DELETE /api/fridges/:id — remove a unit
app.delete("/api/fridges/:id", (req, res) => {
  const idx = fridges.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: `Unit ${req.params.id} not found` });
  fridges.splice(idx, 1);
  res.json({ deleted: req.params.id });
});

// PATCH /api/fridges/:id — update sensor and config fields
const PATCHABLE = new Set(["temp", "status", "compressor", "door", "target", "stock", "technicianName", "sla"]);
app.patch("/api/fridges/:id", (req, res) => {
  const idx = fridges.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: `Unit ${req.params.id} not found` });
  const patch = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => PATCHABLE.has(k))
  );
  fridges[idx] = { ...fridges[idx], ...patch };
  res.json(fridges[idx]);
});

// Serve the Vite production build when the dist/ folder exists.
// In dev, the Vite dev server handles the frontend separately.
import { existsSync } from "node:fs";
const dist = join(__dir, "../dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  // SPA fallback — React Router-style deep links work without a CDN rewrite rule.
  app.get("/{*splat}", (_req, res) => res.sendFile(join(dist, "index.html")));
}

export default app;

// Only bind a port when executed directly (not imported by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () =>
    console.log(`ColdChain API → http://localhost:${PORT}`)
  );
}
