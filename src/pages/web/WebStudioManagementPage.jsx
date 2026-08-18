import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import TeamHubPanel from '../../components/Layout/TeamHubPanel'
import { getPagesBySite, getSites } from '../../utils/webSiteStorage'
import logoOnDark from '../../assets/bachmain-logo-on-dark.png'
import logoBusiness from '../../assets/bachmain-logo.png'

const NAV = [
  { path: '/web/studio/yonetim', label: 'Güncel Durum', icon: LayoutDashboard, exact: true },
  { path: '/web/studio/yonetim/domain-bagla', label: 'Domain Bağla', icon: Globe2 },
  { path: '/web/studio/yonetim/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { path: '/web/studio/yonetim/urunler', label: 'Ürünler', icon: ShoppingBag },
  { path: '/web/studio/yonetim/siparisler', label: 'Siparişler', icon: Package },
  { path: '/web/studio/yonetim/profil', label: 'Mağaza profili', icon: Store },
  { path: '/web/studio/yonetim/odeme', label: 'Ödeme ayarları', icon: CreditCard },
]

const studioPanelBg =
  'bg-[linear-gradient(155deg,#1d4ed8_0%,#2563eb_42%,#0ea5e9_100%)]'
const shellBg =
  'bg-[radial-gradient(700px_420px_at_10%_12%,rgba(52,211,153,0.08),transparent_60%),radial-gradient(820px_520px_at_92%_88%,rgba(96,165,250,0.12),transparent_62%),linear-gradient(180deg,#eff3fb_0%,#eef2f7_42%,#edf2f8_100%)]'
const glassCard =
  'rounded-[24px] border border-white/80 bg-[rgba(255,255,255,0.8)] shadow-[0_10px_35px_-18px_rgba(18,38,95,0.35)] backdrop-blur-[18px]'
const sectionCard =
  'rounded-[22px] border border-[#e6edf7] bg-white/84 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.32)]'
const statCard =
  'rounded-[18px] border border-[#e9eef8] bg-[linear-gradient(180deg,#ffffff,rgba(244,247,252,0.92))] px-4 py-3'
const softPill =
  'inline-flex items-center rounded-full border border-[#d8e2f0] bg-white/92 px-3 py-1 text-[11px] font-semibold text-[#203375]'

const STUDIO_TRANSITION_MS = 520
let keepStudioShell = false

function titleForPath(pathname) {
  return NAV.find((item) => item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`))?.label || 'Studio Yönetim'
}

function fmtDate(value) {
  if (!value) return 'Henüz yok'
  try {
    return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })
  } catch {
    return value
  }
}

function TopBtn({ children, dark = false }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
        dark
          ? 'border-[#E2BC0F]/40 bg-[#E2BC0F] text-white hover:bg-[#f0c922]'
          : 'border-white/20 bg-white text-[#203375] hover:bg-white/90'
      }`}
    >
      {children}
    </button>
  )
}

