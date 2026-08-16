import { useEffect, useState } from 'react'
import { Megaphone, Sparkles } from 'lucide-react'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../components/Layout/AppPageLayout'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
} from '../utils/dashboardDesign'
import {
  fetchProductUpdates,
  filterChannel,
  getUnreadIds,
  markChannelSeen,
  readUpdatesCache,
  UNREAD_PILL_CLASS,
  UPDATE_CHANNELS,
} from '../utils/productUpdates'

const BADGE_CLASS = {
  Yeni: 'bg-emerald-500/15 text-emerald-700',
  Güncelleme: 'bg-cyan-500/15 text-cyan-700',
  Duyuru: 'bg-blue-500/15 text-blue-700',
  Özellik: 'bg-purple-500/15 text-purple-700',
  Fiyat: 'bg-orange-500/15 text-orange-700',
}

export default function AnnouncementsPage() {
  const cached = readUpdatesCache()
  const [version, setVersion] = useState(cached.version)
  const [items, setItems] = useState(() => filterChannel(cached.items, UPDATE_CHANNELS.feature))
  const [freshIds, setFreshIds] = useState(
    () => new Set(getUnreadIds(cached.items, UPDATE_CHANNELS.feature)),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchProductUpdates()
      .then((payload) => {
        if (cancelled) return
        setVersion(payload.version)
        const next = filterChannel(payload.items, UPDATE_CHANNELS.feature)
        setFreshIds(new Set(getUnreadIds(payload.items, UPDATE_CHANNELS.feature)))
        setItems(next)
        markChannelSeen(payload.items, UPDATE_CHANNELS.feature)
      })
      .catch(() => {
        if (cancelled) return
        const fallback = filterChannel(readUpdatesCache().items, UPDATE_CHANNELS.feature)
        setFreshIds(new Set(getUnreadIds(readUpdatesCache().items, UPDATE_CHANNELS.feature)))
        setItems(fallback)
        markChannelSeen(fallback, UPDATE_CHANNELS.feature)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="YENİ ÖZELLİKLER VE DUYURULAR"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />

      <AppPagePanel className="customer-list-panel w-full">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={APP_PANEL_TITLE_CLASS}>Sürüm notları</h2>
            <p className={`mt-1 ${YF_TEXT_CLASS}`}>
              Her yeni özellik yayınlandığında sürüm numarası otomatik artar. Aşağıda kod ve detay
              yer alır.
            </p>
          </div>
          <span className="rounded-xl border border-[var(--glass-border)] px-3 py-1.5 text-[14px] font-bold text-[var(--muted)]">
            Sürüm {version}
          </span>
        </div>

        {loading ? <p className={YF_TEXT_CLASS}>Duyurular yükleniyor…</p> : null}

        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(140,145,165,0.14)] text-[var(--muted)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-bold leading-tight text-[var(--muted)]">
                      {item.title}
                    </h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${
                        BADGE_CLASS[item.badge] || BADGE_CLASS.Duyuru
                      }`}
                    >
                      {item.badge}
                    </span>
                    {item.code ? (
                      <span className="rounded-md bg-black/5 px-2 py-0.5 font-mono text-[12px] font-bold text-[var(--muted)]">
                        {item.code}
                      </span>
                    ) : null}
                    {freshIds.has(item.id) ? <span className={UNREAD_PILL_CLASS}>Yeni</span> : null}
                  </div>
                  <p className={`mt-2 whitespace-pre-line ${YF_TEXT_CLASS}`}>
                    {item.body || item.detail}
                  </p>
                  <p className={`mt-3 flex items-center gap-1 ${YF_TEXT_CLASS}`}>
                    <Megaphone className="h-3.5 w-3.5" />
                    {item.date}
                    {item.version ? ` · v${item.version}` : ''}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
