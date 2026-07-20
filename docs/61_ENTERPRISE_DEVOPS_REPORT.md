# BachMain Enterprise DevOps Report

**Date:** 2026-07-20  
**Scope:** CI skeleton (D1), branching + PR template (D2 start), staging/preview docs, Security Center deploy health  
**Related:** [59 Gap](./59_ENTERPRISE_DEVOPS_GAP_REPORT.md) · [60 Roadmap](./60_ENTERPRISE_DEVOPS_ROADMAP.md) · [62 Branching](./62_BRANCHING_STRATEGY.md) · [63 Staging](./63_STAGING_AND_PREVIEW.md) · [53 Security](./53_ENTERPRISE_SECURITY_REPORT.md)

---

## 1. Delivered this sprint

| Item                             | Location                                      |
| -------------------------------- | --------------------------------------------- |
| ESLint flat config (warn-first)  | `eslint.config.js`                            |
| Prettier                         | `.prettierrc.json`                            |
| Husky + lint-staged + commitlint | `.husky/*`, `commitlint.config.js`            |
| GitHub Actions CI                | `.github/workflows/ci.yml`                    |
| Soft secret scan                 | `scripts/ci-secret-scan.mjs`                  |
| PR template + CODEOWNERS         | `.github/`                                    |
| Branch / staging docs            | `docs/62`, `docs/63`                          |
| `develop` / `staging` branches   | Created from `main`                           |
| Security Center deploy panel     | `/api/security/overview` + `/security/deploy` |
| Ship script PR reminder          | `scripts/ship.sh`                             |

## 2. CI behavior (intentional)

- **Lint / format / audit / secret-scan:** soft (`continue-on-error`) during transition
- **API typecheck + CRM/API builds:** hard jobs
- **Admin build:** soft until always green
- **Main branch protection:** **not** forced yet (documented for D3)

## 3. Scores

| Dimension                  | Score        | Notes                                          |
| -------------------------- | ------------ | ---------------------------------------------- |
| CI maturity                | **62 / 100** | Skeleton live; gates not mandatory             |
| Release process            | **48 / 100** | Docs + branches; habit still main-push capable |
| Security + DevOps combined | **70 / 100** | P0 security done; DevOps catching up           |

## 4. Remaining risks

1. Direct `main` push still works (by design until D3)
2. Staging Neon / Vercel Staging project not yet provisioned in cloud console
3. No real unit test suite
4. Commitlint is warn-level — can still land non-conventional commits if hooks skipped

## 5. Next (D3)

1. Enable GitHub Environment `production` approval
2. Require CI checks on `main` after 2 weeks green
3. Provision staging Neon + Vercel Staging env vars
4. Expand tests beyond placeholder job

## 6. Regression

- [ ] `npm run lint` completes (warnings OK)
- [ ] `npm --prefix apps/api run typecheck`
- [ ] `npm run build`
- [ ] Admin `/guvenlik` shows CI/Deploy panel
