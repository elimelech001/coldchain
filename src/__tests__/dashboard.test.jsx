import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import ColdChainDashboard, { FRIDGES } from "../ColdChainDashboard.jsx";

// Stub globalThis.fetch so the dashboard never hits a real network.
// Returns the full FRIDGES seed data by default; individual tests can override.
function mockFetch(data = FRIDGES) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── Fleet view ───────────────────────────────────────────────────────────────

describe("ColdChainDashboard — fleet view", () => {
  beforeEach(() => {
    mockFetch();
    render(<ColdChainDashboard />);
  });

  it("renders the app title immediately (before fetch resolves)", () => {
    expect(screen.getByText("ColdChain")).toBeInTheDocument();
  });

  it("shows the unit count after the fleet data loads", async () => {
    await screen.findByText(new RegExp(`${FRIDGES.length} units`));
  });

  it("renders a card for every fridge once the data arrives", async () => {
    // Wait for first card to appear, then assert the rest synchronously
    await screen.findByText("QN-02");
    FRIDGES.forEach((f) => {
      expect(screen.getAllByText(f.id).length).toBeGreaterThan(0);
    });
  });

  it("shows the total stock-at-risk figure in the header", async () => {
    // critical 5400 + warning 3100 = 8500
    await screen.findByText("$8,500");
  });

  it("orders the critical unit ahead of healthy ones", async () => {
    await screen.findByText("QN-02");
    const cards = screen.getAllByRole("button");
    expect(cards[0].textContent).toContain("QN-02");
  });

  it("makes exactly one fetch call on mount to /api/fridges", async () => {
    await screen.findByText("QN-02");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fridges")
    );
  });
});

// ─── Loading & error states ───────────────────────────────────────────────────

describe("ColdChainDashboard — loading and error states", () => {
  it("shows a loading indicator before the fetch resolves", () => {
    // fetch that never resolves so we can inspect the loading state
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<ColdChainDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an error message when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );
    render(<ColdChainDashboard />);
    await screen.findByText(/failed to load/i);
  });

  it("shows an error message when the API returns a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) })
    );
    render(<ColdChainDashboard />);
    await screen.findByText(/failed to load/i);
  });
});

// ─── Incident playbook interaction ────────────────────────────────────────────

describe("ColdChainDashboard — incident playbook interaction", () => {
  beforeEach(async () => {
    mockFetch();
    render(<ColdChainDashboard />);
    // Load with real timers so findByText's internal polling works.
    await screen.findByText("QN-02");
    // Install fake timers only after data is rendered, to control playbook animation.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function openUnit(id) {
    const card = screen.getAllByRole("button").find((b) => b.textContent.includes(id));
    fireEvent.click(card);
  }

  it("opens the incident view with the unit's store and model", () => {
    openUnit("QN-02");
    const modal = screen.getByTestId("incident-modal");
    expect(within(modal).getAllByText(/Astoria/).length).toBeGreaterThan(0);
    expect(within(modal).getByText(/Response playbook/i)).toBeInTheDocument();
  });

  it("shows the stock-at-risk banner for a failing unit", () => {
    openUnit("QN-02");
    const modal = screen.getByTestId("incident-modal");
    expect(within(modal).getByText(/of stock at risk/i)).toBeInTheDocument();
  });

  it("runs all playbook steps to completion and shows resolved", () => {
    openUnit("QN-02");
    const modal = screen.getByTestId("incident-modal");
    // Execute all 4 steps (they run independently in parallel)
    const execBtns = within(modal).getAllByRole("button", { name: /Execute/i });
    execBtns.forEach(btn => fireEvent.click(btn));
    // Advance through executing phase (1500ms) then awaiting phase (up to 12000ms)
    act(() => { vi.advanceTimersByTime(14000); });
    expect(within(modal).getByText(/All steps resolved/i)).toBeInTheDocument();
  });

  it("recommends replacing the worn-out QN-02 unit", () => {
    openUnit("QN-02");
    const modal = screen.getByTestId("incident-modal");
    expect(within(modal).getByText("Replace unit")).toBeInTheDocument();
  });

  it("recommends repair for the still-viable BK-03 unit", () => {
    openUnit("BK-03");
    const modal = screen.getByTestId("incident-modal");
    expect(within(modal).getByText("Repair viable")).toBeInTheDocument();
  });

  it("shows the fault history for a unit with prior incidents", () => {
    openUnit("QN-02");
    const modal = screen.getByTestId("incident-modal");
    expect(within(modal).getByText(/Fault & service history/i)).toBeInTheDocument();
    expect(within(modal).getByText(/Compressor failure/)).toBeInTheDocument();
  });

  it("closes the modal when the X button is clicked", () => {
    openUnit("QN-02");
    expect(screen.getByTestId("incident-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close incident view/i }));
    expect(screen.queryByTestId("incident-modal")).not.toBeInTheDocument();
  });
});
