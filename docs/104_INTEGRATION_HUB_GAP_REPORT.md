# BachMain Enterprise Integration Hub — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation (IH-0)  
**Companion:** [90/91 Platform](./90_PLATFORM_CORE_GAP_REPORT.md) · [66/67 Workflow](./66_WORKFLOW_ENGINE_GAP_REPORT.md) · [102/103 Marketplace](./102_MARKETPLACE_GAP_REPORT.md) · [68/69 AIOS](./68_AIOS_GAP_REPORT.md)  
**Constraint:** Operating hub for connectors · Event-driven · No second bus · Deep-link existing SoTs · Do not rewrite WhatsApp/OpenAI/Commerce/Billing adapters

## 1. Goal

Not an API screen — the company’s **external world control plane**: ERP, CRM, commerce, accounting, banks, shipping, IoT, AI, B2B/B2C. Connections, webhooks, ETL, EDI, file transfer, AI wizard, and visual flow builder under one hub. Platform Core registers; Marketplace discovers; **Integration Hub operates**.

## 2. Exists

| Surface                         | Reality                                   |
| ------------------------------- | ----------------------------------------- |
| Platform Integration Center     | `/platform?tab=integrations` status stubs |
| Platform API Gateway tab        | `/platform?tab=api` stub                  |
| Marketplace integrations shelf  | `/marketplace?tab=integrations`           |
| WhatsApp / omni                 | `/mesajlar` (live channel)                |
| OpenAI settings                 | `/ayarlar/ai/openai`                      |
| Commerce channels               | `/ticaret`                                |
| Workflow actions                | `/otomasyon`                              |
| Billing webhooks                | API-only Stripe/iyzico                    |
| Central Integration Hub         | **Missing**                               |
| Webhook / ETL / EDI / Retry UI  | Missing                                   |
| Logo / Paraşüt / SAP connectors | Missing                                   |

## 3. Closed in IH-0

| ID  | Gap                             | Fix                                                       |
| --- | ------------------------------- | --------------------------------------------------------- |
| I1  | No central hub                  | `/entegrasyon` Dashboard + category tabs                  |
| I2  | Scattered connectors            | Unified connector catalog + Connection Manager stubs      |
| I3  | No webhook / ETL / EDI surfaces | Hub tabs with stubs + deep-links                          |
| I4  | No AI wizard                    | NL brief → draft flow heuristic (local)                   |
| I5  | No ops events                   | `trigger.integration.*` catalog + publish on connect/sync |

## 4. Open

| ID  | Gap                                   | Phase |
| --- | ------------------------------------- | ----- |
| I6  | Real OAuth / secrets vault            | IH-1  |
| I7  | Live webhook signature + retry engine | IH-1  |
| I8  | ETL runtime + field mapping canvas    | IH-1  |
| I9  | EDI EDIFACT/X12 parsers               | IH-2  |
| I10 | Bank / shipping / PLC adapters        | IH-2  |
| I11 | Sandbox mock APIs                     | IH-1  |
| I12 | OpenAPI export + Postman              | IH-2  |

## 5. Rules

1. One event bus: `workflow/eventBus` — no second bus.
2. Existing adapters stay SoT; hub deep-links them.
3. Connectors are isolated; never mutate Platform Core tables directly.
4. High-risk sync → Human Approval via Workflow.
5. Marketplace installs integration packs; Hub runs them.
