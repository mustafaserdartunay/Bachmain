# BachMain Customer Experience Cloud — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** CXC-0 foundation (additive)  
**Constraint:** Do not break `/musteriler`, `/crm`, portal, omnichannel · Do not fork Master Customer

## 1. Goal

CRM is not a customer list. Customer Experience Cloud is the central customer platform integrated with sales, support, quotes, orders, accounting, production, warehouse, logistics, and AI — Salesforce / HubSpot / Dynamics / Zendesk / Intercom class.

## 2. What exists (preserve as SoT)

| Capability                      | Reality                                           | Keep         |
| ------------------------------- | ------------------------------------------------- | ------------ |
| Master customers                | `/musteriler` + `customerProfiles`                | ✅ SoT       |
| Customer create/edit            | `/musteriler/yeni`, multi-contact, geo, MDM check | ✅           |
| Customer detail (finance-first) | `/musteriler/:id` statement + portal + stock      | ✅           |
| CRM agenda                      | `/crm` tasks / notes / appointments               | ✅           |
| B2B portal                      | `/portal/:token` + tickets                        | ✅           |
| Omnichannel                     | `/mesajlar`                                       | ✅           |
| Growth Lead Center              | `/ai-buyume/lead` scoring                         | ✅ bridge    |
| Field map                       | `/saha-satis` + `customerGeo`                     | ✅ reuse     |
| Quotes / orders / MES / finance | existing process UIs                              | ✅ link-only |
| Events                          | `trigger.customer.created`                        | ✅ extend    |

## 3. Gaps

| ID  | Gap                                                   | Sev     |
| --- | ----------------------------------------------------- | ------- |
| C1  | Customer Center hub `/musteri-deneyimi`               | P0      |
| C2  | Unified Customer Timeline (filterable)                | P0      |
| C3  | Customer 360 aggregation (contacts, cari, orders, AI) | P0      |
| C4  | Sales pipeline drag-drop (opportunity → customerId)   | P0      |
| C5  | AI health score + next actions                        | P0 stub |
| C6  | Smart customer cards + multi-view (list/kanban/map)   | P1      |
| C7  | Lead Center bridge (Growth → master customer)         | P1      |
| C8  | Support desk bridge (portal tickets + SLA)            | P1      |
| C9  | Loyalty tiers                                         | P2      |
| C10 | AI meeting → summary/tasks                            | P2      |
| C11 | Executive map + churn risk charts                     | P1      |
| C12 | Event hygiene (`updated` vs `created` on edit)        | P0      |

## 4. Non-negotiable

1. **No duplicate customer records** — Master Customer = `customerProfiles` / CRM API customers only.
2. CXC tables **reference** `customerId` (projection / insight / opportunity), never copy master fields as SoT.
3. Event-driven: `trigger.customer.*`, `trigger.cxc.*` via Workflow.
4. BachMain design: iOS feel, minimal, glass (`APP_SURFACE_PANEL_CLASS`), responsive.
5. Existing `/musteriler` and `/crm` routes stay operational.

## 5. Integration

Finance · MES · Commerce · Growth · Workflow · AIOS · Knowledge · Document Center · MDM
