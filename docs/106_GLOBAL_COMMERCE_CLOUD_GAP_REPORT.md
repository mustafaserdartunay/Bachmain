# BachMain Global Commerce Cloud — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Cloud hub elevation (GC-Cloud / docs 106)  
**Companion:** [76/77 Commerce Platform](./76_COMMERCE_PLATFORM_GAP_REPORT.md) · [64/65 MDM](./64_MDM_GAP_REPORT.md) · [102/103 Marketplace](./102_MARKETPLACE_GAP_REPORT.md) · [104/105 Integration](./104_INTEGRATION_HUB_GAP_REPORT.md)  
**Constraint:** ERP extension · One Product Master · One order model · Event-driven promote · Do not fork SKUs/orders · Design System glass/iOS

## 1. Goal

Commerce is **not a website** — the company’s digital sales center: B2B, B2C, Dealer, Customer Portal, Marketplace, Showroom, AI Commerce on **one ERP-native platform**. Orders, stock, price, production, logistics, and accounting share the same data model.

## 2. Exists (76/77)

| Surface                      | Reality                                                  |
| ---------------------------- | -------------------------------------------------------- |
| Commerce Center `/ticaret`   | GC-0/GC-1 channels, inbox, price, stock sync, Product AI |
| API `/v1/commerce/*`         | Overview, channels, listings, inbox promote, GC-1 shells |
| Product Master               | `/stok/urunler` SoT                                      |
| ERP orders / quotes          | `/siparisler`, `/teklifler`                              |
| Cloud hub polish             | Partial — custom header, thin SoT strip                  |
| CPQ / configurator / loyalty | Missing                                                  |
| Customer / Supplier portals  | Stubs only                                               |
| `/bayi` route                | Sidebar orphan → retarget dealer tab                     |

## 3. Closed in GC-Cloud (106)

| ID  | Gap                         | Fix                                                                     |
| --- | --------------------------- | ----------------------------------------------------------------------- |
| G1  | Not positioned as Cloud hub | Elevate `/ticaret` → Global Commerce Cloud + AppPageShell               |
| G2  | Thin ERP deep-links         | SoT chips: sipariş, teklif, stok, lojistik, finans, belge, AIOS, MP, IH |
| G3  | Missing portal/CPQ surfaces | Hub tabs: CPQ, Configurator, Customer/Supplier, Loyalty, Gift, Showroom |
| G4  | `/bayi` orphan              | Navigate → `/ticaret?tab=dealer`                                        |
| G5  | Nav discoverability         | Top-level sidebar + `/commerce` alias                                   |

## 4. Open

| ID  | Gap                        | Phase            |
| --- | -------------------------- | ---------------- |
| G6  | Live marketplace adapters  | GC-2 (unchanged) |
| G7  | 360/3D/AR PDP runtime      | GC-3             |
| G8  | Real CPQ + live price calc | GC-2             |
| G9  | Checkout / loyalty engines | GC-2             |
| G10 | Multi-company storefronts  | GC-3             |

## 5. Rules

1. Never create a second order or product table for channels.
2. Inbox → `trigger.commerce.order.promoted` → ERP SoT once.
3. Channels consume MDM listings; Marketplace packs discover; Integration Hub connects.
4. Additive UI only — preserve GC-0/1 behaviors.
