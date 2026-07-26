import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Building2,
  FileText,
  Mail,
  Plus,
  Receipt,
  Save,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { FormSectionPanel, FORM_FIELD_ROW_CLASS } from '../components/Common/FormSectionPanel'
import CreateCustomerPickModal from '../components/Common/CreateCustomerPickModal'
import InvoiceDeliveryStatusPanel from '../components/Sales/InvoiceDeliveryStatusPanel'
import NumericInput from '../components/Products/NumericInput'
import { findCustomerProfile } from '../data/customerProfiles'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { formatTL } from '../utils/productPricing'
import { BTN_PRIMARY } from '../utils/buttonStyles'
import {
  createAndIssueSalesInvoice,
  createSalesInvoice,
  getSalesInvoiceById,
  INVOICE_KIND_LABELS,
  SALES_INVOICES_EVENT,
} from '../utils/salesInvoicesStore'
import {
  invoiceKindIssueLabel,
  invoiceKindTitle,
  readEInvoiceSettings,
  resolveCustomerInvoiceKind,
} from '../utils/eInvoiceSettingsStore'

function todayInput() {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function createLine() {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: '',
    quantity: 1,
    unitPrice: 0,
    vat: 20,
  }
}

function kindOptionClass(active, tone) {
  if (!active) return 'border-dark-500/45 bg-dark-900/40 text-gray-400 hover:border-dark-500/70'
  if (tone === 'arsiv')
    return 'border-violet-500/45 bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30'
  return 'border-blue-500/45 bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30'
}

