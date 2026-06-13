import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import NumericInput from '../../components/Products/NumericInput'
import { formatTL } from '../../utils/productPricing'
import { initialWarehouses, warehouseMovements, warehouseStatuses } from '../../data/warehousesData'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

const statusClasses = {
  Aktif: 'badge-green',
  Kritik: 'badge-red',
  Bakımda: 'badge-orange',
  Pasif: 'badge-gray',
}

const movementClasses = {
  Giriş: 'badge-green',
  Çıkış: 'badge-red',
  Rezerv: 'badge-orange',
  Sayım: 'badge-blue',
  'Transfer Giriş': 'badge-purple',
}

function emptyWarehouse() {
  return {
    id: null,
    name: '',
    code: '',
    type: 'Ana Depo',
    status: 'Aktif',
    city: '',
    district: '',
    address: '',
    manager: '',
    phone: '',
    email: '',
    capacityM3: 0,
    usedM3: 0,
    shelfCount: 0,
    activeShelves: 0,
    criticalProducts: 0,
    totalSku: 0,
    totalStock: 0,
    estimatedValue: 0,
    inboundToday: 0,
    outboundToday: 0,
    transferPending: 0,
    temperature: '',
    humidity: '',
    lastCountDate: '',
    notes: '',
    zones: [],
    stock: [],
  }
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-accent-blue' }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-[10px] text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}

function CapacityBar({ used, total }) {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const color = percent >= 85 ? 'bg-red-500' : percent >= 70 ? 'bg-orange-500' : 'bg-emerald-500'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">Kapasite</span>
        <span className="text-gray-300">%{percent}</span>
      </div>
      <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-gray-500">{used.toLocaleString('tr-TR')} / {total.toLocaleString('tr-TR')} m³</p>
    </div>
  )
}

