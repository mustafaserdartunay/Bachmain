# BachMain load tests (k6)

Scenario file: `scenarios.js`

Tiers (via `scripts/run-k6.sh`): **50**, **100**, **500**, **1000** concurrent users.

Covered groups:

- Login page (web)
- API health
- Dashboard shell
- Teklif / Sipariş / Üretim / Rapor (analitik) screens

Heavy tiers (500+) require `K6_ALLOW_HEAVY=1`.

HTML reports: `tests/reports/k6/vus-*/report.html` and `tests/reports/k6/index.html`.
