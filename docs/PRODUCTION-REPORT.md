# BACHMAIN Platform — Production Cutover Report

Generated: 2026-07-11

## 1. Architecture

| Domain | Role | Code path | Vercel project |
|--------|------|-----------|----------------|
| https://bachmain.com | Kurumsal web | `apps/web` | `bachmain-web` |
| https://www.bachmain.com | Kurumsal web | `apps/web` | `bachmain-web` |
| https://uygulama.bachmain.com | CRM | repo root | `bachmain` (existing) |
| https://yonetim.bachmain.com | Admin | `apps/admin` | `bachmain-admin` |

## 2. DNS records (Squarespace)

| Type | Host | Value | Notes |
|------|------|-------|-------|
| A | `@` | `76.76.21.21` | apex → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | or `bachmain.com` |
| CNAME | `uygulama` | `cname.vercel-dns.com` | CRM |
| CNAME | `yonetim` | `cname.vercel-dns.com` | Admin |

Keep Google Workspace MX/SPF/DKIM unchanged.

## 3. Login flow

All marketing "Giriş Yap" CTAs redirect to `https://uygulama.bachmain.com`.

## 4. Environment variables

See `.env.production.example`.

CRM: `OPENAI_API_KEY`, `VITE_PLATFORM_API_URL`
Admin: `CORS_ORIGIN`, `JWT_SECRET`

## 5. Remaining work (honest)

- CRM data is still primarily **browser localStorage** (not a shared cloud DB).
- Admin JSON store on Vercel serverless uses `/tmp` (ephemeral) — needs Postgres/Supabase for durable multi-tenant data.
- Realtime Socket.io not deployed yet; API polling bridge is prepared via `platformApi.js`.
- Full RBAC/JWT across subdomains needs a dedicated auth service.

## 6. Test checklist

- [ ] bachmain.com loads marketing site
- [ ] Giriş Yap → uygulama.bachmain.com
- [ ] uygulama.bachmain.com loads CRM
- [ ] yonetim.bachmain.com loads admin
- [ ] HTTPS certificates valid
- [ ] Google Workspace email still works
