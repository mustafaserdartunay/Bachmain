# BachMain AI Command Center — Gap Report

**Version:** 2026-07-20 · Cilt 21.1  
**Status:** Foundation (CC-0)  
**Companion:** [92/93 AI Brain](./92_AI_BRAIN_GAP_REPORT.md) · [68/69 AIOS](./68_AIOS_GAP_REPORT.md)  
**Constraint:** Additive personal workspace · Do not rewrite ModernDashboard or AiosHubPage internals · Glass / iOS surface language

## 1. Goal

Personal AI workspace that greets the user on login and runs the day: priorities, alerts, live KPIs, recommendations, quick actions, voice, smart search, chat, tasks, calendar, workflow approvals, insights, executive mode — role-personalized.

AI is a **day manager**, not a Q&A bot.

## 2. What exists

| Piece         | Reality                                                          |
| ------------- | ---------------------------------------------------------------- |
| Home `/`      | ModernDashboard (Güncel Durum)                                   |
| AIOS hub      | `/aios` tabbed brain ops                                         |
| Voice         | HeaderAiAssistant + `/api/voice/*`                               |
| Domain stores | orders, quotes, CRM tasks/appts, production, treasury, customers |
| Gateway chat  | `/v1/aios/gateway/chat` + local stub                             |

## 3. Gaps closed (CC-0)

| ID  | Gap                              | Fix                                                            |
| --- | -------------------------------- | -------------------------------------------------------------- |
| C1  | No personal AI home              | `/` → AI Command Center                                        |
| C2  | ModernDashboard displaced        | Preserved at `/guncel-durum`                                   |
| C3  | Greeting / Today / Alerts / KPIs | Live from domain stores + local seeds                          |
| C4  | Chat + voice                     | Right rail chat via AIOS client; voice opens header assistant  |
| C5  | Personalization                  | Persona modes (sales / production / finance / warehouse / ceo) |
| C6  | Quick actions / search           | Deep-links + local smart search                                |

## 4. Open (later)

| ID  | Gap                                       | Phase  |
| --- | ----------------------------------------- | ------ |
| C7  | Server-pushed realtime today feed         | CC-1   |
| C8  | NL ERP execute from chat (tools)          | AIOS-1 |
| C9  | Per-role layout sync to API               | CC-2   |
| C10 | Replace seed alerts with live risk engine | CC-1   |

## 5. Non-negotiable

1. Do not delete ModernDashboard — relocate only.
2. Do not fork AIOS gateway — reuse `src/aios/api.js`.
3. Browser never calls model providers.
4. Destructive actions still require Human Approval / domain screens.
