# BachMain Database — Gap Report (Target vs Today)

**Version:** 2026-07-20  
**Target:** Enterprise Multi-Tenant SaaS DB Philosophy (user spec 2026)  
**Baseline:** [56_DATABASE_CURRENT_STATE.md](./56_DATABASE_CURRENT_STATE.md)

---

## Verdict

Plane A (`apps/api`) is a **solid identity/billing/support scaffold** (~33 tables) but is **far from** the full enterprise module catalog (CRM children, projects, production, logistics, accounting, AI, document center).  

Production still depends on **Plane B JSON blobs** + **Plane C localStorage**.  

Building all target tables in one migration would be high risk. Gaps below are prioritized for a **phased, additive, backward-compatible** plan ([58](./58_DATABASE_MIGRATION_PLAN.md)).

---

## 1. Global standard columns

| Required field | Status | Gap |
|----------------|--------|-----|
| `id` UUID | OK on Plane A | Plane B uses TEXT ids |
| `company_id` | Partial | Missing on some children; never on Plane B |
| `branch_id` | Missing | No `branches` table |
| `warehouse_id` | Partial | Only stock movements |
| `created_by` / `updated_by` | Missing | Only ticket `created_by_user_id` |
| `created_at` / `updated_at` / `deleted_at` | OK Plane A | Missing / incomplete Plane B |
| `is_active` | Missing | Use `status` / `active` inconsistently |
| `version` | Missing | No optimistic concurrency / template versioning |

**Query rule:** “Every query filters `company_id`” — enforced only on thin API CRM routes today; CRM SPA does not.

---

## 2. Core / platform tables (spec §3)

| Target | Exists? | Notes |
|--------|---------|-------|
| companies | Yes | Missing branding/settings split |
| company_settings | Partial | `system_settings` KV only |
| company_subscription | Alias | `subscriptions` |
| company_branding | No | |
| company_billing | Partial | via subscriptions/payments |
| company_domains | No | |
| company_integrations | No | |
| branches | No | |
| warehouses | Yes | No zones/bins |
| warehouse_locations | No | |
| users | Yes | |
| roles / permissions / role_permissions | Yes | `user_roles` missing (membership.role TEXT instead) |
| user_roles | No | |
| sessions | Partial | `refresh_tokens` ≠ full session table |
| audit_logs / activity_logs | Yes | audit lacks `company_id` index |
| notifications | Yes | |
| files | Yes | Public URL model; private R2 later |
| tags / comments / attachments / favorites | No | |
| custom_fields / custom_field_values | No | |
| workflows / workflow_steps | No | |
| approval_flows / approval_logs | No | |

---

## 3. Domain modules — coverage matrix

| Domain | Spec tables (approx) | SQL today | Gap severity |
|--------|----------------------|-----------|--------------|
| CRM (§4) | ~17 | `customers` only | **Critical** |
| Project (§5) | ~9 | 0 | Critical |
| Tasks (§6) | ~10 | 0 (localStorage) | Critical |
| Calendar (§7) | ~4 | 0 | High |
| Sales (§8) | ~7 | 0 (quotes local) | Critical |
| Production (§9) | ~12 | 0 | Critical |
| Stock (§10) | ~13 | products/categories/stock_movements | High |
| Warehouse (§11) | ~7 | warehouses only | High |
| Logistics (§12) | ~25 | 0 | Critical |
| Accounting (§13) | ~13 | SaaS invoices only | Critical |
| Document center (§14) | ~8 | 0 | High |
| Subscription (§15) | ~8 | plans/subscriptions/payments/feature_flags | Medium |
| AI (§16) | ~9 | 0 (usage log helper only) | High |
| Integration (§17) | ~7 | webhook_events + api_keys | Medium |

---

## 4. Index gaps (vs spec §18)

| Rule | Status |
|------|--------|
| Index every FK | **Incomplete** — several FKs lack secondary indexes |
| `(company_id, …)` composite | Partial — tickets good; customers only single-col |
| `(company_id, deleted_at)` | **Missing** everywhere |
| `(company_id, email)` unique customers | **Missing** |
| `status` indexes | Partial (tickets only) |
| `created_at` indexes | Partial (activity_logs) |

---

## 5. Soft delete / versioning / audit / search / reporting

| Concern | Status |
|---------|--------|
| Soft delete | Plane A columns exist; hard deletes still possible in admin JSON paths |
| Versioning | Absent |
| Audit on critical writes | Partial (API `logActivity`; not universal) |
| Full-text / search columns | Absent (`tsvector` / search_document) |
| Reporting views / matviews | Absent |

---

## 6. Performance / tenancy risks

1. **JSON blob `app_state`** — does not scale to thousands of companies.  
2. **`tenant_data` collection dumps** — whole-collection rewrite; no row-level pagination.  
3. **No RLS** — tenancy is application-layer only.  
4. **Name collision:** future sales `invoices` vs SaaS `invoices`. Recommend rename SaaS → `billing_invoices` before sales module.  
5. **Dual identity** — staff vs tenant users vs app_state accounts.

---

## 7. What must NOT happen

- Drop Plane A or Plane B tables  
- Big-bang CREATE of 150+ empty tables without app cutover  
- Force CRM off localStorage without dual-write soak ([54](./54_CRM_TENANT_CUTOVER.md))  
- Silent rename of live billing tables without views/aliases  

---

## Related

- Migration plan: [58_DATABASE_MIGRATION_PLAN.md](./58_DATABASE_MIGRATION_PLAN.md)
