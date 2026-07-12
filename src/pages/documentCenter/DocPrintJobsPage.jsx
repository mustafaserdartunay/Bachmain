import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { clearPrintJobs, loadPrintJobs } from '../../utils/docPrintJobsStore'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('tr-TR')
  } catch {
    return iso
  }
}

export default function DocPrintJobsPage() {
  const [tick, setTick] = useState(0)
  const jobs = useMemo(() => loadPrintJobs(), [tick])

  async function handleClear() {
    if (!window.confirm('Tüm yazdırma kayıtları silinsin mi?')) return
    clearPrintJobs()
    await flushWorkspaceNow()
    setTick((n) => n + 1)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yazdırma Kayıtları"
        actions={(
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-black uppercase text-red-300"
          >
            <Trash2 className="h-4 w-4" /> Temizle
          </button>
        )}
      />

      <section className="card overflow-hidden p-0">
        {jobs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-semibold text-gray-500">Henüz yazdırma kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dark-500/40 bg-dark-700/40 text-[11px] font-black uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Zaman</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3">Belge</th>
                  <th className="px-4 py-3">Şablon / Etiket</th>
                  <th className="px-4 py-3">Kullanıcı</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-dark-500/30">
                    <td className="px-4 py-3 font-semibold text-gray-300">{formatWhen(job.printedAt)}</td>
                    <td className="px-4 py-3 font-bold uppercase text-blue-300">{job.kind}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {job.docType || '—'}{job.documentId ? ` · ${job.documentId}` : ''}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-300">
                      {job.templateName || job.labelName || job.templateId || job.labelId || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{job.userEmail || '—'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-300">{job.status || 'ok'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppPageShell>
  )
}
