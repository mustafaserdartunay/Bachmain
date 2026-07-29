import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Accessibility,
  Boxes,
  Download,
  ExternalLink,
  FileCode2,
  Gauge,
  Play,
  RefreshCw,
  ShieldCheck,
  TestTube2,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/MetricCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { getStaffRole } from '@/pages/StaffLoginPage'
import {
  qualityControlApi,
  type QualityArtifact,
  type QualityRun,
  type QualityRunDetail,
  type QualitySuite,
} from '@/services/qualityControlApi'
import { formatDateTime } from '@/lib/utils'

const SUITES: Array<{
  id: QualitySuite
  title: string
  description: string
  icon: typeof TestTube2
  heavy?: boolean
}> = [
  {
    id: 'all',
    title: 'Tüm Kalite Testleri',
    description: 'Playwright, Bruno, Lighthouse ve k6 birlikte',
    icon: ShieldCheck,
  },
  {
    id: 'e2e',
    title: 'Playwright E2E',
    description: 'Web, CRM ve Yönetim kullanıcı yolculukları',
    icon: TestTube2,
  },
  {
    id: 'api',
    title: 'Bruno API',
    description: 'Auth, yetki, CRUD, token ve rate limit',
    icon: FileCode2,
  },
  {
    id: 'lighthouse',
    title: 'Lighthouse',
    description: 'Performans, erişilebilirlik, SEO, best practices',
    icon: Accessibility,
  },
  {
    id: 'load',
    title: 'k6 Yük Testi',
    description: '50 / 100 kullanıcı; ağır modda 500 / 1000',
    icon: Gauge,
    heavy: true,
  },
]

function runVariant(run: QualityRun) {
  if (run.status === 'queued' || run.status === 'in_progress') return 'warning' as const
  if (run.conclusion === 'success') return 'success' as const
  if (run.conclusion === 'failure' || run.conclusion === 'cancelled') return 'danger' as const
  return 'default' as const
}

function runLabel(run: QualityRun) {
  if (run.status === 'queued') return 'Kuyrukta'
  if (run.status === 'in_progress') return 'Çalışıyor'
  if (run.conclusion === 'success') return 'Başarılı'
  if (run.conclusion === 'failure') return 'Başarısız'
  if (run.conclusion === 'cancelled') return 'İptal'
  return run.conclusion || run.status
}

function reportHref(artifact: QualityArtifact, mode: 'report' | 'download') {
  // Same-origin staff cookie authenticates a new report tab. Token remains out of the URL.
  return mode === 'report' ? artifact.reportUrl : artifact.downloadUrl
}

