# BachMain Workflow Engine — Gap Report

**Version:** 2026-07-16  
**Status:** Foundation in progress (WF-0)  
**Constraint:** Additive · Event-driven · Do not break CRM SoT / existing `workflowStages`

## 1. Goal

BachMain is not only a data-entry ERP. Target: **no-code, AI-assisted workflow platform** that listens to domain events, decides, and automates across modules.

## 2. What exists today

| Capability                                           | Reality                                                             | Gap                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Quote/Order/Production **stage panels**              | `src/utils/workflowStages.js` + Quotes/Orders/Depo                  | Linear stage UI only — not a graph engine                  |
| Document Center workflow                             | `BACHMAIN_DOCUMENT_CENTER/10_WORKFLOW_ENGINE.md`                    | Belge lifecycle only                                       |
| AI Growth “Otomasyon” menu                           | `/ai-buyume/otomasyon` settings stub                                | Not cross-module workflows                                 |
| Domain event bus                                     | Ad-hoc `window` CustomEvents (`bach:workflow-stages-updated`, etc.) | No central bus, no subscribers registry, no durable outbox |
| Workflow SQL tables                                  | Listed in `docs/57` / `58` M7 — **not implemented**                 | Missing                                                    |
| React Flow designer                                  | Not in CRM deps                                                     | Missing                                                    |
| Versioning / rollback                                | None                                                                | Missing                                                    |
| Test / simulation / execution log                    | None                                                                | Missing                                                    |
| Template library                                     | None                                                                | Missing                                                    |
| Business rule engine                                 | None                                                                | Missing                                                    |
| AI workflow assistant                                | None                                                                | Missing                                                    |
| Tenant scope (company/branch/warehouse/role/package) | Org context exists; not wired to workflows                          | Missing                                                    |

## 3. Architecture principles (non-negotiable)

1. **Modules must not call each other directly** for side effects — publish → Event Bus → Workflow Engine → Actions.
2. Existing `workflowStages` remains the **UI process panel** for quotes/orders; the new engine is a **separate** automation layer that may _listen_ to stage changes later.
3. CRM localStorage remains UI SoT until dual-write/API cutover; workflow drafts may store locally with optional API sync.
4. Additive schema only — no rewrite of Quotes/Orders/Production.

## 4. Priority gaps (ordered)

| ID  | Gap                                             | Severity |
| --- | ----------------------------------------------- | -------- |
| G1  | No `workflows` / versions / runs tables + API   | P0       |
| G2  | No designer UI                                  | P0       |
| G3  | No node catalog (trigger/action/condition/…)    | P0       |
| G4  | No in-browser + API event bus                   | P0       |
| G5  | No execution log / test mode                    | P1       |
| G6  | No templates                                    | P1       |
| G7  | No durable outbox / worker                      | P1       |
| G8  | No business-rule compiler                       | P2       |
| G9  | No AI assistant → graph                         | P2       |
| G10 | Full action runtime (WhatsApp, PDF, ERP writes) | P2–P3    |

## 5. Compatibility notes

- Do **not** rename or remove `loadWorkflowStages` / stage publish events.
- Do **not** couple Production → Accounting via imports; emit `order.created` style events instead.
- Feature can ship behind route `/otomasyon/*` without changing default dashboards.
