# BachMain Enterprise DevOps — Gap Report

**Status:** Post-D1/D2 baseline (2026-07-20)  
**Plan path:** This file satisfies the upgrade plan’s `docs/54_ENTERPRISE_DEVOPS_GAP_REPORT.md`.  
**Also published as:** [59_ENTERPRISE_DEVOPS_GAP_REPORT.md](./59_ENTERPRISE_DEVOPS_GAP_REPORT.md) (extended numbering series).

## Verdict

Security P0 and DevOps **D1 CI skeleton + D2 branches/docs** are landed. Production can still ship via `main` + Vercel CLI during transition; PR/CI/preview path is ready but **main branch protection is not forced yet** (D3).

## Matrix (after this upgrade)

| Layer                     | Before        | After                                                  |
| ------------------------- | ------------- | ------------------------------------------------------ |
| GitHub Actions            | Missing       | `.github/workflows/ci.yml` (lint soft; builds present) |
| ESLint / Prettier / Husky | Missing       | Root warn-first + lint-staged + commitlint             |
| TypeScript (CRM)          | JSX-majority  | Unchanged (api/admin tsc in CI)                        |
| Unit tests                | Minimal       | Placeholder job only                                   |
| Branches                  | Direct `main` | `develop` + `staging` + docs (`62`)                    |
| Preview / staging         | Undocumented  | Documented (`63`); Neon staging env still to provision |
| Prod approval             | CLI `--prod`  | Still allowed; Environment approval = D3               |
| Rollback                  | Manual        | Runbook + Security Center deploy panel                 |
| Conventional commits      | Habit         | commitlint warn-level                                  |

## Related

- Roadmap: [55_ENTERPRISE_DEVOPS_ROADMAP.md](./55_ENTERPRISE_DEVOPS_ROADMAP.md) · [60](./60_ENTERPRISE_DEVOPS_ROADMAP.md)
- Report: [56_ENTERPRISE_DEVOPS_REPORT.md](./56_ENTERPRISE_DEVOPS_REPORT.md) · [61](./61_ENTERPRISE_DEVOPS_REPORT.md)
- Security: [51](./51_ENTERPRISE_SECURITY_GAP_REPORT.md) · [53](./53_ENTERPRISE_SECURITY_REPORT.md)
- Note: `54_CRM_TENANT_CUTOVER.md` and `55_OPS_BACKUP_DR.md` remain separate CRM/ops docs (different filenames).
