import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, Megaphone, Package, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'

type AnnouncementBadge = 'Yeni' | 'Güncelleme' | 'Duyuru' | 'Özellik' | 'Fiyat'
type AnnouncementStatus = 'draft' | 'published' | 'archived'
type AnnouncementChannel = 'feature' | 'training' | 'package'

type Announcement = {
  id: string
  channel?: AnnouncementChannel | string
  code?: string
  version?: string
  title: string
  detail: string
  body?: string
  badge: AnnouncementBadge | string
  status: AnnouncementStatus | string
  date?: string
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
  videoUrl?: string
  videoTitle?: string
  planName?: string
  priceFrom?: number | null
  priceTo?: number | null
  priceNote?: string
}

type FormState = {
  title: string
  detail: string
  body: string
  badge: AnnouncementBadge
  status: AnnouncementStatus
  channel: AnnouncementChannel
  videoUrl: string
  videoTitle: string
  planName: string
  priceFrom: string
  priceTo: string
  priceNote: string
}

const CHANNEL_TABS: {
  key: AnnouncementChannel
  path: string
  label: string
  title: string
  subtitle: string
  createLabel: string
  defaultBadge: AnnouncementBadge
}[] = [
  {
    key: 'feature',
    path: '/duyurular',
    label: 'Özellikler',
    title: 'Özellikler / Sürüm',
    subtitle:
      'Yayınlanan her özellik CRM sürümünü otomatik artırır. Kayıt BM-x.y.z koduyla hem bu panelde hem CRM duyuru sayfasında görünür.',
    createLabel: 'Yeni özellik',
    defaultBadge: 'Özellik',
  },
  {
    key: 'training',
    path: '/egitim-duyurulari',
    label: 'Eğitim',
    title: 'Eğitim Bildirimleri',
    subtitle:
      'Eklenen her video EDU kodu alır. CRM Eğitim sayfasında ve kullanıcı menüsünde kırmızı rozet olarak görünür.',
    createLabel: 'Yeni video bildirimi',
    defaultBadge: 'Yeni',
  },
  {
    key: 'package',
    path: '/paket-duyurulari',
    label: 'Paketler',
    title: 'Paket Bildirimleri',
    subtitle:
      'Fiyat değişimi veya ücretli yeni özellik PKG kodu alır. CRM Paketler sayfasında detay ve bildirim rozeti gösterilir.',
    createLabel: 'Yeni paket bildirimi',
    defaultBadge: 'Fiyat',
  },
]

function channelFromPath(pathname: string): AnnouncementChannel {
  if (pathname.includes('egitim')) return 'training'
  if (pathname.includes('paket')) return 'package'
  return 'feature'
}

function emptyForm(channel: AnnouncementChannel): FormState {
  const tab = CHANNEL_TABS.find((item) => item.key === channel) || CHANNEL_TABS[0]
  return {
    title: '',
    detail: '',
    body: '',
    badge: tab.defaultBadge,
    status: 'published',
    channel,
    videoUrl: '',
    videoTitle: '',
    planName: '',
    priceFrom: '',
    priceTo: '',
    priceNote: '',
  }
}

function statusVariant(status?: string) {
  if (status === 'published') return 'success' as const
  if (status === 'archived') return 'danger' as const
  return 'warning' as const
}

function badgeVariant(badge?: string) {
  if (badge === 'Yeni') return 'success' as const
  if (badge === 'Güncelleme' || badge === 'Fiyat') return 'gold' as const
  if (badge === 'Özellik') return 'default' as const
  return 'default' as const
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'training') return <GraduationCap className="h-4 w-4" />
  if (channel === 'package') return <Package className="h-4 w-4" />
  return <Sparkles className="h-4 w-4" />
}

