# BachMain Platform Core — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** PC-0 foundation (additive)  
**Constraint:** Do not rewrite ERP/CRM · Modular monolith · Domain hubs stay SoT

## 1. Goal

BachMain is a **Business Operating System**. All modules run on one Platform Core: identity, events, workflow, AI gateway, notifications, jobs, settings, module registry — without code duplication.

## 2. What exists (preserve)

| Capability            | Reality                                       | Keep            |
| --------------------- | --------------------------------------------- | --------------- |
| Identity / JWT        | `/v1/auth/*`, AuthContext                     | ✅              |
| Entitlements          | `entitlements.js` + schema roles              | ✅              |
| MDM hub               | `/ayarlar/master-data`                        | ✅              |
| Workflow + event bus  | `/otomasyon`, `eventBus.js`, catalog          | ✅ **core bus** |
| AIOS / AI gateway     | `/aios`, `gateway.ts`                         | ✅              |
| Domain hubs           | CXC, Finance, MES, Commerce, Docs, Analytics… | ✅ deep-link    |
| Billing / license     | `/v1/billing`, `/hesap/lisans`                | ✅              |
| Onboarding            | `/kurulum`                                    | ✅              |
| Multi-company         | orgScope / kurumsal yapı                      | ✅              |
| Feature flags table   | `feature_flags`                               | ✅ wire API     |
| Notifications service | Socket.IO + table                             | ✅ deep-link    |
| Health                | `GET /v1/health`                              | ✅ extend       |

## 3. Gaps

| ID  | Gap                                     | Sev |
| --- | --------------------------------------- | --- |
| P1  | Platform Center hub `/platform`         | P0  |
| P2  | Module registry (no ownership steal)    | P0  |
| P3  | `/v1/platform/*` + `0014_platform_core` | P0  |
| P4  | Job/queue stubs                         | P0  |
| P5  | Composite health monitor                | P0  |
| P6  | Feature flag CRUD/evaluate              | P1  |
| P7  | Files/media API                         | P1  |
| P8  | Plugin SDK                              | P2  |
| P9  | Observability / backup / update centers | P2  |
| P10 | Developer mode                          | P1  |

## 4. Non-negotiable

1. **Domain boundaries** — modules do not own each other’s tables.
2. **Single event bus** — Workflow catalog + `publishDomainEvent` (no second bus).
3. **Master Data** stays MDM — PC only links.
4. Modular monolith now; microservice-extractable packages later.
5. No rewrite of localStorage ERP SoT in PC-0.

## 5. Integration

All domain hubs · Workflow · AIOS · Identity · Billing · Knowledge · Document · Analytics
