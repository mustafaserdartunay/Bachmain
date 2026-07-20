# BachMain AI Enterprise Organization — Gap Report

**Version:** 2026-07-20  
**Status:** Foundation (ORG-0)  
**Companion:** [68/69 AIOS](./68_AIOS_GAP_REPORT.md) · [92/93 Brain](./92_AI_BRAIN_GAP_REPORT.md)  
**Constraint:** Digital workforce layer on AIOS · Agents never peer-chat · Orchestrator + events only · Gateway + RBAC + audit · Do not break existing agent IDs

## 1. Goal

AI is not one assistant. It is a **role-based digital organization**: CEO → C-suite → Directors → specialists. Each employee works only in authorized domains; every recommendation is explainable; critical actions need human approval.

## 2. Exists today

| Piece                      | Reality                      |
| -------------------------- | ---------------------------- |
| 23 agents                  | Flat `AIOS_AGENTS` catalog   |
| Gateway / runs / approvals | AIOS-0                       |
| Orchestrator UI            | Chain preview stubs          |
| Org chart / C-suite titles | Missing as first-class layer |

## 3. Gaps closed (ORG-0)

| ID  | Gap                    | Fix                                                |
| --- | ---------------------- | -------------------------------------------------- |
| O1  | No org chart           | `organizationCatalog` + `/v1/aios/organization`    |
| O2  | Flat workforce         | C-suite + Director titles; `reportsTo` / `orgTier` |
| O3  | Peer agent chat risk   | Orchestrator dispatch only; event log              |
| O4  | Explainability surface | Mandate + `why` on each org role                   |
| O5  | CRM org UI             | `/ai-organizasyon` + AIOS `?tab=organization`      |

## 4. Open

| ID  | Gap                                             | Phase          |
| --- | ----------------------------------------------- | -------------- |
| O6  | Multi-agent briefing job (CEO collects reports) | ORG-1          |
| O7  | ABAC field/row enforcement per agent            | ORG-1 / AIOS-1 |
| O8  | Learning from approval outcomes → memory        | ORG-2          |

## 5. Rules

1. Agents communicate **only** via Orchestrator (events).
2. Browser → Gateway only; no provider keys client-side.
3. Payment / stock / invoice / cancel → Human Approval.
4. Existing agent IDs stay stable; titles may elevate.
