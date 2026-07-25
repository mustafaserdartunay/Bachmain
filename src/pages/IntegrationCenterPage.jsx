import { useEffect, useMemo, useState } from 'react'
import { Cable, Search } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import PlatformConnectionCard from '../components/Integrations/PlatformConnectionCard'
import ConnectionWizard from '../components/Integrations/ConnectionWizard'
import ManageConnectionPanel from '../components/Integrations/ManageConnectionPanel'
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_PLATFORMS,
  listPlatformsByCategory,
} from '../integrations/catalog'
import {
  listConnections,
  overviewStats,
  subscribeIntegrations,
  syncPlatform,
} from '../integrations/connectionStore'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

export default function IntegrationCenterPage({
  title = 'Entegrasyon Merkezi',
  subtitle = 'API anahtarı olmadan OAuth ile bağlanın — BachMain teknik detayları yönetir.',
  platformsFilter = null,
  backTo = '/',
  backLabel = 'Başa dön',
}) {
  const [tick, setTick] = useState(0)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [wizardPlatform, setWizardPlatform] = useState(null)
  const [managePlatform, setManagePlatform] = useState(null)

  useEffect(() => subscribeIntegrations(() => setTick((n) => n + 1)), [])

  const connections = useMemo(() => listConnections(), [tick])
  const stats = useMemo(() => overviewStats(), [tick])

  const platforms = useMemo(() => {
    let list = platformsFilter
      ? INTEGRATION_PLATFORMS.filter(platformsFilter)
      : listPlatformsByCategory(category)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.id.includes(q))
    return list
  }, [category, query, platformsFilter, tick])

  function handleManage(platform, action) {
    if (action === 'sync') {
      syncPlatform(platform.id)
      setTick((n) => n + 1)
      return
    }
    setManagePlatform(platform)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={title}
        subtitle={subtitle}
        backTo={backTo}
        backLabel={backLabel}
        titleClassName="text-[#38bdf8]"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Bağlı', value: stats.connected },
          { label: 'Webhook Aktif', value: stats.webhookActive },
          { label: 'Süresi Yaklaşan', value: stats.expiringSoon },
          { label: 'Toplam Mesaj', value: stats.totalMessages },
        ].map((k) => (
          <div key={k.label} className={`${APP_SURFACE_PANEL_CLASS} p-3`}>
            <p className="text-[10px] font-black uppercase text-[var(--muted)]">{k.label}</p>
            <p className="mt-1 text-xl font-black tabular-nums text-[var(--ink)]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!platformsFilter ? (
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
              Tümü
            </FilterChip>
            {INTEGRATION_CATEGORIES.map((c) => (
              <FilterChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </FilterChip>
            ))}
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <Cable className="h-3.5 w-3.5" />
            Social Message Center bağlantıları
          </p>
        )}
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Platform ara…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-sky-500/40"
          />
        </label>
      </div>

      {managePlatform ? (
        <ManageConnectionPanel
          platform={managePlatform}
          connection={connections[managePlatform.id]}
          onClose={() => setManagePlatform(null)}
          onChanged={() => setTick((n) => n + 1)}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => (
          <PlatformConnectionCard
            key={platform.id}
            platform={platform}
            connection={connections[platform.id]}
            onConnect={setWizardPlatform}
            onManage={handleManage}
          />
        ))}
      </div>

      {platforms.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">Eşleşen platform yok.</p>
      ) : null}

      <ConnectionWizard
        open={Boolean(wizardPlatform)}
        platform={wizardPlatform}
        onClose={() => setWizardPlatform(null)}
        onComplete={() => {
          setTick((n) => n + 1)
        }}
      />
    </AppPageShell>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
        active
          ? 'border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-200'
          : 'border-white/10 text-[var(--muted)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
    </button>
  )
}
