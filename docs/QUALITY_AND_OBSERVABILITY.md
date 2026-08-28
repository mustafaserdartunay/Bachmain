# Quality & Observability (BachMain)

Production-oriented continuous testing and monitoring for BachMain surfaces:

| Surface | URL                                            |
| ------- | ---------------------------------------------- |
| Web     | https://bachmain.com                           |
| CRM     | https://uygulama.bachmain.com                  |
| Admin   | https://yonetim.bachmain.com                   |
| API     | https://api.bachmain.com (or `API_PUBLIC_URL`) |

## Layout

```
tests/e2e/           Playwright journeys
tests/load/          k6 scenarios
tests/lighthouse/    Lighthouse runner inputs (reports under tests/reports)
tests/reports/       Generated HTML/JSON (gitignored)
bruno/bachmain/      Bruno REST collection
monitoring/          Prometheus + Grafana compose overlay
ops/sentry/          Release / source map upload
scripts/run-*.sh|mjs Quality runners + HTML aggregators
.github/workflows/quality.yml
```

## npm scripts

| Script                      | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `npm run test:e2e`          | Playwright (HTML → `tests/reports/playwright/html`) |
| `npm run test:api`          | Bruno + rate-limit probe                            |
| `npm run test:load`         | k6 tiers 50/100 (+500/1000 if `K6_ALLOW_HEAVY=1`)   |
| `npm run test:lighthouse`   | Perf / a11y / SEO / best-practices                  |
| `npm run test:quality`      | e2e + api + lighthouse + aggregate index            |
| `npm run test:report`       | `tests/reports/index.html` failure index            |
| `npm run compose:obs`       | API stack + Prometheus/Grafana exporters            |
| `npm run sentry:sourcemaps` | Upload CRM source maps for release                  |

## Credentials (CI / local)

```bash
export E2E_MEMBER_EMAIL=...
export E2E_MEMBER_PASSWORD=...
export E2E_ADMIN_EMAIL=...
export E2E_ADMIN_PASSWORD=...
export VITE_SENTRY_DSN=...          # CRM / admin build
export SENTRY_DSN=...               # API process
export SENTRY_AUTH_TOKEN=...        # source map upload
```

Credential-gated Playwright tests **skip** when secrets are absent (smoke still runs).

## Monitoring

```bash
docker compose -f docker-compose.yml -f monitoring/docker-compose.observability.yml up -d
```

- Grafana: http://localhost:3001 (default `admin` / `bachmain`)
- Prometheus: http://localhost:9090
- API metrics: `GET /metrics` (allow-listed from rate limit)

Dashboard panels: request count, error rate, API latency p95, active users approx, CPU, RAM, disk, network, PostgreSQL connections.

## Sentry

- Frontend: `src/utils/sentry.js`, `apps/admin/src/lib/sentry.ts` — `@sentry/react` when DSN set
- Backend: `apps/api/src/shared/sentry.ts` — `@sentry/node` when `SENTRY_DSN` set
- Source maps: Vite `build.sourcemap` when DSN/token present + `ops/sentry/upload-sourcemaps.sh`
- Release: `VITE_SENTRY_RELEASE` / `SENTRY_RELEASE`

## CI

`.github/workflows/quality.yml` runs on PR, nightly schedule, and `workflow_dispatch` (not on every `main` push — CI covers push gates). Artifacts upload under `tests/reports/*`. Heavy k6 (500/1000) only when manually dispatched with heavy flag. Live health checks use `yonetim.bachmain.com/api` until `api.bachmain.com` is production.

## Yönetim Kalite Kontrol Merkezi

Super Admin menüsündeki **Kalite Kontrol** (`/kalite-kontrol`) sayfası:

- Tüm testleri veya Playwright / Bruno / Lighthouse / k6 paketlerini ayrı ayrı başlatır.
- k6 500/1000 ağır yük katmanını ayrıca onaylatır.
- GitHub Actions durumunu 15 saniyede bir yeniler.
- Başarısız işleri ve adımları gösterir.
- CI artifact içindeki HTML raporunu güvenli server-side proxy ile açar veya ZIP indirir.

Vercel `bachmain-admin` production ortamında:

```bash
GITHUB_ACTIONS_TOKEN=<fine-grained-token>
GITHUB_REPOSITORY=mustafaserdartunay/Bachmain
GITHUB_ACTIONS_REF=main
```

Token yalnızca ilgili repository için **Actions: Read and write** iznine sahip olmalıdır.
Token tarayıcıya gönderilmez; yalnızca Yönetim API'si GitHub ile konuşur. Endpoint sadece
`super_admin` oturumuna açıktır. `ADMIN_PASSWORD` yapılandırılmadan kalite kontrol endpoint'i
çalışmaz.

## Suggested missing tests

1. Authenticated Playwright flows for invoice create, stock movements, MFA.
2. Multi-tenant isolation (company A cannot read company B customers).
3. k6 authenticated write path (teklif/sipariş POST) with seeded bearer tokens.
4. Bruno: refresh-token rotation, MFA verify, Stripe/iyzico webhook signature negatives.
5. Contract/OpenAPI snapshot vs `apps/api` route map.
6. Visual regression for `AppPageHeader` / `SplitCreateButton`.
7. Lighthouse with CRM `storageState` for authenticated routes.
8. Chaos: Redis down → in-memory rate limit fallback behaviour.
9. Admin member delete / email-change E2E (confirm dialogs).
10. Synthetic uptime checks (external) for `/v1/health` + web `/giris`.
