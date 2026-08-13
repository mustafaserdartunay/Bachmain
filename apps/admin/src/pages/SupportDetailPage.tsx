import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  Tag,
  User,
  UserCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Timeline } from '@/components/ui/Timeline'
import { usePageState } from '@/hooks/usePageState'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { supportApi } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import type { BadgeVariant, TimelineEvent } from '@/types'

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

type ThreadItem = {
  id: string
  kind: 'description' | 'reply' | 'timeline' | 'note'
  author: string
  content: string
  date: string
}

export function SupportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [reply, setReply] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [patchBusy, setPatchBusy] = useState(false)
  const [statusValue, setStatusValue] = useState('')
  const [priorityValue, setPriorityValue] = useState('')
  const [assigneeValue, setAssigneeValue] = useState('')
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)

  const fetcher = useMemo(() => () => supportApi.get(id!), [id])
  const { status, data: ticket, reload } = usePageState({ fetcher, delay: 0 })

  useEffect(() => {
    if (!ticket) return
    setStatusValue(ticket.status || 'open')
    setPriorityValue(ticket.priority || 'medium')
    setAssigneeValue(ticket.assignee || '')
  }, [ticket?.id, ticket?.status, ticket?.priority, ticket?.assignee])

  if (status === 'loading') return <DetailSkeleton />
  if (status === 'error' || !ticket) {
    return <ErrorState onRetry={reload} title="Ticket bulunamadı" />
  }

  const slaDate = new Date(ticket.slaDeadline)
  const now = new Date()
  const slaRemaining = Math.max(0, Math.round((slaDate.getTime() - now.getTime()) / 3600000))
  const tags = Array.isArray(ticket.tags) ? ticket.tags : []
  const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : []
  const internalNotes = Array.isArray(ticket.internalNotes) ? ticket.internalNotes : []
  const replies = Array.isArray(ticket.replies) ? ticket.replies : []
  const timeline = Array.isArray(ticket.timeline) ? ticket.timeline : []

  const thread: ThreadItem[] = [
    {
      id: `desc-${ticket.id}`,
      kind: 'description' as const,
      author: ticket.contactName || ticket.customer || 'Kullanıcı',
      content: ticket.description || '',
      date: ticket.createdAt,
    },
    ...replies.map((r) => ({
      id: r.id,
      kind: 'reply' as const,
      author: r.author,
      content: r.content,
      date: r.date,
    })),
    ...timeline.map((ev) => ({
      id: ev.id,
      kind: 'timeline' as const,
      author: ev.user || 'Sistem',
      content: `${ev.title}${ev.description ? ` — ${ev.description}` : ''}`,
      date: ev.date,
    })),
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)))

  const handleAddNote = async () => {
    if (!note.trim() || !id) return
    setPatchBusy(true)
    try {
      await supportApi.addNote(id, note.trim())
      setNote('')
      setFlash({ ok: true, message: 'İç not eklendi' })
      await reload()
    } catch (err) {
      setFlash({ ok: false, message: err instanceof Error ? err.message : 'Not eklenemedi' })
    } finally {
      setPatchBusy(false)
    }
  }

  const handleReply = async () => {
    if (!reply.trim() || !id) return
    setReplySending(true)
    try {
      await supportApi.reply(id, reply.trim())
      setReply('')
      setFlash({ ok: true, message: 'Yanıt gönderildi' })
      await reload()
    } catch (err) {
      setFlash({ ok: false, message: err instanceof Error ? err.message : 'Yanıt gönderilemedi' })
    } finally {
      setReplySending(false)
    }
  }

  const handleSaveControls = async () => {
    if (!id) return
    setPatchBusy(true)
    try {
      await supportApi.update(id, {
        status: statusValue,
        priority: priorityValue,
        assignee: assigneeValue.trim() || 'Atanmadı',
      })
      setFlash({ ok: true, message: 'Ticket güncellendi' })
      await reload()
    } catch (err) {
      setFlash({ ok: false, message: err instanceof Error ? err.message : 'Güncelleme başarısız' })
    } finally {
      setPatchBusy(false)
    }
  }

  const memberHref = ticket.accountId
    ? `/uyeler/${encodeURIComponent(ticket.accountId)}`
    : ticket.customerId
      ? `/musteriler/${ticket.customerId}`
      : null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={ticket.subject}
        subtitle={`#${ticket.id} · ${ticket.customer}${ticket.categoryLabel ? ` · ${ticket.categoryLabel}` : ''}`}
        breadcrumbs={[
          { label: 'Destek', href: '/destek' },
          { label: ticket.subject },
        ]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/destek')}>
              <ArrowLeft className="h-4 w-4" /> Gelen kutusu
            </Button>
            {memberHref ? (
              <Button variant="secondary" size="sm" onClick={() => navigate(memberHref)}>
                <UserCircle2 className="h-4 w-4" /> Üye hesabı
              </Button>
            ) : null}
          </>
        }
      />

      {flash ? (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            flash.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {flash.message}
        </div>
      ) : null}

      <Card padding="md" hover={false}>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Durum</label>
            <Select value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Öncelik</label>
            <Select value={priorityValue} onChange={(e) => setPriorityValue(e.target.value)}>
              {Object.entries(priorityLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Atanan</label>
            <Input
              value={assigneeValue}
              onChange={(e) => setAssigneeValue(e.target.value)}
              placeholder="personel@bachmain.com"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              disabled={patchBusy}
              onClick={() => void handleSaveControls()}
            >
              Kaydet
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Öncelik</p>
          <Badge
            variant={(statusBadgeMap[ticket.priority] ?? 'default') as BadgeVariant}
            className="mt-2"
          >
            {priorityLabels[ticket.priority] || ticket.priority}
          </Badge>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Durum</p>
          <Badge
            variant={(statusBadgeMap[ticket.status] ?? 'default') as BadgeVariant}
            className="mt-2"
          >
            {statusLabels[ticket.status] || ticket.status}
          </Badge>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Atanan</p>
          <p className="mt-2 text-sm font-semibold text-text">{ticket.assignee}</p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" /> SLA kalan
          </p>
          <p className={`mt-2 text-sm font-bold ${slaRemaining < 4 ? 'text-rose-600' : 'text-text'}`}>
            {slaRemaining} saat
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> Konuşma geçmişi
              </CardTitle>
            </CardHeader>
            <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto">
              {thread.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    item.kind === 'reply'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : item.kind === 'description'
                        ? 'border-bach-blue/20 bg-bach-blue/5'
                        : 'border-border bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text">
                      {item.kind === 'description'
                        ? 'Talep açıklaması'
                        : item.kind === 'reply'
                          ? 'Yanıt'
                          : 'Olay'}{' '}
                      · {item.author}
                    </span>
                    <span className="text-xs text-text-subtle">{formatDateTime(item.date)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">{item.content}</p>
                </div>
              ))}
            </div>

            <Textarea
              placeholder="Müşteriye e-posta ile iletilecek yanıt…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[96px]"
            />
            <Button
              variant="gold"
              size="sm"
              className="mt-3"
              disabled={!reply.trim() || replySending || !ticket.contactEmail}
              onClick={() => void handleReply()}
            >
              <Send className="h-4 w-4" /> Yanıtı gönder
            </Button>
            {!ticket.contactEmail ? (
              <p className="mt-2 text-xs text-rose-600">Dönüş için müşteri e-postası kayıtlı değil.</p>
            ) : (
              <p className="mt-2 text-xs text-text-muted">
                Yanıt {ticket.contactEmail} adresine gönderilir.
              </p>
            )}
          </Card>

          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> İç notlar (personel)
              </CardTitle>
            </CardHeader>
            {internalNotes.length > 0 ? (
              <ul className="mb-4 space-y-3">
                {internalNotes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-700">{n.author}</span>
                      <span className="text-xs text-text-subtle">{formatDateTime(n.date)}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{n.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-text-muted">İç not yok.</p>
            )}
            <Textarea
              placeholder="İç not ekle (müşteri görmez)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={!note.trim() || patchBusy}
              onClick={() => void handleAddNote()}
            >
              <Send className="h-4 w-4" /> Not ekle
            </Button>
          </Card>

          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" /> Etiketler
              </CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-text-muted">—</span>
              )}
            </div>
          </Card>

          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" /> Dosya ekleri
              </CardTitle>
            </CardHeader>
            {attachments.length === 0 ? (
              <p className="text-sm text-text-muted">Henüz dosya eklenmemiş.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-text-subtle" />
                      <span className="text-sm font-medium text-text">{file.name}</span>
                    </div>
                    <span className="text-xs text-text-subtle">{file.size}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> İletişim
              </CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-text-muted">Firma</dt>
                <dd className="font-semibold text-text">{ticket.customer}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Kullanıcı</dt>
                <dd className="font-medium text-text">{ticket.contactName || '—'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">E-posta</dt>
                <dd className="font-medium text-text">
                  {ticket.contactEmail ? (
                    <a
                      className="text-bach-blue hover:underline"
                      href={`mailto:${ticket.contactEmail}`}
                    >
                      {ticket.contactEmail}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Telefon</dt>
                <dd className="font-medium text-text">{ticket.contactPhone || '—'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Kategori</dt>
                <dd className="font-medium text-text">{ticket.categoryLabel || '—'}</dd>
              </div>
            </dl>
            {memberHref ? (
              <Link
                to={memberHref}
                className="mt-3 inline-block text-sm font-medium text-bach-blue hover:underline"
              >
                {ticket.accountId ? 'Üye hesabına git →' : 'Müşteri kartına git →'}
              </Link>
            ) : null}
          </Card>

          <Card padding="lg" hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" /> SLA
              </CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Oluşturulma</dt>
                <dd className="font-medium text-text">{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Son güncelleme</dt>
                <dd className="font-medium text-text">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">SLA deadline</dt>
                <dd className="font-medium text-rose-600">{formatDateTime(ticket.slaDeadline)}</dd>
              </div>
            </dl>
          </Card>

          {timeline.length > 0 ? (
            <Card padding="lg" hover={false}>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <Timeline events={timeline as TimelineEvent[]} />
            </Card>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
