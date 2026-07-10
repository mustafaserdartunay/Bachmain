import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  FileText,
  Globe,
  Plus,
  Receipt,
  Save,
  Trash2,
} from 'lucide-react'
import { findCustomerProfile } from '../data/customerProfiles'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { getTreasuryAccounts, createCustomerSalesInvoice } from '../utils/treasuryStore'
import { createSalesInvoice } from '../utils/salesInvoicesStore'
import { updateDepoItem } from '../utils/depoStore'
import { formatCollectionDate } from '../utils/customerMovementForm'
import { appendActivity } from '../utils/customerActivity'
import { formatTL } from '../utils/productPricing'
import NumericInput from '../components/Products/NumericInput'
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { FormSectionPanel, FORM_FIELD_LABEL_CLASS, FORM_FIELD_ROW_CLASS } from '../components/Common/FormSectionPanel'

const DOCUMENT_CONFIG = {
  'satis-faturasi': {
    title: 'Satış Faturası',
    icon: Receipt,
    partyLabel: 'Alıcı',
    prefix: 'SF',
    kind: 'invoice',
  },
  'alis-faturasi': {
    title: 'Alış Fiş / Faturası',
    icon: FileText,
    partyLabel: 'Satıcı',
    prefix: 'AF',
    kind: 'invoice',
  },
  'ihracat-faturasi': {
    title: 'İhracat Faturası',
    icon: Globe,
    partyLabel: 'Alıcı',
    prefix: 'IF',
    kind: 'invoice',
    foreign: true,
  },
  virman: {
    title: 'Virman',
    icon: ArrowRightLeft,
    prefix: 'VR',
    kind: 'transfer',
  },
}