function WarehouseForm({ draft, onChange, onSave, onCancel, isNew }) {
  function update(field, value) {
    onChange({ ...draft, [field]: value })
  }

  function addZone() {
    update('zones', [...(draft.zones || []), { name: 'Yeni Alan', usage: 0, shelves: 0, color: 'bg-blue-500' }])
  }

  function updateZone(index, field, value) {
    update('zones', draft.zones.map((zone, i) => (i === index ? { ...zone, [field]: value } : zone)))
  }

  function removeZone(index) {
    if (!window.confirm('Bu depo alanını silmek istediğinize emin misiniz?')) return
    update('zones', draft.zones.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-label="Kapat" />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-dark-500/60 bg-dark-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-dark-500/50 bg-dark-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{isNew ? 'Yeni Depo Oluştur' : 'Depo Düzenle'}</h2>
            <p className="text-xs text-gray-500">Depo kartı, kapasite, lokasyon ve alan bilgileri</p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-2 text-gray-400 hover:bg-dark-700 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <label className="form-label">Depo Adı *</label>
              <input className="form-input" value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="Merkez Depo" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Depo Kodu *</label>
              <input className="form-input" value={draft.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="MRK" />
            </div>
            <div className="col-span-3">
              <label className="form-label">Depo Tipi</label>
              <select className="form-input" value={draft.type} onChange={(e) => update('type', e.target.value)}>
                <option>Ana Depo</option>
                <option>Bölge Deposu</option>
                <option>Geçici Alan</option>
                <option>Sevkiyat Deposu</option>
                <option>İade Deposu</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Durum</label>
              <select className="form-input" value={draft.status} onChange={(e) => update('status', e.target.value)}>
                <option>Aktif</option>
                <option>Kritik</option>
                <option>Bakımda</option>
                <option>Pasif</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="form-label">İl</label>
              <input className="form-input" value={draft.city} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div className="col-span-3">
              <label className="form-label">İlçe</label>
              <input className="form-input" value={draft.district} onChange={(e) => update('district', e.target.value)} />
            </div>
            <div className="col-span-6">
              <label className="form-label">Adres</label>
              <input className="form-input" value={draft.address} onChange={(e) => update('address', e.target.value)} />
            </div>

            <div className="col-span-3">
              <label className="form-label">Depo Sorumlusu</label>
              <input className="form-input" value={draft.manager} onChange={(e) => update('manager', e.target.value)} />
            </div>
            <div className="col-span-3">
              <label className="form-label">Telefon</label>
              <input className="form-input" value={draft.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div className="col-span-3">
              <label className="form-label">E-posta</label>
              <input className="form-input" value={draft.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="col-span-3">
              <label className="form-label">Son Sayım Tarihi</label>
              <input className="form-input" value={draft.lastCountDate} onChange={(e) => update('lastCountDate', e.target.value)} placeholder="31.05.2026" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div><label className="form-label">Kapasite (m³)</label><NumericInput value={draft.capacityM3} onChange={(v) => update('capacityM3', v)} /></div>
            <div><label className="form-label">Kullanılan (m³)</label><NumericInput value={draft.usedM3} onChange={(v) => update('usedM3', v)} /></div>
            <div><label className="form-label">Toplam Raf</label><NumericInput value={draft.shelfCount} onChange={(v) => update('shelfCount', v)} /></div>
            <div><label className="form-label">Aktif Raf</label><NumericInput value={draft.activeShelves} onChange={(v) => update('activeShelves', v)} /></div>
            <div><label className="form-label">Toplam SKU</label><NumericInput value={draft.totalSku} onChange={(v) => update('totalSku', v)} /></div>
            <div><label className="form-label">Toplam Stok</label><NumericInput value={draft.totalStock} onChange={(v) => update('totalStock', v)} /></div>
            <div><label className="form-label">Kritik Ürün</label><NumericInput value={draft.criticalProducts} onChange={(v) => update('criticalProducts', v)} /></div>
            <div><label className="form-label">Tahmini Değer</label><NumericInput value={draft.estimatedValue} onChange={(v) => update('estimatedValue', v)} suffix="₺" formatMode="price" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Sıcaklık Aralığı</label>
              <input className="form-input" value={draft.temperature} onChange={(e) => update('temperature', e.target.value)} placeholder="18-24°C" />
            </div>
            <div>
              <label className="form-label">Nem Aralığı</label>
              <input className="form-input" value={draft.humidity} onChange={(e) => update('humidity', e.target.value)} placeholder="%45-55" />
            </div>
          </div>

          <div className="rounded-xl bg-dark-700/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Depo Alanları / Bloklar</h3>
              <button onClick={addZone} className={`${BTN_PRIMARY} gap-1`}>
                <Plus className="w-3.5 h-3.5" /> Alan Ekle
              </button>
            </div>
            <div className="space-y-2">
              {(draft.zones || []).map((zone, index) => (
                <div key={`${zone.name}-${index}`} className="grid grid-cols-12 gap-2 items-center">
                  <input className="form-input col-span-4" value={zone.name} onChange={(e) => updateZone(index, 'name', e.target.value)} placeholder="A Blok" />
                  <div className="col-span-3"><NumericInput value={zone.usage} onChange={(v) => updateZone(index, 'usage', v)} suffix="%" /></div>
                  <div className="col-span-3"><NumericInput value={zone.shelves} onChange={(v) => updateZone(index, 'shelves', v)} placeholder="Raf" /></div>
                  <select className="form-input col-span-1" value={zone.color} onChange={(e) => updateZone(index, 'color', e.target.value)}>
                    <option value="bg-emerald-500">Yeşil</option>
                    <option value="bg-blue-500">Mavi</option>
                    <option value="bg-orange-500">Turuncu</option>
                    <option value="bg-red-500">Kırmızı</option>
                    <option value="bg-purple-500">Mor</option>
                  </select>
                  <button onClick={() => removeZone(index)} className="col-span-1 p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Notlar</label>
            <textarea className="form-input resize-none" rows={3} value={draft.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 border-t border-dark-500/50 pt-4">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-colors">Vazgeç</button>
            <button onClick={onSave} className={`${BTN_SUCCESS} px-5 py-2 text-sm`}>{isNew ? 'Depo Oluştur' : 'Depoyu Kaydet'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState(initialWarehouses)
  const [selectedId, setSelectedId] = useState(initialWarehouses[0]?.id)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Tümü')
  const [showForm, setShowForm] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [draft, setDraft] = useState(emptyWarehouse())
  const [toast, setToast] = useState('')

  const selected = warehouses.find((warehouse) => warehouse.id === selectedId) || warehouses[0]

  const filtered = useMemo(() => {
    return warehouses.filter((warehouse) => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q
        || warehouse.name.toLowerCase().includes(q)
        || warehouse.code.toLowerCase().includes(q)
        || warehouse.city.toLowerCase().includes(q)
        || warehouse.manager.toLowerCase().includes(q)
      const matchesStatus = status === 'Tümü' || warehouse.status === status
      return matchesQuery && matchesStatus
    })
  }, [warehouses, query, status])

  const totals = useMemo(() => {
    const capacity = warehouses.reduce((sum, wh) => sum + wh.capacityM3, 0)
    const used = warehouses.reduce((sum, wh) => sum + wh.usedM3, 0)
    const value = warehouses.reduce((sum, wh) => sum + wh.estimatedValue, 0)
    const critical = warehouses.reduce((sum, wh) => sum + wh.criticalProducts, 0)
    return {
      capacity,
      used,
      value,
      critical,
      percent: capacity > 0 ? Math.round((used / capacity) * 100) : 0,
      stock: warehouses.reduce((sum, wh) => sum + wh.totalStock, 0),
    }
  }, [warehouses])

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  function openNew() {
    setIsNew(true)
    setDraft(emptyWarehouse())
    setShowForm(true)
  }

  function openEdit(warehouse) {
    setIsNew(false)
    setDraft({ ...warehouse, zones: [...warehouse.zones], stock: [...warehouse.stock] })
    setShowForm(true)
  }

  function saveWarehouse() {
    if (!draft.name.trim() || !draft.code.trim()) {
      alert('Depo adı ve depo kodu zorunludur.')
      return
    }
    if (isNew) {
      const id = `WH-${String(warehouses.length + 1).padStart(3, '0')}`
      const next = { ...draft, id }
      setWarehouses([next, ...warehouses])
      setSelectedId(id)
      showToast('Depo oluşturuldu')
    } else {
      setWarehouses(warehouses.map((warehouse) => (warehouse.id === draft.id ? draft : warehouse)))
      setSelectedId(draft.id)
      showToast('Depo kaydedildi')
    }
    setShowForm(false)
  }

  function deleteWarehouse(id) {
    if (warehouses.find((warehouse) => warehouse.id === id)?.name === 'Merkez Depo') {
      alert('Merkez Depo silinemez.')
      return
    }
    if (!window.confirm('Bu depoyu silmek istediğinize emin misiniz?')) return
    const next = warehouses.filter((warehouse) => warehouse.id !== id)
    setWarehouses(next)
    setSelectedId(next[0]?.id)
    showToast('Depo silindi')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dark-500/50 bg-gradient-to-r from-dark-800 via-dark-800 to-dark-700 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Link to="/" className="hover:text-gray-300 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Stok Yönetimi</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-300">Depolar</span>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent-blue">Depo Yönetimi</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Depolar</h1>
            <p className="mt-1 text-sm text-gray-500">Depo kartları, kapasite, stok dağılımı, hareket ve raf yönetimi</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => selected && openEdit(selected)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
              Düzenle
            </button>
            <button onClick={openNew} className={`${BTN_PRIMARY} gap-1.5 px-4 py-2.5 text-sm`}>
              <Plus className="w-4 h-4" /> Yeni Depo
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={Warehouse} label="Toplam Depo" value={warehouses.length} sub="Aktif lokasyon" />
        <StatCard icon={Boxes} label="Toplam Stok" value={totals.stock.toLocaleString('tr-TR')} sub="Adet" color="text-emerald-400" />
        <StatCard icon={PackageCheck} label="Kapasite Kullanımı" value={`%${totals.percent}`} sub={`${totals.used}/${totals.capacity} m³`} color="text-orange-400" />
        <StatCard icon={AlertTriangle} label="Kritik Ürün" value={totals.critical} sub="Tüm depolar" color="text-red-400" />
        <StatCard icon={ClipboardList} label="Stok Değeri" value={`${formatTL(totals.value)}`} sub="Tahmini" color="text-purple-400" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Depo adı, kod, şehir veya sorumlu ara..."
              className="form-input pl-10"
            />
          </div>
          <div className="flex gap-1">
            {warehouseStatuses.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${status === item ? 'bg-accent-blue/20 text-accent-blue' : 'text-gray-500 hover:bg-dark-700 hover:text-gray-300'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 items-start">
        <div className="col-span-3 space-y-3">
          {filtered.map((warehouse) => {
            const isSelected = selected?.id === warehouse.id
            return (
              <button
                key={warehouse.id}
                onClick={() => setSelectedId(warehouse.id)}
                className={`card w-full text-left transition-colors ${isSelected ? 'border-accent-blue/50 bg-accent-blue/10' : 'hover:bg-dark-700/40'}`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-dark-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent-blue" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{warehouse.name}</p>
                        <p className="text-xs text-gray-500">{warehouse.code} · {warehouse.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Lokasyon</p>
                    <p className="text-sm text-gray-300">{warehouse.city}/{warehouse.district}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Sorumlu</p>
                    <p className="text-sm text-gray-300">{warehouse.manager}</p>
                  </div>
                  <div className="col-span-2">
                    <CapacityBar used={warehouse.usedM3} total={warehouse.capacityM3} />
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={statusClasses[warehouse.status] || 'badge-gray'}>{warehouse.status}</span>
                  </div>
                  <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => deleteWarehouse(warehouse.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="col-span-2 sticky top-[4.5rem] space-y-4">
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                  <p className="text-xs text-gray-500">{selected.code} · {selected.type}</p>
                </div>
                <span className={statusClasses[selected.status] || 'badge-gray'}>{selected.status}</span>
              </div>

              <div className="mt-4 space-y-3">
                <CapacityBar used={selected.usedM3} total={selected.capacityM3} />
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-dark-700/50 p-2 text-center">
                    <p className="text-lg font-bold text-white">{selected.totalSku}</p>
                    <p className="text-[10px] text-gray-500">SKU</p>
                  </div>
                  <div className="rounded-lg bg-dark-700/50 p-2 text-center">
                    <p className="text-lg font-bold text-emerald-400">{selected.totalStock.toLocaleString('tr-TR')}</p>
                    <p className="text-[10px] text-gray-500">Stok</p>
                  </div>
                  <div className="rounded-lg bg-dark-700/50 p-2 text-center">
                    <p className="text-lg font-bold text-red-400">{selected.criticalProducts}</p>
                    <p className="text-[10px] text-gray-500">Kritik</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-dark-500/40 pt-4 text-sm">
                <p className="flex items-start gap-2 text-gray-400"><MapPin className="w-4 h-4 mt-0.5 text-gray-500" /> {selected.address}</p>
                <p className="flex items-center gap-2 text-gray-400"><Phone className="w-4 h-4 text-gray-500" /> {selected.phone}</p>
                <p className="flex items-center gap-2 text-gray-400"><Mail className="w-4 h-4 text-gray-500" /> {selected.email}</p>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Depo Alanları</h3>
              <div className="space-y-3">
                {selected.zones.map((zone) => (
                  <div key={zone.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-300">{zone.name}</span>
                      <span className="text-gray-500">{zone.shelves} raf · %{zone.usage}</span>
                    </div>
                    <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
                      <div className={`h-full rounded-full ${zone.color}`} style={{ width: `${zone.usage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Depodaki Ürünler</h3>
              <div className="space-y-2">
                {selected.stock.map((item) => {
                  const available = item.quantity - item.reserved
                  const critical = item.quantity <= item.critical
                  return (
                    <div key={`${item.stockCode}-${item.shelf}`} className="rounded-lg bg-dark-700/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.product}</p>
                          <p className="text-xs text-gray-500">{item.stockCode} · Raf {item.shelf}</p>
                        </div>
                        <span className={critical ? 'badge-red' : 'badge-green'}>{critical ? 'Kritik' : 'Uygun'}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                        <div><p className="text-gray-500">Toplam</p><p className="text-gray-200">{item.quantity}</p></div>
                        <div><p className="text-gray-500">Rezerv</p><p className="text-orange-400">{item.reserved}</p></div>
                        <div><p className="text-gray-500">Müsait</p><p className="text-emerald-400">{available}</p></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <h3 className="section-title"><ArrowLeftRight className="w-4 h-4 text-accent-purple" /> Son Stok Hareketleri</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500/50">
                  <th className="table-header text-left pb-2">Tarih</th>
                  <th className="table-header text-left pb-2">Depo</th>
                  <th className="table-header text-left pb-2">Ürün</th>
                  <th className="table-header text-center pb-2">Tip</th>
                  <th className="table-header text-right pb-2">Miktar</th>
                  <th className="table-header text-left pb-2">Belge</th>
                </tr>
              </thead>
              <tbody>
                {warehouseMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-dark-500/20">
                    <td className="table-cell text-gray-500">{movement.date}</td>
                    <td className="table-cell">{movement.warehouse}</td>
                    <td className="table-cell">{movement.product}</td>
                    <td className="table-cell text-center"><span className={movementClasses[movement.type] || 'badge-gray'}>{movement.type}</span></td>
                    <td className="table-cell text-right font-medium">{movement.quantity}</td>
                    <td className="table-cell text-accent-blue">{movement.document}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Operasyon Özeti</h3>
          <div className="space-y-3">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="rounded-lg bg-dark-700/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{warehouse.name}</p>
                  <span className={statusClasses[warehouse.status] || 'badge-gray'}>{warehouse.status}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-gray-500">Giriş</p><p className="text-emerald-400">{warehouse.inboundToday}</p></div>
                  <div><p className="text-gray-500">Çıkış</p><p className="text-red-400">{warehouse.outboundToday}</p></div>
                  <div><p className="text-gray-500">Transfer</p><p className="text-purple-400">{warehouse.transferPending}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <WarehouseForm
          draft={draft}
          onChange={setDraft}
          onSave={saveWarehouse}
          onCancel={() => setShowForm(false)}
          isNew={isNew}
        />
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-[120] flex items-center gap-2 rounded-xl bg-emerald-500/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  )
}
