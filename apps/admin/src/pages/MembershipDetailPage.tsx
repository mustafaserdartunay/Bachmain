import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  History,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  PlayCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { TabNav } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { usePageState } from '@/hooks/usePageState'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { membershipsApi, type MembershipDetail } from '@/services/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { BadgeVariant } from '@/types'

const tabs = [
  { value: 'overview', label: 'Genel' },
  { value: 'license', label: 'Lisans & Süre' },
  { value: 'payments', label: 'Ödemeler' },
  { value: 'history', label: 'Geçmiş' },
  { value: 'security', label: 'Güvenlik & Mail' },
]

export function MembershipDetailPage() {
  const params = useParams()
  const id = decodeURIComponent(String(params.id || '').trim())
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [extendDays, setExtendDays] = useState(7)
  const [extendMode, setExtendMode] = useState<'trial' | 'active'>('trial')
  const [extendNote, setExtendNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)
  const [planCode, setPlanCode] = useState('starter')
  const [errorMessage, setErrorMessage] = useState('')

  const fetcher = useMemo(
    () => async (): Promise<MembershipDetail> => {
      if (!id) throw new Error('Üye ID eksik')
      try {
        return await membershipsApi.get(id)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Üye detayı yüklenemedi')
        throw err
      }
    },
    [id],
  )
  const { status, data: member, reload } = usePageState({ fetcher, delay: 0 })

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label)
    setFlash(null)
    try {
      const res = (await fn()) as {
        licenseExpiry?: string
        daysAdded?: number
      }
      await reload()
      const expiry = res?.licenseExpiry
      const days = res?.daysAdded
      setFlash({
        ok: true,
        message: expiry
          ? `Süre uzatıldı${days ? ` (+${days} gün)` : ''}. Yeni bitiş: ${formatDate(expiry)}`
          : 'İşlem uygulandı',
      })
    } catch (err) {
      setFlash({
        ok: false,
        message: err instanceof Error ? err.message : 'İşlem başarısız',
      })
    } finally {
      setBusy(null)
    }
  }

  function extendQuick(days: number, mode: 'trial' | 'active', label: string) {
    if (!member) return
    void run(label, () => membershipsApi.extend(member.id, { days, mode, note: label }))
  }

  if (!id) {
    return (
      <ErrorState
        title="Geçersiz üye linki"
        description="Üye kimliği bulunamadı. Listeye dönüp tekrar deneyin."
        onRetry={() => navigate('/uyeler')}
      />
    )
  }

  if (status === 'loading') return <DetailSkeleton />
  if (status === 'error' || !member) {
    return (
      <ErrorState
        onRetry={reload}
        title="Üye detayı açılamadı"
        description={
          errorMessage || 'İstenen üye hesabı yüklenemedi. Tekrar deneyin veya listeye dönün.'
        }
      />
    )
  }

  const badgeVariant =
    (statusBadgeMap[member.statusKind || ''] as BadgeVariant) ||
    (statusBadgeMap[String(member.status).toLowerCase()] as BadgeVariant) ||
    'default'

  const payments = member.paymentRequests || []
  const history = member.billingHistory || []
  const mailLogs = member.mailLogs || []
  const authEvents = member.authEvents || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={member.fullName || member.email}
        subtitle={`${member.company || '—'} · ${member.source || '—'}`}
        breadcrumbs={[
          { label: 'Üye Hesapları', href: '/uyeler' },
          { label: member.fullName || member.email },
        ]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/uyeler')}>
              <ArrowLeft className="h-4 w-4" /> Listeye dön
            </Button>
            {member.customerId ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/musteriler/${member.customerId}`)}
              >
                <Building2 className="h-4 w-4" /> Müşteri kartı
              </Button>
            ) : null}
          </>
        }
      />

      {flash && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            flash.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {flash.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Durum</p>
          <div className="mt-2">
            <Badge variant={badgeVariant}>{member.status}</Badge>
          </div>
          <p className="mt-2 text-xs text-text-subtle">
            Ham: {member.statusRaw || '—'} / {member.subscriptionStatus || '—'}
          </p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Lisans bitiş</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-text">
            {member.licenseExpiry && member.licenseExpiry !== '—'
              ? formatDate(member.licenseExpiry)
              : '—'}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {typeof member.remainingDays === 'number'
              ? member.remainingDays < 0
                ? `${Math.abs(member.remainingDays)} gün geçmiş`
                : `${member.remainingDays} gün kaldı`
              : 'Süre hesaplanamadı'}
          </p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Plan</p>
          <p className="mt-1 text-lg font-bold text-text">{member.plan || '—'}</p>
          <p className="mt-1 text-xs text-text-muted">{member.tenantCode || '—'}</p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Son aktivite</p>
          <p className="mt-1 text-sm font-semibold text-text">
            {member.lastLoginAt && member.lastLoginAt !== '—'
              ? formatDateTime(member.lastLoginAt)
              : '—'}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Kayıt:{' '}
            {member.createdAt && member.createdAt !== '—' ? formatDate(member.createdAt) : '—'}
          </p>
        </Card>
      </div>

      <Card padding="lg" hover={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="h-4 w-4" /> Süre uzat / Yönet
          </CardTitle>
        </CardHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-text">Deneme / paket uzat</p>
            <p className="text-xs text-text-muted">
              Biten 7 günlük denemeyi buradan uzatabilirsiniz. Mevcut bitiş gelecekteyse üzerine
              eklenir; bitmişse bugünden başlar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="gold"
                size="sm"
                disabled={!!busy}
                onClick={() => extendQuick(7, 'trial', 'demo+7')}
              >
                +7 gün Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!!busy}
                onClick={() => extendQuick(14, 'trial', 'demo+14')}
              >
                +14 gün Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!!busy}
                onClick={() => extendQuick(30, 'active', 'paket+30')}
              >
                +30 gün Paket
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Gün</label>
                <Select
                  value={String(extendDays)}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                >
                  {[3, 7, 14, 30, 60, 90].map((d) => (
                    <option key={d} value={d}>
                      {d} gün
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Mod</label>
                <Select
                  value={extendMode}
                  onChange={(e) => setExtendMode(e.target.value as 'trial' | 'active')}
                >
                  <option value="trial">Demo / Deneme</option>
                  <option value="active">Paket (aktif)</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Not (opsiyonel)</label>
              <Input
                value={extendNote}
                onChange={(e) => setExtendNote(e.target.value)}
                placeholder="Örn. müşteri talebiyle +7 gün"
              />
            </div>
            <Button
              variant="gold"
              size="sm"
              disabled={!!busy}
              onClick={() =>
                run('extend', () =>
                  membershipsApi.extend(member.id, {
                    days: extendDays,
                    mode: extendMode,
                    note: extendNote,
                  }),
                )
              }
            >
              <RefreshCw className={`h-4 w-4 ${busy === 'extend' ? 'animate-spin' : ''}`} />
              {busy === 'extend' ? 'Uzatılıyor…' : `${extendDays} gün uzat`}
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-text">Hesap işlemleri</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!!busy}
                onClick={() =>
                  run('activate', () => membershipsApi.action(member.id, { action: 'activate' }))
                }
              >
                <PlayCircle className="h-4 w-4" /> Aktifleştir
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!!busy}
                onClick={() =>
                  run('suspend', () => membershipsApi.action(member.id, { action: 'suspend' }))
                }
              >
                <PauseCircle className="h-4 w-4" /> Askıya al
              </Button>
              {member.role === 'demo' || member.source === 'Demo Talep' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!!busy}
                  onClick={() =>
                    run('convert', () =>
                      membershipsApi.action(member.id, { action: 'convert_demo', days: 7 }),
                    )
                  }
                >
                  <UserCheck className="h-4 w-4" /> Demo → Üyelik
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-end gap-2 pt-2">
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs text-text-muted">Plan ata</label>
                <Select value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!!busy}
                onClick={() =>
                  run('plan', () =>
                    membershipsApi.action(member.id, {
                      action: 'set_plan',
                      planCode,
                      period: 'month',
                    }),
                  )
                }
              >
                Planı uygula
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <TabNav items={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" padding="lg">
            <CardHeader>
              <CardTitle className="text-base">İletişim & firma</CardTitle>
            </CardHeader>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info icon={<Mail className="h-4 w-4" />} label="E-posta" value={member.email} />
              <Info
                icon={<Phone className="h-4 w-4" />}
                label="GSM"
                value={member.gsm || member.phone || '—'}
              />
              <Info
                icon={<Building2 className="h-4 w-4" />}
                label="Firma"
                value={member.company || '—'}
              />
              <Info
                icon={<MapPin className="h-4 w-4" />}
                label="Şehir"
                value={[member.district, member.city].filter(Boolean).join(' / ') || '—'}
              />
              <Info label="Vergi No" value={member.taxNo || '—'} />
              <Info label="Vergi Dairesi" value={member.taxOffice || '—'} />
              <Info label="Adres" value={member.address || '—'} />
              <Info label="Çalışan" value={member.companySize || '—'} />
            </dl>
            {member.message && member.message !== '—' ? (
              <div className="mt-4 rounded-xl border border-border bg-surface-elevated p-3">
                <p className="text-xs font-medium text-text-muted">Demo mesajı</p>
                <p className="mt-1 text-sm text-text">{member.message}</p>
              </div>
            ) : null}
          </Card>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Hesap meta</CardTitle>
            </CardHeader>
            <dl className="space-y-3 text-sm">
              <Meta label="Hesap ID" value={member.id} mono />
              <Meta label="Müşteri ID" value={member.customerId || '—'} mono />
              <Meta label="Tenant" value={member.tenantCode || '—'} mono />
              <Meta label="Kaynak" value={member.source || '—'} />
              <Meta label="Giriş" value={member.canLogin === false ? 'Kapalı' : 'Açık'} />
              {member.customerId ? (
                <Link
                  to={`/musteriler/${member.customerId}`}
                  className="inline-block text-sm font-semibold text-bach-blue hover:underline"
                >
                  Müşteri detayına git →
                </Link>
              ) : null}
            </dl>
          </Card>
        </div>
      )}

      {activeTab === 'license' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="text-base">Lisans özeti</CardTitle>
          </CardHeader>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Meta label="Durum etiketi" value={member.status} />
            <Meta label="Bitiş tarihi" value={member.licenseExpiry || '—'} />
            <Meta
              label="Kalan gün"
              value={typeof member.remainingDays === 'number' ? String(member.remainingDays) : '—'}
            />
            <Meta label="Plan" value={member.plan || '—'} />
            <Meta label="Plan kodu" value={member.planCode || '—'} />
            <Meta label="Abonelik durumu" value={member.subscriptionStatus || '—'} />
          </dl>
        </Card>
      )}

      {activeTab === 'payments' &&
        (payments.length === 0 ? (
          <Card padding="lg">
            <p className="text-sm text-text-muted">Ödeme talebi yok.</p>
          </Card>
        ) : (
          <DataTable
            columns={[
              { key: 'plan', label: 'Plan' },
              { key: 'status', label: 'Durum' },
              { key: 'method', label: 'Yöntem' },
              {
                key: 'createdAt',
                label: 'Tarih',
                render: (r) => formatDateTime(String(r.createdAt || '')),
              },
            ]}
            rows={payments as Array<Record<string, unknown> & { id: string }>}
          />
        ))}

      {activeTab === 'history' &&
        (history.length === 0 ? (
          <Card padding="lg">
            <p className="text-sm text-text-muted">Abonelik geçmişi yok.</p>
          </Card>
        ) : (
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" /> Billing geçmişi
              </CardTitle>
            </CardHeader>
            <DataTable
              columns={[
                { key: 'action', label: 'İşlem' },
                {
                  key: 'at',
                  label: 'Zaman',
                  render: (r) => formatDateTime(String(r.at || '')),
                },
                {
                  key: 'meta',
                  label: 'Detay',
                  render: (r) => (
                    <span className="text-xs text-text-muted">
                      {r.meta ? JSON.stringify(r.meta) : '—'}
                    </span>
                  ),
                },
              ]}
              rows={history as Array<Record<string, unknown> & { id: string }>}
            />
          </Card>
        ))}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Auth olayları</CardTitle>
            </CardHeader>
            {authEvents.length === 0 ? (
              <p className="text-sm text-text-muted">Kayıt yok.</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'type', label: 'Olay' },
                  { key: 'result', label: 'Sonuç' },
                  { key: 'ip', label: 'IP' },
                  {
                    key: 'at',
                    label: 'Zaman',
                    render: (r) => formatDateTime(String(r.at || '')),
                  },
                ]}
                rows={authEvents as Array<Record<string, unknown> & { id: string }>}
              />
            )}
          </Card>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">E-posta logları</CardTitle>
            </CardHeader>
            {mailLogs.length === 0 ? (
              <p className="text-sm text-text-muted">Mail kaydı yok.</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'status', label: 'İletim' },
                  { key: 'template', label: 'Şablon' },
                  { key: 'subject', label: 'Konu' },
                  {
                    key: 'sentAt',
                    label: 'Zaman',
                    render: (r) => formatDateTime(String(r.sentAt || r.createdAt || '')),
                  },
                ]}
                rows={mailLogs as Array<Record<string, unknown> & { id: string }>}
              />
            )}
          </Card>
        </div>
      )}
    </motion.div>
  )
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon ? <span className="mt-0.5 text-text-subtle">{icon}</span> : null}
      <div>
        <dt className="text-xs text-text-subtle">{label}</dt>
        <dd className="text-sm font-medium text-text">{value}</dd>
      </div>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium text-text ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
