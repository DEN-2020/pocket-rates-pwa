# Pocket Rates PWA

Working technical name for a mobile-first fiat/crypto converter PWA.

Status: foundation phase. Brand/name are not final.

Main flow: **open -> enter/calculate an amount in any currency -> selected currencies update instantly**.

## Read first
- `docs/ARCHITECTURE_PLAN.md`
- `docs/DECISIONS.md`
- `docs/DATA_PROVIDERS.md`
- `AGENTS.md`

## Stack
React + TypeScript + Vite + decimal.js-light + vite-plugin-pwa. Charts/tests are added progressively.

## Local development
Target runtime: Node.js 24 LTS.

Commands:
- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Hosting
1. GitHub Pages — pilot/preview.
2. ChatGPT Sites — second deployment after PWA/runtime validation.
3. Later custom domain/production host as needed.

## License
No open-source license has been selected yet.
