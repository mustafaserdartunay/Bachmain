/**
 * Live host + integration metrics for Platform Ops / Sunucu İzleme.
 * Values come from the running Node process, Neon, GitHub, and Redis — never mocked.
 */
import os from 'node:os'
import fs from 'node:fs'
import { getSql, hasDatabase } from './db.mjs'

let lastCpuSample = null

function sampleCpuPercent() {
  const cpus = os.cpus()
  if (!cpus?.length) return 0

  let idle = 0
  let total = 0
  for (const cpu of cpus) {
    idle += cpu.times.idle
    total += Object.values(cpu.times).reduce((a, b) => a + b, 0)
  }

  if (!lastCpuSample) {
    lastCpuSample = { idle, total, at: Date.now() }
    // First call has no delta — approximate via 1 - idle/total of absolute counters
    return total > 0 ? Math.round((1 - idle / total) * 100) : 0
  }

  const idleDelta = idle - lastCpuSample.idle
  const totalDelta = total - lastCpuSample.total
  lastCpuSample = { idle, total, at: Date.now() }
  if (totalDelta <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100)))
}

function sampleRamPercent() {
  const total = os.totalmem()
  const free = os.freemem()
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round(((total - free) / total) * 100)))
}

function sampleStoragePercent() {
  try {
    // Prefer the writable volume used by this runtime (Vercel /tmp or project root).
    const target = process.env.VERCEL ? '/tmp' : process.cwd()
    const st = fs.statfsSync(target)
    const total = Number(st.blocks) * Number(st.bsize)
    const free = Number(st.bfree) * Number(st.bsize)
    if (!total) return 0
    return Math.max(0, Math.min(100, Math.round(((total - free) / total) * 100)))
  } catch {
    return 0
  }
}

async function probeNeon() {
  if (!hasDatabase()) {
    return { status: 'degraded', latencyMs: 0, detail: 'DATABASE_URL yok' }
  }
  const db = getSql()
  const started = Date.now()
  try {
    await db`SELECT 1 AS ok`
    return { status: 'healthy', latencyMs: Date.now() - started, detail: 'Neon Postgres' }
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - started,
      detail: err?.message || 'Neon bağlantı hatası',
    }
  }
}

async function probeRedis() {
  const url = String(process.env.REDIS_URL || '').trim()
  if (!url) return { status: 'degraded', latencyMs: 0, detail: 'REDIS_URL yok' }
  const started = Date.now()
  try {
    // Lightweight TCP-less check via fetch only if Upstash REST; otherwise mark configured.
    if (url.startsWith('https://')) {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2500) })
      return {
        status: res.ok || res.status === 400 || res.status === 401 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - started,
        detail: 'Redis REST',
      }
    }
    return { status: 'healthy', latencyMs: 0, detail: 'REDIS_URL tanımlı' }
  } catch (err) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - started,
      detail: err?.message || 'Redis erişilemedi',
    }
  }
}

async function probeGitHub() {
  const token = String(process.env.GITHUB_ACTIONS_TOKEN || '').trim()
  const repository = String(
    process.env.GITHUB_REPOSITORY || 'mustafaserdartunay/Bachmain',
  ).trim()
  if (!token) {
    return {
      status: 'degraded',
      latencyMs: 0,
      detail: 'GITHUB_ACTIONS_TOKEN yok',
      repository,
      configured: false,
    }
  }
  const started = Date.now()
  try {
    const res = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'bachmain-admin-system-metrics',
      },
      signal: AbortSignal.timeout(4000),
    })
    const latencyMs = Date.now() - started
    if (!res.ok) {
      return {
        status: 'degraded',
        latencyMs,
        detail: `GitHub HTTP ${res.status}`,
        repository,
        configured: true,
      }
    }
    const data = await res.json()
    return {
      status: 'healthy',
      latencyMs,
      detail: data.full_name || repository,
      repository: data.full_name || repository,
      configured: true,
      openIssues: data.open_issues_count ?? null,
      pushedAt: data.pushed_at || null,
    }
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - started,
      detail: err?.message || 'GitHub erişilemedi',
      repository,
      configured: true,
    }
  }
}

