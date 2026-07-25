import { useMemo, useState } from 'react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { listLogs, formatRelativeTr } from '../integrations/connectionStore'
import { getPlatformById } from '../integrations/catalog'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

export default function IntegrationLogsPage() {
  const [platformFilter, setPlatformFilter] = useState('')
  const logs = useMemo(
    () => listLogs({ platformId: platformFilter || undefined, limit: 100 }),
    [platformFilter],
  )

  return (
    <AppPageShell>
      <AppPageHeader
        title="Entegrasyon Logları"
        subtitle="OAuth, webhook ve API işlem geçmişi"
        backTo="/entegrasyon"
        backLabel="Entegrasyon"
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} overflow-x-auto p-0`}>
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <label className="text-[10px] font-black uppercase text-[var(--muted)]">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs font-semibold text-[var(--ink)]"
          >
            <option value="">Tümü</option>
            {[...new Set(logs.map((l) => l.platformId))].map((id) => (
              <option key={id} value={id}>
                {getPlatformById(id)?.title || id}
              </option>
            ))}
          </select>
        </div>
        <table className="min-w-full text-left text-[11px]">
          <thead className="border-b border-white/10 text-[10px] font-black uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Platform</th>
              <th className="px-4 py-2">İşlem</th>
              <th className="px-4 py-2">Durum</th>
              <th className="px-4 py-2">HTTP</th>
              <th className="px-4 py-2">Süre</th>
              <th className="px-4 py-2">Detay</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                  Henüz log yok. Bir platform bağlayınca burada görünecek.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="whitespace-nowrap px-4 py-2 font-semibold text-[var(--ink)]">
                    {formatRelativeTr(log.at)}
                  </td>
                  <td className="px-4 py-2 font-bold">
                    {getPlatformById(log.platformId)?.title || log.platformId}
                  </td>
                  <td className="px-4 py-2">{log.action}</td>
                  <td
                    className={`px-4 py-2 font-black ${log.success ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {log.success ? 'Başarılı' : 'Başarısız'}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{log.httpCode}</td>
                  <td className="px-4 py-2 tabular-nums">{log.durationMs} ms</td>
                  <td className="max-w-[220px] truncate px-4 py-2 text-[var(--muted)]">
                    {log.detail}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppPageShell>
  )
}
