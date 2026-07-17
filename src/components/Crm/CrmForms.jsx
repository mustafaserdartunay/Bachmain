import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import EditableDropdownPill from '../EditableDropdownPill'
import DateRangePicker from '../Common/DateRangePicker'
import CrmCustomerSearchField from './CrmCustomerSearchField'
import {
  appointmentStatusOptions,
  appointmentTypeOptions,
  LIST_PILL_CLASS,
  noteColorOptions,
  priorityOptions,
} from '../../utils/crmMeta'
import {
  getCrmTemplateCategoryOptions,
  getCrmTemplateStageOptions,
  resolveTaskFormStatus,
} from '../../utils/crmProcessHelpers'
import { resolveCustomerRepresentative, readOptionLists } from '../../utils/customerMeta'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

const FIELD_LABEL = 'mb-1.5 block text-[12px] font-black uppercase tracking-wider text-gray-500'

const HEADER_POPOVER_BTN_CANCEL =
  'btn-cancel !h-9 !min-h-9 min-w-[5.5rem] px-4 text-[12px] font-bold'

const HEADER_POPOVER_BTN_SUBMIT =
  'inline-flex h-9 min-w-[5.5rem] items-center justify-center rounded-xl bg-gradient-to-br from-[#7cf2c6] via-[#34d399] to-[#10b981] px-4 text-[12px] font-bold text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5'

const HEADER_POPOVER_ICON_BTN =
  'inline-flex shrink-0 items-center justify-center p-0 text-[#f43f5e] transition-colors hover:text-[#e11d48]'

