# BachMain Enterprise Security — Gap Report

**Status:** Baseline (2026-07-20)  
**Principle:** Do not break production · No data loss · Phased remediation  

## Verdict

BachMain is **not Enterprise-ready** yet. Production CRM is largely client-side (`localStorage`); admin Neon/JSON API handles auth/billing; `apps/api` Fastify scaffold is the intended control plane; root `server/` + `api/` OpenAI proxies are unauthenticated and accept client-supplied keys.

## Area matrix

| Area | Status | Notes |
|------|--------|-------|
| Folder structure | Partial | CRM at repo root; `apps/api` scaffold |
| API | Partial | Three stacks (Express AI, Admin, Fastify) |
| Database / Neon | Partial | Admin Neon blob; API Drizzle; no forced SSL |
| Auth | Partial | Admin JWT/session; CRM localStorage tokens |
| RBAC | Partial | Schema in API; CRM UI entitlements only |
| Middleware | Partial | Helmet mainly on `apps/api` |
| OpenAI | High risk | Public proxy + client keys |
| Stripe | High risk | Webhooks without signature verify |
| Mail | Partial | Resend in admin |
| WhatsApp | Partial | Admin Meta API |
| Google Maps | Partial | `VITE_*` client key (restrict in console) |
| Upload / Storage | Missing | Schema only |
| Cron / Cache / Queue | Missing | Redis unused |
| Audit / Activity | Partial | API tables; CRM local only |
| Multi-tenant | Critical gap | Server filter only on thin CRM API |
| Security Center | Mock | Nav exists; no live page |

## P0 risks

1. Unauthenticated OpenAI proxies accepting browser API keys  
2. Stripe webhooks without `Stripe-Signature` verification  
3. CRM multi-tenant data in browser storage  
4. Access tokens in `localStorage` / URL query  
5. Tracked sensitive seed data risk (`apps/admin/server/data/db.json`)

## Related docs

- [ENTERPRISE-SAAS-ARCHITECTURE.md](./ENTERPRISE-SAAS-ARCHITECTURE.md)
- [52_ENTERPRISE_SECURITY_ROADMAP.md](./52_ENTERPRISE_SECURITY_ROADMAP.md)
