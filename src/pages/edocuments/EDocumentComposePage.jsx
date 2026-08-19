import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { formatTL } from '../../utils/productPricing'
import { readCompanySettings } from '../../utils/companySettings'
import { getCustomerProfiles } from '../../data/customerProfiles'
import { readSalesInvoices } from '../../utils/salesInvoicesStore'
import { edocumentsApi } from '../../utils/edocumentsApi'
import { EdocAlert, EDocumentsSubnav, formatEdocError } from './eDocumentShared'
import {
  NILVERA_TEST_RECEIVER,
  NILVERA_TEST_SENDER,
  nilveraTestPartyFields,
} from '../../data/nilveraTestParties'

const FIELD =
  'w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-sm text-gray-200'

function Field({ label, children }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  )
}

function emptyLine(overrides = {}) {
  return {
    name: '',
    quantity: 1,
    unitType: 'C62',
    price: 0,
    kdvPercent: 20,
    allowanceTotal: 0,
    ...overrides,
  }
}

function partyFromCompany(company) {
  return {
    taxNumber: company.taxNumber || '',
    name: company.legalTitle || company.companyName || '',
    taxOffice: company.taxOffice || '',
    address: company.address || '',
    city: '',
    country: 'Türkiye',
    phone: company.phone || '',
    email: company.email || '',
    website: company.website || '',
  }
}

function partyFromCustomer(customer) {
  if (!customer) {
    return {
      taxNumber: '',
      name: '',
      taxOffice: '',
      address: '',
      city: '',
      country: 'Türkiye',
      phone: '',
      email: '',
    }
  }
  return {
    taxNumber: customer.taxNumber || customer.vergiNo || '',
    name: customer.company || customer.companyTitle || customer.name || '',
    taxOffice: customer.taxOffice || '',
    address: customer.address || '',
    city: customer.city || '',
    country: customer.country || 'Türkiye',
    phone: customer.phone || '',
    email: customer.email || '',
  }
}

