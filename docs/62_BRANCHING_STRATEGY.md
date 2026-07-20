# Branch strategy (DevOps D2)

## Branches

| Branch      | Purpose         | Deploys to                            |
| ----------- | --------------- | ------------------------------------- |
| `main`      | Production      | Vercel production (CRM/admin/web)     |
| `develop`   | Integration     | Preview / optional develop alias      |
| `staging`   | Pre-prod soak   | Staging Vercel project + staging Neon |
| `feature/*` | Feature work    | PR → Preview                          |
| `hotfix/*`  | Urgent prod fix | Fast-track PR → `main`                |
| `release/*` | Release cut     | PR → `staging` then `main`            |

## Flow

```text
feature/* → PR → develop → PR → staging → approve → main (prod)
hotfix/*  → PR → main (emergency; document in PR)
```

## Transition rules

1. Prefer PRs; direct push to `main` remains possible until GitHub branch protection is enabled (D3).
2. CI on `main`/`develop`/`staging` must run; lint/audit may soft-fail during D1.
3. Hotfix: open `hotfix/<slug>` from `main`, merge with checklist in PR template.

## Protection (enable later in GitHub Settings)

- `main`: require PR, require CI `Build CRM` + `API typecheck`, optional CODEOWNERS
- Do **not** enable “block all pushes” until develop habit is stable (2+ weeks)
