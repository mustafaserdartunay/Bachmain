import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  CreditCard,
  ExternalLink,
  Eye,
  FolderTree,
  Globe2,
  LayoutDashboard,
  Package,
  Rocket,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { getPagesBySite, getSites } from '../../utils/webSiteStorage'

const NAV = [
  { path: '/web/studio/yonetim', label: 'Güncel Durum', icon: LayoutDashboard, exact: true },
  { path: '/web/studio/yonetim/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { path: '/web/studio/yonetim/urunler', label: 'Ürünler', icon: ShoppingBag },
  { path: '/web/studio/yonetim/siparisler', label: 'Siparişler', icon: Package },
  { path: '/web/studio/yonetim/profil', label: 'Mağaza profili', icon: Store },
  { path: '/web/studio/yonetim/odeme', label: 'Ödeme ayarları', icon: CreditCard },
]

function fmtDate(value) {
  if (!value) return 'Henüz yok'
  try {
    return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })
  } catch {
    return value
  }
}

function ShellButton({ children, dark = false, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
        dark
          ? 'border-[#E2BC0F]/40 bg-[#E2BC0F] text-white hover:bg-[#f0c922]'
          : 'border-white/25 bg-white text-[#203375] hover:bg-white/90'
      }`}
    >
      {children}
    </button>
  )
}

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-[26px] border border-white/70 bg-[rgba(255,255,255,0.78)] shadow-[0_10px_36px_-14px_rgba(30,35,60,0.18)] backdrop-blur-[26px] ${className}`}
    >
      {children}
    </div>
  )
}

function Metric({ label, value, hint, tone = 'default' }) {
  const toneClass =
    tone === 'warn'
      ? 'text-amber-700'
      : tone === 'success'
        ? 'text-emerald-700'
        : 'text-[#203375]'
  return (
    <div className="rounded-2xl border border-[rgba(121,166,210,0.22)] bg-white/70 px-4 py-3">
      <p className="text-xs font-medium text-[#64748b]">{label}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#94a3b8]">{hint}</p> : null}
    </div>
  )
}

