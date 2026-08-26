import { Truck } from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

function row(label, value) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={TCC_MUTED}>{label}</span>
      <span className={TCC_YF}>{value || '—'}</span>
    </div>
  )
}

export default function TruckVehicleCard({ vehicle }) {
  if (!vehicle) {
    return (
      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className={`${TCC_YFB} uppercase`}>Araç</p>
        <p className={`${TCC_MUTED} mt-2`}>Bu sevkiyata bağlı araç kaydı yok.</p>
      </section>
    )
  }

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className={`${TCC_YFB} uppercase`}>Araç</p>
      <div className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-[rgba(37,99,235,0.08)]">
        {vehicle.photoUrl ? (
          <img src={vehicle.photoUrl} alt={vehicle.plate} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Truck className="h-10 w-10" />
            <span className={TCC_MUTED}>Araç fotoğrafı yok</span>
          </div>
        )}
      </div>
      {row('Plaka', vehicle.plate)}
      {row('Dorse', vehicle.trailer)}
      {row('Marka', vehicle.brand)}
      {row('Model', vehicle.model)}
      {row('Yıl', vehicle.year)}
      {row('Araç tipi', vehicle.type)}
      {row('Şasi', vehicle.chassis)}
      {row('GPS cihazı', vehicle.gpsDevice)}
      {row('Maksimum yük', vehicle.maxKg ? `${vehicle.maxKg.toLocaleString('tr-TR')} kg` : '')}
      {row('Mevcut yük', `${Math.round(vehicle.currentKg).toLocaleString('tr-TR')} kg`)}
      {row('Doluluk', vehicle.fillPct != null ? `%${vehicle.fillPct}` : '')}
      {row(
        'Yükseklik',
        vehicle.heightM != null ? `${vehicle.heightM.toLocaleString('tr-TR')} m` : '',
      )}
      {row('Genişlik', vehicle.widthM != null ? `${vehicle.widthM.toLocaleString('tr-TR')} m` : '')}
      {row(
        'Uzunluk',
        vehicle.lengthM != null ? `${vehicle.lengthM.toLocaleString('tr-TR')} m` : '',
      )}
      {row(
        'Ağırlık',
        vehicle.weightKg != null ? `${vehicle.weightKg.toLocaleString('tr-TR')} kg` : '',
      )}
    </section>
  )
}
