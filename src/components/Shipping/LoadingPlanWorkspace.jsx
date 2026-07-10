import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  FileDown,
  Globe,
  MapPin,
  Package,
  Receipt,
  Scale,
  Truck,
  User,
} from 'lucide-react'
import BarcodeSlipPanel from './BarcodeSlipPanel'
import CargoLoadScene from './CargoLoadScene'
import LoadingWizardStepper, { STEPS } from './LoadingWizardStepper'
import SummaryMetrics from '../Common/SummaryMetrics'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../Layout/AppPageLayout'
import { SHIPPING_HOME_PATH } from '../../data/shippingMenu'
import {
  SHIPPING_LANGUAGES,
  SHIPPING_SCOPES,
  SHIPPING_VEHICLE_MODELS,
  SIZE_PRESETS,
  VEHICLE_CATEGORIES,
} from '../../utils/shippingConstants'
import { buildCargoPlacements, summarizeLoading } from '../../utils/shippingCalculations'
import { downloadInvoiceFile, saveShippingLoading } from '../../utils/shippingStore'
import { translateLive } from '../../utils/shippingI18n'

const DEFAULT_ORIGIN = 'İstanbul Merkez Depo'

function CapacityBadge({ status }) {
  if (status === 'over') {
    return <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">Kapasite aşıldı</span>
  }
  if (status === 'warn') {
    return <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">Sınırda — dikkat</span>
  }
  return <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">Plan uygun</span>
}

