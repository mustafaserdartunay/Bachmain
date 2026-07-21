# Commercial Sales Gate — Pre-Live Audit

**Date:** 2026-07-21  
**Auditor role:** Independent enterprise software review (code evidence)  
**Repo HEAD at audit start:** `d916da7`  
**Verdict:** **NOT READY FOR COMMERCIAL SALES** (🔴)

This document is the sales-blocker gate. Hub “foundations” (MP-0 / IH-0 / GC-Cloud) are **product theater / stubs**, not enterprise completions.

## Deal blockers (must clear before mid/large enterprise sales)

1. **CRM/ERP SoT is browser `localStorage`** — multi-device, multi-user, backup, and tenant isolation claims fail. Dual-write OFF (`src/utils/crmApiDualWrite.js`).
2. **Commerce “promote to ERP” does not create ERP orders** — `promoteOrderLocal` writes `erp_stub_*` only.
3. **Marketplace / Integration Hub installs are in-memory / localStorage** — lost on restart; no durable secrets vault.
4. **Backup/restore not proven** — runbook exists; no restore script/drill evidence; Security Center backup `placeholder: true`.
5. **No load-test evidence** for 100 / 1 000 companies or 10 000 concurrent users.
6. **Audit log sparse** — finance/orders/install/connect largely unaudited.
7. **WhatsApp tokens plaintext** in tenant JSON; Meta HMAC requires `WHATSAPP_APP_SECRET` + raw body (now gated in production).
8. **Fine-grained RBAC incomplete** — tokens now carry coarse `perms`; domain-specific codes still reuse `crm.customers.*`.

## Critical fixes applied in this gate (security patches)

| Fix                                             | Status                                          |
| ----------------------------------------------- | ----------------------------------------------- |
| `GET /v1/admin/leads` requires staff            | Applied                                         |
| Empty JWT `perms` denied; login issues perms    | Applied                                         |
| AIOS strips client `system` role                | Applied                                         |
| iyzico webhook shared-secret gate + env         | Applied                                         |
| MFA tables migration `0015_mfa_trusted_devices` | Applied                                         |
| WhatsApp production signature gate              | Applied (needs `WHATSAPP_APP_SECRET` + rawBody) |

These patches **do not** make the product commercial-ready. They only remove the worst open holes found in this pass.

## Honest GO LIVE scores (0–100)

| Area         | Score | Why                                                                    |
| ------------ | ----: | ---------------------------------------------------------------------- |
| Architecture |    48 | Modular hubs exist; SoT split (LS vs API)                              |
| Security     |    42 | Patches applied; WA tokens, RBAC, audit still weak                     |
| Performance  |    28 | No load evidence; large SPA bundle                                     |
| Database     |    55 | Many migrations; MFA gap closed; CRM not on Neon                       |
| AI           |    40 | Gateway server-side OK; tools simulated; injection partially mitigated |
| ERP          |    35 | Orders/stock/quotes local-first                                        |
| UI/UX        |    62 | Design system hubs; mobile unproven                                    |
| Scalability  |    22 | No multi-tenant load proof                                             |
| Cloud        |    50 | Vercel deploys work; env docs incomplete                               |
| DevOps       |    45 | Ship scripts; DR unproven                                              |
| Compliance   |    30 | Audit/immutability incomplete                                          |

**Average ≈ 41 / 100**

## Decision

🔴 **NOT READY** for mid/large institutional commercial sales as a multi-tenant Enterprise ERP.

### Allowed today (narrow)

- Demo / pilot with **single-browser** process CRM disclaimer
- Staff-operated admin + billing signup flows (with secrets configured)
- Documented “foundation” hubs as **roadmap UI**, not sold features

### Required before 🟡 READY AFTER FIXING

1. CRM cutover: Neon SoT + dual-write ON + localStorage deprecate
2. Commerce promote → real `orders` row
3. Durable marketplace/integrations + encrypted secrets
4. Quarterly restore drill script + evidence log
5. Domain RBAC + audit on money/order paths
6. Meta raw-body HMAC verified end-to-end
7. Load test report (100 tenants minimum)

### Required before 🟢 READY FOR COMMERCIAL SALES

All of the above + GIB/e-invoice production path, live channel adapters for sold packages, and signed customer SLA matching actual SoT.
