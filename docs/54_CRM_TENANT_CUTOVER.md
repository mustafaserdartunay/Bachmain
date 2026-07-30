# CRM Multi-tenant Cutover Checklist (Phase 4)

**Status:** Gated — dual-write scaffolding shipped; API-first read is OFF by default.  
**Do not enable production cutover without explicit approval.**

## Goals

- Every CRM row scoped by server-side `company_id`
- Client `orgScope` remains UX-only
- No data loss: localStorage remains authoritative until dual-write is verified

## Feature flags

| Flag                       | Default | Effect                                          |
| -------------------------- | ------- | ----------------------------------------------- |
| `VITE_CRM_DUAL_WRITE=1`    | off     | Mirror local writes → `/api/tenant/:collection` |
| `VITE_CRM_READ_SOURCE=api` | `local` | Read from API first (experimental)              |

Helpers: `src/utils/crmApiDualWrite.js`, `src/utils/tenantSync.js`.

## Pre-flight

1. [ ] Neon schema has `company_id` on CRM tables (`apps/api` customers+)
2. [ ] Tenant JWT includes `cid`
3. [ ] Dual-write enabled on staging only for 7 days
4. [ ] Diff report: local vs API row counts per tenant
5. [ ] Rollback plan: set flags off; localStorage unchanged

## Cutover steps

1. Enable dual-write on staging
2. Smoke: create/edit customer → appears in API
3. Enable dual-write on production (still read-local)
4. Spot-check 3 tenants
5. Separate approval → `VITE_CRM_READ_SOURCE=api`
6. Monitor error rates 48h
7. Deprecate local-only writes in a later sprint

## Acceptance

- Zero silent data loss
- Server rejects cross-tenant reads
- Audit log entries for customer.create/update

## Company-first context authorization

The current CRM control plane (`yonetim.bachmain.com/api`) supports a backward-compatible
company-first authorization step before branch and warehouse authorization:

- A session may access its primary tenant plus explicitly granted tenant codes.
- Company switching issues a new signed token scoped to the selected `tenantCode`.
- Every tenant collection request resolves the selected company from the server-side grant list;
  a client-supplied tenant code alone never grants access.
- Access levels are `viewer` (read-only) and `editor` (read/write). The primary company owner
  remains `owner`; removing primary-owner access is forbidden.
- Revoking a grant invalidates existing scoped tokens on their next request because membership is
  re-checked server-side.
- The CRM clears and hydrates its workspace when the tenant code changes. A rejected read-only
  write is replaced with the authoritative server workspace.

Branch and warehouse selectors remain UX scopes inside the active company. Server-enforced
`branch_id` / `warehouse_id` authorization is a later migration and must not be represented as a
security boundary until normalized tables and repository filters are live.
