# BachMain Global Commerce Platform — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation in progress (GC-0)  
**Constraint:** Single Product Master (MDM) · Event-driven orders · Do not fork products per channel

## 1. Goal

One platform for ERP + CRM + AI + Commerce: B2B, B2C, dealer, distributor, franchise, dropshipping, and marketplaces. **All channel orders flow into one center**; no manual copy between systems.

## 2. What exists today

| Capability                | Reality                                       | Gap                                 |
| ------------------------- | --------------------------------------------- | ----------------------------------- |
| Product master            | CRM products + MDM path                       | Not published to marketplaces       |
| Dealer pricing            | Product form dealer discount                  | No dealer portal commerce hub       |
| B2B panel                 | CustomerDetail B2B access flag + portal token | Not full B2B price/stock portal     |
| Bayi module               | `/bayi` sidebar                               | Not unified Commerce Center         |
| Marketplace sync          | None                                          | Amazon/Trendyol/… adapters missing  |
| Multi-currency/FX         | Product pricing FX helpers                    | No commerce price engine rules      |
| Multi-language product    | Partial / none                                | No i18n product content store       |
| Order channels            | Quotes/Orders local                           | No channel inbox / unified flow     |
| Stock sync                | Warehouse LS                                  | No multi-channel push               |
| Returns / subscriptions   | Partial CRM                                   | No Return Center / sub commerce     |
| Shipping/payment catalogs | Ops integrations scattered                    | No Commerce Shipping/Payment Center |

## 3. Non-negotiable

1. **One Product Master** — channels consume MDM/ERP product; never duplicate SKUs.
2. **Event bus** — `commerce.order.received` → Workflow / AIOS / Production / Warehouse.
3. **No manual order transfer** between channels and ERP.
4. Additive modules only — do not break `/bayi`, B2B portal, or stock pages.

## 4. Priority gaps

| ID  | Gap                                            | Sev |
| --- | ---------------------------------------------- | --- |
| C1  | Commerce Center UI + API shell                 | P0  |
| C2  | Channel catalog + connection stubs             | P0  |
| C3  | Unified order inbox                            | P0  |
| C4  | Price rules (customer/dealer/country/currency) | P0  |
| C5  | Stock sync job stub                            | P1  |
| C6  | Product i18n + AI content hooks                | P1  |
| C7  | Real marketplace adapters                      | P2  |
| C8  | Return / subscription commerce                 | P2  |
| C9  | Shipping & payment center                      | P2  |

## 5. Compatibility

- Products remain SoT in product catalog / MDM.
- Workflow + AIOS listen to commerce events (GC-1 wiring).
- Document Center marketplace ≠ commerce marketplace.
