// Empty string = same origin (production). Override with VITE_API_URL for split deploys.
const BASE = import.meta?.env?.VITE_API_URL ?? (import.meta?.env?.PROD ? "" : "http://localhost:3001");

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} — ${path}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: body != null ? { "Content-Type": "application/json" } : {},
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status} — ${path}`);
  return res.json();
}

async function apiPatch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status} — ${path}`);
  return res.json();
}

export const fetchFridges = (status) =>
  apiGet(status ? `/api/fridges?status=${status}` : "/api/fridges");

export const fetchFridge = (id) => apiGet(`/api/fridges/${id}`);

export const fetchStats = () => apiGet("/api/stats");

export const fetchAlerts = () => apiGet("/api/alerts");

export const triggerPlaybook = (id) => apiPost(`/api/fridges/${id}/playbook`);

export const patchFridge = (id, patch) => apiPatch(`/api/fridges/${id}`, patch);
