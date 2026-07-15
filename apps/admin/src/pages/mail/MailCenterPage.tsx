import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'

type MailRow = {
  id: string
  to?: string
  subject?: string
  template?: string
  status?: string
  attempts?: number
  error?: string | null
  createdAt?: string
  sentAt?: string | null
  providerId?: string | null
}

type MailStatus = {
  provider?: string
  enabled?: boolean
  configured?: boolean
  from?: string
  templates?: string[]
  queuePending?: number
  sentLast24h?: number
  failedLast24h?: number
}

function statusVariant(status?: string) {
  if (status === 'sent' || status === 'resent') return 'success' as const
  if (status === 'failed') return 'danger' as const
  if (status === 'skipped_no_provider') return 'warning' as const
  return 'default' as const
}

export function MailCenterPage() {
  const [tab, setTab] = useState<'logs' | 'queue' | 'failed' | 'settings'>('logs')
  const [status, setStatus] = useState<MailStatus | null>(null)
  const [rows, setRows] = useState<MailRow[]>([])
  const [templates, setTemplates] = useState<string[]>([])
  const [error, setError] = useState('')
  const [testTo, setTestTo] = useState('')
  const [testTemplate, setTestTemplate] = useState('test')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const loadStatus = useCallback(async () => {
    const data = await api.get<{ ok: boolean } & MailStatus>('/mail/status')
    setStatus(data)
    setTemplates(data.templates || [])
  }, [])

  const loadRows = useCallback(async () => {
    try {
      setError('')
      await loadStatus()
      if (tab === 'queue') {
        const data = await api.get<{ rows: MailRow[] }>('/mail/queue')
        setRows(data.rows || [])
      } else if (tab === 'failed') {
        const data = await api.get<{ rows: MailRow[] }>('/mail/failed')
        setRows(data.rows || [])
      } else if (tab === 'logs') {
        const data = await api.get<{ rows: MailRow[] }>('/mail/logs')
        setRows(data.rows || [])
      } else {
        setRows([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [tab, loadStatus])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  async function runTest() {
    setBusy(true)
    setMessage('')
    try {
      const data = await api.post<{ ok: boolean; row: MailRow }>('/mail/test', {
        to: testTo,
        template: testTemplate,
      })
      setMessage(`Test sonucu: ${data.row?.status}${data.row?.error ? ` · ${data.row.error}` : ''}`)
      await loadRows()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Test başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function processQueue() {
    setBusy(true)
    try {
      await api.post('/mail/process-queue', { limit: 25 })
      await loadRows()
    } finally {
      setBusy(false)
    }
  }

  async function resend(id: string) {
    setBusy(true)
    try {
      await api.post(`/mail/resend/${id}`, {})
      await loadRows()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="E-posta Merkezi"
        subtitle="Resend üzerinden production mail geçmişi, kuyruk, başarısız gönderimler ve test."
      />

      {status ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 text-sm">
            <div className="text-text-muted">Sağlayıcı</div>
            <div className="mt-1 font-bold capitalize">{status.provider || '—'}</div>
            <div className="mt-1 text-xs text-text-subtle">{status.configured ? 'API key tanımlı' : 'RESEND_API_KEY eksik'}</div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="text-text-muted">Kuyruk</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{status.queuePending ?? 0}</div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="text-text-muted">Son 24s gönderilen</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{status.sentLast24h ?? 0}</div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="text-text-muted">Son 24s başarısız</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-rose-600">{status.failedLast24h ?? 0}</div>
          </Card>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['logs', 'Mail Geçmişi'],
            ['queue', 'Mail Kuyruğu'],
            ['failed', 'Başarısız'],
            ['settings', 'Ayarlar / Test'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === id ? 'bg-bach-blue text-white' : 'border border-border text-text'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={processQueue}
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
        >
          Kuyruğu işle
        </button>
      </div>

      {error ? <ErrorState title="Hata" description={error} onRetry={loadRows} /> : null}

      {tab === 'settings' ? (
        <Card className="space-y-4 p-4">
          <div>
            <h3 className="font-bold text-text">Mail Ayarları</h3>
            <p className="mt-1 text-sm text-text-muted">
              From: <span className="font-mono text-xs">{status?.from || 'BACHMAIN &lt;noreply@bachmain.com&gt;'}</span>
            </p>
            <p className="mt-2 text-sm text-text-muted">
              DNS: Resend dashboard → Domains → <strong>bachmain.com</strong> için SPF / DKIM / DMARC kayıtlarını ekleyin.
              Detaylar: <code className="text-xs">docs/MAIL-INFRASTRUCTURE.md</code>
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="text-sm">
              Test e-posta
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="ornek@firma.com"
              />
            </label>
            <label className="text-sm">
              Şablon
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value)}
              >
                {(templates.length ? templates : ['test']).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy || !testTo}
              onClick={runTest}
              className="rounded-lg bg-bach-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              API Testi Gönder
            </button>
          </div>
          {message ? <p className="text-sm font-semibold text-text">{message}</p> : null}
        </Card>
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-elevated text-left text-text-muted">
              <tr>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">Alıcı</th>
                <th className="px-3 py-2">Konu</th>
                <th className="px-3 py-2">Şablon</th>
                <th className="px-3 py-2">Zaman</th>
                <th className="px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    {row.error ? <div className="mt-1 max-w-[14rem] truncate text-[11px] text-rose-600">{row.error}</div> : null}
                  </td>
                  <td className="px-3 py-2">{row.to}</td>
                  <td className="px-3 py-2">{row.subject}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.template}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">
                    {(row.sentAt || row.createdAt || '').replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-bach-blue"
                      disabled={busy}
                      onClick={() => resend(row.id)}
                    >
                      Yeniden gönder
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-text-muted">
                    Kayıt yok
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
