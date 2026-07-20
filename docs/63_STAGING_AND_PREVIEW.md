# Staging & Vercel Preview

## Preview (every PR)

Vercel Git integration (or CLI) creates a **Preview** deployment per PR automatically when the GitHub repo is connected.

Checklist:

1. Connect GitHub repo to Vercel projects: `bachmain` (CRM), `bachmain-admin`, `bachmain-web`
2. Enable “Preview Deployments” for PR branches
3. Comment Preview URL on PR (Vercel bot)

Env: use Preview environment variables — **never** point Preview at production Neon write credentials if avoidable. Prefer read-only or staging DB.

## Staging environment

| Item       | Recommendation                                                            |
| ---------- | ------------------------------------------------------------------------- |
| Git branch | `staging`                                                                 |
| Vercel     | Separate project **or** Staging alias on same project with Staging env    |
| Database   | Neon **branch** or separate database `bachmain_staging`                   |
| Secrets    | Distinct `JWT_*`, Stripe **test** keys, `OPENAI_API_KEY` (budget-limited) |
| Domain     | e.g. `staging.uygulama.bachmain.com` / `staging.yonetim.bachmain.com`     |

### Neon staging

1. Create branch from prod (or empty DB + migrate Drizzle `0000`+)
2. Set `DATABASE_URL` only on Vercel Staging / `staging` branch env
3. Run `npm --prefix apps/api run db:migrate` + `db:seed` against staging

### Manual promote (until Environment approval)

```bash
# After staging soak
git checkout main
git merge staging
git push origin main
# Then production deploy via approved ship / Vercel prod
```

## Production approval (D3)

GitHub Environment `production` with required reviewers. Until enabled, document every prod deploy in PR or commit message.

## Rollback

1. Vercel Dashboard → Project → Deployments → ⋯ → **Promote** previous Ready deployment
2. Or Instant Rollback if available
3. Note deployment ID in Admin Security Center / incident log

See also: [55_OPS_BACKUP_DR.md](./55_OPS_BACKUP_DR.md)
