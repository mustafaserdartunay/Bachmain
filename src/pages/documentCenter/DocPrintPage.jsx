import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { listTemplatesByDocType, getDocTemplateById, saveDocTemplate, loadDocTemplates } from '../../utils/docTemplatesStore'
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
import { buildQuoteDocumentHtml } from '../../utils/quoteDocumentHtml'
import { readQuotePrintSettings, DOC_PRINT_SETTINGS_EVENT } from '../../utils/docPrintSettingsStore'
import { getExchangeRatesSnapshot } from '../../hooks/useExchangeRates'

function ensureQuoteTemplate() {
  const existing = loadDocTemplates().find((item) => item.id === 'tpl-quote-system')
  if (existing) return existing
  return saveDocTemplate({
    id: 'tpl-quote-system',
    name: 'BachMain Teklif',
    docType: 'quote',
    pageSize: 'A4',
    orientation: 'portrait',
    designMode: 'html',
    status: 'published',
    headerHtml: '',
    bodyHtml: '',
    footerHtml: '',
    blocks: [],
  })
}

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
  const docType = params.get('type') || 'quote'
  const documentId = params.get('id') || ''
  const templateId = params.get('templateId') || ''
  const [busy, setBusy] = useState(false)
  const [printTick, setPrintTick] = useState(0)
  const previewRef = useRef(null)

  useEffect(() => {
    ensureQuoteTemplate()
    function refresh() {
      setPrintTick((n) => n + 1)
    }
    window.addEventListener(DOC_PRINT_SETTINGS_EVENT, refresh)
    return () => window.removeEventListener(DOC_PRINT_SETTINGS_EVENT, refresh)
  }, [])

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
    if (docType === 'quote' && selectedDoc) {
      const customer = resolveCustomer(selectedDoc.customer || selectedDoc.customerId || selectedDoc.customerName)
      const display = getCustomerDisplay(customer)
      return {
        html: buildQuoteDocumentHtml({
          quote: selectedDoc,
          company: readCompanySettings(),
          customer: {
            company: display.brandShortName || customer.company || '',
            contact: display.companyTitle || '',
            authorizedName: selectedDoc.contact || customer.authorizedName || customer.contactName || '',
            email: selectedDoc.email || customer.email || '',
            phone: selectedDoc.phone || customer.phone || '',
            address: customer.address || customer.city || '',
          },
          settings: readQuotePrintSettings(),
          rates: getExchangeRatesSnapshot(),
        }),
        errors: [],
      }
    }
    if (!selectedTpl) return { html: '<p>Şablon seçin</p>', errors: [] }
    return renderTemplateHtml(selectedTpl, context)
  }, [selectedTpl, context, docType, selectedDoc, printTick])

  useEffect(() => {
    const frame = previewRef.current
    if (!frame) return undefined

    function fit() {
      const doc = frame.contentDocument
      if (!doc) return
      const height = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
      )
      if (height > 0) frame.style.height = `${height}px`
    }

    function bindImages() {
      const doc = frame.contentDocument
      if (!doc) return
      Array.from(doc.images || []).forEach((img) => {
        if (!img.complete) img.addEventListener('load', fit, { once: true })
      })
    }

    function onLoad() {
      fit()
      bindImages()
    }

    frame.addEventListener('load', onLoad)
    onLoad()
    const timer = window.setTimeout(fit, 80)
    return () => {
      frame.removeEventListener('load', onLoad)
      window.clearTimeout(timer)
    }
  }, [rendered.html])

  async function handlePdf() {
    if (!selectedDoc) return
    if (docType !== 'quote' && !selectedTpl) return
    setBusy(true)
    try {
      await downloadPdfFromHtml(rendered.html, `${selectedDoc.id || 'belge'}.pdf`)
      logPrintJob({
        kind: 'pdf',
        docType,
        documentId: selectedDoc.id,
        templateId: selectedTpl?.id || 'tpl-quote-system',
        templateName: selectedTpl?.name || 'BachMain Teklif',
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
    if (docType !== 'quote' && !selectedTpl) return
    openPrintWindow(rendered.html)
    logPrintJob({
      kind: 'print',
      docType,
      documentId: selectedDoc?.id || '',
      templateId: selectedTpl?.id || 'tpl-quote-system',
      templateName: selectedTpl?.name || 'BachMain Teklif',
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
            <button type="button" disabled={busy || !selectedDoc} onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300 disabled:opacity-40">
              <Printer className="h-4 w-4" /> Yazdır
            </button>
            <button type="button" disabled={busy || !selectedDoc} onClick={handlePdf} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm disabled:opacity-40`}>
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        )}
      />

      <section className="card overflow-visible p-0">
        <div className="border-b border-dark-500/40 px-4 py-3 text-xs font-black uppercase text-gray-400">Önizleme</div>
        <iframe
          ref={previewRef}
          title="Yazdırma önizleme"
          scrolling="no"
          className="block w-full overflow-hidden border-0 bg-white"
          srcDoc={rendered.html}
        />
      </section>
    </AppPageShell>
  )
}
