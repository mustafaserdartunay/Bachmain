import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, PenLine, Trash2 } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import DeletedRecordsPanel from '../../components/Common/DeletedRecordsPanel'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import {
  DOC_TEMPLATES_EVENT,
  loadDocTemplates,
  softDeleteDocTemplate,
  restoreDocTemplate,
} from '../../utils/docTemplatesStore'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { appendActivityEntry } from '../../utils/activityArchiveStore'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

export default function DocTemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState(loadDocTemplates)

  useEffect(() => {
    function refresh() {
      setTemplates(loadDocTemplates())
    }
    window.addEventListener(DOC_TEMPLATES_EVENT, refresh)
    return () => window.removeEventListener(DOC_TEMPLATES_EVENT, refresh)
  }, [])

  function handleDelete(template) {
    if (!window.confirm(`"${template.name}" silinenlere taşınsın mı?`)) return
    softDeleteDocTemplate(template.id)
    appendActivityEntry({
      module: 'settings',
      action: 'delete',
      entityType: 'docTemplate',
      entityId: template.id,
      entityLabel: template.name,
      snapshot: template,
    })
    setTemplates(loadDocTemplates())
    flushWorkspaceNow()
  }

  function handleRestore(record) {
    restoreDocTemplate(record.id)
    setTemplates(loadDocTemplates())
    flushWorkspaceNow()
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Şablonlar"
        actions={(
          <button
            type="button"
            className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm`}
            onClick={() => navigate(`${DOCUMENT_CENTER_BASE}/tasarimci`)}
          >
            <Plus className="h-4 w-4" /> Yeni Şablon
          </button>
        )}
      />

      <section className="card overflow-hidden p-0">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-gray-500">
            Şablon yok. Yeni şablon oluşturarak başlayın.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/50">
                <th className="table-header text-left px-4 py-3">Ad</th>
                <th className="table-header text-left px-4 py-3">Tip</th>
                <th className="table-header text-left px-4 py-3">Boyut</th>
                <th className="table-header text-right px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id} className="border-b border-dark-500/20">
                  <td className="table-cell px-4 font-bold text-white">{tpl.name}</td>
                  <td className="table-cell px-4 uppercase text-gray-400">{tpl.docType}</td>
                  <td className="table-cell px-4 text-gray-400">{tpl.pageSize}</td>
                  <td className="table-cell px-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`${DOCUMENT_CENTER_BASE}/tasarimci?id=${encodeURIComponent(tpl.id)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-dark-500/50 px-2.5 py-1 text-[11px] font-black uppercase text-gray-300 hover:bg-dark-700"
                      >
                        <PenLine className="h-3.5 w-3.5" /> Düzenle
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(tpl)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1 text-[11px] font-black uppercase text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <DeletedRecordsPanel
        title="Silinen Şablonlar"
        collection="docTemplates"
        onRestore={handleRestore}
        emptyMessage="Silinen şablon yok."
      />
    </AppPageShell>
  )
}
