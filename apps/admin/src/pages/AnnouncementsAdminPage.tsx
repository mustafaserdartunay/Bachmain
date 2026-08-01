import { useCallback, useEffect, useMemo, useState } from 'react'
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'

type AnnouncementBadge = 'Yeni' | 'Güncelleme' | 'Duyuru' | 'Özellik'
type AnnouncementStatus = 'draft' | 'published' | 'archived'

type Announcement = {
  id: string
  title: string
  detail: string
  badge: AnnouncementBadge | string
  status: AnnouncementStatus | string
  date?: string
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

const EMPTY_FORM = {
  title: '',
  detail: '',
  badge: 'Yeni' as AnnouncementBadge,
  status: 'published' as AnnouncementStatus,
}

function statusVariant(status?: string) {
  if (status === 'published') return 'success' as const
  if (status === 'archived') return 'danger' as const
  return 'warning' as const
}

function badgeVariant(badge?: string) {
  if (badge === 'Yeni') return 'success' as const
  if (badge === 'Güncelleme') return 'gold' as const
  if (badge === 'Özellik') return 'default' as const
  return 'default' as const
}

export function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [badges, setBadges] = useState<string[]>(['Yeni', 'Güncelleme', 'Duyuru', 'Özellik'])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const load = useCallback(async () => {
    const data = await api.get<{ items: Announcement[]; badges?: string[] }>(
      '/announcements/admin',
    )
    setItems(data.items || [])
    if (data.badges?.length) setBadges(data.badges)
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

  const visible = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((row) => row.status === filter)
  }, [items, filter])

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setMsg('')
  }

  function startEdit(row: Announcement) {
    setEditingId(row.id)
    setForm({
      title: row.title || '',
      detail: row.detail || '',
      badge: (row.badge as AnnouncementBadge) || 'Duyuru',
      status: (row.status as AnnouncementStatus) || 'draft',
    })
    setMsg('')
  }

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      if (editingId) {
        await api.put(`/announcements/admin/${editingId}`, form)
        setMsg('Duyuru güncellendi')
      } else {
        await api.post('/announcements/admin', form)
        setMsg('Duyuru oluşturuldu')
      }
      setEditingId(null)
      setForm(EMPTY_FORM)
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
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return
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

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Duyurular"
        subtitle="CRM Ana Sayfa / Yeni Özellikler ve Duyurular bölümüne blog gibi içerik yayınlayın."
        actions={
          <Button type="button" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Yeni Duyuru
          </Button>
        }
      />

      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {msg ? <p className="text-sm font-medium text-text-muted">{msg}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-text">
              {editingId ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Oluştur'}
            </h2>
            {editingId ? (
              <Badge variant="gold">Düzenleme</Badge>
            ) : (
              <Badge variant="success">Yeni</Badge>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted">Başlık</span>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Örn. Tahsilat ve Ödeme Modülü"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted">İçerik</span>
            <Textarea
              value={form.detail}
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              placeholder="Kullanıcıya gösterilecek kısa açıklama…"
              className="min-h-[140px]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted">Etiket</span>
              <Select
                value={form.badge}
                onChange={(e) =>
                  setForm((f) => ({ ...f, badge: e.target.value as AnnouncementBadge }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as AnnouncementStatus }))
                }
              >
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
                <option value="archived">Arşiv</option>
              </Select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" disabled={busy || !form.title.trim() || !form.detail.trim()} onClick={save}>
              {editingId ? 'Güncelle' : 'Kaydet ve Yayınla'}
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
            <h2 className="text-sm font-semibold text-text">Yayın Listesi</h2>
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
              <p className="text-sm text-text-subtle">Henüz duyuru yok.</p>
            ) : (
              visible.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-border bg-surface-elevated p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bach-blue/10 text-bach-blue">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">{row.title}</h3>
                        <Badge variant={badgeVariant(row.badge)}>{row.badge}</Badge>
                        <Badge variant={statusVariant(row.status)}>
                          {row.status === 'published'
                            ? 'Yayında'
                            : row.status === 'archived'
                              ? 'Arşiv'
                              : 'Taslak'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-text-muted">{row.detail}</p>
                      <p className="mt-2 text-[11px] font-medium text-text-subtle">
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