export default function EDocumentComposePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invoiceId = params.get('invoiceId') || ''
  const customers = useMemo(() => getCustomerProfiles(), [])

  const [company, setCompany] = useState(() => partyFromCompany(readCompanySettings()))
  const [customer, setCustomer] = useState(() => partyFromCustomer(null))
  const [customerId, setCustomerId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [documentType, setDocumentType] = useState('auto')
  const [lines, setLines] = useState([emptyLine()])
  const [taxpayerHint, setTaxpayerHint] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const currency = 'TRY'

  useEffect(() => {
    setCompany(partyFromCompany(readCompanySettings()))
    if (!invoiceId) return
    const invoice = readSalesInvoices().find((row) => row.id === invoiceId)
    if (!invoice) return
    setInvoiceNo(invoice.invoiceNo || '')
    setIssueDate(
      String(invoice.issueDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    )
    setDueDate(String(invoice.dueDate || '').slice(0, 10))
    const profile = getCustomerProfiles().find((row) => row.id === invoice.customerId)
    setCustomerId(invoice.customerId || '')
    setCustomer(
      partyFromCustomer(
        profile
          ? { ...profile, company: invoice.customerName || profile.company }
          : { company: invoice.customerName },
      ),
    )
    setLines([
      emptyLine({
        name: invoice.title || invoice.invoiceNo || 'Satış faturası',
        quantity: 1,
        price: Number(invoice.totalAmount) || 0,
        kdvPercent: 0,
      }),
    ])
  }, [invoiceId])

  const preview = useMemo(() => {
    const net = lines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0
      const price = Number(line.price) || 0
      const allowance = Number(line.allowanceTotal) || 0
      return sum + Math.max(0, qty * price - allowance)
    }, 0)
    const kdv = lines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0
      const price = Number(line.price) || 0
      const allowance = Number(line.allowanceTotal) || 0
      const lineNet = Math.max(0, qty * price - allowance)
      return sum + lineNet * ((Number(line.kdvPercent) || 0) / 100)
    }, 0)
    return { net, kdv, payable: net + kdv }
  }, [lines])

  function selectCustomer(id) {
    setCustomerId(id)
    const profile = customers.find((row) => row.id === id)
    setCustomer(partyFromCustomer(profile))
  }

  async function lookupTaxpayer() {
    const taxNumber = String(customer.taxNumber || '').replace(/\D/g, '')
    if (taxNumber.length < 10) {
      setTaxpayerHint('')
      return
    }
    try {
      const data = await edocumentsApi.taxpayer(taxNumber)
      setTaxpayerHint(
        data.isEInvoiceTaxpayer
          ? `e-Fatura mükellefi${data.title ? ` · ${data.title}` : ''}`
          : 'e-Fatura kaydı yok → e-Arşiv önerilir',
      )
    } catch (err) {
      setTaxpayerHint(formatEdocError(err))
    }
  }

  function patchLine(index, key, value) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, [key]: value } : line)),
    )
  }

  async function submit(asDraft) {
    setBusy(true)
    setError('')
    try {
      if (!customer.name || !customer.taxNumber) {
        throw new Error('Fatura gönderilemedi. Nedeni: Alıcı unvan ve VKN/TCKN zorunludur.')
      }
      if (!lines.some((line) => String(line.name || '').trim())) {
        throw new Error('Fatura gönderilemedi. Nedeni: En az bir kalem girilmelidir.')
      }
      const payload = {
        invoiceNo: invoiceNo || undefined,
        issueDate,
        dueDate: dueDate || undefined,
        currency,
        notes: notes || undefined,
        company,
        customer,
        lines: lines
          .filter((line) => String(line.name || '').trim())
          .map((line) => ({
            name: line.name,
            quantity: Number(line.quantity) || 0,
            unitType: line.unitType || 'C62',
            price: Number(line.price) || 0,
            allowanceTotal: Number(line.allowanceTotal) || 0,
            kdvPercent: Number(line.kdvPercent) || 0,
          })),
      }
      const data = await edocumentsApi.create({
        invoiceId: invoiceId || undefined,
        asDraft,
        documentType,
        payload,
      })
      const id = data.document?.id
      if (id) navigate(`/e-belgeler/${id}`)
      else navigate('/e-belgeler/giden')
    } catch (err) {
      setError(formatEdocError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/e-belgeler" label="E-Belgeler" />}
        centerTitle="Yeni E-Fatura"
        showBack={false}
      />
      <EDocumentsSubnav />
      <AppPagePanel
        title="Fatura bilgileri"
        description={
          invoiceId
            ? `Satış faturası ${invoiceId} yüklendi. KDV ve VKN kontrol edin.`
            : 'Göndermeden önce VKN sorgusu belge türünü belirler.'
        }
      >
        <EdocAlert>{error}</EdocAlert>
        <div className="grid gap-6 lg:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="text-xs font-black uppercase tracking-wide text-gray-500">
              Gönderen şirket
            </legend>
            <button
              type="button"
              className="rounded-xl border border-dark-500/40 px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-300"
              onClick={() => setCompany(nilveraTestPartyFields(NILVERA_TEST_SENDER))}
            >
              Test Kurum 1’i gönderen yap
            </button>
            <Field label="Unvan">
              <input
                className={FIELD}
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </Field>
            <Field label="VKN/TCKN">
              <input
                className={FIELD}
                value={company.taxNumber}
                onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
              />
            </Field>
            <Field label="Vergi dairesi">
              <input
                className={FIELD}
                value={company.taxOffice}
                onChange={(e) => setCompany({ ...company, taxOffice: e.target.value })}
              />
            </Field>
            <Field label="Adres">
              <input
                className={FIELD}
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="text-xs font-black uppercase tracking-wide text-gray-500">
              Alıcı
            </legend>
            <button
              type="button"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-200"
              onClick={() => {
                setCustomerId('')
                setCustomer(nilveraTestPartyFields(NILVERA_TEST_RECEIVER))
                setDocumentType('e-fatura')
                setTaxpayerHint(
                  `Test Kurum 2 · VKN ${NILVERA_TEST_RECEIVER.taxNumber} · e-Fatura alıcısı (PK ${NILVERA_TEST_RECEIVER.aliasPk})`,
                )
                if (!lines.some((line) => String(line.name || '').trim())) {
                  setLines([
                    emptyLine({
                      name: 'Nilvera test kalemi',
                      quantity: 1,
                      price: 100,
                      kdvPercent: 20,
                    }),
                  ])
                }
              }}
            >
              Test Kurum 2’yi alıcı yap
            </button>
            <Field label="Kayıtlı müşteri">
              <select
                className={FIELD}
                value={customerId}
                onChange={(e) => selectCustomer(e.target.value)}
              >
                <option value="">Elle doldur / seç</option>
                {customers.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.company || row.companyTitle || row.name || row.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unvan">
              <input
                className={FIELD}
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </Field>
            <Field label="VKN/TCKN">
              <input
                className={FIELD}
                value={customer.taxNumber}
                onChange={(e) => setCustomer({ ...customer, taxNumber: e.target.value })}
                onBlur={() => void lookupTaxpayer()}
              />
            </Field>
            {taxpayerHint ? <p className="text-xs text-emerald-300">{taxpayerHint}</p> : null}
            <Field label="Vergi dairesi">
              <input
                className={FIELD}
                value={customer.taxOffice}
                onChange={(e) => setCustomer({ ...customer, taxOffice: e.target.value })}
              />
            </Field>
            <Field label="Adres">
              <input
                className={FIELD}
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              />
            </Field>
          </fieldset>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Belge no">
            <input
              className={FIELD}
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
          </Field>
          <Field label="Tarih">
            <input
              type="date"
              className={FIELD}
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </Field>
          <Field label="Vade">
            <input
              type="date"
              className={FIELD}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Belge türü">
            <select
              className={FIELD}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="auto">Otomatik (VKN sorgusu)</option>
              <option value="e-fatura">e-Fatura</option>
              <option value="e-arsiv">e-Arşiv</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Kalemler</p>
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-6">
              <input
                className={`${FIELD} sm:col-span-2`}
                placeholder="Ürün / hizmet"
                value={line.name}
                onChange={(e) => patchLine(index, 'name', e.target.value)}
              />
              <input
                className={FIELD}
                type="number"
                min="0"
                step="0.01"
                placeholder="Miktar"
                value={line.quantity}
                onChange={(e) => patchLine(index, 'quantity', e.target.value)}
              />
              <input
                className={FIELD}
                type="number"
                min="0"
                step="0.01"
                placeholder="Birim fiyat"
                value={line.price}
                onChange={(e) => patchLine(index, 'price', e.target.value)}
              />
              <input
                className={FIELD}
                type="number"
                min="0"
                step="1"
                placeholder="KDV %"
                value={line.kdvPercent}
                onChange={(e) => patchLine(index, 'kdvPercent', e.target.value)}
              />
              <button
                type="button"
                className="text-xs font-bold text-rose-300 disabled:opacity-40"
                disabled={lines.length === 1}
                onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
              >
                Sil
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-bold text-emerald-300"
            onClick={() => setLines((current) => [...current, emptyLine()])}
          >
            + Kalem ekle
          </button>
        </div>

        <Field label="Not">
          <textarea
            className={`${FIELD} mt-1`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div className="mt-4 rounded-xl border border-dark-500/40 bg-dark-900/40 p-4 text-sm">
          <p>Ara toplam: {formatTL(preview.net)}</p>
          <p>KDV: {formatTL(preview.kdv)}</p>
          <p className="font-black">Ödenecek: {formatTL(preview.payable)}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">Para birimi: {currency}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${BTN_SUCCESS} px-4 text-xs`}
            disabled={busy}
            onClick={() => submit(true)}
          >
            Taslak kaydet
          </button>
          <button
            type="button"
            className={`${BTN_PRIMARY} px-4 text-xs`}
            disabled={busy}
            onClick={() => submit(false)}
          >
            Gönder
          </button>
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Önizleme Bachmain verisidir. Resmî PDF, taslak kaydedildikten sonra belge detayından
          Nilvera üzerinden alınır.
        </p>
      </AppPagePanel>
    </AppPageShell>
  )
}
