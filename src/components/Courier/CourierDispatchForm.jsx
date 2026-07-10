import { useEffect, useMemo, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import EditableDropdownPill from '../EditableDropdownPill'
import { getCustomerProfiles } from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { formatCustomerAddress, getCustomerCoordinates } from '../../utils/customerGeo'
import { VEHICLE_TYPES } from '../../utils/courierStore'

const PRIORITY_OPTIONS = [
  { label: 'Normal' },
  { label: 'Acil' },
  { label: 'Aynı Gün' },
]

export default function CourierDispatchForm({ fleet = [], onSubmit, submitting = false }) {
  const customers = useMemo(() => getCustomerProfiles(), [])
  const [form, setForm] = useState({
    customerId: customers[0]?.id || '',
    vehicleType: 'motor',
    vehicleId: '',
    referenceNo: '',
    packageNote: '',
    priority: 'Normal',
    sharedWithCustomer: true,
  })

  const customerOptions = customers.map((customer) => {
    const display = getCustomerDisplay(customer)
    return {
      label: display.brandShortName || display.companyTitle,
      customerId: customer.id,
    }
  })

  const availableFleet = useMemo(() => fleet.filter((item) => {
    if (item.status !== 'available') return false
    if (form.vehicleType && item.vehicleType !== form.vehicleType) return false
    return true
  }), [fleet, form.vehicleType])

  useEffect(() => {
    if (!form.vehicleId && availableFleet[0]) {
      setForm((current) => ({ ...current, vehicleId: availableFleet[0].id }))
    }
  }, [availableFleet, form.vehicleId])

  const vehicleOptions = availableFleet.map((item) => ({
    label: `${item.name} · ${item.courierName}`,
    vehicleId: item.id,
  }))

  const selectedCustomerOption = customerOptions.find((item) => item.customerId === form.customerId)
  const selectedVehicleOption = vehicleOptions.find((item) => item.vehicleId === form.vehicleId)
  const selectedCustomer = customers.find((item) => item.id === form.customerId)
  const previewAddress = selectedCustomer ? formatCustomerAddress(selectedCustomer) : ''

  function handleVehicleTypeChange(vehicleType) {
    const nextFleet = fleet.filter((item) => item.status === 'available' && item.vehicleType === vehicleType)
    setForm((current) => ({
      ...current,
      vehicleType,
      vehicleId: nextFleet[0]?.id || '',
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.vehicleId || !form.customerId) return
    const customer = customers.find((item) => item.id === form.customerId)
    onSubmit?.({
      ...form,
      customerName: customer ? (getCustomerDisplay(customer).brandShortName || getCustomerDisplay(customer).companyTitle) : '',
      customerPhone: customer?.phone || customer?.mobile || '',
      address: customer ? formatCustomerAddress(customer) : '',
      destination: customer ? getCustomerCoordinates(customer) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Araç Tipi</p>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TYPES.map((type) => {
            const active = form.vehicleType === type.id
            const count = fleet.filter((item) => item.vehicleType === type.id && item.status === 'available').length
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleVehicleTypeChange(type.id)}
                className={`rounded-xl border px-2 py-3 text-center transition-all ${
                  active
                    ? 'border-white/20 bg-dark-700 text-white'
                    : 'border-dark-500/50 bg-dark-800/50 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="text-lg">{type.emoji}</div>
                <div className="mt-1 text-[12px] font-bold">{type.shortLabel}</div>
                <div className="mt-0.5 text-[11px] text-gray-500">{count} müsait</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Müşteri</span>
          <EditableDropdownPill
            value={selectedCustomerOption?.label || ''}
            options={customerOptions}
            onChange={(label) => {
              const match = customerOptions.find((item) => item.label === label)
              setForm((current) => ({ ...current, customerId: match?.customerId || '' }))
            }}
            placeholder="Müşteri seçin"
            editable={false}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Kurye / Araç</span>
          <EditableDropdownPill
            value={selectedVehicleOption?.label || ''}
            options={vehicleOptions}
            onChange={(label) => {
              const match = vehicleOptions.find((item) => item.label === label)
              setForm((current) => ({ ...current, vehicleId: match?.vehicleId || '' }))
            }}
            placeholder={vehicleOptions.length ? 'Araç seçin' : 'Müsait araç yok'}
            editable={false}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Referans No</span>
            <input
              value={form.referenceNo}
              onChange={(event) => setForm((current) => ({ ...current, referenceNo: event.target.value }))}
              placeholder="SIP-2401"
              className="w-full rounded-xl border border-dark-500/50 bg-dark-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Öncelik</span>
            <EditableDropdownPill
              value={form.priority}
              options={PRIORITY_OPTIONS}
              onChange={(priority) => setForm((current) => ({ ...current, priority }))}
              editable={false}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Paket Notu</span>
          <textarea
            value={form.packageNote}
            onChange={(event) => setForm((current) => ({ ...current, packageNote: event.target.value }))}
            rows={3}
            placeholder="Kırılabilir ürün, kapıda teslim..."
            className="w-full rounded-xl border border-dark-500/50 bg-dark-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
          />
        </label>

        {previewAddress && (
          <div className="rounded-xl border border-dark-500/40 bg-dark-900/50 px-3 py-2.5 text-xs text-gray-400">
            <span className="font-bold text-gray-300">Teslimat adresi: </span>
            {previewAddress}
          </div>
        )}

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300">
          <input
            type="checkbox"
            checked={form.sharedWithCustomer}
            onChange={(event) => setForm((current) => ({ ...current, sharedWithCustomer: event.target.checked }))}
            className="rounded border-dark-500 bg-dark-900"
          />
          Oluşturulunca müşteriye takip linki hazırla
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || !form.vehicleId || !form.customerId}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? <Truck className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
        Gönderi Oluştur ve Ata
      </button>
    </form>
  )
}
