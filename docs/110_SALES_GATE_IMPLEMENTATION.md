# Sales-gate implementation log (2026-07-26)

Implements critical items from `docs/109_ENTERPRISE_SAAS_FULL_AUDIT.md` without changing product visual design.

## Shipped

| Item            | Change                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| CSRF            | `apps/api` `/v1/auth/csrf` + cookie double-submit; `apps/admin/server/csrf.mjs` on mutating `/api/*` |
| RBAC            | Role→perms matrix (`rolePermissions.ts` / client mirror); JWT no longer issues `*` for all tenants   |
| Dual-write gate | `crmStore` / `logisticsStore` / `workspaceStorage` only sync when `VITE_CRM_DUAL_WRITE=1`            |
| Token hygiene   | Stop writing access token to `document.cookie`; optional `VITE_AUTH_MEMORY_TOKEN=1`                  |
| ErrorBoundary   | Root boundary + `captureException` in `src/utils/sentry.js`                                          |
| Upload guard    | MIME/size/dangerous-ext checks in `secureFileUpload.js` → ProductFilesUpload                         |
| Stub shelving   | Finance hub, Integration Hub, AIOS, Workflow, CXC, etc. redirect `/`                                 |
| RLS SQL         | `apps/api/drizzle/0018_tenant_rls.sql` (manual apply + app.company_id)                               |
| DR drill        | `npm run dr:restore-drill` → `docs/dr-evidence/`                                                     |
| CI smoke        | `npm run smoke:security` + GitHub `test-security` job                                                |

## Still required before commercial “Evet”

1. Neon cutover (enable dual-write staging → API read → deprecate localStorage)
2. Apply RLS + non-owner DB role + `set_config('app.company_id')` per request
3. Object storage (R2) replace data-URL uploads
4. Full HttpOnly access-token path (memory flag is interim)
5. Playwright E2E on money paths
6. Live restore drill with `CONFIRM_RESTORE=YES`

## Flags

```bash
VITE_CRM_DUAL_WRITE=1          # staging only until verified
VITE_CRM_READ_SOURCE=local     # keep until cutover approval
VITE_AUTH_MEMORY_TOKEN=1       # optional XSS reduction (session lost on refresh)
VITE_SENTRY_DSN=...            # + npm i @sentry/react
```