function SidebarLink({ item, active }) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 text-sm font-semibold transition-all ${
        active
          ? 'border-white/28 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(138,176,233,0.24))] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'border-transparent text-white/90 hover:border-white/15 hover:bg-white/10'
      }`}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-white ${active ? 'bg-white/14' : 'bg-white/12'}`}>
        <Icon className="h-4 w-4 text-white stroke-white" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function PanelTitle({ title, subtitle, actions }) {
  return (
    <div className={`${glassCard} px-5 py-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-bold tracking-[-0.03em] text-[#203375]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[#6c7896]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

function Stat({ label, value, hint, accent = 'text-[#203375]' }) {
  return (
    <div className={statCard}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{label}</p>
      <p className={`mt-1 text-[1.55rem] font-bold tracking-[-0.04em] ${accent}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#90a0b8]">{hint}</p> : null}
    </div>
  )
}

function RowCard({ title, subtitle, trailing }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[18px] border border-[#edf2f8] bg-white/88 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#203375]">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-[#8b97ad]">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
    </div>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e8edf6] text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[#edf2f7] last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-[#203375]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardPage({ primarySite, sites, pages }) {
  const connected = sites.filter((site) => site.domain).length
  return (
    <div className="space-y-5">
      <PanelTitle
        title="Güncel Durum"
        subtitle="Sipariş, stok, kasa ve müşteri operasyonunun anlık görünümü yerine burada site üretim hattınızın anlık görünümünü izlersiniz."
        actions={
          <>
            <span className={softPill}>Studio Yönetim</span>
            <button className="inline-flex items-center rounded-full bg-[#61b6f6] px-4 py-2 text-xs font-semibold text-white">+ Yeni sayfa</button>
          </>
        }
      />

      <div className={`${sectionCard} p-5`}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa6d7]">Operasyon kapasitesi</p>
            <h2 className="mt-1 text-[1.6rem] font-bold tracking-[-0.03em] text-[#203375]">Bugünkü yayın & tasarım dengesi</h2>
          </div>
          <p className="text-sm font-semibold text-[#7b87a3]">Kapasite skoru <span className="text-[#203375]">{pages.length ? '74%' : '0%'}</span></p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Toplam site" value={String(sites.length)} hint="Açılmış proje" />
          <Stat label="Bağlı domain" value={String(connected)} hint="Yayına hazır" accent="text-emerald-700" />
          <Stat label="Toplam sayfa" value={String(pages.length)} hint="Aktif içerik" />
          <Stat label="Aktif tasarım" value={primarySite?.name || 'Yok'} hint={primarySite?.domain || 'Önce domain bağlayın'} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.1fr_0.9fr]">
        <div className={`${sectionCard} p-4`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#203375]">Finans / Kasa Özeti tarzı Studio özeti</h3>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="space-y-2">
            <RowCard title="Ana sayfa revizyonu" subtitle="Hero, üst menü ve CTA blokları" trailing={<span className="text-xs font-semibold text-amber-700">Hazırlanıyor</span>} />
            <RowCard title="Domain kontrolü" subtitle={primarySite?.domain || 'Domain bekleniyor'} trailing={<span className="text-xs font-semibold text-emerald-700">Aktif</span>} />
            <RowCard title="İçerik bölümleri" subtitle={`${pages.length} sayfa düzenlenebilir`} trailing={<span className="text-xs font-semibold text-[#203375]">Canlı</span>} />
            <RowCard title="Son 7 gün yayın akışı" subtitle="Tasarım, onay ve yayın döngüsü" trailing={<span className="text-xs font-semibold text-[#203375]">Stabil</span>} />
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${sectionCard} p-4`}>
            <h3 className="text-sm font-bold text-[#203375]">Operasyon görevleri</h3>
            <div className="mt-3 space-y-2">
              <RowCard title="Domain kaydını tamamla" subtitle="DNS yönlendirmesini kontrol et" />
              <RowCard title="Yeni sayfa aç" subtitle="Landing, hakkımızda, iletişim" />
              <RowCard title="Canlı ön izleme" subtitle="Yayın öncesi son kontrol" />
            </div>
          </div>
          <div className={`${sectionCard} p-4`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#203375]">Son sayfalar</h3>
              <span className="text-xs font-semibold text-[#203375]">Detay</span>
            </div>
            <div className="space-y-2">
              {pages.length ? pages.slice(0, 4).map((page) => (
                <RowCard key={page.id} title={page.title} subtitle={`/${page.slug}`} trailing={<span className="text-xs text-[#8b97ad]">{fmtDate(page.updatedAt)}</span>} />
              )) : <p className="text-sm text-[#64748b]">Henüz sayfa yok.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DomainConnectPage({ sites, pages }) {
  return (
    <div className="space-y-5">
      <PanelTitle
        title="Domain Bağla"
        subtitle="Web sitelerinizi yönetin, domain bağlayın ve sayfa yapınızı tek akışta organize edin."
        actions={<button className="inline-flex items-center rounded-full bg-[#61b6f6] px-4 py-2 text-xs font-semibold text-white">+ Yeni site</button>}
      />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${sectionCard} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#203375]">Bağlı siteler</p>
              <p className="text-xs text-[#8b97ad]">{sites.length} proje</p>
            </div>
            <span className={softPill}>DNS Hazır</span>
          </div>
          <div className="space-y-2">
            {sites.length ? (
              sites.map((site) => (
                <RowCard
                  key={site.id}
                  title={site.name}
                  subtitle={site.domain || 'Domain bağlantısı bekleniyor'}
                  trailing={<span className="text-xs font-semibold text-[#203375]">{fmtDate(site.updatedAt)}</span>}
                />
              ))
            ) : (
              <p className="text-sm text-[#64748b]">Henüz oluşturulmuş site yok. İlk sitenizi oluşturup domain bağlantısını başlatın.</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${sectionCard} p-5`}>
            <h3 className="text-sm font-bold text-[#203375]">DNS kayıtları</h3>
            <div className="mt-3 space-y-2">
              <RowCard title="CNAME" subtitle="www → sites.bachmain.com" />
              <RowCard title="A Kaydı" subtitle="@ → 76.76.21.21" />
              <RowCard title="SSL" subtitle="Bağlantı sonrası otomatik hazırlanır" />
            </div>
          </div>
          <div className={`${sectionCard} p-5`}>
            <h3 className="text-sm font-bold text-[#203375]">İçerik özeti</h3>
            <div className="mt-3 grid gap-3">
              <Stat label="Toplam sayfa" value={String(pages.length)} />
              <Stat label="Yayına hazır site" value={String(sites.filter((site) => site.domain).length)} accent="text-emerald-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoriesPage({ pages }) {
  const menuRows = pages.length
    ? pages.slice(0, 5).map((page) => [page.title.toUpperCase(), page.slug])
    : [['ANA SAYFA', 'ana-sayfa'], ['KURUMSAL', 'kurumsal'], ['İLETİŞİM', 'iletisim']]
  return (
    <div className="space-y-5">
      <PanelTitle title="Kategoriler" subtitle="Soldan kategori seç → üst menü, açılır menü, banner ve filtre mantığında web menü kurgusunu yönet." />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_2.2fr]">
        <div className={`${sectionCard} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94a3b8]">Üst Menü</p>
            <button className="text-xs font-semibold text-[#203375]">+ Ekle</button>
          </div>
          <div className="space-y-2">
            {menuRows.map(([title]) => (
              <div key={title} className="rounded-[18px] border border-[#edf2f7] bg-white/90 px-4 py-3 text-sm font-semibold text-[#203375]">{title}</div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${sectionCard} p-4`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-[#203375]">Çikolata</p>
                <p className="text-xs text-[#94a3b8]">/kategoriler/cikolata</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={softPill}>Vitrin</span>
                <button className="rounded-full bg-[#61b6f6] px-4 py-2 text-xs font-semibold text-white">Kaydet</button>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['1', 'Üst menü başlığı', 'Büyük harf görünür, üst nav kartı'],
                ['2', 'Açılır menü (mega menü)', 'Grup başlığı + alt linkler + kısa içerik'],
                ['3', 'Kategori sayfası bannerı', 'Başlık, açıklama, görsel ve çipler'],
                ['4', 'Sayfa filtre paneli', 'Tümü, premium, fiyat, teslim, tema'],
              ].map(([index, title, desc]) => (
                <div key={index} className="rounded-[18px] border border-[#edf2f7] bg-white/92 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#203375] text-xs font-bold text-white">{index}</span>
                    <div>
                      <p className="text-sm font-bold text-[#203375]">{title}</p>
                      <p className="text-xs text-[#8b97ad]">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductsPage({ pages }) {
  const rows = pages.length
    ? pages.map((page, index) => [page.title, `/${page.slug}`, String((index + 1) * 2), 'Düzenle'])
    : [
        ['Ana Sayfa Hero', '/ana-sayfa', '6', 'Düzenle'],
        ['Kurumsal Blok', '/kurumsal', '4', 'Düzenle'],
        ['İletişim Formu', '/iletisim', '2', 'Düzenle'],
      ]
  return (
    <div className="space-y-5">
      <PanelTitle
        title="Ürünler"
        subtitle={`${rows.length} kayıt`}
        actions={<button className="rounded-full bg-[#61b6f6] px-4 py-2 text-xs font-semibold text-white">+ Yeni ürün</button>}
      />
      <div className={`${sectionCard} overflow-hidden`}>
        <DataTable columns={['Ürün', 'Slug', 'Stok', 'İşlem']} rows={rows} />
      </div>
    </div>
  )
}

function OrdersPage() {
  const rows = [
    ['DRP-953846', 'Test User', 'Havale', '₺1.290', 'Havale bekliyor'],
    ['DRP-953847', 'Demo Form', 'Teklif', '₺0', 'Yeni lead'],
  ]
  return (
    <div className="space-y-5">
      <PanelTitle title="Siparişler" subtitle="2 kayıt" />
      <div className={`${sectionCard} overflow-hidden`}>
        <DataTable columns={['No', 'Müşteri', 'Ödeme', 'Tutar', 'Durum']} rows={rows} />
      </div>
    </div>
  )
}

function ProfilePage({ primarySite }) {
  const fields = [
    ['Mağaza adı', primarySite?.name || 'BachMain Studio'],
    ['Slogan', 'Markanızı dijitalde akıllı şekilde büyütün'],
    ['E-posta', 'destek@bachmain.com'],
    ['Telefon', '0850 000 00 00'],
    ['Adres', 'İstanbul, Türkiye'],
    ['Instagram', 'https://instagram.com/bachmain'],
  ]
  return (
    <div className="space-y-5">
      <PanelTitle title="Mağaza profili" subtitle="Unvan, iletişim ve yasal metinler vitrine yansır." />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className={`${sectionCard} p-4`}>
          <div className="grid gap-3">
            {fields.map(([label, value]) => (
              <div key={label}>
                <p className="mb-1 text-xs font-semibold text-[#6c7896]">{label}</p>
                <div className="rounded-2xl border border-[#e9eef8] bg-white px-4 py-3 text-sm text-[#203375]">{value}</div>
              </div>
            ))}
            <div>
              <p className="mb-1 text-xs font-semibold text-[#6c7896]">Hakkımızda</p>
              <div className="rounded-2xl border border-[#e9eef8] bg-white px-4 py-4 text-sm leading-6 text-[#203375]">
                Markanızın öne çıkan hikayesini, değer önerisini ve ziyaretçiye vereceğiniz ilk güven sinyalini bu alanda kurgularsınız.
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${sectionCard} p-4`}>
            <h3 className="text-sm font-bold text-[#203375]">Profil durumu</h3>
            <div className="mt-3 space-y-2">
              <RowCard title="Logo alanı" subtitle="Hazır" />
              <RowCard title="İletişim bilgileri" subtitle="Tamamlandı" />
              <RowCard title="Sosyal bağlantılar" subtitle="1 kanal bağlı" />
            </div>
          </div>
          <div className={`${sectionCard} p-4`}>
            <h3 className="text-sm font-bold text-[#203375]">Bağlı domain</h3>
            <p className="mt-3 text-lg font-bold text-[#203375]">{primarySite?.domain || 'Domain bekleniyor'}</p>
            <p className="mt-1 text-xs text-[#8b97ad]">Son güncelleme: {fmtDate(primarySite?.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentPage({ primarySite, pages }) {
  return (
    <div className="space-y-5">
      <PanelTitle title="Ödeme ayarları" subtitle="Paket, yayın ve alan adı süreçlerini bu ekrandan yönetirsiniz." />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className={`${sectionCard} p-4`}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-[#203375]">Studio Planı</p>
              <div className="mt-2 rounded-2xl border border-[#e9eef8] bg-white px-4 py-3 text-sm text-[#203375]">Studio Pro</div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#203375]">Webhook URL</p>
              <div className="mt-2 rounded-2xl border border-[#e9eef8] bg-[#f6f9fd] px-4 py-3 text-xs text-[#6c7896]">https://studio.bachmain.com/api/publish/webhook</div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#203375]">Açıklama şablonu</p>
              <div className="mt-2 rounded-2xl border border-[#e9eef8] bg-white px-4 py-3 text-sm text-[#203375]">WEB-{primarySite?.name || 'SITE'}-{pages.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${sectionCard} p-4`}>
            <h3 className="text-sm font-bold text-[#203375]">Yayın durumu</h3>
            <div className="mt-3 grid gap-3">
              <Stat label="Alan adı" value={primarySite?.domain ? 'Aktif' : 'Bekliyor'} accent={primarySite?.domain ? 'text-emerald-700' : 'text-amber-700'} />
              <Stat label="Sayfa içeriği" value={pages.length ? 'Hazır' : 'Eksik'} accent={pages.length ? 'text-emerald-700' : 'text-amber-700'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderPage(pathname, primarySite, sites, pages) {
  switch (pathname) {
    case '/web/studio/yonetim/domain-bagla':
      return <DomainConnectPage sites={sites} pages={pages} />
    case '/web/studio/yonetim/kategoriler':
      return <CategoriesPage pages={pages} />
    case '/web/studio/yonetim/urunler':
      return <ProductsPage pages={pages} />
    case '/web/studio/yonetim/siparisler':
      return <OrdersPage />
    case '/web/studio/yonetim/profil':
      return <ProfilePage primarySite={primarySite} />
    case '/web/studio/yonetim/odeme':
      return <PaymentPage primarySite={primarySite} pages={pages} />
    default:
      return <DashboardPage primarySite={primarySite} sites={sites} pages={pages} />
  }
}

export default function WebStudioManagementPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [sites, setSites] = useState(() => getSites())
  const [entered, setEntered] = useState(() => keepStudioShell)
  const [exiting, setExiting] = useState(false)
  const [teamHubCollapsed, setTeamHubCollapsed] = useState(
    () => localStorage.getItem('bach-team-hub-panel') !== 'expanded',
  )

  function toggleTeamHub() {
    setTeamHubCollapsed((collapsed) => {
      const next = !collapsed
      localStorage.setItem('bach-team-hub-panel', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  useEffect(() => {
    keepStudioShell = true
    if (entered) return undefined
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [entered])

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

  function handleBackToApp(event) {
    event.preventDefault()
    if (exiting) return
    keepStudioShell = false
    setExiting(true)
    window.dispatchEvent(new CustomEvent('bach:studio-exit-start'))
    window.setTimeout(() => navigate('/'), STUDIO_TRANSITION_MS)
  }

  const shellState = exiting ? 'studio-shell--exiting' : entered ? 'studio-shell--entered' : ''

  return (
    <div className={`bach-admin studio-shell ${shellState} min-h-screen w-full ${shellBg} text-[#0f172a]`}>
      <aside className={`app-sidebar overflow-hidden fixed top-[var(--shell-gap)] left-[var(--shell-gap)] z-50 hidden h-[calc(100dvh-(2*var(--shell-gap)))] w-[var(--ds-sidebar-expanded,17.5rem)] flex-col rounded-[26px] border border-white/16 ${studioPanelBg} px-3 py-4 text-white shadow-[0_18px_44px_-18px_rgba(17,24,39,0.55)] lg:flex`}>
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_72%)]"
          aria-hidden
        />
        <div className="relative mb-5 flex flex-wrap items-center gap-2.5 px-1 pt-1">
          <img
            src={logoOnDark}
            alt="BACHMAIN"
            width={200}
            height={44}
            className="h-[2.35rem] w-auto object-contain"
            draggable={false}
          />
          <span className="inline-flex items-center rounded-full border border-white/28 bg-white/16 px-[0.85rem] py-[0.35rem] text-[0.8rem] font-bold tracking-[0.02em] text-white backdrop-blur-[8px]">
            Studio
          </span>
        </div>
        <nav className="relative flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`)
            return <SidebarLink key={item.path} item={item} active={active} />
          })}
        </nav>
        <div className="relative mt-4 rounded-2xl border border-white/80 bg-white p-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <img
              src={logoBusiness}
              alt="BACHMAIN"
              width={200}
              height={44}
              className="h-[2.35rem] w-auto object-contain"
              draggable={false}
            />
            <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-[0.85rem] py-[0.35rem] text-[0.8rem] font-bold tracking-[0.02em] text-[#1d4ed8]">
              Business
            </span>
          </div>
          <Link
            to="/"
            onClick={handleBackToApp}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Uygulamaya Dön
          </Link>
        </div>
      </aside>

      <div
        className="app-shell-content flex min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-page"
        data-sidebar-collapsed="false"
        data-teamhub-collapsed={teamHubCollapsed ? 'true' : 'false'}
      >
        <header className={`relative z-40 flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] shrink-0 items-center gap-3 overflow-hidden rounded-[26px] border border-white/14 ${studioPanelBg} px-4 py-2 text-white shadow-[0_16px_40px_-18px_rgba(15,23,42,0.55)] sm:px-6`}>
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_72%)]"
            aria-hidden
          />
          <div className="relative hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex lg:hidden">
            {NAV.map((item) => (
              <Link key={item.path} to={item.path} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${pathname === item.path || pathname.startsWith(`${item.path}/`) ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="relative ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Link to="/web/studio" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3 text-xs font-semibold text-white transition hover:bg-white/25 lg:hidden">
              <ChevronLeft className="h-4 w-4" />
              Domain Bağla
            </Link>
            <TopBtn><Eye className="h-3.5 w-3.5 text-[#203375]" />Ön izleme</TopBtn>
            <a href={primarySite?.domain || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white px-3 text-xs font-semibold text-[#203375] transition hover:bg-white/90">
              <ExternalLink className="h-3.5 w-3.5 text-[#203375]" />Canlı vitrine git
            </a>
            <TopBtn dark><Rocket className="h-3.5 w-3.5 text-white" />Kaydet ve canlıya taşı</TopBtn>
          </div>
        </header>

        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-1 lg:hidden">
          {NAV.map((item) => (
            <Link key={item.path} to={item.path} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${pathname === item.path || pathname.startsWith(`${item.path}/`) ? 'bg-[#203375] text-white' : 'border border-[#d8e2f0] bg-white/80 text-[#203375]'}`}>
              {item.label}
            </Link>
          ))}
        </div>

        <main className="app-responsive min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 sm:px-4 lg:px-0">
          {renderPage(pathname, primarySite, sites, pages)}
        </main>
      </div>

      <TeamHubPanel collapsed={teamHubCollapsed} onToggle={toggleTeamHub} />
    </div>
  )
}
