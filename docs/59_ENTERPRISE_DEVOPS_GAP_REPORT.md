# BachMain Enterprise DevOps — Gap Report

**Status:** Baseline (2026-07-20)  
**Note:** Numbered `59` because `54`–`58` are reserved for CRM cutover / ops / database docs.

## Verdict

Production ships via **direct `main` push + Vercel CLI**. There is **no GitHub Actions CI**, no ESLint/Prettier/Husky at CRM root, no enforced PR/preview/staging path. Security P0 work landed separately; DevOps maturity is the next bottleneck.

## Matrix

| Layer                     | Status                 | Gap                                    |
| ------------------------- | ---------------------- | -------------------------------------- |
| GitHub Actions            | Missing                | Lint/typecheck/build/audit/secret scan |
| ESLint / Prettier / Husky | Missing (root)         | Commit quality gate                    |
| TypeScript strict (CRM)   | JSX-majority           | `apps/api` + `apps/admin` have tsc     |
| Unit/integration tests    | Minimal / none         | No CI test job substance               |
| Branch strategy           | Direct `main`          | develop/staging/PR not required        |
| Preview deploy            | Manual/Vercel capable  | No PR → Preview workflow               |
| Staging DB                | Undocumented           | Prod Neon shared risk                  |
| Prod approval             | None (CLI `--prod`)    | Manual Environment approval            |
| Rollback                  | Manual previous deploy | No runbook in Security Center          |
| Conventional commits      | Partial habit          | Not enforced                           |
| Semantic release          | Manual `2.1.0`         | No changelog automation                |

## Related

- Roadmap: [60_ENTERPRISE_DEVOPS_ROADMAP.md](./60_ENTERPRISE_DEVOPS_ROADMAP.md)
- Report: [61_ENTERPRISE_DEVOPS_REPORT.md](./61_ENTERPRISE_DEVOPS_REPORT.md)
- Security: [51](./51_ENTERPRISE_SECURITY_GAP_REPORT.md) · [53](./53_ENTERPRISE_SECURITY_REPORT.md)
