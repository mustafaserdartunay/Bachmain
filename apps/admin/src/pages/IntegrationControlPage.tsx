import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plug,
  RefreshCw,
  Webhook,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MetricCard, PageHeader } from '@/components/ui/MetricCard'
import { ADMIN_INTEGRATION_TENANTS, adminIntegrationOverview } from '@/data/integrationControlDemo'

const PLATFORM_COLS = [
  'whatsapp',
  'instagram',
  'facebook',
  'messenger',
  'telegram',
  'tiktok',
  'linkedin',
  'x',
  'gmail',
  'outlook',
] as const

function ConnCell({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
  ) : (
    <XCircle className="mx-auto h-4 w-4 text-rose-400/70" />
  )
}

export function IntegrationControlPage() {
  const overview = useMemo(() => adminIntegrationOverview(), [])
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ADMIN_INTEGRATION_TENANTS
    return ADMIN_INTEGRATION_TENANTS.filter(
      (t) => t.company.toLowerCase().includes(q) || t.plan.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entegrasyon Kontrol Merkezi"
        subtitle="Super Admin — tüm müşteri OAuth / webhook / API durumu"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Toplam Firma"
          value={String(overview.totalFirms)}
          icon={<Plug className="h-4 w-4" />}
        />
        <MetricCard
          label="Aktif Firma"
          value={String(overview.activeFirms)}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Webhook Aktif"
          value={String(overview.webhookActive)}
          icon={<Webhook className="h-4 w-4" />}
        />
        <MetricCard
          label="Süresi Dolacak"
          value={String(overview.expiringSoon)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Bachy özeti</CardTitle>
          <Badge variant="gold">AI</Badge>
        </CardHeader>
        <div className="space-y-2 px-4 pb-4 text-sm text-text-muted">
          <p>
            Bugün <strong className="text-text">{overview.whatsappConnected}</strong> müşterinin
            WhatsApp bağlantısı aktif.
          </p>
          <p>
            <strong className="text-text">{overview.expiringSoon}</strong> müşterinin Instagram
            token süresi yaklaşıyor.
          </p>
          <p>
            <strong className="text-text">{overview.oauthBroken}</strong> müşterinin Gmail OAuth
            bağlantısı kopmuş.
          </p>
          <p>
            <strong className="text-text">{overview.webhookErrors}</strong> müşterinin webhook’u
            cevap vermiyor.
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tümünü Düzelt (yakında)
          </button>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Müşteri Entegrasyonları</CardTitle>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Firma ara…"
            className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm"
          />
        </CardHeader>
        <div className="overflow-x-auto px-2 pb-4">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-border text-[10px] uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2">Firma</th>
                <th className="px-3 py-2">Paket</th>
                {PLATFORM_COLS.map((p) => (
                  <th key={p} className="px-2 py-2 text-center capitalize">
                    {p === 'x' ? 'X' : p.slice(0, 3)}
                  </th>
                ))}
                <th className="px-3 py-2">Mesaj</th>
                <th className="px-3 py-2">Senkron</th>
                <th className="px-3 py-2">Webhook</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/60"
                >
                  <td className="px-3 py-2.5 font-semibold text-text">{row.company}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="default">{row.plan}</Badge>
                  </td>
                  {PLATFORM_COLS.map((p) => (
                    <td key={p} className="px-2 py-2.5 text-center">
                      <ConnCell ok={Boolean(row.platforms[p])} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.totalMessages.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">{row.lastSync}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={row.webhook === 'Aktif' ? 'success' : 'danger'}>
                      {row.webhook}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      to={`/entegrasyon-kontrol/${row.id}`}
                      className="font-semibold text-violet-600 hover:underline"
                    >
                      Detay
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
