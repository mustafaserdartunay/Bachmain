# BachMain Enterprise DevOps — Roadmap

**Rule:** Do not break production. CI starts **non-blocking**; main protection is gradual.

## D1 — CI skeleton (this sprint)

- ESLint (warn-first on CRM JSX) + Prettier
- Husky + lint-staged
- Commitlint (warn → later error)
- GitHub Actions: lint, `apps/api` typecheck, CRM/admin/api build, `npm audit`, secret scan placeholder
- Soft bundle size note on CRM build

## D2 — Branches / Preview / Staging

- Branches: `develop`, `staging`; document `feature/*`, `hotfix/*`, `release/*`
- PR template (+ optional CODEOWNERS)
- Vercel Preview on PR; staging alias/env separate from prod
- Neon staging database (branch or separate) documented
- Ship scripts updated for PR-first flow; hotfix path documented

## D3 — Gates + rollback

- Required checks on `main` (after CI green habit)
- GitHub Environment `production` approval
- Rollback runbook + Security Center deploy health links
- Drizzle migration + backup checklist before prod migrate

## D4 — Observability / release (later)

- Sentry (or equivalent), alerts, Lighthouse soft budgets
- Feature flags server-side, semantic release / changelog

## Acceptance (D1)

CI may fail/warn without blocking emergency `hotfix/*` → `main` deploys during transition.
