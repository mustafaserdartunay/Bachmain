# BachMain Marketplace — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation (MP-0)  
**Companion:** [90/91 Platform / Plugin](./90_PLATFORM_CORE_GAP_REPORT.md) · [100/101 App Builder](./100_AI_APP_BUILDER_GAP_REPORT.md) · [86/87 Documents](./86_DOCUMENT_PLATFORM_GAP_REPORT.md)  
**Constraint:** Ecosystem hub · Install via Plugin SDK only · Isolated extensions · Security scan stub · Do not rewrite Document/AIOS/App Builder store tabs — deep-link them

## 1. Goal

Not a simple app store — BachMain **ecosystem**: AI Agents, industry packs, apps, themes, documents, dashboards, workflows, integrations, prompts — one-click install. All installs are Plugin SDK extensions; never mutate Platform Core.

## 2. Exists

| Surface                             | Reality                        |
| ----------------------------------- | ------------------------------ |
| Platform Plugin Center              | `/platform?tab=plugins` stub   |
| Document Marketplace                | `/belge-merkezi/marketplace`   |
| App Builder packs                   | `/ai-uygulama?tab=marketplace` |
| AIOS marketplace tab                | Agent/prompt stub              |
| Unified Marketplace Home            | **Missing**                    |
| Install wizard / licenses / reviews | Missing                        |

## 3. Closed in MP-0

| ID  | Gap                        | Fix                                                                                                |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| M1  | No central hub             | `/marketplace` Discover + category tabs                                                            |
| M2  | Scattered catalogs         | Unified catalog seed (industry, agents, apps, docs, dashboards, WF, integrations, themes, prompts) |
| M3  | No install path            | Install Center stub → Plugin registry + local installed list                                       |
| M4  | No AI recommend            | Heuristic recommendations panel                                                                    |
| M5  | Broken App Store docs link | Docs 102/103 + index (74 retarget)                                                                 |

## 4. Open

| ID  | Gap                                    | Phase |
| --- | -------------------------------------- | ----- |
| M6  | Real dependency / compatibility engine | MP-1  |
| M7  | Paid licenses / billing                | MP-2  |
| M8  | Partner publish portal                 | MP-2  |
| M9  | Cloud sync of installs                 | MP-2  |
| M10 | Security malware scan pipeline         | MP-1  |

## 5. Rules

1. Installs are isolated plugins — no core table writes.
2. Security scan gate before publish (stub in MP-0).
3. Demo data optional; rollback supported in Install Center stub.
4. Deep-link SoT stores; do not duplicate Document/Workflow designers.
