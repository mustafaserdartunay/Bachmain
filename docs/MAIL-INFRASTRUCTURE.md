# BACHMAIN Production Mail Infrastructure

**Provider:** [Resend](https://resend.com) (preferred)  
**Shared across:** `uygulama.bachmain.com` · `yonetim.bachmain.com` · `bachmain.com`  
**API host:** `yonetim.bachmain.com/api/mail/*` and auth mail endpoints

## Environment variables (Vercel — never commit secrets)

Set on **bachmain-admin** (and any service that sends mail):

| Variable | Example | Required |
|----------|---------|----------|
| `RESEND_API_KEY` | `re_xxxx` | Yes (send) |
| `EMAIL_FROM` | `BACHMAIN <noreply@bachmain.com>` | Yes |
| `EMAIL_REPLY_TO` | `destek@bachmain.com` | Optional |
| `SUPPORT_EMAIL` | `destek@bachmain.com` | Optional |
| `APP_URL` | `https://uygulama.bachmain.com` | Yes (links) |
| `ADMIN_URL` | `https://yonetim.bachmain.com` | Optional |
| `WEB_URL` | `https://bachmain.com` | Optional |
| `MAIL_LOGIN_NOTIFY` | `1` / `0` | Optional (default on) |

Also add `RESEND_API_KEY` + `EMAIL_FROM` to `apps/api` when that stack is production.

## DNS (domain: bachmain.com)

Create a domain in Resend → Domains → `bachmain.com` (or `mail.bachmain.com`).  
Add **exactly** the records Resend shows. Typical pattern:

| Type | Name / Host | Value (example — use Resend dashboard values) |
|------|-------------|-----------------------------------------------|
| TXT | `@` or `resend._domainkey` | DKIM public key from Resend |
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@bachmain.com` |
| MX | optional / receiving only | Not required for outbound transactional |

After verify status is **Verified** in Resend, production sends use `noreply@bachmain.com`.

Until verified, Resend only allows sending to the account owner email (test mode).

## Templates (HTML)

`welcome`, `email_verification`, `password_reset`, `password_changed`, `new_login`, `two_factor`, `subscription_purchased`, `subscription_renewed`, `package_expiring`, `package_expired`, `grace_started`, `payment_success`, `payment_failed`, `ticket_new`, `ticket_replied`, `new_message`, `campaign`, `announcement`, `invoice_created`, `trial_ending`, `test`

## Admin UI

`https://yonetim.bachmain.com/eposta`

- Mail geçmişi · Kuyruk · Başarısız · Yeniden gönder · API / şablon testi

## Auth CRM flows

- Register → welcome + verify email  
- Login → new login notice  
- `/sifremi-unuttum` → reset mail  
- `/sifre-sifirla?token=` → set password + changed notice  
- `/eposta-dogrula?token=` → verify  

## Queue & logs

Store: `store.mail.queue` + `store.mail.logs`  
Statuses: `queued` · `pending` · `sent` · `failed` · `resent` · `skipped_no_provider`  
Process: `POST /api/mail/process-queue`

## Smoke test

1. Set `RESEND_API_KEY` on Vercel admin project  
2. Verify DNS in Resend  
3. Staff → E-posta Merkezi → API Testi → your inbox  
4. Expect status `sent` and Resend dashboard delivery
