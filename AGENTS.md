# AGENTS.md

This repository is the single source of truth for Pocket Rates.

Before changing architecture, read:
- `docs/ARCHITECTURE_PLAN.md`
- `docs/DECISIONS.md`
- `docs/DATA_PROVIDERS.md`

Rules:
- Mobile-first PWA; phone UX is primary.
- Reference screenshots are UX/functionality inspiration only; do not clone design 1:1.
- One codebase for GitHub Pages, ChatGPT Sites, and later hosting.
- MVP stays frontend-only unless a concrete blocker requires backend.
- Never ship API secrets in frontend/Vite env/Git history.
- All provider logic stays behind adapters.
- Never silently mix official/reference/bank/market/custom rates.
- Calculator and conversion must never trigger network calls.
- Use decimal arithmetic; round only for display.
- Offline mode may only use cached rates and must show stale/source metadata.
- Historical charts must not fabricate gaps or silently splice incompatible sources.
- Crypto identity is not ticker-only.
- Lazy-load heavy charting/features.
- No ads/accounts/payments/premium/backend platform work in MVP.
- Record any plan deviation in `docs/DECISIONS.md`.

Phases:
0. Provider/CORS/licensing/PWA-host validation
1. Foundation + CI + conversion/calculator kernel
2. Mobile converter UX
3. Provider adapters/cache/error handling
4. History charts
5. PWA/offline/install/update
6. Accessibility/performance/visual polish
7. Real-device pilot
