# Pocket Rates — approved architecture plan

Date: 2026-09-20
Status: source of truth

## Product goal
A modern mobile-first PWA for fiat and crypto conversion. Main flow:

**open -> enter or calculate an amount in any row -> all visible currencies update instantly.**

The “Converter Plus” screenshots are functional/UX references only. Branding and visual design must be original.

## MVP
- Android/iPhone first
- installable PWA where host/runtime permits
- fast startup
- dark/light/system themes
- offline app shell + cached-rate conversion
- multiple visible currencies
- add/remove/reorder/search
- built-in calculator
- fiat history where the provider actually has coverage
- BTC/ETH/USDT plus a small crypto set
- custom/manual rate
- source/freshness/stale indicators
- no login
- no backend unless justified
- no monetization yet

## Architecture
GitHub repository is the single source of truth.

```text
GitHub
  -> CI / test / build
  -> GitHub Pages (pilot/preview)
  -> ChatGPT Sites (second deployment after runtime/PWA validation)
  -> future production/custom domain
```

Application layers:

```text
React UI
 -> feature state
 -> domain logic (calculator/conversion/history)
 -> provider adapters
 -> storage adapters
```

Provider response formats must never leak into UI components.

## Stack
- React + TypeScript
- Vite
- decimal.js-light
- vite-plugin-pwa / Workbox
- Lightweight Charts, lazy-loaded
- Vitest
- Playwright later in Phase 1/2
- custom CSS tokens/components

Next.js is intentionally avoided for MVP because the app is primarily interactive and static-hosted. Vanilla TypeScript is possible but less maintainable for the required state and screen complexity.

## Data model
### Asset
Stable internal ID, kind `fiat|crypto`, code, name, icon/flag metadata, provider IDs, display precision, optional network/contract metadata. Crypto ticker is never the sole identity.

### QuoteSnapshot
Reference currency, normalized rate map, quote semantics, provider/source, source date/time, fetched-at time, provenance, schema version.

### HistoricalSeries
Pair, provider, semantics, granularity, requested range, real coverage, points, gaps, fetched-at, source metadata.

### CustomRate
Pair, direction, decimal value, timestamps, optional expiry.

### Preferences
Theme, locale, home currency, selected assets, order, precision and interaction settings.

### CalculationDraft
Active asset, raw expression, parsed result, and snapshot used.

## Conversion math
Use decimal arithmetic.

Normalize one coherent snapshot:

`Q(X) = units of X per 1 reference unit`

Then:

`amountB = amountA * Q(B) / Q(A)`

Rules:
- no intermediate display rounding
- preserve raw input as string
- stablecoins are not hard-coded equal to fiat
- editing uses one coherent snapshot so values do not jump mid-expression

## Converter UX
Each row: icon/flag, code, compact name/source metadata, amount, active/stale state.

Tap row -> active input. Adding/removing/reordering is local. Typing and calculator operations never call the network.

## Calculator
MVP: digits, decimal separator, + - × ÷, parentheses, sign, backspace, clear, equals.

Never use JavaScript `eval`. Use a constrained parser with precedence, parentheses, validation, expression length/depth limits and division-by-zero handling.

Percentage semantics are deferred until they can be made unambiguous.

## Rate semantics
Keep distinct:
- official/reference
- blended/mid-market
- bank buy/sell
- market
- crypto market price
- custom

Never average unrelated meanings just because multiple sources exist.

## Fiat providers
Primary: Frankfurter v2.

Use current rates, time series, provider attribution and provider-specific routes where needed. Historical coverage is pair/provider-specific: “data since 1948” does not mean every pair has that history.

Fallback providers are only used when semantics are compatible and must remain labeled.

## Crypto providers
Separate provider layer.

Pilot: BTC, ETH, USDT and a small curated set. Do not promise free deep history or production polling before verifying provider limits/licensing. Commercial release requires a fresh licensing/rate-limit review.

## Charts
Candidate periods: 1d, 7d, 1m, 3m, 6m, 1y, 2y, 5y, 10y, MAX.

Enable only when meaningful:
- daily fiat data is not intraday
- MAX shows actual first date
- gaps stay gaps unless explicitly documented
- min/max/% are computed from loaded source data before display downsampling
- historical cross-rates use matching dates
- never multiply an entire historical crypto series by today’s fiat rate

Chart library is lazy-loaded. Touch crosshair must not break vertical scrolling.

## Offline/cache
- Service Worker/Cache Storage: app shell/static assets
- IndexedDB: snapshots, history cache, structured preferences, migrations
- localStorage: only tiny early preferences such as theme

