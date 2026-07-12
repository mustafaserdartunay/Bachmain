import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { listTemplatesByDocType, getDocTemplateById } from '../../utils/docTemplatesStore'
import { buildDocumentContext, renderTemplateHtml } from '../../utils/docVariableEngine'
import { downloadPdfFromHtml, openPrintWindow } from '../../utils/docPrint'
import { logPrintJob } from '../../utils/docPrintJobsStore'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { readCompanySettings } from '../../utils/companySettings'
import { loadQuotes } from '../../utils/quotesStore'
import { loadOrders } from '../../utils/ordersStore'
import { findCustomerProfileByReference, getCustomerProfiles } from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import { useAuth } from '../../auth/AuthContext'

function resolveCustomer(ref) {
  if (!ref) return {}
  if (typeof ref === 'object') return ref
  return findCustomerProfileByReference(ref)
    || getCustomerProfiles().find((c) => c.id === ref)
    || { company: String(ref) }
}

export default function DocPrintPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const initialType = params.get('type') || 'quote'
  const initialDocId = params.get('id') || ''
  const initialTpl = params.get('templateId') || ''

  const [docType, setDocType] = useState(initialType)
  const [documentId, setDocumentId] = useState(initialDocId)
  const [templateId, setTemplateId] = useState(initialTpl)
  const [busy, setBusy] = useState(false)

  const templates = useMemo(() => listTemplatesByDocType(docType === 'generic' ? '' : docType), [docType])
  const documents = useMemo(() => {
    if (docType === 'order') return loadOrders()
    return loadQuotes()
  }, [docType])

  const selectedDoc = documents.find((item) => item.id === documentId) || documents[0] || null
  const selectedTpl = getDocTemplateById(templateId) || templates[0] || null

  const context = useMemo(() => {
    if (!selectedDoc) {
      return buildDocumentContext({ company: readCompanySettings(), user })
    }
    const customer = resolveCustomer(selectedDoc.customer || selectedDoc.customerId || selectedDoc.customerName)
    const display = getCustomerDisplay(customer)
    return buildDocumentContext({
      company: readCompanySettings(),
      user: user || {},
      customer: { ...customer, companyTitle: display.companyTitle, shortBrandName: display.brandShortName },
      document: {
        id: selectedDoc.id,
        createdAt: selectedDoc.createdAt || selectedDoc.date || '',
        grandTotal: selectedDoc.grandTotal ?? selectedDoc.total ?? '',
        notes: selectedDoc.notes || selectedDoc.termsDescription || '',
      },
      lineItems: selectedDoc.items || selectedDoc.lineItems || [],
    })
  }, [selectedDoc, user])

  const rendered = useMemo(() => {
    if (!selectedTpl) return { html: '<p>Şablon seçin</p>', errors: [] }
    return renderTemplateHtml(selectedTpl, context)
  }, [selectedTpl, context])

  async function handlePdf() {
    if (!selectedTpl || !selectedDoc) return
    setBusy(true)
    try {
      await downloadPdfFromHtml(rendered.html, `${selectedDoc.id || 'belge'}.pdf`)
      logPrintJob({
        kind: 'pdf',
        docType,
        documentId: selectedDoc.id,
        templateId: selectedTpl.id,
        templateName: selectedTpl.name,
        userEmail: user?.email || '',
      })
      await flushWorkspaceNow()
    } catch (err) {
      window.alert(err.message || 'PDF oluşturulamadı')
    } finally {
      setBusy(false)
    }
  }

  async function handlePrint() {
    if (!selectedTpl) return
    openPrintWindow(rendered.html)
    logPrintJob({
      kind: 'print',
      docType,
      documentId: selectedDoc?.id || '',
      templateId: selectedTpl.id,
      templateName: selectedTpl.name,
      userEmail: user?.email || '',
    })
    await flushWorkspaceNow()
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yazdır / PDF"
        actions={(
          <div className="flex gap-2">
            <button type="button" disabled={busy || !selectedTpl} onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300 disabled:opacity-40">
              <Printer className="h-4 w-4" /> Yazdır
            </button>
            <button type="button" disabled={busy || !selectedTpl} onClick={handlePdf} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm disabled:opacity-40`}>
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        )}
      />

      <section className="card grid gap-3 md:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-black uppercase text-gray-500">Belge tipi</span>
          <select className="form-input" value={docType} onChange={(e) => { setDocType(e.target.value); setDocumentId(''); setTemplateId('') }}>
            <option value="quote">Teklif</option>
            <option value="order">Sipariş</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-black uppercase text-gray-500">Belge</span>
          <select className="form-input" value={selectedDoc?.id || ''} onChange={(e) => setDocumentId(e.target.value)}>
            {documents.length === 0 ? <option value="">Kayıt yok</option> : null}
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.id}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-black uppercase text-gray-500">Şablon</span>
          <select className="form-input" value={selectedTpl?.id || ''} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.length === 0 ? <option value="">Şablon yok — önce oluşturun</option> : null}
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-dark-500/40 px-4 py-3 text-xs font-black uppercase text-gray-400">Önizleme</div>
        <iframe title="Yazdırma önizleme" className="min-h-[700px] w-full bg-white" srcDoc={rendered.html} />
      </section>
    </AppPageShell>
  )
}
