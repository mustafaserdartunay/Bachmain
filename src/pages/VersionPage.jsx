import { AppPageHeader, AppPageShell, AppPagePanel } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { APP_VERSION, readVersionTransitions } from '../version/appVersion'
import { getVersionHistory } from '../version/versionHistory'

function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

export default function VersionPage() {
  const history = getVersionHistory()
  const transitions = readVersionTransitions()

  return (
    <AppPageShell>
      <AppPageHeader title="Sürüm geçmişi" backTo="/" />

      <AppPagePanel
        title="Aktif sürüm"
        description="Sol menüdeki etiket ile aynı kod. Ay: ay numarası + yılın son iki hanesi (ör. 726 = Temmuz 2026)."
        className={APP_SURFACE_PANEL_CLASS}
        dotColor="blue"
      >
        <p className="font-mono text-2xl font-semibold tracking-tight text-[var(--text)]">
          {APP_VERSION}
        </p>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          Format: BM-V&#123;major&#125;.&#123;ay&#125;&#123;yy&#125; — örnek BM-V1.726
        </p>
      </AppPagePanel>

      <AppPagePanel
        title="Bu cihazda geçişler"
        description="Uygulama yenilendiğinde hangi sürümden hangisine geçildiği (saat ile). Üye verileri silinmez."
        className={APP_SURFACE_PANEL_CLASS}
        dotColor="green"
      >
        {transitions.length === 0 ? (
          <p className="text-[13px] text-[var(--muted)]">
            Henüz kayıtlı geçiş yok. İlk kurulum veya bu sürümle açıldı.
          </p>
        ) : (
          <ul className="space-y-3">
            {transitions.map((row) => (
              <li
                key={`${row.at}-${row.from}-${row.to}`}
                className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface-2,transparent)] px-3 py-2.5"
              >
                <p className="font-mono text-[13px] font-semibold text-[var(--text)]">
                  {row.from} → {row.to}
                </p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">{formatDateTime(row.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </AppPagePanel>

      <AppPagePanel
        title="Yayın notları"
        description="Her sürümde bir öncekine göre eklenen modüller."
        className={APP_SURFACE_PANEL_CLASS}
        dotColor="violet"
      >
        <div className="space-y-5">
          {history.map((entry) => (
            <article
              key={entry.version}
              className="rounded-xl border border-[var(--border)]/60 px-3 py-3 sm:px-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-mono text-[15px] font-bold text-[var(--text)]">
                  {entry.version}
                </h3>
                <time className="text-[12px] text-[var(--muted)]" dateTime={entry.releasedAt}>
                  {formatDateTime(entry.releasedAt)}
                </time>
              </div>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                {entry.previousVersion
                  ? `Geçiş: ${entry.previousVersion} → ${entry.version}`
                  : 'Başlangıç sürümü'}
                {entry.title ? ` · ${entry.title}` : ''}
              </p>
              <ul className="mt-3 space-y-2.5">
                {(entry.modules || []).map((mod) => (
                  <li key={mod.name} className="text-[13px] leading-snug">
                    <span className="font-semibold text-[var(--text)]">{mod.name}</span>
                    {mod.detail ? (
                      <span className="text-[var(--muted)]"> — {mod.detail}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
