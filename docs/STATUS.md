# Implementation status

Updated: 2026-09-20

## Completed

### Architecture / repository
- GitHub repository is the source of truth.
- Approved architecture is stored in `docs/ARCHITECTURE_PLAN.md`.
- Architecture rules for agents are stored in `AGENTS.md`.
- Node 24 + React + TypeScript + Vite 8 toolchain is pinned through `package-lock.json`.
- CI runs typecheck, unit tests and production build.

### Core calculations
- Decimal conversion kernel via `decimal.js-light`.
- Safe arithmetic expression parser without `eval`.
- +, -, ×, ÷, parentheses, unary sign, decimal comma/dot.
- Calculator result becomes the active currency amount.
- No network request occurs per calculator key press.

### Converter UX
- Mobile-first currency rows.
- Any selected row can become the active input currency.
- Localized display formatting is separate from calculation precision.
- Currency manager bottom sheet.
- Search, add, remove and accessible up/down reorder controls.
- Minimum of two selected currencies.
- Selected layout and active currency persist in IndexedDB.

### Fiat data
- Frankfurter v2 adapter behind a provider interface.
- Selected-currency requests are batched from one base currency.
- Reordering currencies does not cause another provider request.
- Successful snapshots are cached in IndexedDB.
- Cached snapshots are shown with explicit stale/cached state when fresh network data is unavailable.
- Manual refresh and refresh-on-reconnect are implemented.

### PWA foundation
- Vite PWA / Workbox configuration exists.
- GitHub Pages workflow exists.
- Pages deployment is currently blocked only because Pages is not enabled for this new repository in GitHub Settings.

## In progress

### Phase 2 / 3
- Real-device mobile UX refinement.
- Better formatting and long-number handling.
- Robust provider error states.
- Cache retention/version policy.
- Asset manager gesture polish.

## Next
1. Finish converter interaction polish.
2. Add historical fiat provider methods and chart data model.
3. Add lazy-loaded chart screen.
4. Add PWA icons/manifest assets and update prompt UI.
5. Validate install/offline behavior on the deployed origin.
6. Add crypto provider only after the fiat path is stable.

## Deliberately deferred
- Accounts/sync.
- Payments/premium.
- Advertising.
- Deep crypto history.
- Browser extension.
- Windows/native wrappers.
- Backend.
