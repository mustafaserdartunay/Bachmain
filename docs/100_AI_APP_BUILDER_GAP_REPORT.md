# BachMain AI App Builder & Workflow Designer — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation (AB-0)  
**Companion:** [66/67 Workflow](./66_WORKFLOW_ENGINE_GAP_REPORT.md) · [90/91 Platform / Plugin](./90_PLATFORM_CORE_GAP_REPORT.md) · [68/69 AIOS](./68_AIOS_GAP_REPORT.md)  
**Constraint:** NL → draft modules · Deep-link SoT builders · Plugin extension model · Do not rewrite Workflow / Analytics / Document designers · Do not patch core tables

## 1. Goal

Low-code / no-code AI native platform: users describe modules in natural language; AI scaffolds screens, forms, tables, workflows, reports, dashboards. Published apps integrate via **Plugin SDK** — never mutate Platform Core directly.

## 2. Exists (SoT — deep-link only)

| Capability                       | Reality                        |
| -------------------------------- | ------------------------------ |
| Workflow Designer                | `/otomasyon/designer`          |
| Analytics Dashboard Builder      | `/analitik?tab=builder`        |
| Document Designer                | `/belge-merkezi/tasarimci`     |
| Platform Plugin Center           | `/platform?tab=plugins` (stub) |
| Workflow NL stub                 | `src/workflow/aiAssistant.js`  |
| Generic Form/Page/Module builder | Missing                        |

## 3. Closed in AB-0

| ID  | Gap                             | Fix                                                 |
| --- | ------------------------------- | --------------------------------------------------- |
| B1  | No App Center hub               | `/ai-uygulama` tabbed hub                           |
| B2  | No NL → module draft            | localStore + `/v1/aios/app-builder/nl`              |
| B3  | No publish path                 | Plugin publish stub → Platform plugins intent       |
| B4  | Scattered builders              | Deep-link cards to WF / Analytics / Docs / Platform |
| B5  | Templates / marketplace surface | Template seed + Marketplace tab stub                |

## 4. Open (later)

| ID  | Gap                                | Phase       |
| --- | ---------------------------------- | ----------- |
| B6  | Real Form/Page/Table canvases      | AB-1        |
| B7  | DB modeler + migrations via Plugin | AB-1        |
| B8  | Runtime module loader              | AB-2        |
| B9  | Full Plugin SDK + Marketplace      | PC-2 / AB-2 |
| B10 | AI Code Assist (TS/SQL/tests)      | AB-2        |

## 5. Non-negotiable

1. Generated apps = extensions (Plugin), not core forks.
2. RBAC / ABAC / Audit / design system apply automatically.
3. Preview / draft / rollback before publish.
4. Simulations and drafts never write domain SoT until publish + approval.
