# BACHMAIN Platform Production

## Domain map

| Domain | App | Vercel project | Root directory |
|--------|-----|----------------|----------------|
| bachmain.com / www | Kurumsal web | `bachmain-web` | `apps/web` |
| uygulama.bachmain.com | CRM | `bachmain` | `.` (repo root) |
| yonetim.bachmain.com | Admin | `bachmain-admin` | `apps/admin` |

## DNS (Squarespace)

Keep nameservers on Squarespace. Add/edit:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` **or** `bachmain.com` |
| CNAME | `uygulama` | `cname.vercel-dns.com` |
| CNAME | `yonetim` | `cname.vercel-dns.com` |

Do **not** change MX / SPF / DKIM (Google Workspace mail).

SSL: Vercel issues certificates automatically after DNS verifies.

## Login flow

Marketing site CTAs → `https://uygulama.bachmain.com`

## Shared API

Admin exposes `/api/*` (tickets, notifications, customers, dashboard).
CRM reads via `VITE_PLATFORM_API_URL`.

## Known gaps (localStorage CRM)

CRM still stores most business data in browser localStorage.
Full multi-tenant DB + realtime sockets require a managed database
(Postgres/Supabase) and are listed under remaining work.
