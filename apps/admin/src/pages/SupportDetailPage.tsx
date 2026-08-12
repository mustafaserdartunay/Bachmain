import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Pencil, Paperclip, MessageSquare, Clock, Tag, User,
  AlertTriangle, Send,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Input'
import { Timeline } from '@/components/ui/Timeline'
import { usePageState } from '@/hooks/usePageState'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { supportApi } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import type { BadgeVariant } from '@/types'

const priorityLabels = { low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik' }
const statusLabels = { open: 'Açık', in_progress: 'İşlemde', waiting: 'Bekliyor', resolved: 'Çözüldü', closed: 'Kapalı' }

export function SupportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [reply, setReply] = useState('')
  const [replySending, setReplySending] = useState(false)

  const fetcher = useMemo(
    () => () => supportApi.get(id!),
    [id],
  )

  const { status, data: ticket, reload } = usePageState({ fetcher, delay: 0 })

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

  const handleAddNote = async () => {
    if (!note.trim() || !id) return
    await supportApi.addNote(id, note.trim())
    setNote('')
    reload()
  }

  const handleReply = async () => {
    if (!reply.trim() || !id) return
    setReplySending(true)
    try {
      await supportApi.reply(id, reply.trim())
      setReply('')
      reload()
    } finally {
      setReplySending(false)
    }
  }

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
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" /> Düzenle
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Öncelik</p>
          <Badge variant={(statusBadgeMap[ticket.priority] ?? 'default') as BadgeVariant} className="mt-2">
            {priorityLabels[ticket.priority]}
          </Badge>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Durum</p>
          <Badge variant={(statusBadgeMap[ticket.status] ?? 'default') as BadgeVariant} className="mt-2">
            {statusLabels[ticket.status]}
          </Badge>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted">Atanan</p>
          <p className="mt-2 text-sm font-semibold text-text">{ticket.assignee}</p>
        </Card>
        <Card padding="md" hover={false}>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" /> SLA Kalan
          </p>
          <p className={`mt-2 text-sm font-bold ${slaRemaining < 4 ? 'text-rose-600' : 'text-text'}`}>
            {slaRemaining} saat
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Açıklama</CardTitle>
            </CardHeader>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{ticket.description}</p>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> Müşteriye Dönüş
              </CardTitle>
            </CardHeader>
            {replies.length > 0 ? (
              <ul className="mb-4 space-y-3">
                {replies.map((item) => (
                  <li key={item.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700">{item.author}</span>
                      <span className="text-xs text-text-subtle">{formatDateTime(item.date)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">{item.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-text-muted">Henüz müşteriye yanıt yok.</p>
            )}
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
              onClick={handleReply}
            >
              <Send className="h-4 w-4" /> Yanıtı Gönder
            </Button>
            {!ticket.contactEmail ? (
              <p className="mt-2 text-xs text-rose-600">Dönüş için müşteri e-postası kayıtlı değil.</p>
            ) : (
              <p className="mt-2 text-xs text-text-muted">Yanıt {ticket.contactEmail} adresine gönderilir.</p>
            )}
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" /> Etiketler
              </CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {tags.length ? tags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              )) : <span className="text-sm text-text-muted">—</span>}
            </div>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" /> Dosya Ekleri
              </CardTitle>
              <Button variant="secondary" size="sm">Dosya Ekle</Button>
            </CardHeader>
            {attachments.length === 0 ? (
              <p className="text-sm text-text-muted">Henüz dosya eklenmemiş.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-bach-blue/5"
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

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> İç Notlar
              </CardTitle>
            </CardHeader>
            {internalNotes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {internalNotes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{n.author}</span>
                      <span className="text-xs text-text-subtle">{formatDateTime(n.date)}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{n.content}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="İç not ekle (müşteri görmez)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Button variant="gold" size="sm" className="mt-3" disabled={!note.trim()} onClick={handleAddNote}>
              <Send className="h-4 w-4" /> Not Ekle
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg">
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
                    <a className="text-bach-blue hover:underline" href={`mailto:${ticket.contactEmail}`}>
                      {ticket.contactEmail}
                    </a>
                  ) : '—'}
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
            {ticket.customerId ? (
              <Link
                to={`/musteriler/${ticket.customerId}`}
                className="mt-3 inline-block text-sm font-medium text-bach-blue hover:underline"
              >
                Müşteri kartına git →
              </Link>
            ) : null}
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" /> SLA Bilgisi
              </CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Oluşturulma</dt>
                <dd className="font-medium text-text">{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Son Güncelleme</dt>
                <dd className="font-medium text-text">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">SLA Deadline</dt>
                <dd className="font-medium text-rose-600">{formatDateTime(ticket.slaDeadline)}</dd>
              </div>
            </dl>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Müşteri Zaman Çizelgesi</CardTitle>
            </CardHeader>
            <Timeline events={ticket.timeline} />
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
