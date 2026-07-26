import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, Paperclip } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import EFaturaMark from '../../components/Common/EFaturaMark'
import CreateCustomerPickModal from '../../components/Common/CreateCustomerPickModal'
import { formatTL } from '../../utils/productPricing'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import {
  formatInvoiceDisplayDate,
  formatInvoiceDocDate,
  findSupplierForInvoice,
  getIncomingEInvoiceById,
  importIncomingEInvoiceToLedger,
  INCOMING_E_INVOICES_EVENT,
  updateIncomingEInvoice,
} from '../../utils/incomingEInvoicesStore'

function money(value) {
  return formatTL(Number(value) || 0)
}

function InvoicePreview({ invoice }) {
  const lines = invoice.lines?.length
    ? invoice.lines
    : [
        {
          id: 'single',
          code: '—',
          description: 'Mal / hizmet',
          quantity: 1,
          unit: 'Adet',
          unitPrice: invoice.net,
          vatRate: 20,
          amount: invoice.net,
        },
      ]

  return (
    <article className="overflow-hidden rounded-2xl border border-dark-500/40 bg-white text-[#1a1a1a] shadow-card">
      <div className="border-b border-gray-200 px-5 py-4 sm:px-7 sm:py-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_auto_0.9fr] lg:items-start">
          <div className="min-w-0 text-[11px] leading-relaxed text-gray-700">
            <p className="text-sm font-black uppercase tracking-wide text-gray-900">
              {invoice.supplierTitle}
            </p>
            {invoice.supplierAddress ? <p className="mt-1">{invoice.supplierAddress}</p> : null}
            {invoice.supplierTaxOffice || invoice.supplierTaxId ? (
              <p className="mt-1">
                {invoice.supplierTaxOffice ? `${invoice.supplierTaxOffice} V.D. ` : ''}
                {invoice.supplierTaxId ? `VKN: ${invoice.supplierTaxId}` : ''}
              </p>
            ) : null}
          </div>

          <div className="flex justify-center">
            <EFaturaMark size={56} />
          </div>

          <div className="text-[11px] lg:text-right">
            <div className="inline-block overflow-hidden rounded-lg border border-gray-200 text-left">
              <table className="min-w-[200px] text-[11px]">
                <tbody>
                  {[
                    ['Özelleştirme No', invoice.customizationNo],
                    ['Senaryo', invoice.scenario],
                    ['Fatura Tipi', invoice.invoiceType],
                    ['Fatura No', invoice.invoiceNo],
                    ['Fatura Tarihi', formatInvoiceDocDate(invoice.date)],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100 last:border-0">
                      <th className="bg-gray-50 px-2.5 py-1.5 text-left font-bold text-gray-600">
                        {label}
                      </th>
                      <td className="px-2.5 py-1.5 font-semibold text-gray-900">{value || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Sayın</p>
            <p className="mt-1 text-sm font-black text-gray-900">{invoice.buyer || '—'}</p>
            {invoice.buyerAddress ? (
              <p className="mt-1 text-[11px] text-gray-600">{invoice.buyerAddress}</p>
            ) : null}
            {invoice.buyerTaxOffice || invoice.buyerTaxId ? (
              <p className="mt-1 text-[11px] text-gray-600">
                {invoice.buyerTaxOffice ? `${invoice.buyerTaxOffice} V.D. ` : ''}
                {invoice.buyerTaxId ? `VKN: ${invoice.buyerTaxId}` : ''}
              </p>
            ) : null}
          </div>
          {invoice.ettn ? (
            <div className="sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">ETTN</p>
              <p className="mt-1 break-all text-[11px] font-semibold text-gray-700">
                {invoice.ettn}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto px-3 py-3 sm:px-5">
        <table className="w-full min-w-[640px] border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#1e3a5f] text-white">
              <th className="px-2 py-2 text-left font-bold">Sıra</th>
              <th className="px-2 py-2 text-left font-bold">Malzeme / Hizmet</th>
              <th className="px-2 py-2 text-right font-bold">Miktar</th>
              <th className="px-2 py-2 text-right font-bold">Birim Fiyat</th>
              <th className="px-2 py-2 text-right font-bold">KDV %</th>
              <th className="px-2 py-2 text-right font-bold">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id || index} className="border-b border-gray-100">
                <td className="px-2 py-2 text-gray-600">{index + 1}</td>
                <td className="px-2 py-2">
                  <p className="font-bold text-gray-900">{line.description}</p>
                  {line.code ? <p className="text-gray-500">{line.code}</p> : null}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-gray-800">
                  {line.quantity} {line.unit || ''}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-gray-800">
                  {money(line.unitPrice)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-gray-800">
                  %{line.vatRate ?? 20}
                </td>
                <td className="px-2 py-2 text-right font-bold tabular-nums text-gray-900">
                  {money(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div className="text-[11px] text-gray-600">
          <p>
            <span className="font-bold text-gray-800">Ödeme Koşulu:</span> {invoice.paymentTerms}
          </p>
        </div>
        <div className="min-w-[220px] overflow-hidden rounded-lg border border-gray-200 text-[11px]">
          <div className="flex justify-between gap-4 border-b border-gray-100 px-3 py-2">
            <span className="text-gray-600">Malzeme / Hizmet Toplamı</span>
            <span className="font-bold tabular-nums">{money(invoice.net)}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 px-3 py-2">
            <span className="text-gray-600">Hesaplanan KDV</span>
            <span className="font-bold tabular-nums">{money(invoice.vat)}</span>
          </div>
          <div className="flex justify-between gap-4 bg-gray-50 px-3 py-2.5">
            <span className="font-black text-gray-900">Ödenecek Tutar</span>
            <span className="font-black tabular-nums text-gray-900">{money(invoice.amount)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function SidebarCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-dark-500/40 bg-dark-800/55 p-4 ${className}`}>
      {children}
    </div>
  )
}

export default function IncomingEInvoiceDetailPage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(() => getIncomingEInvoiceById(invoiceId))
  const [noteDraft, setNoteDraft] = useState('')
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function refresh() {
      setInvoice(getIncomingEInvoiceById(invoiceId))
    }
    refresh()
    window.addEventListener(INCOMING_E_INVOICES_EVENT, refresh)
    return () => window.removeEventListener(INCOMING_E_INVOICES_EVENT, refresh)
  }, [invoiceId])

  const statusGreen = useMemo(() => {
    const label = String(invoice?.acceptanceLabel || invoice?.status || '')
    return /kabul|içeri|onay/i.test(label)
  }, [invoice])

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function runImport(supplier) {
    setBusy(true)
    const result = importIncomingEInvoiceToLedger(invoiceId, {
      supplierId: supplier?.id,
      supplierName: supplier?.company,
    })
    setBusy(false)
    setSupplierModalOpen(false)
    if (!result.ok) {
      showToast(result.error || 'İşlem başarısız')
      return
    }
    setInvoice(result.invoice)
    showToast('Cariye işlendi · tedarikçi alacaklı')
    if (result.supplier?.id) {
      window.setTimeout(() => navigate(`/musteriler/${result.supplier.id}`), 900)
    }
  }

  function handleImportClick() {
    if (!invoice || invoice.imported || busy) return
    const matched = findSupplierForInvoice(invoice)
    if (!matched) {
      setSupplierModalOpen(true)
      return
    }
    runImport(matched)
  }

  function handleAddNote() {
    const text = noteDraft.trim()
    if (!text || !invoice) return
    const notes = [
      ...(invoice.notes || []),
      { id: `N-${Date.now()}`, text, at: new Date().toISOString() },
    ]
    const updated = updateIncomingEInvoice(invoice.id, { note: text, notes })
    setInvoice(updated)
    setNoteDraft('')
    showToast('Not eklendi')
  }

  if (!invoice) {
    return (
      <AppPageShell>
        <AppPageHeader
          title="Gelen E-Fatura"
          onBack={() => navigate('/giderler/gelen-e-faturalar')}
          backLabel="Listeye dön"
        />
        <section className={`${APP_SURFACE_PANEL_CLASS} p-8 text-center`}>
          <p className="text-sm font-bold text-gray-400">Fatura bulunamadı.</p>
          <Link
            to="/giderler/gelen-e-faturalar"
            className="mt-3 inline-block text-sm font-bold text-blue-300 underline"
          >
            Gelen E-Faturalar
          </Link>
        </section>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      {toast ? (
        <div className="fixed right-6 top-20 z-[80] rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 shadow-2xl">
          {toast}
        </div>
      ) : null}

      <AppPageHeader
        title={invoice.invoiceNo}
        onBack={() => navigate('/giderler/gelen-e-faturalar')}
        backLabel="Listeye dön"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InvoicePreview invoice={invoice} />

        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
          <SidebarCard>
            <div className="flex items-start gap-3">
              <EFaturaMark size={40} showLabel={false} />
              <div className="min-w-0">
                <p className="text-sm font-black text-white">Fatura alındı</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">e-Fatura</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide ${
                      statusGreen
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusGreen ? 'bg-emerald-400' : 'bg-orange-400'}`}
                    />
                    {invoice.acceptanceLabel || invoice.status}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {formatInvoiceDisplayDate(invoice.date)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={invoice.imported || busy}
              onClick={handleImportClick}
              className="mt-4 flex h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#c4a484] via-[#a67c52] to-[#8b6914] px-4 text-sm font-black tracking-wide text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              {invoice.imported ? 'İÇERİ ALINDI' : 'İÇERİ AL'}
            </button>
            {invoice.imported ? (
              <p className="mt-2 text-center text-[11px] font-semibold text-emerald-300/90">
                Cari hesaba işlendi · tedarikçi alacaklı
              </p>
            ) : (
              <p className="mt-2 text-center text-[11px] font-semibold text-gray-500">
                Cariye alış faturası olarak işler (tedarikçi alacaklı)
              </p>
            )}
          </SidebarCard>

          <SidebarCard className="space-y-1 p-2">
            <a
              href={`data:text/plain,${encodeURIComponent(`PDF önizleme stub · ${invoice.invoiceNo}`)}`}
              download={`${invoice.invoiceNo}.txt`}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-200 transition-colors hover:bg-dark-700/60"
            >
              <span>PDF dosyasını göster</span>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-200 transition-colors hover:bg-dark-700/60"
            >
              <span>HTML dosyasını göster</span>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          </SidebarCard>

          <SidebarCard>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Not ekle"
              rows={4}
              className="w-full resize-none rounded-xl border border-dark-500/45 bg-dark-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/40"
            />
            {(invoice.notes || []).length > 0 ? (
              <ul className="mt-3 max-h-28 space-y-1.5 overflow-y-auto">
                {invoice.notes.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg bg-dark-900/35 px-2.5 py-1.5 text-xs text-gray-400"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dark-500/45 text-gray-400"
                title="Ek (yakında)"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="rounded-lg border border-dark-500/50 bg-dark-700/70 px-4 py-2 text-xs font-black tracking-wide text-gray-200"
              >
                EKLE
              </button>
            </div>
          </SidebarCard>
        </aside>
      </div>

      <CreateCustomerPickModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSelect={runImport}
        listKind="supplier"
        title="Tedarikçi Seçin"
        description="Faturayı hangi cari hesaba (alacaklı) işleyelim?"
        searchPlaceholder="Tedarikçi ara..."
        emptyLabel="Tedarikçi bulunamadı. Önce tedarikçi oluşturun."
      />
    </AppPageShell>
  )
}
