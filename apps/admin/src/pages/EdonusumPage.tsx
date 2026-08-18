import { useCallback, useEffect, useState } from 'react'
import { FileText, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/MetricCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'

type Overview = {
  connectedCompanies?: number
  activeConnections?: number
  errorConnections?: number
  sentToday?: number
  incomingToday?: number
  failedToday?: number
  errorRows?: Array<{
    id: string
    companyId: string
    companyTitle?: string | null
    environment?: string
    status?: string
    lastError?: string | null
    lastTestAt?: string | null
    taxNumber?: string | null
    apiKeyFingerprint?: string | null
  }>
}

type ConnectionRow = {
  id: string
  companyId: string
  companyTitle?: string | null
  environment?: string
  status?: string
  lastError?: string | null
  lastTestAt?: string | null
  lastSyncAt?: string | null
  taxNumber?: string | null
  apiKeyFingerprint?: string | null
}

export function EdonusumPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [rows, setRows] = useState<ConnectionRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, list] = await Promise.all([
        api.get<Overview>('/edocuments?op=admin-overview'),
        api.get<{ rows?: ConnectionRow[] }>('/edocuments?op=admin-connections'),
      ])
      setOverview(ov)
      setRows(list.rows || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="E-Dönüşüm / Nilvera"
        subtitle="Sistem genelinde e-belge bağlantıları. Müşteri API anahtarları gösterilmez."
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        }
      />
      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Bağlı şirket" value={overview?.connectedCompanies} />
        <Metric label="Aktif bağlantı" value={overview?.activeConnections} />
        <Metric label="Hatalı" value={overview?.errorConnections} />
        <Metric label="Bugün gönderilen" value={overview?.sentToday} />
        <Metric label="Bugün gelen" value={overview?.incomingToday} />
        <Metric label="Başarısız" value={overview?.failedToday} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Şirket bağlantıları
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto p-4">
          {loading ? (
            <p className="text-sm text-text-muted">Yükleniyor…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-text-muted">
                  <th className="pb-2">Şirket</th>
                  <th className="pb-2">VKN</th>
                  <th className="pb-2">Ortam</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Anahtar</th>
                  <th className="pb-2">Hata</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td className="py-4 text-text-muted" colSpan={6}>
                      Bağlı şirket yok. Müşteriler Uygulama → E-Belgeler → Ayarlar üzerinden Nilvera
                      anahtarı kaydeder.
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="py-2">{row.companyTitle || row.companyId}</td>
                    <td className="py-2">{row.taxNumber || '—'}</td>
                    <td className="py-2">{row.environment}</td>
                    <td className="py-2">
                      <Badge>{row.status}</Badge>
                    </td>
                    <td className="py-2 font-mono text-xs">{row.apiKeyFingerprint || '****'}</td>
                    <td className="py-2 text-rose-500">{row.lastError || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value ?? '—'}</p>
    </Card>
  )
}
