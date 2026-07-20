# BachMain Digital Twin Platform — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation in progress (DT-0)  
**Constraint:** Visualization layer only · Do not rewrite ERP business logic · 3D optional

## 1. Goal

BachMain is not only tables. Factory, warehouses, pallets, trucks, branches, and order flows are visualized in real time so operators can “see” the business live.

## 2. What exists today

| Capability           | Reality                                      | Gap                                   |
| -------------------- | -------------------------------------------- | ------------------------------------- |
| Truck load 3D        | `TruckLoadCalculator` + `TruckScene3D` (R3F) | Not in a Twin Center                  |
| Logistics flows      | `/lojistik/*` pages                          | Not animated end-to-end twin          |
| Warehouse UI         | Depo workspace lists                         | No aisle/rack/location map / heat map |
| Production           | Job cards / stages                           | No factory floor / machine OEE twin   |
| Live KPI shell       | Dashboard widgets                            | No Control Room multi-domain wall     |
| What-if / bottleneck | None                                         | Missing                               |
| Route live twin      | Courier tracking partial                     | Not Maps+ETA twin                     |
| Digital Twin module  | **None**                                     | Missing                               |

## 3. Architecture rule

Digital Twin sits **above** ERP modules. It **reads** orders/production/warehouse/logistics (and later AIOS predictions). It does **not** own transactional truth.

## 4. Priority gaps

| ID  | Gap                                   | Sev |
| --- | ------------------------------------- | --- |
| T1  | Digital Twin Center UI + sub-views    | P0  |
| T2  | Factory isometric + status colors     | P0  |
| T3  | Production flow animation             | P0  |
| T4  | Warehouse map + heat map              | P0  |
| T5  | Reuse truck 3D + AI load link         | P0  |
| T6  | Control Room / live KPI               | P0  |
| T7  | API twin overview / preferences       | P1  |
| T8  | Machine OEE + quality view live feeds | P1  |
| T9  | Google Maps route twin                | P2  |
| T10 | What-if simulator + AI forecasts      | P2  |

## 5. Compatibility

- Keep `TruckLoadCalculator` route.
- 3D behind feature toggle (`enable3d`) for performance.
- Mobile-first responsive; heavy Canvas only when opted in.
