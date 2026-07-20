# BachMain AI Enterprise Organization — Architecture & Roadmap

**Version:** 2026-07-20  
**Companion:** [96 Gap](./96_AI_ENTERPRISE_ORG_GAP_REPORT.md)

```mermaid
flowchart TB
  CEO[AI_CEO] --> COO[AI_COO]
  CEO --> CFO[AI_CFO]
  CEO --> CMO[AI_CMO]
  CEO --> CTO[AI_CTO]
  CEO --> CHRO[AI_CHRO]
  CEO --> Dirs[Directors]
  Dirs --> Spec[Specialists]
  UI[Org_UI] --> Orch[Orchestrator]
  Orch --> EventBus[Domain_Events]
  Orch --> GW[AI_Gateway]
  GW --> Audit[aios_runs]
```

## Org chart (ORG-0)

AI CEO  
├── AI COO · AI CFO · AI CMO · AI CTO · AI CHRO  
├── Production · Warehouse · Logistics · Sales · CRM  
├── Purchasing · Support · Quality · Analytics · Knowledge

Each node: `agentId`, `reportsTo`, `mandate[]`, `modules[]`, `permissions[]`, `explainWhy`.

## Communication

- No direct agent↔agent chat.
- `POST /v1/aios/organization/dispatch` enqueues orchestrator event → optional gateway briefing → audit run.
- CRM mirrors events in `orgStore` when offline.

## API

| Method | Path                             | Purpose                      |
| ------ | -------------------------------- | ---------------------------- |
| GET    | `/v1/aios/organization`          | Chart + roles                |
| POST   | `/v1/aios/organization/dispatch` | Orchestrator message (event) |

## Phases

| Phase     | Scope                                                     |
| --------- | --------------------------------------------------------- |
| **ORG-0** | Catalog · API · UI · explainability · event dispatch stub |
| ORG-1     | CEO daily briefing job · real tool adapters               |
| ORG-2     | Learning loop from approvals → memory                     |

## Compatibility

Specialist agents remain. Org layer is the **top** AIOS surface; Command Center / AIOS hub deep-link in.
