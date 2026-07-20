# BachMain Enterprise Document Platform — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** DP-0 foundation (additive)  
**Constraint:** Do not break `/belge-merkezi` designers, print, templates · Single PDF engine rule

## 1. Goal

Document Platform is not “PDF only”. Quotes, orders, production forms, waybills, invoices, packing lists, CMR, pallet/carton/product labels, QR/barcode, and mail/SMS/WhatsApp templates are produced from **one** engine — no-code, drag-and-drop, BachMain iOS design language.

## 2. What exists (preserve as SoT)

| Capability                | Reality                                    | Keep                    |
| ------------------------- | ------------------------------------------ | ----------------------- |
| Document Center hub       | `/belge-merkezi`                           | ✅ elevate as DP hub    |
| BachDocumentDesigner      | visual builder + undo/redo                 | ✅ SoT builder          |
| Templates store           | `docTemplatesStore` + versions[]           | ✅                      |
| Label designer            | `/belge-merkezi/etiket` + mm presets       | ✅                      |
| Variable catalog + engine | `docVariableCatalog` / `docVariableEngine` | ✅                      |
| Print / PDF               | `docPrint.js` (html2canvas → jsPDF)        | ✅ **canonical engine** |
| Print profiles            | `DocPrintProfilesPage` + store             | ✅                      |
| Print jobs                | `docPrintJobsStore`                        | ✅                      |
| Quote/order deep-link     | `/belge-merkezi/yazdir?type=`              | ✅ adapter path         |
| Spec docs                 | `BACHMAIN_DOCUMENT_CENTER/*`               | ✅                      |
| Workflow actions          | `action.document.print`                    | ✅ extend               |

## 3. Gaps

| ID  | Gap                                                   | Sev                  |
| --- | ----------------------------------------------------- | -------------------- |
| D1  | Enterprise hub IA (all DP tabs)                       | P0                   |
| D2  | `/v1/documents` + `0012_document_platform`            | P0                   |
| D3  | Single engine adapter (quotes/statement still forked) | P0 rule / P1 migrate |
| D4  | Variables / Assets / Fonts real UIs                   | P1                   |
| D5  | AI Document Designer                                  | P0 stub              |
| D6  | Barcode/QR dedicated designers (beyond label)         | P1                   |
| D7  | Approval via Workflow                                 | P1                   |
| D8  | Localization packs                                    | P2                   |
| D9  | Version compare / rollback UI                         | P1                   |
| D10 | Digital signature / PDF/A / CMYK                      | P2                   |
| D11 | Template marketplace live                             | P1 stub              |
| D12 | Printer agent (ZPL/ESC-POS)                           | P2                   |
| D13 | Orphan `DocumentVisualDesigner`                       | P1 quarantine        |

## 4. Non-negotiable

1. **One document engine** — `docPrint` + `docVariableEngine` + designer blocks. No new parallel PDF stacks.
2. Quote/order DOM-PDF paths become **adapters** later; do not rewrite in DP-0.
3. Master templates stay client workspace SoT until API dual-write.
4. Event-driven: `trigger.document.*` via Workflow.
5. Knowledge Platform ≠ Document Platform (docs vs operational templates).

## 5. Integration

ERP · CRM · MES · Finance · Logistics · Workflow · AIOS · Knowledge · Print Center · Commerce
