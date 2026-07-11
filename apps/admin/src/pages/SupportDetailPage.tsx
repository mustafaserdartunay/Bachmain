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

  const handleAddNote = async () => {
    if (!note.trim() || !id) return
    await supportApi.addNote(id, note.trim())
    setNote('')
    reload()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={ticket.subject}
        subtitle={`#${ticket.id} · ${ticket.customer}`}
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
            <p className="text-sm leading-relaxed text-text-muted">{ticket.description}</p>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" /> Etiketler
              </CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {ticket.tags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" /> Dosya Ekleri
              </CardTitle>
              <Button variant="secondary" size="sm">Dosya Ekle</Button>
            </CardHeader>
            {ticket.attachments.length === 0 ? (
              <p className="text-sm text-text-muted">Henüz dosya eklenmemiş.</p>
            ) : (
              <ul className="space-y-2">
                {ticket.attachments.map((file) => (
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
            {ticket.internalNotes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {ticket.internalNotes.map((n) => (
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
                <User className="h-4 w-4" /> Müşteri
              </CardTitle>
            </CardHeader>
            <p className="text-sm font-semibold text-text">{ticket.customer}</p>
            <Link
              to={`/musteriler/${ticket.customerId}`}
              className="mt-2 inline-block text-sm font-medium text-bach-blue hover:underline"
            >
              Müşteri kartına git →
            </Link>
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
