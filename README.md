# ColdChain — refrigeration incident dashboard

A working React prototype: monitor a fleet of supermarket fridges, and when one
fails, run an automated response playbook (dispatch tech, relocate stock, hold
deliveries, log + check warranty), see fault history, and get a clear
repair-vs-replace call with the dollar value of stock at risk.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
```

## Test it

```bash
npm test         # run the full suite once
npm run test:watch
```

25 tests across two files:

**`src/__tests__/logic.test.js`** — the business logic (pure, no UI):
- `advise` repair-vs-replace scoring: replace for worn-out units, repair when
  economics still favor service, never replace a clean in-warranty unit, cost
  ratio math, and the score threshold behavior.
- `spoilWindow` spoilage countdown: null when healthy, stock value when failing,
  shrinks as temperature drift grows, never drops below the 0.5h floor.
- Fleet aggregates: `stockAtRisk`, `statusCounts`, `sortByUrgency` (and that
  sorting doesn't mutate the input).
- `playbook` step order, vendor/SLA embedding, warranty surfacing.

**`src/__tests__/dashboard.test.jsx`** — the UI (React Testing Library + jsdom):
- Renders title, a card per fridge, the header stock-at-risk figure, and orders
  the critical unit first.
- Opening a unit shows its store/model, the at-risk banner, and history.
- Running the playbook advances the timer chain to completion and flips the
  control to "Resolved".
- Replace recommendation for QN-02, repair for BK-03.

## Structure

```
src/
  ColdChainDashboard.jsx   # the UI; imports all logic from logic.js
  logic.js                 # pure business logic, separately testable
  main.jsx                 # app entry
  __tests__/
    fixtures.js            # one unit per archetype
    logic.test.js
    dashboard.test.jsx
    setup.js
```

The logic is deliberately split out of the component so tests exercise the real
functions the UI uses — not copies that can drift out of sync.
