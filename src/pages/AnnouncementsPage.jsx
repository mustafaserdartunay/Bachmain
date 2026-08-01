import { useEffect, useState } from 'react'
import { Megaphone, Sparkles } from 'lucide-react'

const PLATFORM_API = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'
const CACHE_KEY = 'bachmain_announcements_cache_v1'

const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Müşteri Ekstre PDF Yenilendi',
    date: '05.06.2026',
    badge: 'Yeni',
    detail:
      'Cari hareketler sayfasından gönderilen ekstre PDF artık firma logonuz, IBAN bilgileriniz ve modern renk tonlarıyla oluşturuluyor.',
  },
  {
    id: 'ann-2',
    title: 'Tahsilat ve Ödeme Modülü',
    date: '04.06.2026',
    badge: 'Güncelleme',
    detail:
      'Müşteri detayında tahsilat ve ödeme işlemleri kasa/banka seçimiyle cari hareketlere işleniyor. İşlem yeri kolonu eklendi.',
  },
  {
    id: 'ann-3',
    title: 'Profil ve Müşteri Numarası',
    date: '03.06.2026',
    badge: 'Duyuru',
    detail:
      'Her firma için benzersiz müşteri numarası otomatik oluşturuluyor. Yönetici kontrol panelinden destek ekibi erişebilir.',
  },
  {
    id: 'ann-4',
    title: 'Düzenlenebilir Açılır Menüler',
    date: '02.06.2026',
    badge: 'Özellik',
    detail:
      'Tip, temsilci, puantaj, kategori ve kasa/banka listelerine yeni seçenek ekleyebilir, düzenleyebilir ve silebilirsiniz.',
  },
]

const BADGE_CLASS = {
  Yeni: 'bg-emerald-500/15 text-emerald-300',
  Güncelleme: 'bg-cyan-500/15 text-cyan-300',
  Duyuru: 'bg-blue-500/15 text-blue-300',
  Özellik: 'bg-purple-500/15 text-purple-300',
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.items) ? parsed.items : null
  } catch {
    return null
  }
}

function writeCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, at: Date.now() }))
  } catch {
    /* ignore */
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    id: item.id,
    title: item.title || '',
    detail: item.detail || '',
    badge: item.badge || 'Duyuru',
    date: item.date || '',
    badgeClass: BADGE_CLASS[item.badge] || BADGE_CLASS.Duyuru,
  }))
}

export default function AnnouncementsPage() {
  const cached = readCache()
  const [announcements, setAnnouncements] = useState(() =>
    normalizeItems(cached || FALLBACK_ANNOUNCEMENTS),
  )
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${PLATFORM_API}/announcements`, {
          credentials: 'omit',
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const items = normalizeItems(data.items || [])
        if (!cancelled && items.length) {
          setAnnouncements(items)
          writeCache(items)
        }
      } catch {
        if (!cancelled && !cached) {
          setAnnouncements(normalizeItems(FALLBACK_ANNOUNCEMENTS))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">
          Yeni Özellikler ve Duyurular
        </h1>
        <p className="mt-2 text-xs font-semibold text-gray-500">
          Sistem güncellemeleri ve yeni modüller burada listelenir.
        </p>
      </section>

      {loading ? (
        <p className="text-center text-xs font-semibold text-gray-500">Duyurular yükleniyor…</p>
      ) : null}

      <div className="space-y-3">
        {announcements.map((item) => (
          <article key={item.id} className="card">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-amber-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black uppercase tracking-wide text-white">
                    {item.title}
                  </h2>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[12px] font-black uppercase ${item.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-gray-400">{item.detail}</p>
                <p className="mt-3 flex items-center gap-1 text-[13px] font-bold text-gray-500">
                  <Megaphone className="h-3 w-3" />
                  {item.date}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