export default function SalesInvoiceCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const settings = useMemo(() => readEInvoiceSettings(), [])

  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [invoiceKind, setInvoiceKind] = useState(settings.defaultInvoiceKind || 'e-fatura')
  const [kindLockedFromCustomer, setKindLockedFromCustomer] = useState(false)
  const [docNo, setDocNo] = useState('')
  const [date, setDate] = useState(todayInput)
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [lines, setLines] = useState(() => [createLine()])
  const [issuedInvoiceId, setIssuedInvoiceId] = useState(null)
  const [liveInvoice, setLiveInvoice] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const customerId = searchParams.get('musteri')
    if (!customerId) return
    const profile = findCustomerProfile(customerId)
    if (profile) applyCustomer(profile)
  }, [searchParams])

  useEffect(() => {
    if (!issuedInvoiceId) return undefined
    function refresh() {
      setLiveInvoice(getSalesInvoiceById(issuedInvoiceId))
    }
    refresh()
    window.addEventListener(SALES_INVOICES_EVENT, refresh)
    return () => window.removeEventListener(SALES_INVOICES_EVENT, refresh)
  }, [issuedInvoiceId])

  function applyCustomer(profile) {
    setCustomer(profile)
    const kind = resolveCustomerInvoiceKind(profile, settings)
    setInvoiceKind(kind)
    setKindLockedFromCustomer(Boolean(profile?.eInvoiceType))
    setCustomerEmail(profile?.email || '')
    const series = kind === 'e-arsiv' ? settings.eArsivSeries : settings.eFaturaSeries
    setDocNo(`${series}${Date.now().toString().slice(-8)}`)
  }

  const display = customer ? getCustomerDisplay(customer) : null
  const issueLabel = invoiceKindIssueLabel(invoiceKind)
  const kindTitle = invoiceKindTitle(invoiceKind)

  const totals = lines.reduce(
    (acc, line) => {
      const net = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)
      const vat = net * ((Number(line.vat) || 0) / 100)
      acc.subtotal += net
      acc.vat += vat
      return acc
    },
    { subtotal: 0, vat: 0 },
  )
  const grandTotal = totals.subtotal + totals.vat

  function updateLine(id, field, value) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    )
  }

  function removeLine(id) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current))
  }

  function handleKindChange(kind) {
    setInvoiceKind(kind)
    setKindLockedFromCustomer(false)
    const series = kind === 'e-arsiv' ? settings.eArsivSeries : settings.eFaturaSeries
    setDocNo(`${series}${Date.now().toString().slice(-8)}`)
  }

  function buildPayload(status = 'draft') {
    return {
      title: description?.trim() || `${kindTitle} Faturası`,
      invoiceNo: docNo,
      customerId: customer?.id || '',
      customerName:
        customer?.company || customer?.companyTitle || display?.companyTitle || 'Müşteri',
      customerEmail,
      issueDate: date,
      dueDate: dueDate || date,
      totalAmount: grandTotal,
      invoiceKind,
      status,
      description: description || `${docNo} ${kindTitle}`,
      lines,
      syncTreasury: status !== 'draft' || grandTotal > 0,
    }
  }

  function handleSaveDraft() {
    if (!customer) {
      setCustomerModalOpen(true)
      return
    }
    setSaving(true)
    const invoice = createSalesInvoice(buildPayload('draft'))
    setSaving(false)
    navigate(`/musteriler/faturalar/${invoice.id}`)
  }

  function handleIssue() {
    if (!customer) {
      setCustomerModalOpen(true)
      return
    }
    if (grandTotal <= 0) {
      window.alert('Fatura tutarı sıfırdan büyük olmalıdır.')
      return
    }
    if (!customerEmail.trim()) {
      window.alert('Müşteri e-posta adresi gerekli (teslimat takibi için).')
      return
    }
    setSaving(true)
    const invoice = createAndIssueSalesInvoice(buildPayload('sending'))
    setIssuedInvoiceId(invoice.id)
    setLiveInvoice(invoice)
    setSaving(false)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yeni Fatura Oluştur"
        subtitle={`${kindTitle} kesme · GİB + e-posta canlı takip`}
        backTo="/musteriler/faturalar"
        backLabel="Listeye dön"
        actions={
          <button
            type="button"
            onClick={() => navigate('/ayarlar/e-fatura')}
            className="inline-flex h-control min-h-control items-center gap-2 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide text-[#3b82f6] hover:text-[#60a5fa]"
          >
            <Settings2 className="h-4 w-4" />
            E-Fatura Ayarları
          </button>
        }
      />

      <FormSectionPanel icon={FileText} title="Belge Türü" dotColor="blue">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleKindChange('e-fatura')}
            className={`rounded-2xl border px-4 py-4 text-left transition-all ${kindOptionClass(invoiceKind === 'e-fatura', 'fatura')}`}
          >
            <p className="text-sm font-black uppercase tracking-wide">e-Fatura</p>
            <p className="mt-1 text-xs text-gray-400">
              GİB e-Fatura mükellefine ticari e-Fatura kesilir.
            </p>
            {invoiceKind === 'e-fatura' ? (
              <p className="mt-2 text-[11px] font-bold text-blue-300">Seçili · {issueLabel}</p>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => handleKindChange('e-arsiv')}
            className={`rounded-2xl border px-4 py-4 text-left transition-all ${kindOptionClass(invoiceKind === 'e-arsiv', 'arsiv')}`}
          >
            <p className="text-sm font-black uppercase tracking-wide">e-Arşiv</p>
            <p className="mt-1 text-xs text-gray-400">
              e-Fatura mükellefi olmayan alıcıya e-Arşiv faturası kesilir.
            </p>
            {invoiceKind === 'e-arsiv' ? (
              <p className="mt-2 text-[11px] font-bold text-violet-300">Seçili · {issueLabel}</p>
            ) : null}
          </button>
        </div>
        {kindLockedFromCustomer ? (
          <p className="mt-3 text-xs font-semibold text-gray-400">
            Müşteri kaydındaki tür:{' '}
            <span className="text-white">{INVOICE_KIND_LABELS[invoiceKind]}</span> — sistem kaydına
            göre otomatik seçildi.
          </p>
        ) : null}
      </FormSectionPanel>

      <FormSectionPanel icon={Building2} title="Alıcı (Müşteri)" dotColor="violet">
        {customer && display ? (
          <div className={`${FORM_FIELD_ROW_CLASS} justify-between gap-4`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/35 text-lg font-extrabold text-[var(--ink)]">
                {display.brandShortName.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]">
                  {display.brandShortName}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-[var(--muted)]">
                  {display.companyTitle}
                  {customer.taxNumber ? ` · VKN ${customer.taxNumber}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCustomerModalOpen(true)}
              className="shrink-0 text-xs font-bold text-blue-300 hover:underline"
            >
              Değiştir
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="inline-flex h-control min-h-control items-center gap-2 rounded-xl border border-dashed border-dark-500/60 px-4 text-xs font-extrabold text-blue-300 hover:border-blue-500/40"
          >
            <Plus className="h-4 w-4" />
            Müşteri Seç
          </button>
        )}
      </FormSectionPanel>

      <FormSectionPanel icon={Receipt} title="Belge Bilgileri" dotColor="blue">
        <div className="grid max-w-4xl grid-cols-1 gap-1 sm:grid-cols-2">
          <Field label="Fatura No">
            <input
              value={docNo}
              onChange={(event) => setDocNo(event.target.value)}
              className="form-input"
              placeholder="Seri + sıra"
            />
          </Field>
          <Field label="Düzenleme Tarihi">
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Vade Tarihi">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Müşteri E-posta" icon={Mail}>
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="form-input"
              placeholder="fatura@musteri.com"
            />
          </Field>
          <Field label="Açıklama" full>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Fatura açıklaması"
              className="form-input"
            />
          </Field>
        </div>
      </FormSectionPanel>

      <FormSectionPanel icon={Receipt} title="Kalemler" dotColor="emerald">
        <div className="space-y-1 overflow-x-auto">
          <div className="glass-inset grid min-w-[640px] grid-cols-[minmax(0,1fr)_90px_140px_80px_130px_36px] gap-2 rounded-[16px] px-3 py-2 text-[12px] font-black uppercase tracking-wider text-[var(--muted)]">
            <span>Açıklama</span>
            <span className="text-right">Miktar</span>
            <span className="text-right">Birim Fiyat</span>
            <span className="text-right">KDV %</span>
            <span className="text-right">Tutar</span>
            <span />
          </div>
          {lines.map((line) => {
            const net = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)
            const lineTotal = net * (1 + (Number(line.vat) || 0) / 100)
            return (
              <div
                key={line.id}
                className={`${FORM_FIELD_ROW_CLASS} grid min-w-[640px] grid-cols-[minmax(0,1fr)_90px_140px_80px_130px_36px] items-center gap-2`}
              >
                <input
                  value={line.description}
                  onChange={(event) => updateLine(line.id, 'description', event.target.value)}
                  placeholder="Ürün / hizmet"
                  className="form-input"
                />
                <NumericInput
                  value={line.quantity}
                  onChange={(value) => updateLine(line.id, 'quantity', value)}
                  className="text-right"
                />
                <NumericInput
                  value={line.unitPrice}
                  onChange={(value) => updateLine(line.id, 'unitPrice', value)}
                  suffix="₺"
                  formatMode="price"
                />
                <NumericInput
                  value={line.vat}
                  onChange={(value) => updateLine(line.id, 'vat', value)}
                  suffix="%"
                  className="text-right"
                />
                <span className="text-right text-sm font-extrabold text-[var(--ink)]">
                  {formatTL(lineTotal)}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="icon-btn flex h-9 w-9 items-center justify-center !rounded-lg text-red-500"
                  aria-label="Satırı sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setLines((current) => [...current, createLine()])}
          className="btn-ghost mt-4 inline-flex items-center gap-2 !px-4 !py-2 text-[12px] font-bold"
        >
          <Plus className="h-4 w-4" /> Kalem Ekle
        </button>

        <div className="mt-5 flex justify-end">
          <div className="glass-inset w-full max-w-xs space-y-2 rounded-[16px] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
              <span>Ara Toplam</span>
              <span className="font-extrabold text-[var(--ink)]">{formatTL(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
              <span>KDV</span>
              <span className="font-extrabold text-[var(--ink)]">{formatTL(totals.vat)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/50 pt-2 text-sm">
              <span className="font-extrabold uppercase tracking-wide text-[var(--ink)]">
                Genel Toplam
              </span>
              <span className="font-extrabold text-emerald-600">{formatTL(grandTotal)}</span>
            </div>
          </div>
        </div>
      </FormSectionPanel>

      {liveInvoice ? <InvoiceDeliveryStatusPanel invoice={liveInvoice} /> : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate('/musteriler/faturalar')}
          className="btn-cancel !px-5 text-[12px] font-bold uppercase"
        >
          Vazgeç
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveDraft}
          className="btn-ghost inline-flex h-control min-h-control items-center gap-2 px-5 text-xs font-extrabold uppercase"
        >
          <Save className="h-4 w-4" /> Taslak Kaydet
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleIssue}
          className={`${BTN_PRIMARY} gap-2 px-5 text-xs uppercase`}
        >
          <Send className="h-4 w-4" />
          {issueLabel}
        </button>
      </div>

      <CreateCustomerPickModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={(picked) => {
          applyCustomer(picked)
          setCustomerModalOpen(false)
        }}
        description="Fatura kesmek için müşteri seçin. Kayıttaki e-Fatura / e-Arşiv türü otomatik uygulanır."
      />
    </AppPageShell>
  )
}

function Field({ label, children, full = false, icon: Icon }) {
  return (
    <label
      className={`app-form-row app-form-field-surface flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${full ? 'col-span-2' : ''}`}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-black capitalize tracking-wider text-[var(--muted)] whitespace-nowrap">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  )
}