Offline behavior:
- calculator works
- preferences work
- conversion uses latest permitted saved snapshot
- stale/source timestamp is explicit
- first-ever offline launch provides calculator/manual mode only, never fake market values

Provider storage terms override generic cache wishes.

## UX/UI
Premium but restrained fintech direction:
- dark/light
- large readable numbers
- minimal visual noise
- one accent
- no admin-dashboard feel
- no mandatory onboarding

Bottom navigation:
- Converter
- Charts
- My rate
- Settings

Asset picker is a modal/sheet.

Mobile:
- primary tap targets >=48x48 CSS px
- active input remains visible above keyboard
- one-handed use
- swipe-delete with undo
- reorder drag handle plus accessible alternative
- pinch zoom remains enabled

## Branding/assets
Later branding phase:
- original SVG logo with transparent background
- light/dark variants if needed
- favicon
- 192/512 PWA icons
- separate maskable icons
- 180 Apple touch icon
- 1200x630 OG image
- locally stored licensed/created flags and crypto icons

Never publish assets copied from the reference app.

## Performance targets
Targets to measure, not promises:
- initial JS without charts <= ~150 KB gzip
- initial transferred resources <= ~500 KB
- calculator/conversion response normally <50 ms on target phone
- no network per keystroke
- LCP <=2.5s, INP <=200ms, CLS <=0.1 on chosen test profile

## Repository structure
```text
.github/workflows/
docs/
public/
src/
  app/
  domain/
    assets/
    calculator/
    conversion/
    history/
  features/
    converter/
    charts/
    custom-rates/
    settings/
  adapters/
    providers/
    storage/
  shared/
    ui/
    formatting/
    i18n/
  styles/
tests/
```

## Git strategy
`main` stays releasable. Use short-lived feature branches/PRs for meaningful changes.

CI: install -> typecheck -> unit tests -> production build -> later E2E and bundle budgets.

GitHub Pages is pilot/preview, not assumed final commercial SaaS hosting. Use the project base path and project-scoped Service Worker/cache names.

## ChatGPT Sites
Treat as a second deployment target only after real tests:
- manifest delivery
- service worker scope/registration
- installability
- offline launch
- CORS
- update behavior
- custom-domain behavior

Do not maintain a divergent Sites copy. Production fixes return to GitHub.

## Backend trigger conditions
Add a thin backend only if required for:
- secret provider keys
- CORS
- shared rate-limit/cache control
- accounts/sync
- payments/premium rights
- background notifications

## Security
- no secrets in frontend/public repo
- VITE_* is not a secret mechanism
- proxy endpoints must be allowlisted, never arbitrary-URL forwarders
- calculator cannot execute code
- analytics should not receive private amounts/expressions by default
- persisted data uses versioned schema/migrations

## V2 / V3
V2: licensed/deeper crypto history, richer custom-rate profiles, optional bank/market data, accounts/sync, custom domain, monetization, useful SEO pair pages, localization/RTL.

V3: browser extension, Windows integration, Android/native wrapper only if PWA limitations justify it, richer asset classes.

## Development phases
### Phase 0 — validate risks
Check real CORS from deployed origins, priority EUR/EGP coverage, crypto current/history limits, provider terms, Pages base path, and Sites PWA/service-worker behavior.

Exit: every MVP data flow has a confirmed source or an explicitly accepted limitation.

### Phase 1 — foundation
Repository, docs, build, CI, domain types, decimal conversion kernel, constrained expression parser, tests.

Exit: reproducible build and core calculations pass.

### Phase 2 — converter UX
Exit: fast phone workflow, no network per keystroke.

### Phase 3 — data/cache
Exit: provider failure never breaks app; source/freshness remain clear.

### Phase 4 — charts
Exit: points/statistics faithfully represent selected source/range.

### Phase 5 — PWA/offline
Exit: installed app launches offline and uses saved data honestly.

### Phase 6 — polish
Accessibility, performance, real-device visual checks.

### Phase 7 — pilot
Use daily, fix issues, only then consider monetization.

## Long-term traps to avoid
- hard-coding one free provider in UI
- treating all rate semantics as interchangeable
- committing licensed market data to Git
- putting keys in client builds
- binding permanently to one host
- diverging GitHub/Sites codebases
- overly broad service-worker scope
- losing settings during domain migration
- rounding through rendered values
- ticker-as-ID for crypto
- one freshness timestamp for mixed sources
- building monetization/account infrastructure before validating the core converter
