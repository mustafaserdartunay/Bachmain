import { useEffect, useState } from 'react'
import { Globe2, Link2, Plus } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import { WEB_STUDIO_SETTINGS_PATH } from '../../data/webMenu'
import { APP_LABEL_CLASS, APP_METRIC_ROW_CLASS, APP_VALUE_CLASS, YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import { getPages, getSites } from '../../utils/webSiteStorage'

function formatWhen(value) {
  if (!value) return 'Henüz yok'
  try {
    return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })
  } catch {
    return value
  }
}

export default function WebStudioDomainConnectPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:web-sites-updated', refresh)
    window.addEventListener('bach:web-pages-updated', refresh)
    return () => {
      window.removeEventListener('bach:web-sites-updated', refresh)
      window.removeEventListener('bach:web-pages-updated', refresh)
    }
  }, [])

  void tick
  const sites = getSites()
  const pages = getPages()
  const connected = sites.filter((site) => site.domain).length

  return (
    <AppPageShell>
      <AppPageHeader
        title="Domain bağla"
        backTo={WEB_STUDIO_SETTINGS_PATH}
        backLabel="Ayarlar"
        actions={
          <button type="button" className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}>
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Plus className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>Yeni site</span>
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AppPagePanel title="Bağlı siteler" description={`${sites.length} proje · ${connected} domain aktif`}>
          {sites.length ? (
            <div className="flex flex-col gap-1">
              {sites.map((site) => (
                <div key={site.id} className={APP_METRIC_ROW_CLASS}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className={APP_LABEL_CLASS}>{site.name}</span>
                  </span>
                  <span className={`${APP_VALUE_CLASS} ${site.domain ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {site.domain || 'Domain bekliyor'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-1 py-4 text-center text-[12px] font-semibold text-[var(--muted)]">
              Henüz site yok. İlk sitenizi oluşturup domain bağlantısını başlatın.
            </p>
          )}
        </AppPagePanel>

        <div className="space-y-4">
          <AppPagePanel title="DNS kayıtları">
            <div className="flex flex-col gap-1">
              <div className={APP_METRIC_ROW_CLASS}>
                <span className={APP_LABEL_CLASS}>CNAME</span>
                <span className={`${APP_VALUE_CLASS} text-[var(--muted)]`}>www → sites.bachmain.com</span>
              </div>
              <div className={APP_METRIC_ROW_CLASS}>
                <span className={APP_LABEL_CLASS}>A kaydı</span>
                <span className={`${APP_VALUE_CLASS} text-[var(--muted)]`}>@ → 76.76.21.21</span>
              </div>
              <div className={APP_METRIC_ROW_CLASS}>
                <span className={APP_LABEL_CLASS}>SSL</span>
                <span className={`${APP_VALUE_CLASS} text-emerald-600`}>Otomatik</span>
              </div>
            </div>
          </AppPagePanel>

          <AppPagePanel title="İçerik özeti">
            <div className="flex flex-col gap-1">
              <div className={APP_METRIC_ROW_CLASS}>
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span className={APP_LABEL_CLASS}>Toplam sayfa</span>
                </span>
                <span className={APP_VALUE_CLASS}>{pages.length}</span>
              </div>
              <div className={APP_METRIC_ROW_CLASS}>
                <span className={APP_LABEL_CLASS}>Yayına hazır site</span>
                <span className={`${APP_VALUE_CLASS} text-emerald-600`}>{connected}</span>
              </div>
              {sites[0] ? (
                <div className={APP_METRIC_ROW_CLASS}>
                  <span className={APP_LABEL_CLASS}>Son güncelleme</span>
                  <span className={`${APP_VALUE_CLASS} text-[var(--muted)]`}>
                    {formatWhen(sites[0].updatedAt)}
                  </span>
                </div>
              ) : null}
            </div>
          </AppPagePanel>
        </div>
      </div>
    </AppPageShell>
  )
}
