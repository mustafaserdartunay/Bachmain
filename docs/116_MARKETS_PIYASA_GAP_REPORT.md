# BachMain Piyasa (Markets) — Gap Report

**Version:** 2026-08-23  
**Status:** MKT-0 shell (additive)  
**Constraint:** Do not touch `/finans`, `/nakit`, `treasuryStore`, or Financial Suite (`docs/82–83`)

## Goal

Tenant-scoped market watch (BIST + FX + gold + crypto + global) with personalizable dashboard — separate from ERP finance/GL.

## Naming

| UI label | Route | Entitlement | Code domain |
| -------- | ----- | ----------- | ----------- |
| Piyasa   | `/piyasa` | `markets` | `src/markets`, `apps/api/.../markets` |

## Exists

- Header quick-action strip (`HeaderCashActionsPanel`) — **Piyasa chip added (MKT-0)**
- Redis rate-limit + Fastify auth/tenant guards (reuse later)
- `recharts` for simple charts (candles later)

## Gaps (phased)

| ID | Gap | Sev |
| -- | --- | --- |
| M1 | Hub `/piyasa` + mock quotes | P0 done shell |
| M2 | MarketDataProvider + backend proxy | P0 |
| M3 | Watchlists / favorites | P0 |
| M4 | Widget dashboard DnD | P1 |
| M5 | Charts + alerts + portfolio | P1 |
| M6 | Admin provider settings + packages | P1 |
| M7 | News / calendar / AI stubs | P2 |

## Non-negotiable

1. Never call market APIs from the browser with secrets.
2. Never reuse `finance` entitlement or `/finans`.
3. Mock provider in development only.
4. Disclaimer: not investment advice.
