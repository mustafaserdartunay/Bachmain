import { useCallback, useEffect, useState } from 'react'
import { FileText, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/MetricCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'

type Platform = {
  configured?: boolean
  hasTestKey?: boolean
  hasLiveKey?: boolean
  fingerprintTest?: string | null
  fingerprintLive?: string | null
  status?: string
  lastTestAt?: string | null
  lastError?: string | null
  companyTitle?: string | null
  taxNumber?: string | null
}

type Overview = {
  connectedCompanies?: number
  activeConnections?: number
  errorConnections?: number
  sentToday?: number
  incomingToday?: number
  failedToday?: number
  platform?: Platform
  errorRows?: Array<{
    id: string
    companyId: string
    companyTitle?: string | null
    environment?: string
    status?: string
    lastError?: string | null
    lastTestAt?: string | null
    taxNumber?: string | null
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
  hasAssignedKey?: boolean
  signatureType?: string
  signatureDeclared?: boolean
  nilveraMatched?: boolean
}

export function EdonusumPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [rows, setRows] = useState<ConnectionRow[]>([])
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [environment, setEnvironment] = useState<'TEST' | 'PRODUCTION'>('TEST')
  const [apiKey, setApiKey] = useState('')
  const [assignCompanyId, setAssignCompanyId] = useState('')
  const [assignKey, setAssignKey] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, list, plat] = await Promise.all([
        api.get<Overview>('/edocuments?op=admin-overview'),
        api.get<{ rows?: ConnectionRow[] }>('/edocuments?op=admin-connections'),
        api.get<{ platform?: Platform }>('/edocuments?op=admin-platform'),
      ])
      setOverview(ov)
      setRows(list.rows || [])
      setPlatform(plat.platform || ov.platform || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function savePlatform() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const data = await api.post<{ platform?: Platform }>('/edocuments?op=admin-platform', {
        environment,
        apiKey: apiKey || undefined,
      })
      setPlatform(data.platform || null)
      setApiKey('')
      setMessage('Bachmain Nilvera anahtarı kaydedildi. Anahtar tarayıcıda tutulmaz.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setBusy(false)
    }
  }

  async function testPlatform() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const data = await api.post<{ platform?: Platform; company?: { Name?: string } }>(
        '/edocuments?op=admin-platform-test',
        { environment },
      )
      setPlatform(data.platform || null)
      setMessage(
        `✓ Platform bağlantısı: ${data.company?.Name || data.platform?.companyTitle || 'OK'}`,
      )
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function recheck(companyId: string) {
    setBusy(true)
    setError('')
    try {
      await api.post('/edocuments?op=admin-recheck', { companyId })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kontrol başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function assignKeyToTenant() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.post('/edocuments?op=admin-assign-key', {
        companyId: assignCompanyId,
        apiKey: assignKey,
      })
      setAssignKey('')
      setMessage('Üye firmasına özel Nilvera anahtarı atandı. Üye bu anahtarı görmez.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Atama başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="E-Dönüşüm / Nilvera"
        subtitle="Önce Bachmain Nilvera’ya bağlanır. Üyeler yalnızca firma + imza bilgisi girer; API anahtarı üye paneline çıkmaz."
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        }
      />
      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>1. Bachmain ↔ Nilvera (platform)</CardTitle>
        </CardHeader>
        <div className="grid gap-3 p-4 text-sm">
          <p>
            Durum: <Badge>{platform?.status || 'disconnected'}</Badge> ·{' '}
            {platform?.companyTitle || 'şirket yok'} · VKN {platform?.taxNumber || '—'}
          </p>
          <p className="text-sm text-text-muted">
            Test ortamı iki firmadır. Bachmain şu an Test Kurum 1 (VKN 1234567801) olarak bağlıdır.
            Test Kurum 2 (VKN 1234567802) alıcıdır: Uygulama → E-Belgeler → Yeni E-Fatura → “Test
            Kurum 2’yi alıcı yap”. Gelen kutu için Kurum 2’nin Kurum 1’e fatura kesmesi gerekir.
          </p>
          <p className="text-text-muted">
            TEST anahtarı {platform?.hasTestKey ? platform.fingerprintTest : 'yok'} · Canlı{' '}
            {platform?.hasLiveKey ? platform.fingerprintLive : 'yok'}
          </p>
          {platform?.lastError ? <p className="text-rose-500">{platform.lastError}</p> : null}
          <label className="grid max-w-md gap-1">
            Ortam
            <select
              className="rounded-md border border-border bg-transparent px-3 py-2"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'TEST' | 'PRODUCTION')}
            >
              <option value="TEST">Test (apitest.nilvera.com)</option>
              <option value="PRODUCTION">Canlı (api.nilvera.com)</option>
            </select>
          </label>
          <label className="grid max-w-xl gap-1">
            Çözüm ortağı API anahtarı
            <input
              type="password"
              autoComplete="off"
              className="rounded-md border border-border bg-transparent px-3 py-2"
              placeholder="Portal → API Tanımları (üye paneline yapıştırılmaz)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void savePlatform()}>
              Platform anahtarını kaydet
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void testPlatform()}>
              Platformu test et
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Başvuran üye" value={overview?.connectedCompanies} />
        <Metric label="Çalışır" value={overview?.activeConnections} />
        <Metric label="Hatalı" value={overview?.errorConnections} />
        <Metric label="Bugün gönderilen" value={overview?.sentToday} />
        <Metric label="Bugün gelen" value={overview?.incomingToday} />
        <Metric label="Başarısız" value={overview?.failedToday} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            2. Üye açılışları
          </CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4">
          <p className="text-sm text-text-muted">
            Üye VKN’si platform firmasıyla aynıysa otomatik açılır. Değilse Nilvera portalında firma
            + GİB aktivasyonu sonrası aşağıdaki alana o firmanın anahtarı atanır.
          </p>
          <div className="grid max-w-xl gap-2 text-sm">
            <input
              className="rounded-md border border-border bg-transparent px-3 py-2"
              placeholder="Üye tenant kodu / companyId"
              value={assignCompanyId}
              onChange={(e) => setAssignCompanyId(e.target.value)}
            />
            <input
              type="password"
              className="rounded-md border border-border bg-transparent px-3 py-2"
              placeholder="O firmanın Nilvera API anahtarı"
              value={assignKey}
              onChange={(e) => setAssignKey(e.target.value)}
            />
            <Button disabled={busy} onClick={() => void assignKeyToTenant()}>
              Üyeye özel anahtar ata
            </Button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-text-muted">Yükleniyor…</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted">
                    <th className="pb-2">Üye</th>
                    <th className="pb-2">VKN</th>
                    <th className="pb-2">İmza</th>
                    <th className="pb-2">Durum</th>
                    <th className="pb-2">Anahtar</th>
                    <th className="pb-2">Hata</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && !loading ? (
                    <tr>
                      <td className="py-4 text-text-muted" colSpan={7}>
                        Henüz üye başvurusu yok. Üyeler Uygulama → E-Belgeler → Ayarlar’dan firma
                        bilgisi girer.
                      </td>
                    </tr>
                  ) : null}
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="py-2">
                        {row.companyTitle || row.companyId}
                        <div className="text-xs text-text-muted">{row.companyId}</div>
                      </td>
                      <td className="py-2">{row.taxNumber || '—'}</td>
                      <td className="py-2">
                        {row.signatureType || '—'}
                        {row.signatureDeclared ? ' · beyan var' : ''}
                      </td>
                      <td className="py-2">
                        <Badge>{row.status}</Badge>
                      </td>
                      <td className="py-2">{row.hasAssignedKey ? 'atanmış' : 'platform'}</td>
                      <td className="py-2 text-rose-500">{row.lastError || '—'}</td>
                      <td className="py-2">
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setAssignCompanyId(row.companyId)
                            void recheck(row.companyId)
                          }}
                        >
                          Kontrol
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
