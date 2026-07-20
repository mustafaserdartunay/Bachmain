# BachMain AI Operating System (AIOS) — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation shipped (AIOS-0) · Hub elevation via [92/93 AI Brain](./92_AI_BRAIN_GAP_REPORT.md)  
**Constraint:** Additive · Zero-trust gateway · No direct browser→model · Do not break Growth/Voice/Omni proxies

## 1. Goal

Embedded, multi-agent, authorized AI **operating layer** — not a chatbot. Analyzes, suggests, plans, starts automation (Workflow Engine), reports, and waits for human approval on irreversible actions.

## 2. What exists today

| Capability          | Reality                                                                   | Gap                                                 |
| ------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| CRM OpenAI proxies  | `server/growthAi.js`, `voiceChat.js`, `omniChat.js` + zero-trust `env.js` | OpenAI-only; not multi-agent OS                     |
| PII mask            | `apps/api` `maskSensitiveText`                                            | Incomplete (JWT/password/API patterns)              |
| Usage log stub      | `openaiUsageLog.ts`                                                       | Not agent/run/cost dashboard                        |
| Admin “AI Yönetimi” | Module list stub `/ai-yonetimi`                                           | No Control Center                                   |
| Workflow AI nodes   | WF-0 catalog                                                              | Not wired to AIOS gateway                           |
| Multi-provider      | None                                                                      | Need OpenAI / Claude / Gemini / Azure / local stubs |
| Agent registry      | None                                                                      | 23 standard agents missing                          |
| Tool system         | Ad-hoc module APIs                                                        | No validated, audited tool layer                    |
| Human approval      | None for AI actions                                                       | Required for cancel/delete/bulk/privilege           |
| Memory engine       | None                                                                      | Company/product context with masking                |
| Scheduler           | Cron only via WF triggers                                                 | Agent schedules missing                             |

## 3. Non-negotiable rules

1. **Browser never calls model providers** — only Backend → AI Gateway → Provider.
2. **AI never writes DB directly** — only Tools with authz + audit.
3. **Secrets never leave the gateway** — passwords, API keys, cards, IBAN, JWT, system secrets masked/blocked.
4. **New agents = registry entry**, not core rewrites.
5. Existing Growth/Voice routes remain; AIOS is the **central** path for new agent work.

## 4. Priority gaps

| ID  | Gap                                  | Sev |
| --- | ------------------------------------ | --- |
| A1  | AI Gateway + provider adapters       | P0  |
| A2  | Agent catalog + Agent Manager API/UI | P0  |
| A3  | Tool registry + permission + audit   | P0  |
| A4  | AI Control Center (admin)            | P0  |
| A5  | Runs / cost / token audit            | P0  |
| A6  | Human approval queue                 | P1  |
| A7  | Memory engine (scoped)               | P1  |
| A8  | Scheduler                            | P1  |
| A9  | Wire Workflow Engine actions → AIOS  | P2  |
| A10 | Full multi-provider production keys  | P2  |

## 5. Compatibility

- Keep `OPENAI_API_KEY` server-only; reject client keys in production (existing).
- Do not remove `/api/growth/*` or voice routes in AIOS-0.
- Workflow Engine remains separate; AIOS may _invoke_ it later via tools.
