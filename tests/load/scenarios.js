import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const API_BASE = __ENV.API_BASE || 'https://api.bachmain.com'
const WEB_BASE = __ENV.WEB_BASE || 'https://bachmain.com'
const APP_BASE = __ENV.APP_BASE || 'https://uygulama.bachmain.com'
const VUS = Number(__ENV.VUS || 50)
const DURATION = __ENV.DURATION || '2m'

const errorRate = new Rate('bach_errors')
const loginLatency = new Trend('bach_login_ms')
const apiLatency = new Trend('bach_api_ms')

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: Math.max(1, Math.floor(VUS / 10)),
      stages: [
        { duration: '30s', target: Math.floor(VUS / 2) },
        { duration: DURATION, target: VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    bach_errors: ['rate<0.08'],
  },
}

function ok(res, name) {
  const pass = check(res, {
    [`${name} status < 500`]: (r) => r.status < 500,
  })
  errorRate.add(!pass)
  return pass
}

export default function () {
  group('health', () => {
    const res = http.get(`${API_BASE}/v1/health`, { tags: { name: 'health' } })
    apiLatency.add(res.timings.duration)
    ok(res, 'health')
  })

  group('login page', () => {
    const res = http.get(`${WEB_BASE}/giris`, { tags: { name: 'login_page' } })
    loginLatency.add(res.timings.duration)
    ok(res, 'login_page')
  })

  group('dashboard shell', () => {
    const res = http.get(`${APP_BASE}/`, { tags: { name: 'dashboard' } })
    ok(res, 'dashboard')
  })

  group('process screens', () => {
    for (const path of ['/teklifler', '/siparisler', '/uretim', '/analitik']) {
      const res = http.get(`${APP_BASE}${path}`, { tags: { name: path.slice(1) } })
      ok(res, path)
    }
  })

  sleep(1)
}
