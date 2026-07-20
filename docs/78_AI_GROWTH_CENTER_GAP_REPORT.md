# BachMain AI Growth Center — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** AG-0 foundation (extends existing `/ai-buyume`)  
**Constraint:** Do not fork OpenAI proxy · Integrate Workflow / AIOS / Knowledge · Auditable events

## 1. Goal

BachMain grows the company — not only manages it. AI drives sales, SEO, ads, content, social, competitor intel, opportunities, and reports.

## 2. What exists today

| Capability                   | Reality                                                  | Gap                                                            |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| Growth CRM module            | `/ai-buyume` studios + calendar + automation + analytics | Menu ≠ Enterprise IA; no Lead/Funnel/SMS/Campaign/Reports hubs |
| OpenAI generate              | `server/growthAi.js` + `/api/growth/*`                   | Not on platform `/v1/growth`; no tenant DB audit               |
| Content / SEO / Ads / Social | Studio pages + localStorage library                      | Multi-language batch, channel publish, ads platforms stubs     |
| Dashboard                    | Content/calendar/usage metrics                           | Missing visitors, leads, ROAS, CAC, LTV, orders                |
| Lead pool                    | CRM customers / portal leads separate                    | No unified Growth Lead Center + AI score                       |
| Funnel / Landing builder     | Landing studio stub                                      | No visual funnel builder                                       |
| Integrations                 | None for GA/GSC/pixels                                   | Catalog stubs only                                             |
| Workflow / AIOS              | Separate hubs                                            | Growth events not wired                                        |

## 3. Non-negotiable

1. Keep existing `/ai-buyume` routes and OpenAI studios working.
2. Additive platform tables + `/v1/growth/*`.
3. Event bus: `trigger.growth.*` → Workflow; optional AIOS tools later.
4. Manual **or** AI-assisted — user chooses.

## 4. Priority gaps

| ID  | Gap                                                       | Sev |
| --- | --------------------------------------------------------- | --- |
| G1  | Enterprise menu + Lead/Funnel/Campaign/SMS/Reports shells | P0  |
| G2  | Growth dashboard KPIs (demo + API overview)               | P0  |
| G3  | Unified lead inbox + AI score stub                        | P0  |
| G4  | Platform schema + `/v1/growth` API                        | P0  |
| G5  | Growth → Workflow event catalog                           | P0  |
| G6  | Multi-language content jobs                               | P1  |
| G7  | Real ad/social/email/WhatsApp adapters                    | P2  |
| G8  | Landing drag-drop + Funnel canvas                         | P2  |
| G9  | Analytics pixels (GA/GSC/Meta/…)                          | P2  |

## 5. Compatibility

- Existing `aiGrowthSettings` / library / calendar remain SoT for studio drafts until AG-1 dual-write.
- AIOS agents (SEO, Ads, Social) remain catalog; Growth Center is the operator UI.
- Knowledge used for brand SOPs (AG-1 RAG prompts).
