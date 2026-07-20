# BachMain Enterprise Analytics Platform — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** AP-0 foundation (additive)  
**Constraint:** Do not break `/`, ModernDashboard, module reports · No parallel metric ledger

## 1. Goal

Analytics is live, predictive, AI-assisted, and real-time — not only static reports. One Analytics Center composes ERP/CRM/MES/Finance/Commerce/Logistics/HR SoT.

## 2. What exists (preserve)

| Capability                        | Reality                                         | Keep           |
| --------------------------------- | ----------------------------------------------- | -------------- |
| Home ops dashboard                | `/` + `ModernDashboard` + `dashboardModernData` | ✅ SoT compose |
| Module reports                    | satış/tahsilat/nakit/gider/stok/saha            | ✅ deep-link   |
| Finance / MES / CXC / Growth KPIs | domain hubs                                     | ✅ deep-link   |
| Charts                            | Recharts on report pages                        | ✅ reuse       |
| Layout prefs                      | `dashboardLayoutStore` section toggles          | ✅             |
| Sidebar `/raporlar`               | **dead link** (no route)                        | Fix → hub      |

## 3. Gaps

| ID  | Gap                                              | Sev     |
| --- | ------------------------------------------------ | ------- |
| A1  | Analytics Center hub (`/analitik` + `/raporlar`) | P0      |
| A2  | Executive Dashboard (CEO KPI wall)               | P0      |
| A3  | Dashboard Builder drag-drop                      | P0 stub |
| A4  | KPI Center registry                              | P0      |
| A5  | `/v1/analytics` + `0013_analytics_platform`      | P0      |
| A6  | AI Insights / Forecast                           | P0 stub |
| A7  | Data Explorer / Maps / Heatmap                   | P1–P2   |
| A8  | Goals / OKR / Alerts                             | P1      |
| A9  | Report Designer / Board Report / Cockpit         | P2      |
| A10 | Export Center (beyond CSV)                       | P1      |

## 4. Non-negotiable

1. **No parallel ledgers** — KPIs resolve from existing stores/APIs.
2. **Do not rewrite** ModernDashboard — compose and deep-link.
3. Event-driven: `trigger.analytics.*`.
4. BachMain glass / iOS / responsive surfaces.

## 5. Integration

ERP · CRM · MES · Finance · Commerce · Logistics · WMS · HR · Workflow · AIOS · Knowledge · Document · CXC
