import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { saveCustomerProfile } from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { resolveCustomerContactInfo } from '../../utils/customerContacts'
import {
  CUSTOMER_META_KEY,
  readCustomerMeta,
  readOptionLists,
  saveOptionList,
} from '../../utils/customerMeta'
import EditableDropdownPill from '../EditableDropdownPill'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

const FIELD_LABEL = 'mb-1.5 block text-[12px] font-black uppercase tracking-wider text-gray-500'
const PILL_CLASS =
  'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-dark-500/50 bg-dark-700 px-3 text-xs font-bold transition-colors hover:bg-dark-700/80'

function buildFormState(customer) {
  const display = getCustomerDisplay(customer)
  const contactInfo = resolveCustomerContactInfo(customer)
  const savedMeta = readCustomerMeta()[customer.id] || {}

  return {
    shortBrandName: display.brandShortName || '',
    companyTitle: display.companyTitle || customer.company || '',
    taxOffice: customer.taxOffice || '',
    taxNumber: customer.taxNumber || '',
    address: customer.address || '',
    city: customer.city || '',
    warehouse: customer.warehouse || '',
    contactName: contactInfo.contactName || '',
    phone: contactInfo.phone || '',
    email: contactInfo.email || '',
    type: savedMeta.type || '',
    representative: savedMeta.representative || customer.owner || '',
    scoring: savedMeta.scoring || '',
    category: savedMeta.category || '',
  }
}

function buildContacts(customer, form) {
  const baseContacts = Array.isArray(customer.contacts) ? [...customer.contacts] : []
  const authorizedIndex = baseContacts.findIndex((row) => row.id === 'authorized')
  const authorized = {
    id: 'authorized',
    title: 'Yetkili Kişi',
    name: form.contactName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
  }

  if (authorizedIndex >= 0) {
    baseContacts[authorizedIndex] = { ...baseContacts[authorizedIndex], ...authorized }
    return baseContacts
  }

  return [authorized, ...baseContacts]
}

function persistCustomerMeta(customerId, meta) {
  if (!customerId) return
  const current = readCustomerMeta()
  localStorage.setItem(CUSTOMER_META_KEY, JSON.stringify({
    ...current,
    [customerId]: {
      ...(current[customerId] || {}),
      type: meta.type,
      representative: meta.representative,
      scoring: meta.scoring,
      category: meta.category,
    },
  }))
  window.dispatchEvent(new CustomEvent('bach:customer-meta-updated'))
}

export default function CustomerQuickEditModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState(() => buildFormState(customer))
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    setForm(buildFormState(customer))
  }, [customer])

  useEffect(() => {
    if (!activeMenu) return undefined
    function closeActiveMenu() {
      setActiveMenu(null)
    }
    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateOptionList(field, nextOptions) {
    setOptionLists((current) => ({ ...current, [field]: nextOptions }))
    saveOptionList(field, nextOptions)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const companyTitle = form.companyTitle.trim() || form.shortBrandName.trim()
    if (!companyTitle) {
      window.alert('Firma ünvanı veya kısa marka adı zorunludur.')
      return
    }

    const savedProfile = saveCustomerProfile({
      ...customer,
      company: companyTitle,
      companyTitle,
      shortBrandName: form.shortBrandName.trim() || getCustomerDisplay(companyTitle).brandShortName,
      taxOffice: form.taxOffice.trim(),
      taxNumber: form.taxNumber.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      warehouse: form.warehouse.trim(),
      contacts: buildContacts(customer, form),
      contact: form.contactName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      owner: form.representative.trim() || customer.owner || '',
    })

    persistCustomerMeta(savedProfile.id, {
      type: form.type,
      representative: form.representative,
      scoring: form.scoring,
      category: form.category,
    })

    window.dispatchEvent(new CustomEvent('bach:customers-updated'))
    onSaved(savedProfile)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dark-500/50 bg-dark-800 shadow-card">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-dark-500/45 bg-dark-800 px-5 py-3.5">
          <h2 className="text-base font-bold text-white">Müşteri Düzenle</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-dark-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL}>Kısa Marka Adı</label>
              <input value={form.shortBrandName} onChange={(event) => updateField('shortBrandName', event.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>Firma Ünvanı</label>
              <input value={form.companyTitle} onChange={(event) => updateField('companyTitle', event.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>Vergi Dairesi</label>
              <input value={form.taxOffice} onChange={(event) => updateField('taxOffice', event.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>Vergi Numarası</label>
              <input value={form.taxNumber} onChange={(event) => updateField('taxNumber', event.target.value)} className="form-input text-sm" inputMode="numeric" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={FIELD_LABEL}>Detaylı Adres</label>
              <textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} rows={2} className="form-input resize-none text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>İl / İlçe</label>
              <input value={form.city} onChange={(event) => updateField('city', event.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>Depo</label>
              <input value={form.warehouse} onChange={(event) => updateField('warehouse', event.target.value)} className="form-input text-sm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={FIELD_LABEL}>Yetkili Kişi</label>
              <input value={form.contactName} onChange={(event) => updateField('contactName', event.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>Telefon</label>
              <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className={FIELD_LABEL}>E-posta</label>
              <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className="form-input text-sm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL}>Tip</label>
              <EditableDropdownPill
                value={form.type}
                options={optionLists.type}
                onOptionsChange={(next) => updateOptionList('type', next)}
                openKey="quick-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateField('type', value)}
                buttonClassName={PILL_CLASS}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Temsilci</label>
              <EditableDropdownPill
                value={form.representative}
                options={optionLists.representative}
                onOptionsChange={(next) => updateOptionList('representative', next)}
                openKey="quick-representative"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateField('representative', value)}
                buttonClassName={PILL_CLASS}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Puantaj</label>
              <EditableDropdownPill
                value={form.scoring}
                options={optionLists.scoring}
                onOptionsChange={(next) => updateOptionList('scoring', next)}
                openKey="quick-scoring"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateField('scoring', value)}
                buttonClassName={PILL_CLASS}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Kategori</label>
              <EditableDropdownPill
                value={form.category}
                options={optionLists.category}
                onOptionsChange={(next) => updateOptionList('category', next)}
                openKey="quick-category"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateField('category', value)}
                buttonClassName={PILL_CLASS}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-dark-500/30 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-bold text-gray-300">
              Vazgeç
            </button>
            <button type="submit" className={`${BTN_PRIMARY} gap-1.5 px-4 py-2.5 text-sm`}>
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
