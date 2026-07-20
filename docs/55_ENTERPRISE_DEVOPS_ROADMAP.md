# BachMain Enterprise DevOps — Roadmap

**Plan path:** `docs/55_ENTERPRISE_DEVOPS_ROADMAP.md`  
**Canonical twin:** [60_ENTERPRISE_DEVOPS_ROADMAP.md](./60_ENTERPRISE_DEVOPS_ROADMAP.md)

**Rule:** Do not break production. CI starts **non-blocking**; main protection is gradual.

## D1 — CI skeleton — DONE

- ESLint (warn-first) + Prettier + Husky + lint-staged + commitlint
- GitHub Actions: lint (soft), typecheck/build (soft/hard mix), audit (soft), secret scan (soft)
- Soft CRM bundle size note

## D2 — Branches / Preview / Staging — DONE (docs + git branches)

- `develop`, `staging` on origin; `feature/*`, `hotfix/*`, `release/*` documented
- PR template + CODEOWNERS
- Preview/staging runbook: [63_STAGING_AND_PREVIEW.md](./63_STAGING_AND_PREVIEW.md)
- Ship script warns on direct `main` deploys

**Still manual in cloud console:** Neon staging database + Vercel Staging env vars + GitHub↔Vercel Preview connection verify

## D3 — Gates + rollback — NEXT

- Required checks on `main`
- GitHub Environment `production` approval
- Keep Security Center deploy/rollback links current
- Drizzle migrate + backup checklist before prod schema changes

## D4 — Observability / release — LATER

- Sentry, alerts, Lighthouse soft budgets, semantic release

## Acceptance

Emergency `hotfix/*` → `main` remains documented until D3 protection is enabled.