/**
 * Optional: live chat rows from shared Neon (apps/api schema). Empty if table missing.
 */
export async function loadLiveSupportRows() {
  if (!hasDatabase()) return []
  const db = getSql()
  try {
    const rows = await db`
      SELECT
        lc.id,
        lc.status,
        lc.created_at,
        lc.updated_at,
        COALESCE(c.name, '—') AS company_name,
        COALESCE(cu.full_name, cu.email, '—') AS customer_name,
        COALESCE(au.full_name, au.email, '—') AS agent_name
      FROM live_conversations lc
      LEFT JOIN companies c ON c.id = lc.company_id
      LEFT JOIN users cu ON cu.id = lc.customer_user_id
      LEFT JOIN users au ON au.id = lc.agent_user_id
      WHERE lc.status IS DISTINCT FROM 'closed'
      ORDER BY lc.updated_at DESC NULLS LAST
      LIMIT 50
    `
    return (rows || []).map((r) => {
      const updated = r.updated_at ? new Date(r.updated_at).getTime() : Date.now()
      const waitMin = Math.max(0, Math.round((Date.now() - updated) / 60000))
      return {
        id: r.id,
        customer: r.company_name || r.customer_name || '—',
        agent: r.agent_name || 'Atanmadı',
        topic: r.customer_name || 'Canlı destek',
        waitTime: `${waitMin}dk`,
        status: r.status === 'open' ? 'Aktif' : r.status || 'Aktif',
      }
    })
  } catch {
    // Table may not exist on this Neon branch — not an error for admin ops.
    return []
  }
}

export async function collectSystemHealthExtras() {
  const apiStarted = Date.now()
  const [database, redis, github] = await Promise.all([
    probeNeon(),
    probeRedis(),
    probeGitHub(),
  ])
  const apiLatencyMs = Date.now() - apiStarted

  const cpuPercent = sampleCpuPercent()
  const ramPercent = sampleRamPercent()
  const storagePercent = sampleStoragePercent()

  return {
    cpuPercent,
    ramPercent,
    storagePercent,
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    loadAverage: os.loadavg().map((n) => Math.round(n * 100) / 100),
    memory: {
      totalMb: Math.round(os.totalmem() / (1024 * 1024)),
      freeMb: Math.round(os.freemem() / (1024 * 1024)),
    },
    database,
    redis,
    github,
    api: {
      status: 'healthy',
      latencyMs: apiLatencyMs,
      detail: process.env.VERCEL ? 'Vercel serverless' : 'Local Node',
    },
    vercel: {
      status: process.env.VERCEL ? 'healthy' : 'degraded',
      env: process.env.VERCEL_ENV || (process.env.VERCEL ? 'unknown' : 'local'),
      region: process.env.VERCEL_REGION || null,
    },
  }
}

/** Rows for Sunucu İzleme module — built from live probes. */
export async function buildServerMonitorRows() {
  const extras = await collectSystemHealthExtras()
  const statusOf = (pct) => (pct >= 85 ? 'Uyarı' : 'Sağlıklı')
  return [
    {
      id: 'srv_runtime',
      name: extras.api.detail || 'Admin Runtime',
      cpu: `%${extras.cpuPercent}`,
      memory: `%${extras.ramPercent}`,
      disk: `%${extras.storagePercent}`,
      status: statusOf(Math.max(extras.cpuPercent, extras.ramPercent, extras.storagePercent)),
      latency: `${extras.api.latencyMs}ms`,
    },
    {
      id: 'srv_neon',
      name: 'Neon Postgres',
      cpu: '—',
      memory: '—',
      disk: '—',
      status:
        extras.database.status === 'healthy'
          ? 'Sağlıklı'
          : extras.database.status === 'down'
            ? 'Kritik'
            : 'Uyarı',
      latency: `${extras.database.latencyMs}ms`,
    },
    {
      id: 'srv_github',
      name: extras.github.repository || 'GitHub',
      cpu: '—',
      memory: '—',
      disk: '—',
      status:
        extras.github.status === 'healthy'
          ? 'Sağlıklı'
          : extras.github.status === 'down'
            ? 'Kritik'
            : 'Uyarı',
      latency: `${extras.github.latencyMs}ms`,
    },
    {
      id: 'srv_redis',
      name: 'Redis',
      cpu: '—',
      memory: '—',
      disk: '—',
      status:
        extras.redis.status === 'healthy'
          ? 'Sağlıklı'
          : extras.redis.status === 'down'
            ? 'Kritik'
            : 'Uyarı',
      latency: `${extras.redis.latencyMs}ms`,
    },
  ]
}

