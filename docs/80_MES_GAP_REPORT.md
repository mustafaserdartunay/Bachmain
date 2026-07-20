# BachMain MES — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** MES-0 foundation (additive)  
**Constraint:** Do **not** break `/uretim`, `erlenbox-production`, Depo handoff, or logistics load plans

## 1. Goal

BachMain Manufacturing Execution System: plan, execute, monitor operators/machines, quality, scrap, and AI optimization — not merely an order list.

## 2. What exists today (preserve)

| Capability          | Reality                                         | Keep                         |
| ------------------- | ----------------------------------------------- | ---------------------------- |
| Production jobs     | `/uretim` + `erlenbox-production`               | ✅ SoT for commercial jobs   |
| Configurable stages | `erlenbox-workflow-stages` (production segment) | ✅ Kanban columns source     |
| Stage photos        | `productionStagePhotos.js`                      | ✅ Evidence trail            |
| Depo handoff        | `sendProductionJobToDepo`                       | ✅ WMS bridge                |
| Logistics           | Load plans from depo                            | ✅                           |
| Digital Twin        | Demo factory/machine views                      | ✅ Visual layer (wire later) |
| Process Kanban      | CRM ProcessWorkspace only                       | Reuse UI for MES             |

## 3. Gaps (Enterprise MES)

| ID  | Gap                                                               | Sev         |
| --- | ----------------------------------------------------------------- | ----------- |
| M1  | Manufacturing Center hub + IA                                     | P0          |
| M2  | Smart KPI dashboard (OEE/scrap/machines)                          | P0          |
| M3  | Multi-view production orders (card/list/kanban/timeline/calendar) | P0          |
| M4  | Machine / Work Center registry                                    | P0          |
| M5  | Operator tablet execution                                         | P0          |
| M6  | BOM/Recipe + Routing                                              | P0          |
| M7  | Real OEE from events                                              | P0          |
| M8  | Quality Center + AI photo QC                                      | P1          |
| M9  | Scrap analytics                                                   | P1          |
| M10 | Capacity planner AI                                               | P1          |
| M11 | Packaging → pallet → truck chain                                  | P1          |
| M12 | Maintenance + Energy + IoT                                        | P2          |
| M13 | Platform DB (beyond localStorage)                                 | P0 platform |

## 4. Non-negotiable

1. `/uretim` routes and job schema remain.
2. MES links via `productionJobId` / `lineItemId` (same as depo).
3. Event-driven: `trigger.mes.*` + existing `trigger.production.*`.
4. No duplicated job master — MES extends, does not fork.

## 5. Integration targets

ERP · CRM · WMS (Depo) · Logistics · Accounting · Workflow · AIOS · Knowledge · Digital Twin
