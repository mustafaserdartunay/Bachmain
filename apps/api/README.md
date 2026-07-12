# BachMain API — local development

## Quick start

```bash
# 1) Infra
docker compose up -d db redis

# 2) API
cd apps/api
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Health: `GET http://127.0.0.1:8080/v1/health`

## Endpoints (v1)

| Area | Paths |
|------|--------|
| Auth | `/v1/auth/register`, `/login`, `/refresh`, `/forgot-password`, `/reset-password`, `/verify-email`, `/me` |
| Leads | `/v1/leads/demo` |
| Billing | `/v1/billing/plans`, `/checkout`, `/webhooks/stripe`, `/webhooks/iyzico`, `/payments`, `/invoices` |
| CRM | `/v1/customers` |
| Support | `/v1/support/tickets`, `/messages`, `/chat/*` |
| Admin | `/v1/admin/dashboard`, `/companies`, `/users`, `/subscriptions`, `/payments`, `/tickets`, `/activity-logs` |

Socket.IO connects to the same HTTP server; authenticate with `auth: { token: accessToken }`.

## Landing / CRM cutover

Set `VITE_API_URL=http://127.0.0.1:8080` on landing (and later CRM) to use this API.
Until then, production continues on legacy `yonetim.bachmain.com/api`.