export default function LoadingPlanWorkspace() {
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [category, setCategory] = useState('tir')
  const [vehicleId, setVehicleId] = useState('mega-tir')
  const [loadMode, setLoadMode] = useState('koli')
  const [sizePreset, setSizePreset] = useState('50')
  const [completed, setCompleted] = useState(null)
  const [lang, setLang] = useState('tr')
  const [scope, setScope] = useState('domestic')
  const [distanceKm, setDistanceKm] = useState(420)
  const [customerName, setCustomerName] = useState('')
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN)
  const [destination, setDestination] = useState('Ankara Dağıtım Merkezi')
  const [cargo, setCargo] = useState({
    name: 'Karton Koli',
    widthCm: 50,
    lengthCm: 60,
    heightCm: 40,
    weightKg: 20,
    quantity: 48,
  })

  const vehicle = useMemo(() => SHIPPING_VEHICLE_MODELS.find((item) => item.id === vehicleId), [vehicleId])
  const categoryModels = useMemo(
    () => SHIPPING_VEHICLE_MODELS.filter((item) => item.category === category),
    [category],
  )
  const items = useMemo(() => [{
    id: 'cargo-main',
    name: cargo.name,
    loadMode,
    widthCm: cargo.widthCm,
    lengthCm: cargo.lengthCm,
    heightCm: cargo.heightCm,
    weightKg: cargo.weightKg,
    quantity: cargo.quantity,
  }], [cargo, loadMode])

  const summary = useMemo(
    () => summarizeLoading({ vehicleId, distanceKm, items, cargoCalculated: step >= 2 }),
    [vehicleId, distanceKm, items, step],
  )
  const layout = useMemo(() => buildCargoPlacements(items, vehicle), [items, vehicle])

  function goTo(nextStep) {
    setStep(nextStep)
    setMaxStep((current) => Math.max(current, nextStep))
  }

  function applyPreset(presetId) {
    const preset = SIZE_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setSizePreset(presetId)
    setCargo((current) => ({
      ...current,
      widthCm: preset.widthCm,
      lengthCm: preset.lengthCm,
      heightCm: preset.heightCm,
    }))
  }

  function handleScopeChange(nextScope) {
    setScope(nextScope)
    if (nextScope === 'international') setDestination('Berlin Dağıtım Merkezi')
    else setDestination('Ankara Dağıtım Merkezi')
  }

  function handleComplete() {
    const form = {
      language: lang,
      scope,
      vehicleId,
      distanceKm,
      customerName: customerName || 'Müşteri',
      items,
      origin,
      destination,
    }
    const record = saveShippingLoading(form)
    setCompleted(record)
    downloadInvoiceFile(record, lang)
    goTo(3)
  }

  const canNext = step === 0
    ? customerName.trim().length > 1 && origin.trim() && destination.trim() && distanceKm > 0
    : step === 1
      ? Boolean(vehicleId)
      : step === 2
        ? cargo.quantity > 0 && cargo.weightKg > 0 && (loadMode === 'palet' || (cargo.widthCm > 0 && cargo.lengthCm > 0 && cargo.heightCm > 0))
        : false

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yükleme Planı Oluştur"
        backTo={SHIPPING_HOME_PATH}
        backLabel="Nakliye"
      />

      <LoadingWizardStepper
        currentStep={step}
        maxReached={maxStep}
        onStepClick={goTo}
      />

      {step >= 2 && (
        <SummaryMetrics
          columns={4}
          items={[
            { title: 'Doluluk', value: `%${summary.usedPercent}`, subtitle: `${summary.usedVolume} / ${summary.totalVolumeM3} m³`, icon: Box, tone: 'blue', valueTone: summary.capacityStatus === 'over' ? 'red' : 'emerald' },
            { title: 'Ağırlık', value: `${summary.totalWeight.toLocaleString('tr-TR')} kg`, subtitle: `%${summary.weightPercent} kapasite`, icon: Scale, tone: 'orange', valueTone: 'orange' },
            { title: 'Parça', value: summary.pieceCount, subtitle: loadMode === 'palet' ? 'Palet' : 'Koli', icon: Package, tone: 'cyan', valueTone: 'cyan' },
            { title: 'Navlun', value: `${summary.freight.toLocaleString('tr-TR')} ₺`, subtitle: `${distanceKm} km`, icon: Truck, tone: 'purple', valueTone: 'purple' },
          ]}
        />
      )}

      {step === 0 && (
        <AppPagePanel title="Sefer Bilgileri" description="Müşteri, rota ve nakliye kapsamı">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <User className="h-3.5 w-3.5" /> Müşteri
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Firma veya müşteri adı"
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <MapPin className="h-3.5 w-3.5" /> Çıkış Noktası
                </label>
                <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="form-input w-full" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <MapPin className="h-3.5 w-3.5" /> Varış Noktası
                </label>
                <input value={destination} onChange={(e) => setDestination(e.target.value)} className="form-input w-full" />
              </div>
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-400">Mesafe (km)</label>
                <input
                  type="number"
                  min={1}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
                  className="form-input w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">Nakliye Kapsamı</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHIPPING_SCOPES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleScopeChange(item.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        scope === item.id
                          ? 'border-blue-400/50 bg-blue-500/10 text-blue-200'
                          : 'border-dark-500/50 bg-dark-700/30 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Globe className="mb-1 h-4 w-4" />
                      <p className="text-sm font-bold">{item.id === 'domestic' ? 'Yurt İçi' : 'Yurt Dışı'}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">Rapor Dili</p>
                <div className="flex flex-wrap gap-2">
                  {SHIPPING_LANGUAGES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLang(item.id)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        lang === item.id ? 'bg-blue-500/20 text-blue-200' : 'bg-dark-700/50 text-gray-500'
                      }`}
                    >
                      {item.flag} {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AppPagePanel>
      )}

      {step === 1 && (
        <div className="grid gap-4 xl:grid-cols-5">
          <AppPagePanel title="Araç Tipi" className="xl:col-span-2">
            <div className="mb-4 flex flex-wrap gap-2">
              {VEHICLE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCategory(item.id)
                    const first = SHIPPING_VEHICLE_MODELS.find((model) => model.category === item.id)
                    if (first) setVehicleId(first.id)
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-bold ${
                    category === item.id ? 'bg-blue-500/20 text-blue-200' : 'bg-dark-700/50 text-gray-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {categoryModels.map((model) => {
                const active = vehicleId === model.id
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setVehicleId(model.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      active ? 'border-blue-400/50 bg-blue-500/10 ring-1 ring-blue-400/25' : 'border-dark-500/45 bg-dark-700/25'
                    }`}
                  >
                    <img src={model.image} alt="" className="h-16 w-24 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white">{model.name}</p>
                      <p className="text-[13px] text-gray-500">
                        {model.lengthM} m · {model.volumeM3} m³ · {model.maxWeightKg.toLocaleString('tr-TR')} kg
                      </p>
                    </div>
                    {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-300" />}
                  </button>
                )
              })}
            </div>
          </AppPagePanel>

          <div className="xl:col-span-3">
            {vehicle && (
              <div className="overflow-hidden rounded-2xl border border-dark-500/50 bg-dark-800/70 shadow-card">
                <img src={vehicle.image} alt={vehicle.name} className="h-56 w-full object-cover xl:h-72" />
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                  {[
                    ['Uzunluk', `${vehicle.lengthM} m`],
                    ['Genişlik', `${vehicle.widthM} m`],
                    ['Yükseklik', `${vehicle.heightM} m`],
                    ['Hacim', `${vehicle.volumeM3} m³`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-dark-700/40 px-3 py-2">
                      <p className="text-[12px] text-gray-500">{label}</p>
                      <p className="text-sm font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 xl:grid-cols-12">
          <AppPagePanel title="Yük Tanımı" className="xl:col-span-4">
            <div className="mb-4 grid grid-cols-2 gap-2">
              {['koli', 'palet'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLoadMode(mode)}
                  className={`rounded-xl py-2.5 text-xs font-bold ${
                    loadMode === mode ? 'bg-blue-500/20 text-blue-200' : 'bg-dark-700/50 text-gray-500'
                  }`}
                >
                  {mode === 'koli' ? 'Koli / Paket' : 'Palet'}
                </button>
              ))}
            </div>

            {loadMode === 'koli' && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                      sizePreset === preset.id ? 'bg-blue-500/20 text-blue-200' : 'bg-dark-700/50 text-gray-500'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Ürün adı</label>
                <input
                  value={cargo.name}
                  onChange={(e) => setCargo((c) => ({ ...c, name: e.target.value }))}
                  className="form-input w-full"
                />
                {lang !== 'tr' && (
                  <p className="mt-1 text-[12px] text-blue-300">{translateLive(cargo.name, lang)}</p>
                )}
              </div>

              {loadMode === 'koli' && (
                <div className="grid grid-cols-3 gap-2">
                  {[['widthCm', 'En'], ['lengthCm', 'Boy'], ['heightCm', 'Yük.']].map(([field, label]) => (
                    <div key={field}>
                      <label className="mb-1 block text-[12px] text-gray-500">{label} (cm)</label>
                      <input
                        type="number"
                        value={cargo[field]}
                        onChange={(e) => setCargo((c) => ({ ...c, [field]: Number(e.target.value) || 0 }))}
                        className="form-input w-full"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[12px] text-gray-500">Ağırlık (kg)</label>
                  <input
                    type="number"
                    value={cargo.weightKg}
                    onChange={(e) => setCargo((c) => ({ ...c, weightKg: Number(e.target.value) || 0 }))}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-gray-500">Adet</label>
                  <input
                    type="number"
                    value={cargo.quantity}
                    onChange={(e) => setCargo((c) => ({ ...c, quantity: Number(e.target.value) || 0 }))}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-dark-500/40 bg-dark-700/30 px-3 py-2">
                <span className="text-xs text-gray-500">Kapasite durumu</span>
                <CapacityBadge status={summary.capacityStatus} />
              </div>
            </div>
          </AppPagePanel>

          <div className="xl:col-span-8">
            <CargoLoadScene
              vehicle={vehicle}
              placements={layout.placements}
              loadMode={loadMode}
            />
            <p className="mt-2 text-center text-[13px] text-gray-500">
              Ölçü ve adet değiştikçe kasa içi yerleşim canlı güncellenir
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <AppPagePanel
            title="Yükleme Özeti"
            action={<CapacityBadge status={summary.capacityStatus} />}
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                ['Müşteri', customerName],
                ['Rota', `${origin} → ${destination}`],
                ['Araç', vehicle?.name],
                ['Navlun', `${summary.freight.toLocaleString('tr-TR')} ₺`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-dark-500/40 bg-dark-700/30 p-3">
                  <p className="text-[12px] text-gray-500">{label}</p>
                  <p className="mt-1 text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </AppPagePanel>

          <AppPagePanel title="Barkod Fişleri">
            <BarcodeSlipPanel lang={lang} slips={summary.barcodeSlips} unitTotals={summary.unitTotals} />
          </AppPagePanel>

          {completed && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Kayıt tamamlandı · Fatura: <strong>{completed.invoiceNo}</strong>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => goTo(step - 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 px-4 py-2.5 text-sm font-bold text-gray-400 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </button>

        <p className="text-xs text-gray-500">
          Adım {step + 1} / {STEPS.length} · {STEPS[step].label}
        </p>

        {step < 3 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => goTo(step + 1)}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold disabled:opacity-40"
          >
            İleri
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            {completed && (
              <button
                type="button"
                onClick={() => downloadInvoiceFile(completed, lang)}
                className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 px-4 py-2.5 text-sm font-bold text-gray-300"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </button>
            )}
            <button
              type="button"
              onClick={handleComplete}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
            >
              <Receipt className="h-4 w-4" />
              {completed ? 'Yeniden Kaydet' : 'Fatura Kes & Kaydet'}
            </button>
          </div>
        )}
      </div>
    </AppPageShell>
  )
}
