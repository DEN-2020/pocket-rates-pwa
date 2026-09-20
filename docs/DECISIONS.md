# Architecture decisions

## ADR-001 — GitHub is the source of truth
Status: accepted
Date: 2026-09-20

All durable product code and architecture documentation live in this repository. Hosting targets consume the repository; they do not become independent codebases.

## ADR-002 — Static-first MVP
Status: accepted
Date: 2026-09-20

The first version has no custom backend. Browser-side adapters call public providers when their terms and CORS permit it. A backend is added only for a concrete need such as secrets, CORS, shared caching, accounts or payments.

## ADR-003 — React + TypeScript + Vite
Status: accepted
Date: 2026-09-20

Chosen for a mobile-first interactive PWA that must run on static hosting and remain portable across hosts.

## ADR-004 — Decimal arithmetic
Status: accepted
Date: 2026-09-20

Conversion math uses decimal.js-light. Display formatting is separated from calculation precision.

## ADR-005 — Provider abstraction
Status: accepted
Date: 2026-09-20

UI code does not know vendor response shapes. Fiat, crypto, history and future bank/market sources are accessed through adapters with explicit quote semantics.

## ADR-006 — GitHub Pages is pilot hosting
Status: accepted
Date: 2026-09-20

Pages is used for preview/pilot. It is not assumed to be the final commercial hosting platform.

## Change rule
Any intentional deviation from the approved architecture must be recorded here with reason, date, alternatives considered and migration impact.
