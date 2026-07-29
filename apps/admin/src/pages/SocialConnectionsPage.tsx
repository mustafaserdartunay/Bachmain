import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/MetricCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

type SocialConnectionRow = {
  id: string
  companyId: string
  companyName?: string | null
  companySlug?: string | null
  platform: string
  externalId: string
  displayName?: string | null
  username?: string | null
  phoneNumber?: string | null
  status: string
  tokenExpiresAt?: string | null
  lastSyncAt?: string | null
  connectedAt?: string | null
  connectedByEmail?: string | null
  connectedByName?: string | null
}

type ConnectionLogRow = {
  id: string
  companyName?: string | null
  platform: string
  action: string
  success: boolean
  ip?: string | null
  browser?: string | null
  os?: string | null
  message?: string | null
  createdAt?: string | null
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  messenger: 'Messenger',
  whatsapp: 'WhatsApp',
}

export function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnectionRow[]>([])
  const [logs, setLogs] = useState<ConnectionLogRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get<{
        connections?: SocialConnectionRow[]
        logs?: ConnectionLogRow[]
        note?: string
      }>('/social-connections')
      setConnections(data.connections || [])
      setLogs(data.logs || [])
      if (data.note) setError(data.note)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
      setConnections([])
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'all') return connections
    return connections.filter((c) => c.platform === filter)
  }, [connections, filter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sosyal Bağlantılar"
        subtitle="Müşteri bazında Instagram · Facebook · Messenger · WhatsApp Meta bağlantıları"
        actions={
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        }
      />

      {error ? <ErrorState title="Uyarı" description={error} /> : null}

      <div className="flex flex-wrap gap-2">
        {['all', 'instagram', 'facebook', 'messenger', 'whatsapp'].map((p) => (
          <Button
            key={p}
            size="sm"
            variant={filter === p ? 'primary' : 'secondary'}
            onClick={() => setFilter(p)}
          >
            {p === 'all' ? 'Tümü' : PLATFORM_LABEL[p] || p}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Bağlı hesaplar ({filtered.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Hesap</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Bağlayan</th>
                <th className="px-4 py-3 font-medium">Bağlantı tarihi</th>
                <th className="px-4 py-3 font-medium">Son senkron</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? 'Yükleniyor…' : 'Kayıt yok'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.companyName || c.companyId}</div>
                      <div className="text-xs text-muted-foreground">{c.companySlug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{PLATFORM_LABEL[c.platform] || c.platform}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {c.username
                        ? `@${c.username}`
                        : c.displayName || c.phoneNumber || c.externalId}
                    </td>
                    <td className="px-4 py-3">{c.status}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.connectedByName || c.connectedByEmail || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.connectedAt ? formatDateTime(c.connectedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.lastSyncAt ? formatDateTime(c.lastSyncAt) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bağlantı logları</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
                <th className="px-4 py-3 font-medium">Sonuç</th>
                <th className="px-4 py-3 font-medium">IP / Cihaz</th>
                <th className="px-4 py-3 font-medium">Mesaj</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/60">
                  <td className="px-4 py-3 text-xs">
                    {l.createdAt ? formatDateTime(l.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3">{l.companyName || '—'}</td>
                  <td className="px-4 py-3">{PLATFORM_LABEL[l.platform] || l.platform}</td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="px-4 py-3">
                    <Badge variant={l.success ? 'success' : 'danger'}>
                      {l.success ? 'OK' : 'Hata'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {[l.ip, l.browser, l.os].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">{l.message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
