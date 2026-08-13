import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  Headphones,
  History,
  Mail,
  MapPin,
  MessageSquare,
  PauseCircle,
  Phone,
  PlayCircle,
  RefreshCw,
  Send,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { TabNav } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { Timeline } from '@/components/ui/Timeline'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePageState } from '@/hooks/usePageState'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { membershipsApi, supportApi, type MembershipDetail } from '@/services/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { BadgeVariant, SupportTicket, TimelineEvent } from '@/types'

const tabs = [
  { value: 'overview', label: 'Genel' },
  { value: 'support', label: 'Destek' },
  { value: 'billing', label: 'Paket & Ödeme' },
  { value: 'activity', label: 'Aktivite' },
  { value: 'license', label: 'Lisans & Güvenlik' },
]

const priorityLabels: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
}
const statusLabels: Record<string, string> = {
  open: 'Açık',
  in_progress: 'İşlemde',
  waiting: 'Bekliyor',
  resolved: 'Çözüldü',
  closed: 'Kapalı',
}

function asTicket(raw: Record<string, unknown>): SupportTicket {
  return {
    id: String(raw.id || ''),
    subject: String(raw.subject || '—'),
    customer: String(raw.customer || '—'),
    customerId: String(raw.customerId || ''),
    accountId: (raw.accountId as string) || null,
    contactName: raw.contactName ? String(raw.contactName) : undefined,
    contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
    contactPhone: raw.contactPhone ? String(raw.contactPhone) : undefined,
    category: raw.category ? String(raw.category) : undefined,
    categoryLabel: raw.categoryLabel ? String(raw.categoryLabel) : undefined,
    priority: (raw.priority as SupportTicket['priority']) || 'medium',
    status: (raw.status as SupportTicket['status']) || 'open',
    assignee: String(raw.assignee || 'Atanmadı'),
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    slaDeadline: String(raw.slaDeadline || ''),
    createdAt: String(raw.createdAt || ''),
    updatedAt: String(raw.updatedAt || raw.createdAt || ''),
    description: String(raw.description || ''),
    internalNotes: Array.isArray(raw.internalNotes)
      ? (raw.internalNotes as SupportTicket['internalNotes'])
      : [],
    replies: Array.isArray(raw.replies) ? (raw.replies as SupportTicket['replies']) : [],
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as SupportTicket['attachments'])
      : [],
    timeline: Array.isArray(raw.timeline) ? (raw.timeline as TimelineEvent[]) : [],
  }
}

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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmEmailChange, setConfirmEmailChange] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [noteText, setNoteText] = useState('')
  const [ticketBusy, setTicketBusy] = useState(false)

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
  const emailChanges = member.emailChanges || []
  const tickets = (member.supportTickets || []).map((t) => asTicket(t as Record<string, unknown>))
  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null

  const activityEvents: TimelineEvent[] = [
    ...tickets.flatMap((t) => [
      {
        id: `tkt-open-${t.id}`,
        title: `Ticket: ${t.subject}`,
        description: t.description?.slice(0, 160) || t.categoryLabel || '',
        date: t.createdAt,
        type: 'warning' as const,
        user: t.contactName || member.fullName,
      },
      ...(t.timeline || []).map((ev) => ({
        ...ev,
        id: ev.id || `tl-${t.id}-${ev.date}`,
        title: `${t.subject}: ${ev.title}`,
      })),
      ...(t.replies || []).map((r) => ({
        id: `reply-${r.id}`,
        title: `Yanıt · ${t.subject}`,
        description: r.content.slice(0, 160),
        date: r.date,
        type: 'success' as const,
        user: r.author,
      })),
    ]),
    ...authEvents.map((e, i) => ({
      id: String(e.id || `auth-${i}`),
      title: `Auth: ${String(e.type || 'olay')}`,
      description: `${String(e.result || '')} ${e.ip ? `· ${e.ip}` : ''}`.trim(),
      date: String(e.at || e.createdAt || ''),
      type: 'info' as const,
      user: member.email,
    })),
    ...mailLogs.map((m, i) => ({
      id: String(m.id || `mail-${i}`),
      title: `Mail: ${String(m.template || m.subject || 'ileti')}`,
      description: String(m.subject || m.status || ''),
      date: String(m.sentAt || m.createdAt || ''),
      type: 'info' as const,
      user: String(m.to || ''),
    })),
    ...emailChanges.map((r) => ({
      id: r.id,
      title: `E-posta değişimi · ${r.status || '—'}`,
      description: `${r.oldEmail || '—'} → ${r.newEmail || 'bekliyor'}`,
      date: r.completedAt || r.createdAt || '',
      type: 'info' as const,
      user: r.staffEmail || 'sistem',
    })),
    ...history.map((h, i) => ({
      id: String(h.id || `bill-${i}`),
      title: `Billing: ${String(h.action || 'işlem')}`,
      description: h.meta ? JSON.stringify(h.meta).slice(0, 120) : '',
      date: String(h.at || h.createdAt || ''),
      type: 'info' as const,
      user: 'sistem',
    })),
  ]
    .filter((e) => e.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 80)

  async function sendTicketReply() {
    if (!selectedTicket || !replyText.trim()) return
    setTicketBusy(true)
    try {
      await supportApi.reply(selectedTicket.id, replyText.trim())
      setReplyText('')
      await reload()
      setFlash({ ok: true, message: 'Yanıt gönderildi' })
    } catch (err) {
      setFlash({
        ok: false,
        message: err instanceof Error ? err.message : 'Yanıt gönderilemedi',
      })
    } finally {
      setTicketBusy(false)
    }
  }

  async function sendTicketNote() {
    if (!selectedTicket || !noteText.trim()) return
    setTicketBusy(true)
    try {
      await supportApi.addNote(selectedTicket.id, noteText.trim())
      setNoteText('')
      await reload()
      setFlash({ ok: true, message: 'İç not eklendi' })
    } catch (err) {
      setFlash({
        ok: false,
        message: err instanceof Error ? err.message : 'Not eklenemedi',
      })
    } finally {
      setTicketBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <ConfirmDialog
        open={confirmDelete}
        title="Üye silinsin mi?"
        description={`${member.fullName || member.email} hesabı kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet"
        cancelLabel="Hayır"
        tone="danger"
        busy={busy === 'delete'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void (async () => {
            setBusy('delete')
            setFlash(null)
            try {
              await membershipsApi.delete(member.id)
              setConfirmDelete(false)
              navigate('/uyeler')
            } catch (err) {
              setFlash({
                ok: false,
                message: err instanceof Error ? err.message : 'Silme başarısız',
              })
              setConfirmDelete(false)
            } finally {
              setBusy(null)
            }
          })()
        }}
      />
      <ConfirmDialog
        open={confirmEmailChange}
        title="E-posta değişimi başlatılsın mı?"
        description={`Mevcut adrese (${member.email}) güvenli link gönderilecek. Kullanıcı yeni e-postasını yazınca otomatik onaylanır; yönetim bildirimi düşer.`}
        confirmLabel="Evet"
        cancelLabel="Hayır"
        tone="primary"
        busy={busy === 'email-change'}
        onCancel={() => setConfirmEmailChange(false)}
        onConfirm={() => {
          setConfirmEmailChange(false)
          void run('email-change', () => membershipsApi.startEmailChange(member.id))
        }}
      />

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
            <Button
              variant="secondary"
              size="sm"
              disabled={!!busy}
              onClick={() => setConfirmEmailChange(true)}
            >
              <Mail className="h-4 w-4" /> E-posta değiştir
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!!busy}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> Sil
            </Button>
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
              <Button
                variant="secondary"
                size="sm"
                disabled={!!busy}
                onClick={() => setConfirmEmailChange(true)}
              >
                <Mail className="h-4 w-4" /> E-posta değiştir
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!!busy}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" /> Sil
              </Button>
              {member.role === 'demo' ||
              member.source === 'Demo Talep' ||
              member.source === 'Demo Kullanıcısı' ? (
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
              <Meta label="Açık ticket" value={String(tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length)} />
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

      {activeTab === 'support' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2" padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Headphones className="h-4 w-4" /> Ticketlar ({tickets.length})
              </CardTitle>
            </CardHeader>
            {tickets.length === 0 ? (
              <p className="text-sm text-text-muted">Bu üyeye bağlı destek talebi yok.</p>
            ) : (
              <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                {tickets.map((t) => {
                  const active = (selectedTicket?.id || '') === t.id
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? 'border-bach-blue/40 bg-bach-blue/5'
                            : 'border-border hover:bg-surface-elevated'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-text">{t.subject}</p>
                          <Badge
                            variant={
                              (statusBadgeMap[t.status] as BadgeVariant) || 'default'
                            }
                          >
                            {statusLabels[t.status] || t.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {t.categoryLabel || t.category || '—'} ·{' '}
                          {t.createdAt ? formatDate(t.createdAt) : '—'}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <div className="space-y-4 lg:col-span-3">
            {!selectedTicket ? (
              <Card padding="lg">
                <p className="text-sm text-text-muted">Ticket seçin veya henüz talep yok.</p>
              </Card>
            ) : (
              <>
                <Card padding="lg" hover={false}>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-text">{selectedTicket.subject}</h3>
                      <p className="mt-1 text-xs text-text-muted">
                        #{selectedTicket.id} · {priorityLabels[selectedTicket.priority] || selectedTicket.priority}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/destek/${selectedTicket.id}`)}
                    >
                      Destek sayfasında aç
                    </Button>
                  </div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                    Açıklama
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                    {selectedTicket.description || '—'}
                  </p>
                </Card>

                <Card padding="lg" hover={false}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4" /> Konuşma
                    </CardTitle>
                  </CardHeader>
                  <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
                    {(selectedTicket.replies || []).length === 0 ? (
                      <p className="text-sm text-text-muted">Henüz yanıt yok.</p>
                    ) : (
                      (selectedTicket.replies || []).map((r) => (
                        <div
                          key={r.id}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-emerald-700">
                              {r.author}
                            </span>
                            <span className="text-xs text-text-subtle">
                              {formatDateTime(r.date)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">
                            {r.content}
                          </p>
                        </div>
                      ))
                    )}
                    {(selectedTicket.internalNotes || []).map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-amber-700">
                            İç not · {n.author}
                          </span>
                          <span className="text-xs text-text-subtle">
                            {formatDateTime(n.date)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-text-muted">{n.content}</p>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Müşteriye yanıt…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[88px]"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="gold"
                      size="sm"
                      disabled={ticketBusy || !replyText.trim()}
                      onClick={() => void sendTicketReply()}
                    >
                      <Send className="h-4 w-4" /> Yanıt gönder
                    </Button>
                  </div>
                  <Textarea
                    placeholder="İç not (müşteri görmez)…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="mt-3 min-h-[72px]"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    disabled={ticketBusy || !noteText.trim()}
                    onClick={() => void sendTicketNote()}
                  >
                    İç not ekle
                  </Button>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="text-base">Ödeme talepleri</CardTitle>
            </CardHeader>
            {payments.length === 0 ? (
              <p className="text-sm text-text-muted">Ödeme talebi yok.</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'plan', label: 'Plan' },
                  { key: 'status', label: 'Durum' },
                  { key: 'method', label: 'Yöntem' },
                  { key: 'source', label: 'Kaynak' },
                  {
                    key: 'createdAt',
                    label: 'Tarih',
                    render: (r) => formatDateTime(String(r.createdAt || '')),
                  },
                ]}
                rows={payments as Array<Record<string, unknown> & { id: string }>}
              />
            )}
          </Card>
          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" /> Paket / billing geçmişi
              </CardTitle>
            </CardHeader>
            {history.length === 0 ? (
              <p className="text-sm text-text-muted">Abonelik geçmişi yok.</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'action', label: 'İşlem' },
                  {
                    key: 'at',
                    label: 'Zaman',
                    render: (r) => formatDateTime(String(r.at || r.createdAt || '')),
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
            )}
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <Card padding="lg" hover={false}>
          <CardHeader>
            <CardTitle className="text-base">Birleşik aktivite</CardTitle>
          </CardHeader>
          {activityEvents.length === 0 ? (
            <p className="text-sm text-text-muted">Henüz aktivite kaydı yok.</p>
          ) : (
            <Timeline events={activityEvents} />
          )}
        </Card>
      )}

      {activeTab === 'license' && (
        <div className="space-y-6">
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
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">E-posta değişim süreci</CardTitle>
            </CardHeader>
            {emailChanges.length === 0 ? (
              <p className="text-sm text-text-muted">Henüz e-posta değişim kaydı yok.</p>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'status',
                    label: 'Durum',
                    render: (r) => (
                      <Badge
                        variant={
                          r.status === 'completed'
                            ? 'success'
                            : r.status === 'pending'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {String(r.status || '—')}
                        {r.autoApproved ? ' · otomatik' : ''}
                      </Badge>
                    ),
                  },
                  { key: 'oldEmail', label: 'Eski' },
                  {
                    key: 'newEmail',
                    label: 'Yeni',
                    render: (r) => String(r.newEmail || '—'),
                  },
                  {
                    key: 'createdAt',
                    label: 'Başlangıç',
                    render: (r) => formatDateTime(String(r.createdAt || '')),
                  },
                  {
                    key: 'completedAt',
                    label: 'Tamamlandı',
                    render: (r) => (r.completedAt ? formatDateTime(String(r.completedAt)) : '—'),
                  },
                ]}
                rows={emailChanges as Array<Record<string, unknown> & { id: string }>}
              />
            )}
          </Card>
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