function renderPage(pathname, primarySite, sites, pages) {
  const pageCount = pages.length
  const connected = sites.filter((site) => site.domain).length
  switch (pathname) {
    case '/web/studio/yonetim/kategoriler':
      return (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#79a6d2]">Kategoriler</p>
            <h2 className="mt-1 text-xl font-bold text-[#203375]">Sayfa yapısı ve navigasyon</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Web sitenizde açacağınız ana başlıkları, menü düzenini ve bölüm tiplerini burada
              tanımlarsınız.
            </p>
          </GlassCard>
          <div className="grid gap-4 xl:grid-cols-2">
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-[#203375]">Önerilen ana başlıklar</h3>
              <div className="mt-4 space-y-2">
                {['Ana Sayfa', 'Kurumsal', 'Hizmetler', 'Referanslar', 'İletişim'].map((item) => (
                  <div key={item} className="rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3 text-sm font-semibold text-[#203375]">
                    {item}
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-[#203375]">Kullanılabilir sayfalar</h3>
              <div className="mt-4 space-y-2">
                {pages.length ? (
                  pages.map((page) => (
                    <div key={page.id} className="rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3">
                      <p className="text-sm font-semibold text-[#203375]">{page.title}</p>
                      <p className="text-xs text-[#94a3b8]">/{page.slug}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#64748b]">Henüz sayfa oluşturulmadı. Önce `Domain Bağla` ekranından site ekleyin.</p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )
    case '/web/studio/yonetim/urunler':
      return (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#79a6d2]">Ürünler</p>
            <h2 className="mt-1 text-xl font-bold text-[#203375]">Web sayfa blokları ve modüller</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Buradaki alanı web sayfanızda kullanacağınız kart, koleksiyon, banner ve içerik
              modülleri gibi düşünün.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Toplam sayfa" value={String(pageCount)} />
              <Metric label="Hazır blok" value="12" hint="Hero, ürün grid, form, SSS" />
              <Metric label="Bağlı site" value={String(sites.length)} />
              <Metric label="Yayına hazır" value={String(connected)} tone="success" />
            </div>
          </GlassCard>
          <div className="grid gap-4 lg:grid-cols-3">
            {['Hero banner', 'Öne çıkan ürünler', 'İletişim formu', 'Marka hikayesi', 'Sık sorulanlar', 'Alt bilgi'].map((block) => (
              <GlassCard key={block} className="p-4">
                <p className="text-sm font-bold text-[#203375]">{block}</p>
                <p className="mt-1 text-xs text-[#64748b]">Sayfalara sürüklenebilir yapı için hazır modül alanı.</p>
              </GlassCard>
            ))}
          </div>
        </div>
      )
    case '/web/studio/yonetim/siparisler':
      return (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#79a6d2]">Siparişler</p>
            <h2 className="mt-1 text-xl font-bold text-[#203375]">Form ve talep akışı</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Web tasarım sürecinde gelen form gönderimleri, teklif talepleri ve iletişim kayıtları
              burada listelenir.
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-[#64748b]">
                  <tr>
                    <th className="px-3 py-2">Talep</th>
                    <th className="px-3 py-2">Kaynak</th>
                    <th className="px-3 py-2">Durum</th>
                    <th className="px-3 py-2">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Landing formu', 'Ana sayfa', 'Yeni', 'Bugün'],
                    ['Demo talebi', 'İletişim', 'Hazırlanıyor', 'Dün'],
                    ['Teklif isteği', 'Kurumsal', 'Tamamlandı', '12 Ağustos'],
                  ].map((row) => (
                    <tr key={row[0]} className="border-t border-[#edf2f7]">
                      {row.map((cell) => (
                        <td key={cell} className="px-3 py-3 text-[#203375]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )
    case '/web/studio/yonetim/profil':
      return (
        <div className="max-w-4xl space-y-6">
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#79a6d2]">Mağaza profili</p>
            <h2 className="mt-1 text-xl font-bold text-[#203375]">Marka ve domain kimliği</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Logo, başlık, iletişim metinleri ve bağlı domain bilgisi bu alandan yönetilir.
            </p>
          </GlassCard>
          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard className="p-5">
              <p className="text-sm font-bold text-[#203375]">Aktif site</p>
              <p className="mt-3 text-lg font-bold text-[#203375]">{primarySite?.name || 'Henüz site yok'}</p>
              <p className="mt-1 text-sm text-[#64748b]">{primarySite?.domain || 'Domain bağlantısı bekleniyor'}</p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-sm font-bold text-[#203375]">Güncelleme</p>
              <p className="mt-3 text-sm text-[#64748b]">Son değişiklik</p>
              <p className="text-lg font-bold text-[#203375]">{fmtDate(primarySite?.updatedAt)}</p>
            </GlassCard>
          </div>
        </div>
      )
    case '/web/studio/yonetim/odeme':
      return (
        <div className="max-w-4xl space-y-6">
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#79a6d2]">Ödeme ayarları</p>
            <h2 className="mt-1 text-xl font-bold text-[#203375]">Paket ve yayın akışı ayarları</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Studio paneli, yayın paketi, alan adı ve bakım süreçlerine ait faturalandırma alanı.
            </p>
          </GlassCard>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Plan" value="Studio Pro" />
            <Metric label="Alan adı" value={connected ? 'Bağlı' : 'Bekliyor'} tone={connected ? 'success' : 'warn'} />
            <Metric label="Yayın" value={pageCount ? 'Hazır' : 'Eksik'} tone={pageCount ? 'success' : 'warn'} />
          </div>
        </div>
      )
    default:
      return (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#79a6d2]">
                  Operasyon kapasitesi
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#203375]">Studio yönetim özeti</h2>
              </div>
              <p className="text-sm font-semibold text-[#64748b]">
                Aktif site <span className="text-[#203375]">{sites.length}</span>
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Toplam site" value={String(sites.length)} />
              <Metric label="Bağlı domain" value={String(connected)} tone={connected ? 'success' : 'warn'} />
              <Metric label="Toplam sayfa" value={String(pageCount)} />
              <Metric label="Aktif tasarım" value={primarySite ? primarySite.name : 'Yok'} hint={primarySite?.domain || 'Önce domain bağlayın'} />
            </div>
          </GlassCard>
          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-[#203375]">Son oluşturulan sayfalar</h3>
              <div className="mt-4 space-y-2">
                {pages.length ? (
                  pages.slice(0, 6).map((page) => (
                    <div key={page.id} className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#203375]">{page.title}</p>
                        <p className="text-xs text-[#94a3b8]">/{page.slug}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#64748b]">{fmtDate(page.updatedAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#64748b]">Henüz oluşturulmuş sayfa yok.</p>
                )}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-[#203375]">Hızlı aksiyonlar</h3>
              <div className="mt-4 space-y-2">
                {[
                  'Yeni site oluştur',
                  'Domain kaydı tamamla',
                  'Ana sayfa tasarımını düzenle',
                  'Yayın ön izlemesini aç',
                ].map((task) => (
                  <div key={task} className="rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3 text-sm font-semibold text-[#203375]">
                    {task}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )
  }
}

export default function WebStudioManagementPage() {
  const { pathname } = useLocation()
  const [sites, setSites] = useState(() => getSites())

  useEffect(() => {
    const reload = () => setSites(getSites())
    window.addEventListener('bach:web-sites-updated', reload)
    window.addEventListener('bach:web-pages-updated', reload)
    return () => {
      window.removeEventListener('bach:web-sites-updated', reload)
      window.removeEventListener('bach:web-pages-updated', reload)
    }
  }, [])

  const primarySite = sites[0] || null
  const pages = useMemo(() => (primarySite ? getPagesBySite(primarySite.id) : []), [primarySite?.id])

  return (
    <div className="bach-admin studio-shell studio-shell--entered min-h-screen bg-[radial-gradient(600px_400px_at_8%_12%,rgba(255,178,94,0.2),transparent_60%),radial-gradient(700px_500px_at_92%_8%,rgba(139,92,246,0.16),transparent_60%),radial-gradient(650px_500px_at_85%_85%,rgba(16,185,129,0.16),transparent_60%),radial-gradient(600px_450px_at_5%_90%,rgba(59,130,246,0.16),transparent_60%),linear-gradient(160deg,#eef0f4,#e7e9ef_45%,#eef1f6)] text-[#0f172a]">
      <aside className="fixed bottom-[var(--shell-gap)] left-[var(--shell-gap)] top-[var(--shell-gap)] z-50 hidden h-[calc(100dvh-(2*var(--shell-gap)))] w-[17.5rem] flex-col rounded-[26px] border border-white/15 bg-[linear-gradient(165deg,#2a458a_0%,#203375_42%,#18285c_100%)] px-3 py-4 text-white shadow-[0_14px_40px_-16px_rgba(15,23,42,0.45)] lg:flex">
        <Link
          to="/web/studio"
          className="mb-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-2.5 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Domain Bağla
        </Link>
        <div className="mb-4 flex h-12 items-center gap-2 px-1 pt-1">
          <span className="text-lg font-black tracking-[0.14em] text-white">BACHMAIN</span>
          <span className="inline-flex h-5 items-center rounded-md bg-white px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#203375]">
            Web
          </span>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5">
          <p className="mx-[0.35rem] mb-[0.45rem] mt-[0.35rem] px-[0.35rem] text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-white/55">
            Studio
          </p>
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(121,166,210,0.28))] text-white'
                    : 'border-transparent text-white/92 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <span className={`inline-flex h-[1.85rem] w-[1.85rem] items-center justify-center rounded-xl ${active ? 'bg-white text-[#203375]' : 'bg-white/12 text-white'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="mt-3 rounded-2xl border border-white/15 bg-white/10 p-3">
          <p className="truncate text-sm font-semibold text-white">{primarySite?.name || 'Studio yönetim'}</p>
          <p className="mt-0.5 truncate text-xs text-white/70">{primarySite?.domain || 'Domain bağlantısı bekleniyor'}</p>
        </div>
      </aside>

      <div className="min-h-screen gap-[var(--shell-gap)] p-[var(--shell-gap)] lg:ml-[20rem] lg:flex lg:flex-col">
        <header className="relative z-40 flex min-h-[4.75rem] items-center gap-3 rounded-[26px] border border-white/14 bg-[linear-gradient(165deg,#2a458a_0%,#203375_42%,#18285c_100%)] px-4 py-2 text-white shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)] sm:px-6">
          <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  pathname === item.path || pathname.startsWith(`${item.path}/`)
                    ? 'bg-white/20 text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Link to="/web/studio" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3 text-xs font-semibold text-white transition hover:bg-white/25 lg:hidden">
              <ChevronLeft className="h-4 w-4" />
              Domain Bağla
            </Link>
            <ShellButton>
              <Eye className="h-3.5 w-3.5 text-[#203375]" />
              Ön izleme
            </ShellButton>
            <a
              href={primarySite?.domain || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/25 bg-white px-3 text-xs font-semibold text-[#203375] transition hover:bg-white/90"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#203375]" />
              Canlı vitrine git
            </a>
            <ShellButton dark>
              <Rocket className="h-3.5 w-3.5 text-white" />
              Kaydet ve canlıya taşı
            </ShellButton>
          </div>
        </header>
        <div className="mt-4 flex gap-1.5 overflow-x-auto px-1 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                pathname === item.path || pathname.startsWith(`${item.path}/`)
                  ? 'bg-[#203375] text-white'
                  : 'border border-[#d8e2f0] bg-white/80 text-[#203375]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <main className="mt-4 min-w-0 flex-1 overflow-x-hidden">
          {renderPage(pathname, primarySite, sites, pages)}
        </main>
      </div>
    </div>
  )
}
