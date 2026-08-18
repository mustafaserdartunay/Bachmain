import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe2,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Link2,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Settings2,
  Eye,
} from 'lucide-react'
import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
  getPagesBySite,
  createPage,
  deletePage,
  updatePage,
} from '../../utils/webSiteStorage'

// ── Styles inline token shortcuts ────────────────────────────────────
const NAV_BLUE = '#203375'
const card =
  'rounded-2xl border border-[var(--glass-border,rgba(255,255,255,0.75))] bg-[var(--glass-bg,rgba(255,255,255,0.72))] shadow-[0_10px_36px_-14px_rgba(30,35,60,0.14)] backdrop-blur-md'
const btn =
  'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all'
const btnPrimary = `${btn} bg-[${NAV_BLUE}] text-white hover:bg-[#18285c]`
const btnSecondary = `${btn} border border-[var(--glass-border)] bg-white/70 text-[${NAV_BLUE}] hover:bg-white`
const btnDanger = `${btn} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`
const modalPanel =
  'w-full overflow-hidden rounded-[1.75rem] border border-white/70 bg-[rgba(255,255,255,0.88)] shadow-[0_32px_80px_-32px_rgba(32,51,117,0.45)] backdrop-blur-2xl'
const fieldClass =
  'w-full rounded-2xl border border-[#dbe4f1] bg-white/90 px-4 py-3 text-sm text-[#203375] outline-none transition focus:border-[#79a6d2] focus:ring-4 focus:ring-[#79a6d2]/15'

// ── Domain validator ─────────────────────────────────────────────────
function isDomainValid(d) {
  return /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(d.trim())
}
function normalizeDomain(d) {
  const s = d.trim().replace(/\/$/, '')
  if (s && !/^https?:\/\//i.test(s)) return `https://${s}`
  return s
}

// ── Delete confirm dialog ─────────────────────────────────────────────
function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className={`${card} w-full max-w-sm p-6`}>
        <h3 className="text-base font-bold" style={{ color: NAV_BLUE }}>Silmek istediğinize emin misiniz?</h3>
        <p className="mt-1.5 text-sm text-[var(--muted,#64748b)]">{label}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnSecondary} onClick={onCancel}>İptal</button>
          <button className={btnDanger} onClick={onConfirm}>Sil</button>
        </div>
      </div>
    </div>
  )
}

