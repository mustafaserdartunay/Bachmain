# BachMain Enterprise AI Brain — Architecture & Roadmap

**Version:** 2026-07-20 Enterprise  
**Companion:** [92 Gap](./92_AI_BRAIN_GAP_REPORT.md) · [68/69 AIOS](./68_AIOS_GAP_REPORT.md)

```mermaid
flowchart LR
  Hub[AIOS_Center_/aios] --> API[/v1/aios]
  API --> GW[AI_Gateway]
  GW --> OpenAI
  GW --> Stubs[Claude_Gemini_DeepSeek_Mistral_Local]
  API --> Tools[Tool_Runtime]
  Tools --> Approve[Human_Approval]
  Hub --> Deep[Knowledge_Docs_Analytics_Growth_Voice_WF]
```

## Principles

1. **Digital employee** — commands, agents, orchestration, RAG, memory, documents, forecast.
2. **Provider-agnostic** — single gateway; OpenAI production path; others stub until keys.
3. **Human-in-the-loop** — delete / payment / invoice / stock mutations require approval.
4. **Audit** — every run: agent, model, tokens, cost, outcome.
5. **Modular monolith** — microservice-ready boundaries; no domain table fork.

## CRM Hub tabs (`/aios?tab=`)

| Tab            | Role                               |
| -------------- | ---------------------------------- |
| `home`         | AI Home — chat + file intent stubs |
| `agents`       | Agent Manager                      |
| `orchestrator` | Multi-agent chain preview          |
| `memory`       | Scoped memory                      |
| `knowledge`    | Deep-link Knowledge Center         |
| `prompts`      | Prompt Studio                      |
| `automation`   | Deep-link Workflow                 |
| `tasks`        | AI Tasks stub                      |
| `documents`    | Deep-link Document Center          |
| `analytics`    | Deep-link Analytics AI             |
| `forecast`     | Deep-link Forecast                 |
| `vision`       | Deep-link Growth visual            |
| `voice`        | Voice ERP note + header assistant  |
| `translate`    | Translation stub                   |
| `models`       | Model Center                       |
| `usage`        | Token / cost (local + runs API)    |
| `permissions`  | AI permissions rules               |
| `approvals`    | Human approval queue               |
| `audit`        | Run audit                          |
| `marketplace`  | Agent / prompt packs stub          |
| `settings`     | AI settings deep-link              |

## API (unchanged SoT)

Keep `/v1/aios/*` from AIOS-0. Additive only: provider ids `deepseek`, `mistral` in gateway catalog.

## Phases

| Phase               | Scope                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **AIOS-0.5** (this) | Hub elevation · docs 92/93 · providers · localStore · deep-links |
| AIOS-1              | Real tools + RBAC enforcement                                    |
| AIOS-2              | Memory + RAG→chat                                                |
| AIOS-3              | Multi-provider production + voice/growth consolidation           |
| AIOS-4              | Workflow glue · vision · NL ERP end-to-end                       |

## Compatibility

Growth `/ai-buyume`, Voice `/api/voice/*`, Knowledge `/bilgi-merkezi`, Document `/belge-merkezi`, Analytics `/analitik` remain SoT. AIOS does not replace them.
