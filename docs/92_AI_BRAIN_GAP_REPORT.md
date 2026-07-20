# BachMain Enterprise AI Brain — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Hub elevation (AIOS-0.5)  
**Companion:** [68 AIOS Gap](./68_AIOS_GAP_REPORT.md) · [69 AIOS Architecture](./69_AIOS_ARCHITECTURE_ROADMAP.md)  
**Constraint:** Elevate `/aios` · Wire gateway · Deep-link Growth/Knowledge/Analytics/Voice/Workflow · Do not rewrite modules

## 1. Goal

AIOS is the company’s **digital employee** — not only chat. Analyze, act (with approval), report, start workflows, draft documents, forecast, optimize. Provider-agnostic via AI Gateway (OpenAI live; Claude / Gemini / DeepSeek / Mistral / local stubs).

## 2. What exists (SoT)

| Layer           | Reality                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| Gateway         | `apps/api/src/modules/aios/gateway.ts` — OpenAI live + multi-provider stubs |
| Agents / tools  | 23 agents · ~20 tools · human-approval queue                                |
| API             | `/v1/aios/*` (catalog, chat, runs, memory, approvals, schedules)            |
| Knowledge / RAG | `/v1/knowledge/*` (KP-0 lexical)                                            |
| Growth / Voice  | Separate proxies — keep; deep-link only                                     |
| CRM hub         | `/aios` was a static stub (no live API)                                     |

## 3. Gaps closed in this sprint

| ID  | Gap                          | Fix                                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------------------ |
| B1  | Hub is marketing shell       | Tabbed AIOS Center + localStore + gateway chat attempt                         |
| B2  | No Prompt Studio surface     | Prompt Studio tab (local catalog; API later)                                   |
| B3  | Model Center incomplete      | Providers include DeepSeek / Mistral stubs                                     |
| B4  | Brain capabilities scattered | Deep-links: Knowledge, Documents, Analytics, Growth, Voice, Workflow, Platform |
| B5  | Entitlement / menu           | `/aios` → `ai_growth`; sidebar entry                                           |

## 4. Still open (later phases)

| ID  | Gap                                    | Phase   |
| --- | -------------------------------------- | ------- |
| B6  | Real tool adapters (quote/order/stock) | AIOS-1  |
| B7  | RAG compose into gateway chat          | AIOS-2  |
| B8  | Voice/Growth behind single gateway     | AIOS-3  |
| B9  | Workflow `action.openai.run` → AIOS    | AIOS-4  |
| B10 | Vision / realtime translation tools    | AIOS-4  |
| B11 | Dedicated `aios` billing entitlement   | Billing |

## 5. Non-negotiable

1. Browser never calls model providers.
2. AI never writes DB directly — Tools + authz + audit.
3. Secrets masked at gateway.
4. No parallel AI stack — Growth/Voice remain until consolidated.
5. Domain modules stay SoT; AIOS is the intelligence layer only.
