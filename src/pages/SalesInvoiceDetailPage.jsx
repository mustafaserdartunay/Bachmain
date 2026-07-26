import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Mail, Receipt, Send } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { FormSectionPanel, FORM_FIELD_ROW_CLASS } from '../components/Common/FormSectionPanel'
import InvoiceDeliveryStatusPanel from '../components/Sales/InvoiceDeliveryStatusPanel'
import { formatTL } from '../utils/productPricing'
import { BTN_PRIMARY } from '../utils/buttonStyles'
import {
  formatInvoiceDate,
  getSalesInvoiceById,
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
  issueSalesInvoiceToGib,
  SALES_INVOICES_EVENT,
} from '../utils/salesInvoicesStore'
import { invoiceKindIssueLabel } from '../utils/eInvoiceSettingsStore'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

export default function SalesInvoiceDetailPage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(() => getSalesInvoiceById(invoiceId))

  const refresh = useCallback(() => {
    setInvoice(getSalesInvoiceById(invoiceId))
  }, [invoiceId])

  useEffect(() => {
    refresh()
    window.addEventListener(SALES_INVOICES_EVENT, refresh)
    return () => window.removeEventListener(SALES_INVOICES_EVENT, refresh)
  }, [refresh])

  if (!invoice) {
    return (
      <AppPageShell>
        <AppPageHeader title="Fatura" backTo="/musteriler/faturalar" backLabel="Listeye dön" />
        <section className={`${APP_SURFACE_PANEL_CLASS} p-6 text-center text-sm text-gray-400`}>
          Fatura bulunamadı.
          <Link to="/musteriler/faturalar" className="ml-2 text-blue-300 hover:underline">
            Listeye dön
          </Link>
        </section>
      </AppPageShell>
    )
  }

  const canIssue = invoice.gibStatus === 'idle' || invoice.gibStatus === 'failed'
  const issueLabel = invoiceKindIssueLabel(invoice.invoiceKind)

  return (
    <AppPageShell>
      <AppPageHeader
        title={invoice.invoiceNo || 'Fatura Detayı'}
        subtitle={`${INVOICE_KIND_LABELS[invoice.invoiceKind] || ''} · ${INVOICE_STATUS_LABELS[invoice.status] || invoice.status}`}
        backTo="/musteriler/faturalar"
        backLabel="Listeye dön"
        actions={
          canIssue ? (
            <button
              type="button"
              onClick={() => issueSalesInvoiceToGib(invoice.id)}
              className={`${BTN_PRIMARY} gap-2 px-4 text-xs uppercase`}
            >
              <Send className="h-4 w-4" />
              {issueLabel}
            </button>
          ) : null
        }
      />

      <FormSectionPanel icon={Receipt} title="Fatura Özeti" dotColor="blue">
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow label="Müşteri" value={invoice.customerName} />
          <InfoRow label="Fatura No" value={invoice.invoiceNo || '—'} />
          <InfoRow label="Düzenleme" value={formatInvoiceDate(invoice.issueDate)} />
          <InfoRow label="Vade" value={formatInvoiceDate(invoice.dueDate)} />
          <InfoRow label="Tür" value={INVOICE_KIND_LABELS[invoice.invoiceKind]} />
          <InfoRow label="Tutar" value={formatTL(invoice.totalAmount)} />
          <InfoRow label="E-posta" value={invoice.customerEmail || '—'} icon={Mail} />
          <InfoRow label="Açıklama" value={invoice.description || '—'} />
        </div>
      </FormSectionPanel>

      {Array.isArray(invoice.lines) && invoice.lines.length > 0 ? (
        <FormSectionPanel icon={Receipt} title="Kalemler" dotColor="emerald">
          <div className="space-y-1">
            {invoice.lines.map((line) => {
              const net = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)
              const total = net * (1 + (Number(line.vat) || 0) / 100)
              return (
                <div key={line.id} className={`${FORM_FIELD_ROW_CLASS} justify-between gap-3`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--ink)]">
                      {line.description || '—'}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {line.quantity} × {formatTL(line.unitPrice)} · KDV %{line.vat}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-[var(--ink)]">
                    {formatTL(total)}
                  </span>
                </div>
              )
            })}
          </div>
        </FormSectionPanel>
      ) : null}

      <InvoiceDeliveryStatusPanel invoice={invoice} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/musteriler/faturalar')}
          className="btn-cancel !px-5 text-[12px] font-bold uppercase"
        >
          Listeye Dön
        </button>
      </div>
    </AppPageShell>
  )
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className={FORM_FIELD_ROW_CLASS}>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-sm font-bold text-[var(--ink)]">
        {value}
      </span>
    </div>
  )
}
