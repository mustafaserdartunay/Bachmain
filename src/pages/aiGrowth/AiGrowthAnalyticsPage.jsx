import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  readAiGrowthLibrary,
  summarizeAiGrowthUsage,
  readAiGrowthUsage,
} from '../../utils/aiGrowthSettings'

export default function AiGrowthAnalyticsPage() {
  const library = readAiGrowthLibrary().items || []
  const usage = summarizeAiGrowthUsage(readAiGrowthUsage().entries || [])
  const byType = library.reduce((acc, item) => {
    acc[item.type || 'other'] = (acc[item.type || 'other'] || 0) + 1
    return acc
  }, {})

  return (
    <AppPageShell>
      <AppPageHeader title="Analitik" backTo="/ai-buyume" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs text-[var(--muted)]">Toplam üretim</p>
          <p className="mt-2 text-[28px] font-bold">{library.length}</p>
        </div>
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs text-[var(--muted)]">Aylık token</p>
          <p className="mt-2 text-[28px] font-bold">{usage.monthTokens.toLocaleString('tr-TR')}</p>
        </div>
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs text-[var(--muted)]">Aylık maliyet</p>
          <p className="mt-2 text-[28px] font-bold">${usage.monthCostUsd.toFixed(2)}</p>
        </div>
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs text-[var(--muted)]">En iyi saat önerisi</p>
          <p className="mt-2 text-[20px] font-bold">09:00 – 11:00</p>
        </div>
      </div>
      <AppPagePanel title="İçerik tipine göre">
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between rounded-xl border border-dark-500/40 px-3 py-2 text-sm">
              <span>{type}</span>
              <strong>{count}</strong>
            </div>
          ))}
          {Object.keys(byType).length === 0 ? <p className="text-sm text-[var(--muted)]">Henüz analitik veri yok.</p> : null}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          AI önerisi: LinkedIn ve Instagram için hafta içi sabah paylaşımları; Cuma blog + newsletter otomasyonu.
        </p>
      </AppPagePanel>
    </AppPageShell>
  )
}
