import { useEffect, useState } from 'react'
import { ExternalLink, GraduationCap, PlayCircle, Sparkles } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import FormSectionPanel from '../components/Common/FormSectionPanel'
import { APP_METRIC_ROW_CLASS, APP_SUBLABEL_CLASS, YF_TEXT_CLASS } from '../utils/dashboardDesign'
import { openTrainingVideo, TRAINING_SECTIONS } from '../data/trainingMenu'
import { requestGuidedTourStart } from '../components/Onboarding/guidedTourStorage'
import {
  fetchProductUpdates,
  filterChannel,
  getUnreadIds,
  markChannelSeen,
  readUpdatesCache,
  UNREAD_PILL_CLASS,
  UPDATE_CHANNELS,
} from '../utils/productUpdates'

function TrainingVideoRow({ item }) {
  return (
    <button
      type="button"
      onClick={() => openTrainingVideo(item)}
      className={`${APP_METRIC_ROW_CLASS} glass-inset-hover !min-h-[2.75rem] w-full cursor-pointer !justify-between gap-3 !px-3 !py-2 text-left`}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-[var(--ink)]">{item.label}</p>
        <p className="truncate text-[12px] font-semibold text-[var(--muted)]">YouTube eğitim videosu</p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-[var(--purple2)]">
        <PlayCircle className="h-4 w-4" />
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </span>
    </button>
  )
}

export default function TrainingPage() {
  const cachedItems = readUpdatesCache().items
  const [notices, setNotices] = useState(() =>
    filterChannel(cachedItems, UPDATE_CHANNELS.training),
  )
  const [freshIds, setFreshIds] = useState(
    () => new Set(getUnreadIds(cachedItems, UPDATE_CHANNELS.training)),
  )

  useEffect(() => {
    let cancelled = false
    fetchProductUpdates()
      .then((payload) => {
        if (cancelled) return
        const next = filterChannel(payload.items, UPDATE_CHANNELS.training)
        setFreshIds(new Set(getUnreadIds(payload.items, UPDATE_CHANNELS.training)))
        setNotices(next)
        markChannelSeen(payload.items, UPDATE_CHANNELS.training)
      })
      .catch(() => {
        if (!cancelled) markChannelSeen(notices, UPDATE_CHANNELS.training)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppPageShell>
      <AppPageHeader title="Eğitim" />

      <AppPagePanel
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563eb]" />
            Canlı uygulama turu
          </span>
        }
        description="Yeni üye akışı: profil ve logo, müşteri girişi, ürün girişi, ardından teklif süreci. Ekran üzerinde animasyonlu anlatılır."
        dotColor="blue"
      >
        <button
          type="button"
          onClick={() => requestGuidedTourStart()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25"
        >
          Turu başlat
        </button>
      </AppPagePanel>

      {notices.length ? (
        <AppPagePanel
          title={
            <span className="inline-flex items-center gap-2">
              Yeni eğitim videoları
              {freshIds.size ? (
                <span className={UNREAD_PILL_CLASS}>{freshIds.size > 9 ? '9+' : freshIds.size}</span>
              ) : null}
            </span>
          }
          description="Yönetim panelinden eklenen her yeni video burada bildirim olarak görünür."
          dotColor="orange"
        >
          <div className="space-y-2">
            {notices.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--glass-border)] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-bold text-[var(--muted)]">{item.title}</p>
                  {item.code ? (
                    <span className="rounded-md bg-black/5 px-2 py-0.5 font-mono text-[12px] font-bold text-[var(--muted)]">
                      {item.code}
                    </span>
                  ) : null}
                  {freshIds.has(item.id) ? <span className={UNREAD_PILL_CLASS}>Yeni</span> : null}
                </div>
                <p className={`mt-1 whitespace-pre-line ${YF_TEXT_CLASS}`}>
                  {item.body || item.detail}
                </p>
                {item.videoUrl ? (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[14px] font-bold text-[#2563eb]"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {item.videoTitle || 'Videoyu aç'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </AppPagePanel>
      ) : null}

      <AppPagePanel
        title="Modül Eğitimleri"
        description="Sol menüdeki başlıklar altında ilgili sayfa eğitimlerini bulun. Bir başlığa tıklayınca YouTube'da eğitim videosu açılır."
        dotColor="violet"
      >
        <div className="space-y-4">
          {TRAINING_SECTIONS.map((section) => (
            <FormSectionPanel key={section.id} icon={GraduationCap} title={section.title} dotColor="blue">
              <p className={APP_SUBLABEL_CLASS}>
                {section.items.length} eğitim videosu
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <TrainingVideoRow key={`${section.id}-${item.path}-${item.label}`} item={item} />
                ))}
              </div>
            </FormSectionPanel>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