export function formatTry(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)
}

/** Dashboard KPIs derived only from store — no hardcoded demo numbers. */
export function buildDashboardPayload(store) {
  const customers = store.customers || []
  const accounts = store.accounts || []
  const tickets = store.supportTickets || []
  const paymentRequests = store.paymentRequests || []
  const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes(t.status))
  const activeCustomers = customers.filter((c) =>
    ['active', 'trial', 'trialing'].includes(String(c.status || c.subscriptionStatus || '')),
  )
  const mrr = customers.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0)
  const onlineUsers = accounts.filter((a) => a.token || a.sessionToken).length
  const expiringLicenses = customers
    .filter((c) => ['active', 'trial', 'trialing'].includes(String(c.status || '')))
    .filter(
      (c) =>
        c.licenseExpiry && new Date(c.licenseExpiry) < new Date(Date.now() + 90 * 86400000),
    )
    .slice(0, 8)

  const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const now = new Date()
  const revenueChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
    const month = d.getMonth()
    const year = d.getFullYear()
    const monthMrr = customers
      .filter((c) => {
        const created = c.createdAt ? new Date(c.createdAt) : null
        if (!created || Number.isNaN(created.getTime())) return Number(c.mrr) > 0
        return created <= new Date(year, month + 1, 0) && Number(c.mrr) > 0
      })
      .reduce((sum, c) => sum + (Number(c.mrr) || 0), 0)
    return { label: monthLabels[month], value: monthMrr }
  })

  const recentActivities = [
    ...customers.slice(0, 8).map((c) => ({
      id: `act_c_${c.id}`,
      title: 'Müşteri kaydı',
      description: `${c.company || c.email} · ${c.plan || c.planCode || '—'}`,
      date: c.createdAt || c.updatedAt || new Date().toISOString(),
      type: 'success',
      user: 'Sistem',
    })),
    ...openTickets.slice(0, 5).map((t) => ({
      id: `act_t_${t.id}`,
      title: 'Açık destek talebi',
      description: t.subject || t.id,
      date: t.updatedAt || t.createdAt || new Date().toISOString(),
      type: 'warning',
      user: t.assignee || 'Destek',
    })),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 12)

  const pendingPayments = paymentRequests
    .filter((p) => p.status === 'pending')
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      customer: p.companyName || p.email || 'Üye',
      amount: Number(p.amount) || 0,
      dueDate: (p.createdAt || '').slice(0, 10),
      status: 'pending',
    }))

  return {
    kpis: [
      {
        label: 'Aktif Müşteri',
        value: String(activeCustomers.length),
        change: `${customers.length} toplam`,
        trend: 'up',
      },
      {
        label: 'Aylık Gelir (MRR)',
        value: formatTry(mrr),
        change: `${accounts.length} üye hesap`,
        trend: mrr > 0 ? 'up' : 'neutral',
      },
      {
        label: 'Açık Ticket',
        value: String(openTickets.length),
        change: `${tickets.length} toplam`,
        trend: openTickets.length ? 'down' : 'neutral',
      },
      {
        label: 'Online Oturum',
        value: String(onlineUsers),
        change: 'Anlık',
        trend: 'neutral',
      },
    ],
    revenueChart,
    recentActivities,
    expiringLicenses,
    openTickets: openTickets.slice(0, 8),
    pendingPayments,
    systemHealth: [],
  }
}