function Modal({ title, onClose, children, wide, large, fullPage, panelClassName = '', compact = false }) {
  if (fullPage) {
    return (
      <div className={`flex h-full flex-col ${compact ? 'min-h-0' : 'min-h-[520px]'}`}>
        <div className={`flex shrink-0 items-center justify-between border-b border-dark-500/45 ${compact ? 'px-4 py-2.5' : 'px-5 py-3.5'}`}>
          <h2 className={compact ? 'text-xs font-extrabold text-white' : 'text-base font-bold text-white'}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={compact ? HEADER_POPOVER_ICON_BTN : 'rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-dark-700 hover:text-white'}
          >
            <X className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
        </div>
        <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${compact ? '' : 'overflow-y-auto p-5'}`}>{children}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-dark-500/50 bg-dark-800 shadow-card ${large ? 'max-w-4xl' : wide ? 'max-w-2xl' : 'max-w-lg'} ${panelClassName}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-dark-500/45 bg-dark-800 px-5 py-3.5">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-dark-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function DropdownField({ label, value, onChange, options, openKey, activeMenu, setActiveMenu, placeholder }) {
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <EditableDropdownPill
        value={value}
        onChange={onChange}
        options={options}
        openKey={openKey}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        placeholder={placeholder}
        editable={false}
        buttonClassName={LIST_PILL_CLASS}
      />
    </div>
  )
}

export function TaskFormModal({ initial, onClose, onSubmit, fullPage = false, compact = false }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    dateFrom: initial.dateFrom || initial.dueDate || '',
    dateTo: initial.dateTo || '',
    timeFrom: initial.timeFrom || '',
    timeTo: initial.timeTo || '',
    includeTime: Boolean(initial.includeTime || initial.timeFrom || initial.timeTo),
  }))
  const [activeMenu, setActiveMenu] = useState(null)
  const [assigneeTouched, setAssigneeTouched] = useState(false)
  const [representativeOptions, setRepresentativeOptions] = useState(() => readOptionLists().representative)
  const [categoryOptions, setCategoryOptions] = useState(() => getCrmTemplateCategoryOptions())
  const isEdit = Boolean(form.id)

  const statusOptions = useMemo(
    () => getCrmTemplateStageOptions(form.category || categoryOptions[0]?.label || 'Genel'),
    [form.category, categoryOptions],
  )

  useEffect(() => {
    function refreshTemplates() {
      setCategoryOptions(getCrmTemplateCategoryOptions())
    }
    window.addEventListener('bach:crm-process-templates-updated', refreshTemplates)
    return () => window.removeEventListener('bach:crm-process-templates-updated', refreshTemplates)
  }, [])

  useEffect(() => {
    if (!statusOptions.length) return
    if (statusOptions.some((option) => option.label === form.status)) return
    setForm((current) => ({ ...current, status: statusOptions[0].label }))
  }, [form.status, statusOptions])

  useEffect(() => {
    function refreshRepresentatives() {
      setRepresentativeOptions(readOptionLists().representative)
    }
    window.addEventListener('bach:option-lists-updated', refreshRepresentatives)
    window.addEventListener('bach:customer-meta-updated', refreshRepresentatives)
    return () => {
      window.removeEventListener('bach:option-lists-updated', refreshRepresentatives)
      window.removeEventListener('bach:customer-meta-updated', refreshRepresentatives)
    }
  }, [])

  useEffect(() => {
    if (!activeMenu) return undefined
    function close() { setActiveMenu(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  useEffect(() => {
    if (isEdit || assigneeTouched || !form.customer?.trim()) return
    const representative = resolveCustomerRepresentative(form.customer)
    if (!representative) return
    setForm((current) => (
      current.assignee === representative ? current : { ...current, assignee: representative }
    ))
  }, [form.customer, isEdit, assigneeTouched])

  useEffect(() => {
    if (isEdit || assigneeTouched || !form.customer?.trim()) return undefined
    function syncRepresentative() {
      const representative = resolveCustomerRepresentative(form.customer)
      if (!representative) return
      setForm((current) => (
        current.assignee === representative ? current : { ...current, assignee: representative }
      ))
    }
    window.addEventListener('bach:customer-meta-updated', syncRepresentative)
    return () => window.removeEventListener('bach:customer-meta-updated', syncRepresentative)
  }, [form.customer, isEdit, assigneeTouched])

  function handleCustomerChange(next) {
    setAssigneeTouched(false)
    setForm((current) => {
      const customer = next.customer ?? current.customer
      if (next.representative) {
        return {
          ...current,
          customer,
          ...(next.contact !== undefined ? { contact: next.contact } : {}),
          assignee: next.representative,
        }
      }
      return {
        ...current,
        customer,
        ...(next.contact !== undefined ? { contact: next.contact } : {}),
        assignee: customer.trim() ? current.assignee : '',
      }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      dueDate: form.dateFrom || form.dueDate || new Date().toISOString().slice(0, 10),
    })
  }

  const gridGap = compact ? 'gap-2.5' : 'gap-4'

  const fields = (
    <>
      <div>
        <label className={FIELD_LABEL}>Görev Başlığı</label>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Örn. Teklif revizyonu gönder"
          className="form-input text-sm"
          required
        />
      </div>

      <div className={`grid ${gridGap} sm:grid-cols-2`}>
        <CrmCustomerSearchField
          value={form.customer}
          onChange={handleCustomerChange}
        />
        <DropdownField
          label="Müşteri temsilcisi"
          value={form.assignee}
          onChange={(value) => {
            setAssigneeTouched(true)
            setForm((current) => ({ ...current, assignee: value }))
          }}
          options={representativeOptions}
          openKey="task-assignee"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          placeholder="Sorumlu seçin"
        />
      </div>

      <div className={`grid ${gridGap} grid-cols-3`}>
        <DropdownField
          label="Öncelik"
          value={form.priority}
          onChange={(value) => setForm((current) => ({ ...current, priority: value }))}
          options={priorityOptions}
          openKey="task-priority"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <DropdownField
          label="Durum"
          value={form.status}
          onChange={(value) => setForm((current) => ({ ...current, status: value }))}
          options={statusOptions}
          openKey="task-status"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <DropdownField
          label="Kategori"
          value={form.category || categoryOptions[0]?.label || 'Genel'}
          onChange={(value) => setForm((current) => {
            const nextStatusOptions = getCrmTemplateStageOptions(value)
            const nextStatus = nextStatusOptions.some((option) => option.label === current.status)
              ? current.status
              : nextStatusOptions[0]?.label || ''
            return { ...current, category: value, status: nextStatus }
          })}
          options={categoryOptions}
          openKey="task-category"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Başlangıç / Bitiş Tarihi</label>
        <DateRangePicker
          dateFrom={form.dateFrom || form.dueDate || ''}
          dateTo={form.dateTo || ''}
          timeFrom={form.timeFrom || ''}
          timeTo={form.timeTo || ''}
          includeTime={Boolean(form.includeTime)}
          onChange={(value) => setForm((current) => ({
            ...current,
            ...value,
            dueDate: value.dateFrom || current.dueDate,
          }))}
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Detaylı Açıklama</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Görev kapsamı, beklenen çıktı ve notlar..."
          className={`form-input resize-none text-sm ${compact ? 'min-h-16' : 'min-h-28'}`}
          rows={compact ? 2 : undefined}
        />
      </div>
    </>
  )

  const footer = (
    <div className={`flex items-center justify-end gap-2.5 ${compact ? 'shrink-0 border-t border-[rgba(140,145,165,0.14)] px-4 py-3' : 'pt-1'}`}>
      <button
        type="button"
        onClick={onClose}
        className={compact ? HEADER_POPOVER_BTN_CANCEL : 'btn-cancel px-4 text-xs font-bold'}
      >
        Vazgeç
      </button>
      <button
        type="submit"
        className={compact ? HEADER_POPOVER_BTN_SUBMIT : `${BTN_PRIMARY} gap-1.5 px-4 py-2.5 text-sm`}
      >
        {isEdit ? 'Güncelle' : compact ? 'Oluştur' : 'Görev Oluştur'}
      </button>
    </div>
  )

  return (
    <Modal title={isEdit ? 'Görev Düzenle' : 'Görev Oluştur'} onClose={onClose} wide fullPage={fullPage} compact={compact}>
      <form
        onSubmit={handleSubmit}
        className={compact ? 'flex min-h-0 flex-1 flex-col' : 'space-y-4'}
      >
        {compact ? (
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {fields}
          </div>
        ) : (
          fields
        )}
        {footer}
      </form>
    </Modal>
  )
}

export function AppointmentFormModal({ initial, onClose, onSubmit, fullPage = false, compact = false }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    dateFrom: initial.dateFrom || initial.date || '',
    dateTo: initial.dateTo || (initial.id ? initial.date : '') || '',
    timeFrom: initial.timeFrom || initial.startTime || '',
    timeTo: initial.timeTo || (initial.id ? initial.endTime : '') || '',
    includeTime: initial.includeTime ?? Boolean(initial.startTime || initial.endTime),
  }))
  const [activeMenu, setActiveMenu] = useState(null)
  const [assigneeTouched, setAssigneeTouched] = useState(false)
  const [representativeOptions, setRepresentativeOptions] = useState(() => readOptionLists().representative)
  const isEdit = Boolean(form.id)

  useEffect(() => {
    function refreshRepresentatives() {
      setRepresentativeOptions(readOptionLists().representative)
    }
    window.addEventListener('bach:option-lists-updated', refreshRepresentatives)
    window.addEventListener('bach:customer-meta-updated', refreshRepresentatives)
    return () => {
      window.removeEventListener('bach:option-lists-updated', refreshRepresentatives)
      window.removeEventListener('bach:customer-meta-updated', refreshRepresentatives)
    }
  }, [])

  useEffect(() => {
    if (!activeMenu) return undefined
    function close() { setActiveMenu(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  useEffect(() => {
    if (isEdit || assigneeTouched || !form.customer?.trim()) return
    const representative = resolveCustomerRepresentative(form.customer)
    if (!representative) return
    setForm((current) => (
      current.assignee === representative ? current : { ...current, assignee: representative }
    ))
  }, [form.customer, isEdit, assigneeTouched])

  useEffect(() => {
    if (isEdit || assigneeTouched || !form.customer?.trim()) return undefined
    function syncRepresentative() {
      const representative = resolveCustomerRepresentative(form.customer)
      if (!representative) return
      setForm((current) => (
        current.assignee === representative ? current : { ...current, assignee: representative }
      ))
    }
    window.addEventListener('bach:customer-meta-updated', syncRepresentative)
    return () => window.removeEventListener('bach:customer-meta-updated', syncRepresentative)
  }, [form.customer, isEdit, assigneeTouched])

  function handleCustomerChange(next) {
    setAssigneeTouched(false)
    setForm((current) => {
      const customer = next.customer ?? current.customer
      if (next.representative) {
        return {
          ...current,
          customer,
          contact: next.contact ?? current.contact,
          assignee: next.representative,
        }
      }
      return {
        ...current,
        customer,
        contact: next.contact ?? current.contact,
        assignee: customer.trim() ? current.assignee : '',
      }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    const dateFrom = form.dateFrom || form.date || new Date().toISOString().slice(0, 10)
    const dateTo = form.dateTo || ''
    const timeFrom = form.includeTime ? form.timeFrom || form.startTime || '' : ''
    const timeTo = form.includeTime ? form.timeTo || form.endTime || '' : ''
    onSubmit({
      ...form,
      date: dateFrom,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      startTime: timeFrom,
      endTime: timeTo,
    })
  }

  const gridGap = compact ? 'gap-2.5' : 'gap-4'

  const fields = (
    <>
      <div>
        <label className={FIELD_LABEL}>Randevu Başlığı</label>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Örn. Teklif sunumu"
          className="form-input text-sm"
          required
        />
      </div>

      <div className={`grid ${gridGap} sm:grid-cols-2`}>
        <CrmCustomerSearchField
          value={form.customer}
          onChange={handleCustomerChange}
        />
        <div>
          <label className={FIELD_LABEL}>İlgili Kişi</label>
          <input
            value={form.contact}
            onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
            placeholder="Yetkili adı"
            className="form-input text-sm"
          />
        </div>
      </div>

      <div className={`grid ${gridGap} grid-cols-3`}>
        <DropdownField
          label="Tür"
          value={form.type}
          onChange={(value) => setForm((current) => ({ ...current, type: value }))}
          options={appointmentTypeOptions}
          openKey="apt-type"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <DropdownField
          label="Durum"
          value={form.status}
          onChange={(value) => setForm((current) => ({ ...current, status: value }))}
          options={appointmentStatusOptions}
          openKey="apt-status"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <DropdownField
          label="Müşteri temsilcisi"
          value={form.assignee}
          onChange={(value) => {
            setAssigneeTouched(true)
            setForm((current) => ({ ...current, assignee: value }))
          }}
          options={representativeOptions}
          openKey="apt-assignee"
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Başlangıç / Bitiş Tarihi</label>
        <DateRangePicker
          dateFrom={form.dateFrom || form.date || ''}
          dateTo={form.dateTo || ''}
          timeFrom={form.timeFrom || form.startTime || ''}
          timeTo={form.timeTo || ''}
          includeTime={Boolean(form.includeTime)}
          dateLabelFormat="numeric"
          showTimeInLabel={false}
          onChange={(value) => setForm((current) => ({
            ...current,
            ...value,
            date: value.dateFrom || current.date,
            startTime: value.includeTime ? value.timeFrom || '' : '',
            endTime: value.includeTime ? value.timeTo || '' : '',
          }))}
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Konum / Bağlantı</label>
        <input
          value={form.location}
          onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
          placeholder="Ofis, fabrika, Teams linki..."
          className="form-input text-sm"
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Randevu Notları</label>
        <textarea
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Gündem maddeleri, hazırlık notları..."
          className={`form-input resize-none text-sm ${compact ? 'min-h-16' : 'min-h-24'}`}
          rows={compact ? 2 : undefined}
        />
      </div>
    </>
  )

  const footer = (
    <div className={`flex items-center justify-end gap-2.5 ${compact ? 'shrink-0 border-t border-[rgba(140,145,165,0.14)] px-4 py-3' : 'pt-1'}`}>
      <button
        type="button"
        onClick={onClose}
        className={compact ? HEADER_POPOVER_BTN_CANCEL : 'btn-cancel px-4 text-xs font-bold'}
      >
        Vazgeç
      </button>
      <button
        type="submit"
        className={compact ? HEADER_POPOVER_BTN_SUBMIT : `${BTN_PRIMARY} gap-1.5 px-4 py-2.5 text-sm`}
      >
        {isEdit ? 'Güncelle' : compact ? 'Oluştur' : 'Randevu Oluştur'}
      </button>
    </div>
  )

  return (
    <Modal
      title={isEdit ? 'Randevu Düzenle' : 'Randevu Oluştur'}
      onClose={onClose}
      wide
      fullPage={fullPage}
      compact={compact}
      panelClassName={compact ? '' : 'h-[593px]'}
    >
      <form
        onSubmit={handleSubmit}
        className={compact ? 'flex min-h-0 flex-1 flex-col' : 'space-y-4'}
      >
        {compact ? (
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {fields}
          </div>
        ) : (
          fields
        )}
        {footer}
      </form>
    </Modal>
  )
}

export function NoteFormModal({ initial, onClose, onSubmit, fullPage = false }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    date: initial.date || new Date().toISOString().slice(0, 10),
    dateFrom: initial.dateFrom || initial.date || new Date().toISOString().slice(0, 10),
    dateTo: initial.dateTo || '',
    timeFrom: initial.timeFrom || initial.time || '',
    timeTo: initial.timeTo || '',
    includeTime: Boolean(initial.includeTime || initial.timeFrom || initial.timeTo || initial.time),
  }))
  const [activeMenu, setActiveMenu] = useState(null)
  const isEdit = Boolean(form.id)

  useEffect(() => {
    if (!activeMenu) return undefined
    function close() { setActiveMenu(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      date: form.date || new Date().toISOString().slice(0, 10),
      time: form.includeTime ? form.timeFrom || '' : '',
    })
  }

  return (
    <Modal title={isEdit ? 'Not Düzenle' : 'Not Oluştur'} onClose={onClose} wide fullPage={fullPage} panelClassName="h-[593px]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={FIELD_LABEL}>Not Başlığı</label>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Kısa başlık"
            className="form-input text-sm"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className={FIELD_LABEL}>Oluşturulma Tarihi</label>
            <input type="date" value={form.date || ''} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="form-input text-sm" />
          </div>
          <DropdownField
            label="Renk"
            value={form.color}
            onChange={(value) => setForm((current) => ({ ...current, color: value }))}
            options={noteColorOptions}
            openKey="note-color"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Başlangıç / Bitiş Tarihi</label>
          <DateRangePicker
            dateFrom={form.dateFrom || form.date || ''}
            dateTo={form.dateTo || ''}
            timeFrom={form.timeFrom || ''}
            timeTo={form.timeTo || ''}
            includeTime={Boolean(form.includeTime)}
            dateLabelFormat="numeric"
            showTimeInLabel={false}
            onChange={(value) => setForm((current) => ({
              ...current,
              ...value,
              date: value.dateFrom || current.date,
            }))}
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Not İçeriği</label>
          <textarea
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            placeholder="Ajandaya eklenecek detaylı not..."
            className="form-input min-h-24 resize-none text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-cancel px-4 text-xs font-bold">
            Vazgeç
          </button>
          <button type="submit" className={`${BTN_PRIMARY} gap-1.5 px-4 py-2.5 text-sm`}>
            {isEdit ? 'Güncelle' : 'Not Ekle'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function emptyTaskForm() {
  const categories = getCrmTemplateCategoryOptions()
  const category = categories[0]?.label || 'Genel'
  const statusOptions = getCrmTemplateStageOptions(category)
  return {
    title: '',
    description: '',
    customer: '',
    assignee: '',
    priority: 'Normal',
    status: statusOptions[0]?.label || 'Beklemede',
    category,
    dueDate: new Date().toISOString().slice(0, 10),
  }
}

export function normalizeTaskForm(task) {
  const category = task.category || getCrmTemplateCategoryOptions()[0]?.label || 'Genel'
  return {
    ...task,
    category,
    status: resolveTaskFormStatus(task, category),
  }
}

export function emptyAppointmentForm() {
  return {
    title: '',
    customer: '',
    contact: '',
    type: 'Toplantı',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    notes: '',
    status: 'Planlandı',
    assignee: '',
  }
}

export function emptyNoteForm(date) {
  return {
    title: '',
    content: '',
    date: date || new Date().toISOString().slice(0, 10),
    time: '',
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    includeTime: false,
    color: 'Mavi',
  }
}