export function QualityControlPage() {
  const [runs, setRuns] = useState<QualityRun[]>([])
  const [configured, setConfigured] = useState(true)
  const [repository, setRepository] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingSuite, setPendingSuite] = useState<QualitySuite | null>(null)
  const [heavy, setHeavy] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<QualityRunDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const role = getStaffRole()

  const loadRuns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await qualityControlApi.list()
      setRuns(response.runs)
      setConfigured(response.configured)
      setRepository(response.repository)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kalite çalıştırmaları alınamadı')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (runId: number, silent = false) => {
    if (!silent) setDetailLoading(true)
    try {
      setDetail(await qualityControlApi.detail(runId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çalıştırma detayı alınamadı')
    } finally {
      if (!silent) setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRuns()
    const timer = window.setInterval(() => {
      void loadRuns(true)
      if (selectedId) void loadDetail(selectedId, true)
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [loadDetail, loadRuns, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void loadDetail(selectedId)
  }, [loadDetail, selectedId])

  const activeCount = useMemo(
    () => runs.filter((run) => run.status === 'queued' || run.status === 'in_progress').length,
    [runs],
  )
  const failedCount = useMemo(
    () => runs.filter((run) => run.conclusion === 'failure').length,
    [runs],
  )

  async function confirmDispatch() {
    if (!pendingSuite) return
    setDispatching(true)
    setNotice('')
    try {
      const result = await qualityControlApi.dispatch(
        pendingSuite,
        heavy && (pendingSuite === 'load' || pendingSuite === 'all'),
      )
      setNotice(result.message)
      setPendingSuite(null)
      setHeavy(false)
      window.setTimeout(() => void loadRuns(true), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test başlatılamadı')
    } finally {
      setDispatching(false)
    }
  }

  if (role && role !== 'super_admin') {
    return (
      <ErrorState
        title="Erişim reddedildi"
        description="Kalite Kontrol Merkezi yalnızca Super Admin tarafından kullanılabilir."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalite Kontrol Merkezi"
        subtitle="Production testlerini başlat, canlı durumu izle ve HTML raporlarını görüntüle"
        actions={
          <Button variant="secondary" size="lg" onClick={() => void loadRuns()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        }
      />

      {!configured ? (
        <Card className="border-amber-300 bg-amber-50/80 dark:bg-amber-950/20" hover={false}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-text">GitHub Actions bağlantısı bekliyor</p>
              <p className="mt-1 text-sm text-text-muted">
                Yönetim production ortamına <code>GITHUB_ACTIONS_TOKEN</code> ekleyin. Token
                yalnızca Actions: Read and Write iznine sahip olmalıdır.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover={false}>
          <p className="text-xs font-medium text-text-muted">Son 20 Çalıştırma</p>
          <p className="mt-1 text-2xl font-bold text-text">{runs.length}</p>
        </Card>
        <Card hover={false}>
          <p className="text-xs font-medium text-text-muted">Aktif</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{activeCount}</p>
        </Card>
        <Card hover={false}>
          <p className="text-xs font-medium text-text-muted">Başarısız</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{failedCount}</p>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Test Başlat</h2>
            <p className="text-sm text-text-muted">İşler GitHub Actions runner üzerinde çalışır.</p>
          </div>
          {repository ? <Badge variant="default">{repository}</Badge> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SUITES.map((suite) => (
            <Card key={suite.id} className="flex h-full flex-col" hover={false}>
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <suite.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-text">{suite.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {suite.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!configured || dispatching}
                onClick={() => setPendingSuite(suite.id)}
                className="mt-auto inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8ad9ff] via-[#60a5fa] to-[#3b82f6] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Çalıştır
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card hover={false} padding="none">
          <div className="border-b border-border px-5 py-4">
            <CardHeader className="mb-0">
              <CardTitle className="text-base">Son Çalıştırmalar</CardTitle>
              <Badge variant={activeCount ? 'warning' : 'default'}>
                {activeCount ? `${activeCount} aktif` : 'Bekleyen yok'}
              </Badge>
            </CardHeader>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <p className="p-5 text-sm text-text-muted">Çalıştırmalar yükleniyor…</p>
            ) : runs.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">Henüz test çalıştırması yok.</p>
            ) : (
              runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedId(run.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface ${
                    selectedId === run.id ? 'bg-sky-50/70 dark:bg-sky-950/20' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text">
                        #{run.runNumber} · {run.name}
                      </p>
                      <Badge variant={runVariant(run)}>{runLabel(run)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-text-subtle">
                      {run.branch} · {run.commit} · {formatDateTime(run.createdAt)}
                    </p>
                  </div>
                  <Activity className="h-4 w-4 shrink-0 text-text-subtle" />
                </button>
              ))
            )}
          </div>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="text-base">Çalıştırma Detayı</CardTitle>
            {detail?.run ? (
              <Badge variant={runVariant(detail.run)}>{runLabel(detail.run)}</Badge>
            ) : null}
          </CardHeader>
          {!selectedId ? (
            <p className="text-sm text-text-muted">
              İş ve rapor ayrıntıları için bir çalıştırma seçin.
            </p>
          ) : detailLoading && !detail ? (
            <p className="text-sm text-text-muted">Detay yükleniyor…</p>
          ) : detail ? (
            <div className="space-y-5">
              <div className="space-y-2">
                {detail.jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-text">{job.name}</p>
                      <Badge
                        variant={
                          job.conclusion === 'success'
                            ? 'success'
                            : job.conclusion === 'failure'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {job.conclusion || job.status}
                      </Badge>
                    </div>
                    {job.failedSteps.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-rose-600">
                        {job.failedSteps.map((step) => (
                          <li key={`${job.id}-${step.number}`}>
                            <XCircle className="mr-1 inline h-3.5 w-3.5" />
                            Adım {step.number}: {step.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-text">HTML Raporları</h3>
                {detail.artifacts.length ? (
                  <div className="space-y-2">
                    {detail.artifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">{artifact.name}</p>
                          <p className="text-xs text-text-subtle">
                            {(artifact.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="secondary" size="icon" asChild>
                            <a
                              href={reportHref(artifact, 'report')}
                              target="_blank"
                              rel="noreferrer"
                              title="HTML raporunu görüntüle"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="secondary" size="icon" asChild>
                            <a href={reportHref(artifact, 'download')} title="Rapor ZIP indir">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">
                    Raporlar testler tamamlandıktan sonra burada görünür.
                  </p>
                )}
              </div>

              <Button variant="secondary" size="sm" asChild>
                <a href={detail.run.htmlUrl} target="_blank" rel="noreferrer">
                  <Boxes className="h-4 w-4" />
                  GitHub çalışma logu
                </a>
              </Button>
            </div>
          ) : null}
        </Card>
      </section>

      <ConfirmDialog
        open={Boolean(pendingSuite)}
        title="Production kalite testleri çalıştırılsın mı?"
        description="Seçili test paketi GitHub Actions üzerinde başlatılır. k6 yük testi production trafiği oluşturur."
        confirmLabel="Evet, Çalıştır"
        cancelLabel="Hayır"
        tone="primary"
        busy={dispatching}
        onCancel={() => {
          setPendingSuite(null)
          setHeavy(false)
        }}
        onConfirm={() => void confirmDispatch()}
      />

      {pendingSuite && (pendingSuite === 'load' || pendingSuite === 'all') ? (
        <div className="fixed bottom-5 right-5 z-[130] rounded-xl border border-amber-200 bg-white p-3 shadow-xl">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={heavy}
              onChange={(event) => setHeavy(event.target.checked)}
            />
            500 / 1000 eşzamanlı ağır yük testlerini de çalıştır
          </label>
        </div>
      ) : null}
    </div>
  )
}