export function AnnouncementsAdminPage() {
  const location = useLocation()
  const channel = channelFromPath(location.pathname)
  const tab = CHANNEL_TABS.find((item) => item.key === channel) || CHANNEL_TABS[0]

  const [items, setItems] = useState<Announcement[]>([])
  const [badges, setBadges] = useState<string[]>(['Yeni', 'Güncelleme', 'Duyuru', 'Özellik', 'Fiyat'])
  const [version, setVersion] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(() => emptyForm(channel))
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const load = useCallback(async () => {
    const data = await api.get<{
      items: Announcement[]
      badges?: string[]
      version?: string
    }>('/announcements/admin')
    setItems(data.items || [])
    if (data.badges?.length) setBadges(data.badges)
    if (data.version) setVersion(data.version)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setError('')
        await load()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yüklenemedi')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    setEditingId(null)
    setForm(emptyForm(channel))
    setMsg('')
    setFilter('all')
  }, [channel])

  const visible = useMemo(() => {
    return items.filter((row) => {
      if ((row.channel || 'feature') !== channel) return false
      if (filter === 'all') return true
      return row.status === filter
    })
  }, [items, channel, filter])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm(channel))
    setMsg('')
  }

  function startEdit(row: Announcement) {
    setEditingId(row.id)
    setForm({
      title: row.title || '',
      detail: row.detail || '',
      body: row.body || row.detail || '',
      badge: (row.badge as AnnouncementBadge) || emptyForm(channel).badge,
      status: (row.status as AnnouncementStatus) || 'draft',
      channel: ((row.channel as AnnouncementChannel) || channel),
      videoUrl: row.videoUrl || '',
      videoTitle: row.videoTitle || '',
      planName: row.planName || '',
      priceFrom: row.priceFrom == null ? '' : String(row.priceFrom),
      priceTo: row.priceTo == null ? '' : String(row.priceTo),
      priceNote: row.priceNote || '',
    })
    setMsg('')
  }

  function payloadFromForm() {
    const body = form.body.trim() || form.detail.trim()
    return {
      title: form.title.trim(),
      detail: form.detail.trim() || body,
      body,
      badge: form.badge,
      status: form.status,
      channel: form.channel,
      videoUrl: form.videoUrl.trim(),
      videoTitle: form.videoTitle.trim(),
      planName: form.planName.trim(),
      priceFrom: form.priceFrom === '' ? null : Number(form.priceFrom),
      priceTo: form.priceTo === '' ? null : Number(form.priceTo),
      priceNote: form.priceNote.trim(),
    }
  }

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      const payload = payloadFromForm()
      if (editingId) {
        await api.put(`/announcements/admin/${editingId}`, payload)
        setMsg('Kayıt güncellendi')
      } else {
        await api.post('/announcements/admin', payload)
        setMsg(
          channel === 'feature' && payload.status === 'published'
            ? 'Özellik yayınlandı. Sürüm otomatik artırıldı.'
            : 'Kayıt oluşturuldu',
        )
      }
      setEditingId(null)
      setForm(emptyForm(channel))
      await load()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setBusy(false)
    }
  }

  async function publish(id: string) {
    setBusy(true)
    try {
      await api.post(`/announcements/admin/${id}/publish`, {})
      await load()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Yayınlanamadı')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
    setBusy(true)
    try {
      await api.post(`/announcements/admin/${id}/delete`, {})
      if (editingId === id) startCreate()
      await load()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Silinemedi')
    } finally {
      setBusy(false)
    }
  }

  const editingRow = editingId ? items.find((row) => row.id === editingId) : null
  const canSave = Boolean(form.title.trim() && (form.body.trim() || form.detail.trim()))

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={tab.title}
        subtitle={tab.subtitle}
        actions={
          <Button type="button" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            {tab.createLabel}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {CHANNEL_TABS.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              item.key === channel
                ? 'bg-bach-blue/10 text-bach-blue'
                : 'text-text-muted hover:bg-black/5 hover:text-text',
            )}
          >
            {item.label}
          </Link>
        ))}
        {version ? (
          <span className="ml-auto rounded-lg border border-border px-3 py-1.5 font-mono text-xs font-bold text-text-muted">
            Platform sürümü {version}
          </span>
        ) : null}
      </div>

      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {msg ? <p className="text-sm font-medium text-text-muted">{msg}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-text">
              {editingId ? 'Kaydı düzenle' : tab.createLabel}
            </h2>
            {editingId ? <Badge variant="gold">Düzenleme</Badge> : <Badge variant="success">Yeni</Badge>}
            {editingRow?.code ? (
              <Badge variant="default">{editingRow.code}</Badge>
            ) : channel === 'feature' ? (
              <span className="text-xs text-text-subtle">Kod yayınlanınca BM-sürüm olarak atanır</span>
            ) : (
              <span className="text-xs text-text-subtle">Kod kaydedilince otomatik atanır</span>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted">Başlık</span>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={
                channel === 'training'
                  ? 'Örn. Teklif listesi eğitimi'
                  : channel === 'package'
                    ? 'Örn. Professional paket fiyat güncellemesi'
                    : 'Örn. Tahsilat ve Ödeme Modülü'
              }
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted">Kısa özet</span>
            <Input
              value={form.detail}
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              placeholder="Listelerde görünen kısa cümle"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted">Detaylı açıklama</span>
            <Textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="CRM sayfasında gösterilecek uzun açıklama. Madde madde yazabilirsiniz."
              className="min-h-[180px]"
            />
          </label>

          {channel === 'training' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-muted">Video bağlantısı</span>
                <Input
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-muted">Video başlığı</span>
                <Input
                  value={form.videoTitle}
                  onChange={(e) => setForm((f) => ({ ...f, videoTitle: e.target.value }))}
                  placeholder="Eğitim videosunun adı"
                />
              </label>
            </div>
          ) : null}

          {channel === 'package' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-muted">Paket adı</span>
                <Input
                  value={form.planName}
                  onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
                  placeholder="Starter / Professional / Enterprise"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted">Eski fiyat (₺)</span>
                <Input
                  type="number"
                  min="0"
                  value={form.priceFrom}
                  onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))}
                  placeholder="4900"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted">Yeni fiyat (₺)</span>
                <Input
                  type="number"
                  min="0"
                  value={form.priceTo}
                  onChange={(e) => setForm((f) => ({ ...f, priceTo: e.target.value }))}
                  placeholder="5400"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-muted">Fiyat notu</span>
                <Input
                  value={form.priceNote}
                  onChange={(e) => setForm((f) => ({ ...f, priceNote: e.target.value }))}
                  placeholder="Mevcut abonelikler dönem sonuna kadar eski fiyattan devam eder."
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted">Etiket</span>
              <Select
                value={form.badge}
                onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value as AnnouncementBadge }))}
              >
                {badges.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted">Durum</span>
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AnnouncementStatus }))}
              >
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
                <option value="archived">Arşiv</option>
              </Select>
            </label>
          </div>

          {channel === 'feature' ? (
            <p className="text-xs leading-5 text-text-subtle">
              Yayına aldığınızda platform sürümü bir yama artar ve kayda <strong>BM-sürüm</strong> kodu
              yazılır. CRM Yeni Özellikler sayfası bu kodu ve detaylı açıklamayı gösterir.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" disabled={busy || !canSave} onClick={save}>
              {editingId ? 'Güncelle' : 'Kaydet ve yayınla'}
            </Button>
            {editingId ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={startCreate}>
                Vazgeç
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text">Kodlu kayıt listesi</h2>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-auto min-w-[140px]"
            >
              <option value="all">Tümü</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
            </Select>
          </div>

          <div className="space-y-3">
            {visible.length === 0 ? (
              <p className="text-sm text-text-subtle">Bu kanalda henüz kayıt yok.</p>
            ) : (
              visible.map((row) => (
                <article key={row.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bach-blue/10 text-bach-blue">
                      <ChannelIcon channel={row.channel || channel} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {row.code ? (
                          <span className="rounded-md bg-black/5 px-2 py-0.5 font-mono text-[11px] font-bold text-text">
                            {row.code}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-text-subtle">Kod yok</span>
                        )}
                        {row.version ? (
                          <span className="text-[11px] font-medium text-text-subtle">v{row.version}</span>
                        ) : null}
                        <Badge variant={badgeVariant(row.badge)}>{row.badge}</Badge>
                        <Badge variant={statusVariant(row.status)}>
                          {row.status === 'published'
                            ? 'Yayında'
                            : row.status === 'archived'
                              ? 'Arşiv'
                              : 'Taslak'}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-text">{row.title}</h3>
                      <p className="mt-1 whitespace-pre-line text-xs leading-5 text-text-muted">
                        {row.body || row.detail}
                      </p>
                      {row.videoUrl ? (
                        <p className="mt-2 text-[11px] font-medium text-bach-blue">{row.videoTitle || row.videoUrl}</p>
                      ) : null}
                      {row.planName || row.priceFrom != null || row.priceTo != null ? (
                        <p className="mt-2 text-[11px] font-medium text-text-subtle">
                          {row.planName ? `${row.planName} · ` : ''}
                          {row.priceFrom != null ? formatCurrency(row.priceFrom) : '—'}
                          {' → '}
                          {row.priceTo != null ? formatCurrency(row.priceTo) : '—'}
                        </p>
                      ) : null}
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-text-subtle">
                        <Megaphone className="h-3.5 w-3.5" />
                        {row.date || '—'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Düzenle
                        </Button>
                        {row.status !== 'published' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="gold"
                            disabled={busy}
                            onClick={() => publish(row.id)}
                          >
                            Yayınla
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => remove(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
