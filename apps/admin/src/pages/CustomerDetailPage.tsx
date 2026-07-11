import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Pencil, Building2, Mail, Phone, MapPin, CreditCard,
  Wallet, Sparkles, History,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { TabNav } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { Timeline } from '@/components/ui/Timeline'
import { usePageState } from '@/hooks/usePageState'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { customersApi } from '@/services/api'
import type { CustomerFull } from '@/services/api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import type { BadgeVariant } from '@/types'

const tabs = [
  { value: 'overview', label: 'Genel Bakış' },
  { value: 'users', label: 'Kullanıcılar' },
  { value: 'account', label: 'Cari Hesap' },
  { value: 'invoices', label: 'Faturalar' },
  { value: 'payments', label: 'Ödemeler' },
  { value: 'support', label: 'Destek' },
  { value: 'ai', label: 'AI Kullanımı' },
  { value: 'logins', label: 'Giriş Geçmişi' },
  { value: 'timeline', label: 'Aktivite' },
]

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const fetcher = useMemo(
    () => async (): Promise<CustomerFull> => {
      return customersApi.get(id!)
    },
    [id],
  )

  const { status, data: customer, reload } = usePageState({ fetcher, delay: 0 })

  if (status === 'loading') return <DetailSkeleton />
  if (status === 'error' || !customer) {
    return <ErrorState onRetry={reload} title="Müşteri bulunamadı" description="İstenen müşteri kaydı bulunamadı." />
  }

  const users = customer.userList
  const invoices = customer.invoices
  const payments = customer.payments
  const tickets = customer.supportTickets
  const aiUsage = customer.aiUsage
  const logins = customer.loginHistory
  const timeline = customer.timeline

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={customer.company}
        subtitle={`${customer.contact} · ${customer.city}`}
        breadcrumbs={[
          { label: 'Müşteri Yönetimi', href: '/musteriler' },
          { label: customer.company },
        ]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/musteriler')}>
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/musteriler/${id}/duzenle`)}>
              <Pencil className="h-4 w-4" /> Düzenle
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Plan</p>
          <p className="mt-1 text-lg font-bold text-text">{customer.plan}</p>
          <Badge variant={(statusBadgeMap[customer.status] ?? 'default') as BadgeVariant} className="mt-2">
            {customer.status === 'active' ? 'Aktif' : customer.status === 'trial' ? 'Deneme' : customer.status === 'suspended' ? 'Askıda' : 'İptal'}
          </Badge>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">MRR</p>
          <p className="mt-1 text-lg font-bold text-text">{formatCurrency(customer.mrr)}</p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Kullanıcılar</p>
          <p className="mt-1 text-lg font-bold text-text">{customer.users}</p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Lisans Bitiş</p>
          <p className="mt-1 text-lg font-bold text-text">{formatDate(customer.licenseExpiry)}</p>
        </Card>
      </div>

      <TabNav items={tabs.map((t) => ({
        ...t,
        count: t.value === 'users' ? users.length
          : t.value === 'invoices' ? invoices.length
          : t.value === 'support' ? tickets.length
          : undefined,
      }))} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Firma Bilgileri
              </CardTitle>
            </CardHeader>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-text-subtle" />
                <div>
                  <dt className="text-xs text-text-subtle">E-posta</dt>
                  <dd className="text-sm font-medium text-text">{customer.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-text-subtle" />
                <div>
                  <dt className="text-xs text-text-subtle">Telefon</dt>
                  <dd className="text-sm font-medium text-text">{customer.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-text-subtle" />
                <div>
                  <dt className="text-xs text-text-subtle">Şehir</dt>
                  <dd className="text-sm font-medium text-text">{customer.city}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-text-subtle" />
                <div>
                  <dt className="text-xs text-text-subtle">Vergi No</dt>
                  <dd className="text-sm font-medium text-text">{customer.taxNo}</dd>
                </div>
              </div>
            </dl>
          </Card>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" /> Cari Bakiye
              </CardTitle>
            </CardHeader>
            <p className={`text-3xl font-bold tabular-nums ${customer.balance < 0 ? 'text-rose-600' : customer.balance > 0 ? 'text-emerald-600' : 'text-text'}`}>
              {formatCurrency(Math.abs(customer.balance))}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {customer.balance < 0 ? 'Borçlu' : customer.balance > 0 ? 'Alacaklı' : 'Dengede'}
            </p>
            <Link to="/cari-hesaplar" className="mt-4 inline-block text-sm font-medium text-bach-blue hover:underline">
              Cari hesaba git →
            </Link>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <DataTable
          columns={[
            { key: 'name', label: 'Ad Soyad' },
            { key: 'email', label: 'E-posta' },
            { key: 'role', label: 'Rol' },
            { key: 'lastLogin', label: 'Son Giriş', render: (r) => formatDateTime(String(r.lastLogin)) },
            { key: 'status', label: 'Durum', render: (r) => <Badge variant="success">{String(r.status)}</Badge> },
          ]}
          rows={users}
        />
      )}

      {activeTab === 'account' && (
        <Card padding="lg">
          <CardTitle className="mb-4 text-base">Cari Hesap Özeti</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-text-muted">Toplam Borç</p>
              <p className="text-xl font-bold text-rose-600">{formatCurrency(customer.balance < 0 ? Math.abs(customer.balance) : 0)}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-text-muted">Toplam Alacak</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(customer.balance > 0 ? customer.balance : 0)}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-text-muted">Net Bakiye</p>
              <p className="text-xl font-bold text-text">{formatCurrency(Math.abs(customer.balance))}</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'invoices' && (
        <DataTable
          columns={[
            { key: 'number', label: 'Fatura No' },
            { key: 'date', label: 'Tarih', render: (r) => formatDate(String(r.date)) },
            { key: 'amount', label: 'Tutar', render: (r) => formatCurrency(Number(r.amount)) },
            { key: 'status', label: 'Durum', render: (r) => <Badge variant="success">{String(r.status)}</Badge> },
          ]}
          rows={invoices}
        />
      )}

      {activeTab === 'payments' && (
        <DataTable
          columns={[
            { key: 'date', label: 'Tarih', render: (r) => formatDate(String(r.date)) },
            { key: 'amount', label: 'Tutar', render: (r) => formatCurrency(Number(r.amount)) },
            { key: 'method', label: 'Yöntem' },
            { key: 'status', label: 'Durum', render: (r) => <Badge variant="success">{String(r.status)}</Badge> },
          ]}
          rows={payments}
        />
      )}

      {activeTab === 'support' && (
        tickets.length === 0 ? (
          <Card padding="lg"><p className="text-sm text-text-muted">Destek kaydı bulunmuyor.</p></Card>
        ) : (
          <DataTable
            columns={[
              { key: 'subject', label: 'Konu' },
              { key: 'priority', label: 'Öncelik', render: (r) => <Badge variant={(statusBadgeMap[String(r.priority)] ?? 'default') as BadgeVariant}>{String(r.priority)}</Badge> },
              { key: 'status', label: 'Durum', render: (r) => <Badge variant={(statusBadgeMap[String(r.status)] ?? 'default') as BadgeVariant}>{String(r.status)}</Badge> },
              { key: 'assignee', label: 'Atanan' },
            ]}
            rows={tickets}
            onRowClick={(row) => navigate(`/destek/${row.id}`)}
          />
        )
      )}

      {activeTab === 'ai' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card padding="lg">
            <Sparkles className="mb-2 h-5 w-5 text-bach-gold" />
            <p className="text-xs text-text-muted">Toplam Sorgu</p>
            <p className="text-2xl font-bold text-text">{aiUsage.totalQueries.toLocaleString('tr-TR')}</p>
          </Card>
          <Card padding="lg">
            <p className="text-xs text-text-muted">Token Kullanımı</p>
            <p className="text-2xl font-bold text-text">{(aiUsage.tokensUsed / 1000).toFixed(0)}K</p>
          </Card>
          <Card padding="lg">
            <p className="text-xs text-text-muted">Tahmini Maliyet</p>
            <p className="text-2xl font-bold text-text">{formatCurrency(aiUsage.costEstimate)}</p>
          </Card>
          <Card className="sm:col-span-3" padding="lg">
            <CardTitle className="mb-3 text-base">En Çok Kullanılan Özellikler</CardTitle>
            <div className="flex flex-wrap gap-2">
              {aiUsage.topFeatures.map((f) => (
                <Badge key={f} variant="gold">{f}</Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'logins' && (
        <DataTable
          columns={[
            { key: 'user', label: 'Kullanıcı' },
            { key: 'ip', label: 'IP' },
            { key: 'device', label: 'Cihaz' },
            { key: 'date', label: 'Tarih', render: (r) => formatDateTime(String(r.date)) },
          ]}
          rows={logins}
        />
      )}

      {activeTab === 'timeline' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Aktivite Zaman Çizelgesi
            </CardTitle>
          </CardHeader>
          <Timeline events={timeline} />
        </Card>
      )}
    </motion.div>
  )
}
