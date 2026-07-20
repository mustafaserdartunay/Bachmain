# Ops — Private Storage, Backup / DR, Monitoring (Phase 5)

## Private storage

**Target:** Cloudflare R2 (or S3-compatible) with private buckets + short-lived signed URLs.

| Rule | Detail |
|------|--------|
| Public upload | Closed |
| Browser access | Signed GET only (≤ 15 min TTL) |
| Virus scan | Deferred until scanner pipeline ready |

Env (planned): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE` (empty in private mode).

## Backup

1. **Neon PITR** — enable point-in-time recovery on production branch; document retention days in runbook.
2. **Logical dump** — weekly `pg_dump` to private object storage (encrypted).
3. **Admin JSON store** — if still used as fallback, snapshot `db.json` is gitignored; use Neon as SoT.

## Disaster recovery

| Scenario | RTO target | Action |
|----------|------------|--------|
| Region outage | 4h | Fail over Neon to secondary / restore PITR |
| Accidental delete | 1h | PITR to timestamp; verify tenant isolation |
| Ransomware / wipe | 24h | Restore encrypted dump + rotate secrets |

### Runbook (summary)

1. Declare incident in admin Security Center notes
2. Freeze writes if needed (`maintenance` flag)
3. Restore DB from PITR or dump
4. Rotate `JWT_*`, `STRIPE_*`, `OPENAI_API_KEY`, `AI_PROXY_SECRET`
5. Smoke: login, one CRM page, AI health, Stripe webhook test event
6. Postmortem within 5 business days

## Monitoring aggregation

Health probes (document endpoints):

- Neon: `SELECT 1` via `/v1/health` DB check (extend)
- Vercel: deployment + edge status
- OpenAI: `/api/growth/health` / AI health
- Resend: bounce/error webhooks
- Stripe: webhook delivery dashboard + signature failures

Admin Security Center panels surface ENV / API / OpenAI / rate-limit / backup placeholders until full aggregation jobs land.
