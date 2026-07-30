# BachMain Enterprise Security Report

**Date:** 2026-07-20  
**Scope:** P0 live hardening + `apps/api` control-plane + Admin Security Center + gated CRM cutover scaffolding + ops docs  
**Related:** [51 Gap](./51_ENTERPRISE_SECURITY_GAP_REPORT.md) · [52 Roadmap](./52_ENTERPRISE_SECURITY_ROADMAP.md) · [54 Cutover](./54_CRM_TENANT_CUTOVER.md) · [55 Ops](./55_OPS_BACKUP_DR.md)

---

## 1. Findings (before)

| Risk                                            | Severity | Notes                      |
| ----------------------------------------------- | -------- | -------------------------- |
| OpenAI proxies accepted client API keys in prod | Critical | Key leak / abuse           |
| Stripe webhooks without signature verify        | Critical | Fake payment activation    |
| Secrets / `db.json` tracked                     | High     | Credential exposure in git |
| Weak / missing ENV fail-fast                    | High     | Misconfigured prod boots   |
| CRM multi-tenant mostly client-side             | High     | No server least-privilege  |
| Security Center mock-only                       | Medium   | No live telemetri          |
| Missing HSTS / CSP                              | Medium   | Browser hardening gap      |

---

## 2. Remediated in this sprint

### OpenAI Zero Trust

- Production ignores client `apiKey` / `X-OpenAI-Key` (`server/env.js`)
- `AI_PROXY_SECRET` gate + in-memory rate limit
- Guards on Express AI server and growth/voice/omni handlers

### Stripe

- HMAC signature verify + idempotent event claim (`apps/admin/server/stripeWebhook.mjs`, `apps/api` billing)
- Raw body preserved for signature
- `STRIPE_WEBHOOK_SECRET` required in production when Stripe enabled

### Secrets / ENV / headers

- `.gitignore`: `.env.*`, `*.pem`, `apps/admin/server/data/db.json`
- Admin `assertEnv.mjs` fail-fast in production
- `apps/api` Zod ENV (JWT 15m / refresh 30d defaults)
- Vercel HSTS + CSP-Report-Only + Permissions-Policy

### `apps/api` harden

- Neon/prod SSL pool
- Password policy min 12 + complexity; scrypt hash (argon2id format reserved)
- `requirePermission` RBAC (legacy tokens without `perms` still allowed)
- Append-only audit (DELETE → 405)
- Redis rate limit when `REDIS_URL` set
- OpenAI usage log helper with PII mask

### Security Center

- Live `/api/security/overview` + Admin `/guvenlik` page with security score 0–100

### Phase 4 / 5 scaffolding

- Dual-write flags + checklist (`54_…`)
- Backup/DR/monitoring runbook (`55_…`)

---

## 3. Remaining risks

| Risk                           | Severity | Next step                                    |
| ------------------------------ | -------- | -------------------------------------------- |
| CRM still localStorage-primary | High     | Complete dual-write soak → API-first (gated) |
| Tokens in localStorage / XSS   | High     | HttpOnly cookies cutover                     |
| Argon2id not yet primary hash  | Medium   | Add `argon2` package + migrate on login      |
| CSP report-only only           | Medium   | Tighten after violation review               |
| Private R2 not wired           | Medium   | Phase 5 implementation                       |
| AI proxy secret optional       | Medium   | Require `AI_PROXY_SECRET` in prod            |

---

## 4. Scores (self-assessment)

| Dimension             | Score        | Comment                              |
| --------------------- | ------------ | ------------------------------------ |
| Security posture      | **72 / 100** | P0 closed; tenancy cutover pending   |
| Performance readiness | **70 / 100** | Rate limits + SSL; Redis optional    |
| Code / architecture   | **68 / 100** | Dual planes (admin + api) converging |
| Ops / DR maturity     | **55 / 100** | Documented; automation pending       |

---

## 5. Recommendations

1. Require `AI_PROXY_SECRET` in production within 14 days
2. Run staging dual-write for ≥ 7 days before API-first reads
3. Move session tokens to HttpOnly Secure cookies
4. Enforce CSP (non-report-only) after 2 weeks of reports
5. Wire Neon PITR verification into Security Center backup panel

---

## 6. Regression checklist

- [ ] Staff / tenant login
- [ ] Same tenant user login from two independent PC/Mac sessions; notification-mail failure must not block either login
- [ ] One CRM page load + save
- [ ] AI health endpoint
- [ ] Stripe test webhook (signed)
- [ ] Admin `/guvenlik` score loads
