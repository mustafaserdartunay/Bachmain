# BachMain Enterprise Security — Roadmap

**Rule:** Working system must not break. Backward compatible. No data loss.

## Phase 0 — Documentation

- Gap report (`51_…`) and this roadmap (`52_…`)
- Link from architecture doc

## Phase 1 — P0 live hardening

| Item | Acceptance |
|------|------------|
| OpenAI Zero Trust | Prod rejects client keys; env key only; rate limit / gate |
| Stripe webhooks | Signature verified; idempotent events |
| Secrets / gitignore | `.env.*`, pems ignored; no hardcoded secrets |
| ENV fail-fast | Missing required env exits (prod) |
| Vercel headers | HSTS + CSP report-only |

## Phase 2 — `apps/api` control plane

- SSL DB pool, JWT 15m / refresh 30d, Argon2id + scrypt fallback  
- RBAC on mutations, append-only audit, Redis rate limit  
- OpenAI server-only + prompt/cost log + PII mask  

## Phase 3 — Security Center (Admin)

- Live audit/session/ENV/API/AI health + security score  

## Phase 4 — CRM multi-tenant cutover (gated)

- Dual-write then API-first; `company_id` on all queries  

## Phase 5 — Ops maturity

- Private storage, backup/DR, monitoring aggregation  

## Final

- `53_ENTERPRISE_SECURITY_REPORT.md` with scores and remaining risks  
