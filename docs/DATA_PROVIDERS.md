# Data provider strategy

Date: 2026-09-20

## Fiat
Primary: **Frankfurter v2**.

Why:
- public API with no API key
- current and historical time-series support
- many central-bank/official sources
- provider attribution and provider-specific routes
- suited to a static browser application when CORS works from the deployed origin

Important:
- historical depth is pair/provider specific
- blended/reference data is not a bank cash buy/sell quote
- do not silently relabel blended data as official for a specific central bank

Fallbacks are added only after confirming compatible semantics, CORS, license, caching terms and rate limits.

## Crypto
Use a separate provider interface.

Pilot candidates: CoinGecko public/keyless capabilities for a small asset set, subject to current rate limits and licensing. Deep history and production polling are not assumed free.

## Required metadata
Every snapshot/history result should carry:
- provider ID
- quote semantics
- source date/time
- fetched-at time
- coverage/granularity where relevant
- attribution/provenance when required

## Never do
- rotate multiple keys to bypass quotas
- average official, bank and market rates as if they were equivalent
- hide provider fallback from the user
- persist provider data longer than its terms permit
- commit licensed market datasets to the public repository


## Crypto pilot implementation

Current pilot provider: **CoinGecko Keyless Public API**.

Implementation rules:
- only request prices when one or more crypto assets are selected
- batch selected CoinGecko IDs into one `/simple/price` request
- normalize USD price as units-per-USD so crypto can share the converter calculation kernel
- do not persist CoinGecko market data in IndexedDB in the pilot
- display `Powered by CoinGecko` attribution whenever CoinGecko-backed assets are active
- handle rate-limit/provider failures as partial data instead of breaking fiat conversion
- no scheduled polling or high-frequency refresh

Production warning:
CoinGecko documents the keyless API as useful for prototyping/open-source/educational use and explicitly says it is not suitable for production workloads, scheduled polling, or high-frequency updates. Before monetization, select an appropriate licensed plan/provider and re-review the applicable API terms, attribution, privacy/user-agreement obligations, cache/storage rules, and rate limits.
