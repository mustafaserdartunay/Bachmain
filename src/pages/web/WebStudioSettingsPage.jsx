import { Link } from 'react-router-dom'
import { Globe2, Settings2 } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  WEB_STUDIO_DOMAIN_CONNECT_PATH,
  WEB_STUDIO_MANAGEMENT_PATH,
} from '../../data/webMenu'
import { getPages, getSites } from '../../utils/webSiteStorage'

export default function WebStudioSettingsPage() {
  const sites = getSites()
  const pages = getPages()
  const connected = sites.filter((site) => site.domain).length

  return (
    <AppPageShell>
      <AppPageHeader title="Ayarlar" backTo={WEB_STUDIO_MANAGEMENT_PATH} backLabel="Güncel Durum" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Link
          to={WEB_STUDIO_DOMAIN_CONNECT_PATH}
          className="card flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-white/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
              <Globe2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--ink)]">Domain bağla</p>
              <p className="text-[12px] font-semibold text-[var(--muted)]">
                DNS kayıtları, SSL ve alan adı yönlendirmesini yönetin.
              </p>
            </div>
          </div>
          <span className="text-[12px] font-extrabold text-blue-600">Aç</span>
        </Link>

        <div className="card px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
              <Settings2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-[var(--ink)]">Yayın özeti</p>
              <p className="text-[12px] font-semibold text-[var(--muted)]">
                {sites.length} site · {connected} domain · {pages.length} sayfa
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppPageShell>
  )
}