function todayInput() {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function createLine() {
  return { id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, description: '', quantity: 1, unitPrice: 0, vat: 20 }
}

export default function CustomerDocumentPage() {
  const navigate = useNavigate()
  const { customerId, docType } = useParams()
  const config = DOCUMENT_CONFIG[docType]
  const customer = findCustomerProfile(customerId)
  const display = getCustomerDisplay(customer)
  const accounts = useMemo(() => getTreasuryAccounts(), [])

  const [docNo, setDocNo] = useState(() => `${config?.prefix || 'DOC'}-${Date.now().toString().slice(-6)}`)
  const [date, setDate] = useState(todayInput())
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [country, setCountry] = useState('')
  const [lines, setLines] = useState(() => [createLine()])
  const [transfer, setTransfer] = useState(() => ({
    fromAccount: accounts[0]?.id || '',
    toAccount: accounts[1]?.id || accounts[0]?.id || '',
    amount: 0,
  }))
  const [sourceDraft, setSourceDraft] = useState(null)
  const [successVisible, setSuccessVisible] = useState(false)
  const successTimer = useRef(null)

  useEffect(() => {
    if (config?.kind !== 'invoice') return
    try {
      const raw = sessionStorage.getItem('erlenbox-depo-document-draft')
        || sessionStorage.getItem('erlenbox-production-document-draft')
      if (!raw) return
      const draft = JSON.parse(raw)
      sessionStorage.removeItem('erlenbox-depo-document-draft')
      sessionStorage.removeItem('erlenbox-production-document-draft')
      setSourceDraft(draft)
      if (draft.invoiceNo) setDocNo(draft.invoiceNo)
      if (draft.description) setDescription(draft.description)
      if (draft.date) setDate(draft.date)
      if (Array.isArray(draft.lines) && draft.lines.length > 0) {
        setLines(draft.lines.map((line) => ({
          id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: line.description || '',
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
          vat: Number(line.vat) || 20,
        })))
      }
    } catch {
      // ignore malformed draft
    }
  }, [config?.kind])

  if (!config) {
    return (
      <div className="space-y-5">
        <section className="card p-6 text-center text-sm font-semibold text-gray-400">
          Belge türü bulunamadı.
          <button type="button" onClick={() => navigate(-1)} className="ml-2 text-blue-300 hover:underline">
            Geri dön
          </button>
        </section>
      </div>
    )
  }

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
    setLines((current) => current.map((line) => (line.id === id ? { ...line, [field]: value } : line)))
  }

  function removeLine(id) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current))
  }

  function showSaved() {
    if (successTimer.current) clearTimeout(successTimer.current)
    setSuccessVisible(true)
    successTimer.current = setTimeout(() => setSuccessVisible(false), 1500)
  }

  function handleSave() {
    let detail
    if (config.kind === 'transfer') {
      const from = accounts.find((account) => account.id === transfer.fromAccount)
      const to = accounts.find((account) => account.id === transfer.toAccount)
      detail = `${docNo} · ${formatTL(transfer.amount)} · ${from?.name || '—'} → ${to?.name || '—'}`
    } else {
      detail = `${docNo} · ${lines.length} kalem · Genel Toplam ${formatTL(grandTotal)}`
    }

    if (docType === 'satis-faturasi') {
      if (grandTotal <= 0) {
        window.alert('Fatura tutarı sıfırdan büyük olmalıdır.')
        return
      }
      createCustomerSalesInvoice({
        customerName: customer.company,
        customerId: customer.id,
        amount: grandTotal,
        docNo,
        date: formatCollectionDate(date),
        dueDate: dueDate ? formatCollectionDate(dueDate) : '',
        description: description || `${docNo} satış faturası`,
      })
      createSalesInvoice({
        title: description?.trim() || 'Satış Faturaları',
        invoiceNo: docNo,
        customerId: customer.id,
        customerName: customer.company,
        issueDate: date,
        dueDate: dueDate || date,
        totalAmount: grandTotal,
        invoiceKind: 'e-fatura',
        status: 'approved',
        description: description || `${docNo} satış faturası`,
        syncTreasury: false,
      })
      if (sourceDraft?.depoItemId) {
        const invoicedQuantity = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
        updateDepoItem(sourceDraft.depoItemId, {
          invoiceNo: docNo,
          invoiceAt: formatCollectionDate(date),
          invoicedQuantity,
        })
      }
    }

    appendActivity(customer.id, `${config.title} Oluşturuldu`, detail)
    showSaved()
    const nextPath = docType === 'satis-faturasi' ? '/musteriler/faturalar' : `/musteriler/${customer.id}`
    setTimeout(() => navigate(nextPath), 800)
  }

  const Icon = config.icon

  return (
    <div className="space-y-5">
      {successVisible && (
        <div className="fixed right-6 top-20 z-[80] rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 shadow-2xl shadow-emerald-950/20">
          {config.title} kaydedildi
        </div>
      )}

      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <button
          type="button"
          onClick={() => navigate(`/musteriler/${customer.id}`)}
          className="absolute left-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Müşteri Detayı
        </button>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">{config.title}</h1>
        </div>
      </section>

      <FormSectionPanel icon={Building2} title={`${config.partyLabel || 'Cari'} Bilgileri`} dotColor="violet">
        <div className={`${FORM_FIELD_ROW_CLASS} flex items-center gap-4`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/35 text-lg font-extrabold text-[var(--ink)]">
            {display.brandShortName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]">{display.brandShortName}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[var(--muted)]">{display.companyTitle} · {customer.city}</p>
          </div>
        </div>
      </FormSectionPanel>

      <FormSectionPanel icon={Icon} title="Belge Bilgileri" dotColor="blue">
        <div className="grid max-w-4xl grid-cols-2 gap-1">
          <Field label="Belge No">
            <input value={docNo} readOnly className="form-input-readonly" />
          </Field>
          <Field label="Belge Tarihi">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="form-input" />
          </Field>
          {config.kind === 'invoice' && (
            <Field label="Vade Tarihi">
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="form-input" />
            </Field>
          )}
          {config.foreign && (
            <>
              <Field label="Döviz">
                <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="form-input">
                  {['USD', 'EUR', 'GBP', 'TRY'].map((code) => <option key={code}>{code}</option>)}
                </select>
              </Field>
              <Field label="Ülke">
                <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Teslim ülkesi" className="form-input" />
              </Field>
            </>
          )}
          <Field label="Açıklama" full>
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Belge açıklaması" className="form-input" />
          </Field>
        </div>
      </FormSectionPanel>

      {config.kind === 'transfer' ? (
        <FormSectionPanel icon={ArrowRightLeft} title="Virman Detayı" dotColor="orange">
          <div className="grid max-w-4xl grid-cols-2 gap-1">
            <Field label="Kaynak Hesap">
              <select value={transfer.fromAccount} onChange={(event) => setTransfer((c) => ({ ...c, fromAccount: event.target.value }))} className="form-input">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </Field>
            <Field label="Hedef Hesap">
              <select value={transfer.toAccount} onChange={(event) => setTransfer((c) => ({ ...c, toAccount: event.target.value }))} className="form-input">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </Field>
            <Field label="Tutar">
              <NumericInput value={transfer.amount} onChange={(value) => setTransfer((c) => ({ ...c, amount: value }))} suffix="₺" formatMode="price" />
            </Field>
          </div>
        </FormSectionPanel>
      ) : (
        <FormSectionPanel icon={Receipt} title="Kalemler" dotColor="emerald">
          <div className="space-y-1">
            <div className="glass-inset grid grid-cols-[minmax(0,1fr)_90px_140px_80px_130px_36px] gap-2 rounded-[16px] px-3 py-2 text-[12px] font-black uppercase tracking-wider text-[var(--muted)]">
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
                <div key={line.id} className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[minmax(0,1fr)_90px_140px_80px_130px_36px] items-center gap-2`}>
                  <input
                    value={line.description}
                    onChange={(event) => updateLine(line.id, 'description', event.target.value)}
                    placeholder="Ürün / hizmet"
                    className="form-input"
                  />
                  <NumericInput value={line.quantity} onChange={(value) => updateLine(line.id, 'quantity', value)} className="text-right" />
                  <NumericInput value={line.unitPrice} onChange={(value) => updateLine(line.id, 'unitPrice', value)} suffix="₺" formatMode="price" />
                  <NumericInput value={line.vat} onChange={(value) => updateLine(line.id, 'vat', value)} suffix="%" className="text-right" />
                  <span className="text-right text-sm font-extrabold text-[var(--ink)]">{formatTL(lineTotal)}</span>
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
                <span className="font-extrabold uppercase tracking-wide text-[var(--ink)]">Genel Toplam</span>
                <span className="font-extrabold text-emerald-600">{formatTL(grandTotal)}</span>
              </div>
            </div>
          </div>
        </FormSectionPanel>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate(`/musteriler/${customer.id}`)}
          className="btn-ghost !px-5 !py-2.5 text-[12px] font-bold uppercase"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={`${BTN_SUCCESS} gap-2 px-5 py-2.5 text-xs uppercase`}
        >
          <Save className="h-4 w-4" /> Kaydet
        </button>
      </div>
    </div>
  )
}

function Field({ label, children, full = false }) {
  return (
    <label className={`glass-inset flex flex-col gap-1.5 rounded-[16px] p-3 ${full ? 'col-span-2' : ''}`}>
      <span className={FORM_FIELD_LABEL_CLASS}>{label}</span>
      {children}
    </label>
  )
}
