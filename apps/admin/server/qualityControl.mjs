import AdmZip from 'adm-zip'
import { getStaffSession } from './staffAuth.mjs'

const DEFAULT_REPOSITORY = 'mustafaserdartunay/Bachmain'
const WORKFLOW_FILE = 'quality.yml'
const ALLOWED_SUITES = new Set(['all', 'e2e', 'api', 'lighthouse', 'load'])

function config() {
  return {
    token: String(process.env.GITHUB_ACTIONS_TOKEN || '').trim(),
    repository: String(process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY).trim(),
    ref: String(process.env.GITHUB_ACTIONS_REF || 'main').trim(),
  }
}

function requireSuperAdmin(req) {
  const session = getStaffSession(req)
  if (!session) {
    return { ok: false, status: 401, message: 'Yönetim personeli oturumu gerekli' }
  }
  if (session.user?.role !== 'super_admin') {
    return { ok: false, status: 403, message: 'Bu işlem yalnızca Super Admin içindir' }
  }
  return { ok: true, session }
}

async function github(path, options = {}) {
  const { token, repository } = config()
  if (!token) {
    const error = new Error('GITHUB_ACTIONS_TOKEN yapılandırılmamış')
    error.status = 503
    error.code = 'QUALITY_CONTROL_NOT_CONFIGURED'
    throw error
  }
  if (!repository || !repository.includes('/')) {
    const error = new Error('GITHUB_REPOSITORY owner/repo biçiminde olmalı')
    error.status = 503
    error.code = 'QUALITY_CONTROL_NOT_CONFIGURED'
    throw error
  }

  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'bachmain-admin-quality-control',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    const error = new Error(detail.message || `GitHub API HTTP ${response.status}`)
    error.status = response.status
    error.code = 'GITHUB_API_ERROR'
    throw error
  }
  return response
}

function normalizeRun(run) {
  return {
    id: run.id,
    runNumber: run.run_number,
    name: run.display_title || run.name,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    commit: run.head_sha?.slice(0, 8),
    actor: run.actor?.login,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    startedAt: run.run_started_at,
    htmlUrl: run.html_url,
  }
}

async function listRuns() {
  const response = await github(
    `/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/runs?per_page=20`,
  )
  const data = await response.json()
  return {
    configured: true,
    repository: config().repository,
    workflow: WORKFLOW_FILE,
    runs: (data.workflow_runs || []).map(normalizeRun),
  }
}

async function runDetail(id) {
  if (!/^\d+$/.test(String(id || ''))) {
    const error = new Error('Geçersiz run id')
    error.status = 400
    throw error
  }

  const [runResponse, jobsResponse, artifactsResponse] = await Promise.all([
    github(`/actions/runs/${id}`),
    github(`/actions/runs/${id}/jobs?per_page=100`),
    github(`/actions/runs/${id}/artifacts?per_page=100`),
  ])
  const [run, jobsData, artifactsData] = await Promise.all([
    runResponse.json(),
    jobsResponse.json(),
    artifactsResponse.json(),
  ])
  return {
    run: normalizeRun(run),
    jobs: (jobsData.jobs || []).map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      htmlUrl: job.html_url,
      failedSteps: (job.steps || [])
        .filter((step) => step.conclusion === 'failure')
        .map((step) => ({ name: step.name, number: step.number })),
    })),
    artifacts: (artifactsData.artifacts || []).map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      size: artifact.size_in_bytes,
      expired: artifact.expired,
      expiresAt: artifact.expires_at,
      reportUrl: `/api/quality?op=report&artifactId=${artifact.id}`,
      downloadUrl: `/api/quality?op=download&artifactId=${artifact.id}`,
    })),
  }
}

async function dispatch(body) {
  const suite = ALLOWED_SUITES.has(body?.suite) ? body.suite : 'all'
  const heavy = body?.heavy === true && (suite === 'all' || suite === 'load')
  const response = await github(
    `/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/dispatches`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: config().ref,
        inputs: { suite, heavy: String(heavy) },
      }),
    },
  )
  await response.text()
  return {
    ok: true,
    suite,
    heavy,
    message: 'Test çalıştırma isteği GitHub Actions kuyruğuna alındı',
  }
}

async function artifactZip(artifactId) {
  if (!/^\d+$/.test(String(artifactId || ''))) {
    const error = new Error('Geçersiz artifact id')
    error.status = 400
    throw error
  }
  const response = await github(`/actions/artifacts/${artifactId}/zip`)
  return Buffer.from(await response.arrayBuffer())
}

function pickHtml(zip, requestedPath) {
  const entries = zip
    .getEntries()
    .filter((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.html'))
  if (requestedPath) {
    const exact = entries.find((entry) => entry.entryName === requestedPath)
    if (exact) return exact
  }
  return (
    entries.find((entry) => /(^|\/)index\.html$/i.test(entry.entryName)) ||
    entries.find((entry) => /report\.html$/i.test(entry.entryName)) ||
    entries[0]
  )
}

async function serveReport(req, res, artifactId, requestedPath) {
  const zip = new AdmZip(await artifactZip(artifactId))
  const entry = pickHtml(zip, requestedPath)
  if (!entry) {
    const error = new Error('Artifact içinde HTML raporu bulunamadı')
    error.status = 404
    throw error
  }
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'private, max-age=60')
  res.setHeader(
    'Content-Security-Policy',
    "sandbox allow-scripts; default-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' blob:",
  )
  res.end(entry.getData())
}

async function downloadArtifact(res, artifactId) {
  const data = await artifactZip(artifactId)
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="bachmain-quality-${artifactId}.zip"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.end(data)
}

export function qualityControlSnapshot() {
  const value = config()
  return {
    configured: Boolean(value.token && value.repository),
    repository: value.repository,
    workflow: WORKFLOW_FILE,
    ref: value.ref,
  }
}

/**
 * Single-segment `/api/quality` endpoint for Vercel routing reliability.
 */
export async function handleQualityControl(req, res, path, body = {}, query = {}) {
  if (path !== 'quality') return false

  const access = requireSuperAdmin(req)
  if (!access.ok) {
    res.statusCode = access.status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'QUALITY_CONTROL_FORBIDDEN', message: access.message }))
    return true
  }

  try {
    if (req.method === 'POST') {
      const result = await dispatch(body)
      res.statusCode = 202
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(result))
      return true
    }

    if (req.method === 'GET' && query.op === 'detail') {
      const result = await runDetail(query.runId)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(result))
      return true
    }

    if (req.method === 'GET' && query.op === 'report') {
      await serveReport(req, res, query.artifactId, query.path)
      return true
    }

    if (req.method === 'GET' && query.op === 'download') {
      await downloadArtifact(res, query.artifactId)
      return true
    }

    if (req.method === 'GET') {
      const snapshot = qualityControlSnapshot()
      if (!snapshot.configured) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ...snapshot, runs: [] }))
        return true
      }
      const result = await listRuns()
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(result))
      return true
    }

    res.statusCode = 405
    res.setHeader('Allow', 'GET, POST')
    res.end()
    return true
  } catch (error) {
    res.statusCode = Number(error.status || 500)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        error: error.code || 'QUALITY_CONTROL_ERROR',
        message: error.message || 'Test kontrol merkezi hatası',
      }),
    )
    return true
  }
}
