import { AppPageHeader, AppPageShell, AppPagePanel } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { APP_VERSION, readVersionTransitions } from '../version/appVersion'
import { getCurrentVersionCategories, getVersionHistory } from '../version/versionHistory'

function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function FeatureCategories({ categories }) {
  if (!categories?.length) return null
  return (
    <div className="space-y-5">
      {categories.map((category) => (
        <section key={category.title}>
          <h3 className="mb-2.5 text-[13px] font-black uppercase tracking-wider text-[var(--muted)]">
            {category.title}
          </h3>
          <ul className="space-y-2">
            {(category.features || []).map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-[var(--border)]/60 px-3 py-2.5"
              >
                <p className="text-[13px] font-semibold text-[var(--text)]">{feature.title}</p>
                {feature.detail ? (
                  <p className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
                    {feature.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function VersionPage() {
  const categories = getCurrentVersionCategories()
  const history = getVersionHistory()
  const transitions = readVersionTransitions()
  const priorReleases = history.filter((entry) => entry.version !== APP_VERSION)

  return (
    <AppPageShell>
      <AppPageHeader title={APP_VERSION} backTo="/" />

      <AppPagePanel
        title="Bu sürümdeki özellikler"
        className={APP_SURFACE_PANEL_CLASS}
        dotColor="blue"
      >
        <FeatureCategories categories={categories} />
      </AppPagePanel>

      {priorReleases.length > 0 ? (
        <AppPagePanel
          title="Önceki sürüm geçişleri"
          className={APP_SURFACE_PANEL_CLASS}
          dotColor="violet"
        >
          <div className="space-y-6">
            {priorReleases.map((entry) => (
              <article key={entry.version}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-mono text-[15px] font-bold text-[var(--text)]">
                    {entry.previousVersion
                      ? `${entry.previousVersion} → ${entry.version}`
                      : entry.version}
                  </h3>
                  <time className="text-[12px] text-[var(--muted)]" dateTime={entry.releasedAt}>
                    {formatDateTime(entry.releasedAt)}
                  </time>
                </div>
                {entry.title ? (
                  <p className="mb-3 text-[13px] font-semibold text-[var(--text)]">{entry.title}</p>
                ) : null}
                <FeatureCategories categories={entry.categories} />
              </article>
            ))}
          </div>
        </AppPagePanel>
      ) : null}

      {transitions.length > 0 ? (
        <AppPagePanel
          title="Bu cihazda güncellemeler"
          className={APP_SURFACE_PANEL_CLASS}
          dotColor="green"
        >
          <ul className="space-y-3">
            {transitions.map((row) => (
              <li
                key={`${row.at}-${row.from}-${row.to}`}
                className="rounded-xl border border-[var(--border)]/60 px-3 py-2.5"
              >
                <p className="font-mono text-[13px] font-semibold text-[var(--text)]">
                  {row.from} → {row.to}
                </p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">{formatDateTime(row.at)}</p>
              </li>
            ))}
          </ul>
        </AppPagePanel>
      ) : null}
    </AppPageShell>
  )
}
