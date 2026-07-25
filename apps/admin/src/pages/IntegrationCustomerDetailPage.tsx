import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Unplug, Webhook, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/MetricCard'
import { getAdminIntegrationTenant } from '@/data/integrationControlDemo'

export function IntegrationCustomerDetailPage() {
  const { tenantId } = useParams()
  const tenant = getAdminIntegrationTenant(tenantId || '')

  if (!tenant) {
    return (
      <div className="space-y-4">
        <PageHeader title="Firma bulunamadı" />
        <Link to="/entegrasyon-kontrol" className="text-sm text-violet-600">
          Geri dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.company}
        subtitle={`${tenant.plan} · Kuruluş ${tenant.founded} · Son giriş ${tenant.lastLogin}`}
      />

      <Link
        to="/entegrasyon-kontrol"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Entegrasyon Kontrol
      </Link>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Kullanıcı" value={tenant.users} />
        <Stat label="Toplam Mesaj" value={tenant.totalMessages.toLocaleString('tr-TR')} />
        <Stat label="API Çağrısı" value={tenant.apiCalls.toLocaleString('tr-TR')} />
        <Stat label="AI Kullanımı" value={tenant.aiUsage} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {tenant.details.map((d) => (
          <Card key={d.platform}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{d.title}</CardTitle>
              <Badge variant={d.connected ? 'success' : 'default'}>
                {d.connected ? 'Bağlı' : 'Bağlı Değil'}
              </Badge>
            </CardHeader>
            <div className="space-y-2 px-4 pb-4 text-xs">
              {d.fields.map((f) => (
                <div
                  key={f.label}
                  className="flex justify-between gap-2 border-b border-border/40 py-1.5"
                >
                  <span className="text-text-muted">{f.label}</span>
                  <span className="max-w-[60%] truncate font-semibold text-text">{f.value}</span>
                </div>
              ))}
              {d.connected ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <MiniBtn icon={RefreshCw} label="Token Yenile" />
                  <MiniBtn icon={Webhook} label="Webhook Testi" />
                  <MiniBtn icon={FileText} label="Logları Aç" />
                  <MiniBtn icon={Unplug} label="Kes" danger />
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase text-text-muted">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-text">{value}</p>
      </div>
    </Card>
  )
}

function MiniBtn({
  icon: Icon,
  label,
  danger,
}: {
  icon: typeof RefreshCw
  label: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold ${
        danger ? 'border-rose-300 text-rose-600' : 'border-border text-text-muted hover:text-text'
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  )
}
