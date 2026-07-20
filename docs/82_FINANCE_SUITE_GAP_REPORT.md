# BachMain Financial Suite — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** FS-0 foundation (additive)  
**Constraint:** Do not break `/nakit`, `/giderler`, `/musteriler/faturalar` · Do not fork balances

## 1. Goal

Finance is fully integrated with ERP, CRM, production, warehouse, purchasing, logistics, and AI — not only voucher posting.

## 2. What exists (preserve as SoT)

| Capability            | Reality                                                       | Keep                        |
| --------------------- | ------------------------------------------------------------- | --------------------------- |
| Treasury              | `/nakit/*` + `treasuryStore` (accounts, movements, çek/senet) | ✅                          |
| Sales invoices / AR   | `/musteriler/faturalar` + `salesInvoicesStore`                | ✅                          |
| Expenses / AP         | `/giderler/*` as treasury movements                           | ✅                          |
| Cash flow chart       | `/nakit/nakit-akisi-raporu`                                   | ✅                          |
| Tax/VAT settings      | `/ayarlar/vergi-kdv`                                          | ✅                          |
| Incoming e-invoice UI | `/giderler/gelen-e-faturalar` seed                            | ✅ stub                     |
| Org multi-company     | Kurumsal yapı + orgScope on treasury                          | ✅                          |
| Entitlement           | `/finans` → `finance` module                                  | ✅ route missing until FS-0 |

## 3. Gaps

| ID  | Gap                                             | Sev     |
| --- | ----------------------------------------------- | ------- |
| F1  | Finance Center `/finans` hub                    | P0      |
| F2  | Chart of accounts + journal projection          | P0      |
| F3  | Management reports (BS / P&L) on projection     | P0      |
| F4  | AI Finance (cash forecast, FX, collection risk) | P0 stub |
| F5  | Bank reconciliation                             | P1      |
| F6  | Budget                                          | P1      |
| F7  | Cost accounting (product/order/machine)         | P1      |
| F8  | Fixed assets                                    | P2      |
| F9  | Real e-invoice / e-ledger adapters              | P1      |
| F10 | AI Collection reminders (mail/WA/SMS)           | P1      |

## 4. Non-negotiable

1. No parallel kasa/gider/fatura balances.
2. Journals **project** from treasury movements + invoices via FKs.
3. Events: `trigger.finance.*` + existing `invoice.issued` / `payment.received`.
4. Integrate MDM (parties/products), Workflow, AIOS, Knowledge.

## 5. Integration

CRM · MES · Commerce · MDM · Workflow · AIOS · Knowledge