// ── Site form dialog ──────────────────────────────────────────────────
function SiteFormDialog({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [domain, setDomain] = useState(initial?.domain || '')
  const [domainErr, setDomainErr] = useState('')
  const [saving, setSaving] = useState(false)

  function validate() {
    if (!name.trim()) return false
    if (domain.trim() && !isDomainValid(domain)) {
      setDomainErr('Geçerli bir domain girin (ör. marka.com)')
      return false
    }
    setDomainErr('')
    return true
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    onSave({ name: name.trim(), domain: normalizeDomain(domain) })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.32)] px-4 backdrop-blur-md">
      <div className={`${modalPanel} max-w-xl`}>
        <div className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_36%),linear-gradient(135deg,#203375_0%,#3556b3_55%,#7aa6d5_100%)] px-6 py-6 text-white">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                Studio
              </p>
              <h3 className="mt-1 text-2xl font-bold">
                {initial ? 'Siteyi düzenle' : 'Yeni web sitesi'}
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-white/78">
                Domain, sayfalar ve yayın akışını tek panelden yöneteceğiniz yeni web alanını oluşturun.
              </p>
            </div>
            <button
              className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-[#dbe4f1] bg-white/75 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#203375] text-white shadow-lg shadow-[#203375]/20">
                  <Globe2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: NAV_BLUE }}>Site bilgisi</p>
                  <p className="text-xs text-[#64748b]">Panelde görünecek ana isim</p>
                </div>
              </div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: NAV_BLUE }}>Site adı *</label>
              <input
                autoFocus
                className={fieldClass}
                placeholder="Örn. BachMain Kurumsal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div className="rounded-2xl border border-[#dbe4f1] bg-[linear-gradient(180deg,rgba(240,246,252,0.95),rgba(255,255,255,0.92))] p-4">
              <p className="text-sm font-bold" style={{ color: NAV_BLUE }}>Hazır yapı</p>
              <div className="mt-3 space-y-2 text-xs text-[#55657d]">
                <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2">Domain bağlantısı</div>
                <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2">Çoklu sayfa desteği</div>
                <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2">Yayın akışı için hazırlık</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dbe4f1] bg-white/75 p-4">
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: NAV_BLUE }}>
              Domain (isteğe bağlı)
            </label>
            <input
              className={`${fieldClass} ${domainErr ? 'border-red-400 focus:border-red-400' : ''}`}
              placeholder="marka.com veya www.marka.com"
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setDomainErr('') }}
            />
            {domainErr && <p className="mt-1 text-xs text-red-500">{domainErr}</p>}
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-xl bg-[#f4f8fc] px-3 py-2 text-xs text-[#64748b]">Kendi domaininizi sonra da bağlayabilirsiniz.</div>
              <div className="rounded-xl bg-[#f4f8fc] px-3 py-2 text-xs text-[#64748b]">İsterseniz subdomain ile başlayabilirsiniz.</div>
              <div className="rounded-xl bg-[#f4f8fc] px-3 py-2 text-xs text-[#64748b]">Yayın öncesi DNS kontrolü eklenebilir.</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe4f1] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,248,252,0.95))] px-4 py-3">
            <div>
              <p className="text-sm font-bold" style={{ color: NAV_BLUE }}>Yeni geçiş</p>
              <p className="text-xs text-[#64748b]">Site oluşturulduğunda hemen sayfa ekleme akışına geçilir.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button className={btnSecondary} onClick={onClose}>İptal</button>
              <button
                className={`${btnPrimary} min-w-[8rem] justify-center ${saving || !name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={saving || !name.trim()}
                onClick={handleSave}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {initial ? 'Kaydet' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Domain connect dialog ─────────────────────────────────────────────
function DomainDialog({ site, onSave, onClose }) {
  const [domain, setDomain] = useState(site.domain || '')
  const [err, setErr] = useState('')

  function handleSave() {
    if (domain.trim() && !isDomainValid(domain)) {
      setErr('Geçerli bir domain girin (ör. marka.com)')
      return
    }
    onSave(normalizeDomain(domain))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className={`${card} w-full max-w-lg p-6`}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: NAV_BLUE }}>Domain bağla — {site.name}</h3>
          <button className="rounded-lg p-1 hover:bg-black/5" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold" style={{ color: NAV_BLUE }}>Domain adresi</label>
          <input
            autoFocus
            className={`w-full rounded-xl border bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#79a6d2]/20 ${err ? 'border-red-400' : 'border-[#e2e8f0] focus:border-[#79a6d2]'}`}
            placeholder="marka.com"
            value={domain}
            onChange={(e) => { setDomain(e.target.value); setErr('') }}
          />
          {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
        </div>

        {/* DNS talimatları */}
        <div className="mt-4 rounded-xl border border-[#79a6d2]/30 bg-[#f0f6fc] p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: NAV_BLUE }}>DNS ayarları</p>
          <p className="text-xs text-[#475569]">Domain sağlayıcınızın panelinde aşağıdaki kaydı oluşturun:</p>
          <div className="mt-2 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-xs text-[#1e293b]">
            <div className="flex gap-4">
              <span className="text-[#64748b]">Tür</span>
              <span className="text-[#64748b]">Ad</span>
              <span className="text-[#64748b]">Değer</span>
            </div>
            <div className="mt-1 flex gap-4 font-semibold">
              <span>CNAME</span>
              <span>www</span>
              <span style={{ color: NAV_BLUE }}>sites.bachmain.com</span>
            </div>
            <div className="mt-0.5 flex gap-4 font-semibold">
              <span>A</span>
              <span>@</span>
              <span style={{ color: NAV_BLUE }}>76.76.21.21</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#64748b]">DNS değişikliklerinin yayılması 5 dakika ile 48 saat sürebilir.</p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className={btnSecondary} onClick={onClose}>İptal</button>
          <button className={btnPrimary} onClick={handleSave}>
            <Link2 className="h-3.5 w-3.5" />
            {domain.trim() ? 'Bağla' : 'Domaini kaldır'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page form dialog ──────────────────────────────────────────────────
function PageFormDialog({ siteId, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('page')

  function handleSave() {
    if (!title.trim()) return
    onSave({ title: title.trim(), type })
  }

  const PAGE_TYPES = [
    { value: 'page', label: 'Standart sayfa' },
    { value: 'home', label: 'Ana sayfa' },
    { value: 'about', label: 'Hakkımızda' },
    { value: 'contact', label: 'İletişim' },
    { value: 'blog', label: 'Blog' },
    { value: 'landing', label: 'Landing page' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className={`${card} w-full max-w-md p-6`}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: NAV_BLUE }}>Yeni sayfa</h3>
          <button className="rounded-lg p-1 hover:bg-black/5" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: NAV_BLUE }}>Sayfa başlığı *</label>
            <input
              autoFocus
              className="w-full rounded-xl border border-[#e2e8f0] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#79a6d2] focus:ring-2 focus:ring-[#79a6d2]/20"
              placeholder="Ana Sayfa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: NAV_BLUE }}>Sayfa türü</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PAGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all text-left ${type === t.value ? 'border-[#203375] bg-[#203375] text-white' : 'border-[#e2e8f0] bg-white/70 text-[#475569] hover:border-[#203375]/40'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className={btnSecondary} onClick={onClose}>İptal</button>
          <button
            className={`${btnPrimary} ${!title.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!title.trim()}
            onClick={handleSave}
          >
            <Plus className="h-3.5 w-3.5" />
            Oluştur
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Site card ─────────────────────────────────────────────────────────
function SiteCard({ site, onSelect, onEdit, onDomain, onDelete }) {
  const pages = getPagesBySite(site.id)
  const hasDomain = Boolean(site.domain)

  return (
    <div
      className={`${card} group flex flex-col gap-0 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5`}
      onClick={() => onSelect(site)}
    >
      {/* Site header */}
      <div
        className="flex items-start justify-between gap-3 p-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.6)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: 'linear-gradient(135deg,#2a458a,#18285c)' }}
          >
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: NAV_BLUE }}>{site.name}</p>
            {hasDomain ? (
              <a
                href={site.domain}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-xs text-[#64748b] hover:text-[#203375]"
                onClick={(e) => e.stopPropagation()}
              >
                {site.domain.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-[#94a3b8]">Domain bağlı değil</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            className="rounded-lg border border-[#e2e8f0] bg-white p-1.5 text-[#64748b] transition hover:border-[#203375]/40 hover:text-[#203375]"
            title="Domain bağla"
            onClick={() => onDomain(site)}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded-lg border border-[#e2e8f0] bg-white p-1.5 text-[#64748b] transition hover:border-[#203375]/40 hover:text-[#203375]"
            title="Düzenle"
            onClick={() => onEdit(site)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded-lg border border-red-100 bg-white p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
            title="Sil"
            onClick={() => onDelete(site)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-5 py-3 text-xs text-[#64748b]">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {pages.length} sayfa
        </span>
        {hasDomain ? (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Domain bağlı
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Domain yok
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5 font-semibold" style={{ color: NAV_BLUE }}>
          Aç <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}

// ── Page row ──────────────────────────────────────────────────────────
const PAGE_TYPE_LABELS = {
  home: 'Ana Sayfa', about: 'Hakkımızda', contact: 'İletişim',
  blog: 'Blog', landing: 'Landing', page: 'Sayfa',
}

function PageRow({ page, siteUrl, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [titleInput, setTitleInput] = useState(page.title)

  function saveTitle() {
    const t = titleInput.trim()
    if (t && t !== page.title) updatePage(page.id, { title: t })
    setEditing(false)
  }

  const liveUrl = siteUrl ? `${siteUrl}/${page.slug}` : null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white/70 px-3 py-2.5 transition hover:border-[#79a6d2]/50 hover:bg-white">
      <FileText className="h-4 w-4 shrink-0 text-[#79a6d2]" />
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            className="w-full rounded-lg border border-[#79a6d2] bg-white px-2 py-0.5 text-sm font-semibold outline-none"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleInput(page.title); setEditing(false) } }}
          />
        ) : (
          <p className="truncate text-sm font-semibold" style={{ color: NAV_BLUE }}>{page.title}</p>
        )}
        <p className="text-xs text-[#94a3b8]">
          {PAGE_TYPE_LABELS[page.type] || 'Sayfa'} · /{page.slug}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#e2e8f0] bg-white p-1.5 text-[#64748b] transition hover:text-[#203375]"
            title="Canlı gör"
          >
            <Eye className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          className="rounded-lg border border-[#e2e8f0] bg-white p-1.5 text-[#64748b] transition hover:text-[#203375]"
          title="Başlığı düzenle"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded-lg border border-red-100 bg-white p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
          title="Sil"
          onClick={() => onDelete(page)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Site detail view ──────────────────────────────────────────────────
function SiteDetail({ site: initialSite, onBack }) {
  const [site, setSite] = useState(initialSite)
  const [pages, setPages] = useState(() => getPagesBySite(initialSite.id))
  const [showPageForm, setShowPageForm] = useState(false)
  const [showDomain, setShowDomain] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const reload = useCallback(() => {
    setSite(getSites().find((s) => s.id === initialSite.id) || site)
    setPages(getPagesBySite(initialSite.id))
  }, [initialSite.id, site])

  useEffect(() => {
    window.addEventListener('bach:web-sites-updated', reload)
    window.addEventListener('bach:web-pages-updated', reload)
    return () => {
      window.removeEventListener('bach:web-sites-updated', reload)
      window.removeEventListener('bach:web-pages-updated', reload)
    }
  }, [reload])

  function handleCreatePage({ title, type }) {
    createPage({ siteId: site.id, title, type })
    setShowPageForm(false)
    reload()
  }

  function handleDeletePage(page) {
    setDeleteTarget({ type: 'page', item: page })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'page') deletePage(deleteTarget.item.id)
    setDeleteTarget(null)
    reload()
  }

  function handleDomainSave(domain) {
    updateSite(site.id, { domain })
    setShowDomain(false)
    reload()
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          className={`${btnSecondary}`}
          onClick={onBack}
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Tüm siteler
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-[#94a3b8]" />
        <span className="text-sm font-semibold" style={{ color: NAV_BLUE }}>{site.name}</span>
      </div>

      {/* Site header card */}
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg,#2a458a,#18285c)' }}
            >
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: NAV_BLUE }}>{site.name}</h2>
              {site.domain ? (
                <a
                  href={site.domain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#203375]"
                >
                  {site.domain.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="text-sm text-[#94a3b8]">Domain henüz bağlanmamış</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className={btnSecondary} onClick={() => setShowDomain(true)}>
              <Link2 className="h-3.5 w-3.5" />
              {site.domain ? 'Domain düzenle' : 'Domain bağla'}
            </button>
          </div>
        </div>

        {/* Domain info strip */}
        {!site.domain && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Domain bağlanmamış</p>
              <p className="text-xs text-amber-700">Domain bağlayarak web sitenizi kendi adresinizden yayınlayabilirsiniz.</p>
            </div>
            <button className={`${btnPrimary} shrink-0 ml-auto`} onClick={() => setShowDomain(true)}>
              Bağla
            </button>
          </div>
        )}
      </div>

      {/* Pages */}
      <div className={`${card} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold" style={{ color: NAV_BLUE }}>Sayfalar</h3>
            <p className="text-xs text-[#64748b]">{pages.length} sayfa</p>
          </div>
          <button className={btnPrimary} onClick={() => setShowPageForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Sayfa ekle
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#79a6d2]/50 bg-[#f8faff] px-4 py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-[#79a6d2]" />
            <p className="text-sm font-semibold" style={{ color: NAV_BLUE }}>Henüz sayfa yok</p>
            <p className="mt-1 text-xs text-[#64748b]">İlk sayfanızı oluşturun.</p>
            <button className={`${btnPrimary} mt-4`} onClick={() => setShowPageForm(true)}>
              <Plus className="h-3.5 w-3.5" />
              Sayfa ekle
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => (
              <PageRow
                key={page.id}
                page={page}
                siteUrl={site.domain || null}
                onEdit={() => {}}
                onDelete={handleDeletePage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showPageForm && (
        <PageFormDialog
          siteId={site.id}
          onSave={handleCreatePage}
          onClose={() => setShowPageForm(false)}
        />
      )}
      {showDomain && (
        <DomainDialog
          site={site}
          onSave={handleDomainSave}
          onClose={() => setShowDomain(false)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          label={`"${deleteTarget.item.title || deleteTarget.item.name}" kalıcı olarak silinecek.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function WebStudioPage() {
  const [sites, setSites] = useState(() => getSites())
  const [selectedSite, setSelectedSite] = useState(null)
  const [showSiteForm, setShowSiteForm] = useState(false)
  const [editSite, setEditSite] = useState(null)
  const [domainSite, setDomainSite] = useState(null)
  const [deleteSiteTarget, setDeleteSiteTarget] = useState(null)

  const reloadSites = useCallback(() => setSites(getSites()), [])

  useEffect(() => {
    window.addEventListener('bach:web-sites-updated', reloadSites)
    window.addEventListener('bach:web-pages-updated', reloadSites)
    return () => {
      window.removeEventListener('bach:web-sites-updated', reloadSites)
      window.removeEventListener('bach:web-pages-updated', reloadSites)
    }
  }, [reloadSites])

  function handleCreateSite({ name, domain }) {
    const site = createSite({ name, domain })
    setShowSiteForm(false)
    reloadSites()
    setSelectedSite(site)
  }

  function handleEditSite({ name, domain }) {
    updateSite(editSite.id, { name, domain })
    setEditSite(null)
    reloadSites()
  }

  function handleDomainSave(domain) {
    updateSite(domainSite.id, { domain })
    setDomainSite(null)
    reloadSites()
  }

  function confirmDeleteSite() {
    deleteSite(deleteSiteTarget.id)
    setDeleteSiteTarget(null)
    reloadSites()
  }

  if (selectedSite) {
    return (
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <SiteDetail
          site={selectedSite}
          onBack={() => setSelectedSite(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-4 lg:px-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAV_BLUE }}>Web Sitesi Yöneticisi</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Web sitelerinizi yönetin, domain bağlayın ve sayfalarınızı düzenleyin.
          </p>
        </div>
        <button className={btnPrimary} onClick={() => setShowSiteForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Yeni site
        </button>
      </div>

      {/* Empty state */}
      {sites.length === 0 ? (
        <div className={`${card} px-6 py-14 text-center`}>
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl text-white"
            style={{ background: 'linear-gradient(135deg,#2a458a,#18285c)' }}
          >
            <Globe2 className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold" style={{ color: NAV_BLUE }}>İlk web sitenizi oluşturun</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#64748b]">
            Web sitenizi buradan yönetin. Kendi domain adresinizi bağlayın, sayfalar ekleyin ve içeriklerinizi düzenleyin.
          </p>
          <button className={`${btnPrimary} mt-6`} onClick={() => setShowSiteForm(true)}>
            <Plus className="h-4 w-4" />
            Yeni site oluştur
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onSelect={setSelectedSite}
              onEdit={(s) => setEditSite(s)}
              onDomain={(s) => setDomainSite(s)}
              onDelete={(s) => setDeleteSiteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showSiteForm && (
        <SiteFormDialog
          onSave={handleCreateSite}
          onClose={() => setShowSiteForm(false)}
        />
      )}
      {editSite && (
        <SiteFormDialog
          initial={editSite}
          onSave={handleEditSite}
          onClose={() => setEditSite(null)}
        />
      )}
      {domainSite && (
        <DomainDialog
          site={domainSite}
          onSave={handleDomainSave}
          onClose={() => setDomainSite(null)}
        />
      )}
      {deleteSiteTarget && (
        <DeleteConfirm
          label={`"${deleteSiteTarget.name}" ve tüm sayfaları kalıcı olarak silinecek.`}
          onConfirm={confirmDeleteSite}
          onCancel={() => setDeleteSiteTarget(null)}
        />
      )}
    </div>
  )
}
