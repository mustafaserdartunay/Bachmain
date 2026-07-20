# BachMain AI Command Center — Architecture & Roadmap

**Version:** 2026-07-20 · Cilt 21.1  
**Companion:** [94 Gap](./94_AI_COMMAND_CENTER_GAP_REPORT.md)

```mermaid
flowchart TB
  Login --> CC[AI_Command_Center_/]
  CC --> Stores[Domain_Local_Stores]
  CC --> AIOS[AIOS_Gateway_Chat]
  CC --> Voice[Header_Voice_Assistant]
  CC --> Deep[Quotes_Orders_CRM_MES_Finance_WF]
  Modern[/guncel-durum] -.->|preserved| Dash[ModernDashboard]
```

## Routes

| Path              | Purpose                                |
| ----------------- | -------------------------------------- |
| `/`               | AI Command Center (ana ekran)          |
| `/ai-komut`       | Alias → `/`                            |
| `/command-center` | Alias → `/`                            |
| `/guncel-durum`   | Legacy ModernDashboard (SoT preserved) |

## Layout

1. **Hero** — time-aware greeting + attention count
2. **AI Today** — priorities strip
3. **My Company Today** — live KPI grid
4. **Alerts + Recommendations**
5. **Quick Actions + Smart Search**
6. **Tasks / Calendar / Workflow**
7. **Insights + Executive Mode** (persona-gated)
8. **Right rail** — AI Chat (desktop); stacks on mobile

Glass panels via `APP_SURFACE_PANEL_CLASS` + `AppPageShell`.

## Personalization

| Persona      | Emphasize                      |
| ------------ | ------------------------------ |
| `sales`      | Quotes, customers, collections |
| `production` | Jobs, scrap, delays            |
| `finance`    | Cash, collections, invoices    |
| `warehouse`  | Stock critical, shipments      |
| `ceo`        | Executive KPI wall + insights  |

Stored in `bach_command_center_v1` localStore; API sync later.

## Phases

| Phase    | Scope                                                              |
| -------- | ------------------------------------------------------------------ |
| **CC-0** | Page · home swap · live KPIs · chat · voice · persona · docs 94/95 |
| CC-1     | Live risk engine · websocket today feed                            |
| CC-2     | Server persona prefs · widget layout editor                        |

## Compatibility

AIOS `/aios`, Growth, Knowledge, Document Center unchanged. Command Center composes and deep-links.
