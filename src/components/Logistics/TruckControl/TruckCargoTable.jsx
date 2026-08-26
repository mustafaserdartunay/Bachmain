import { useMemo, useState } from 'react'
import { APP_SURFACE_PANEL_CLASS, PAGE_TABLE_HEADER_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

const PAGE_SIZE = 25

function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="mt-3 flex justify-end gap-2">
      <button
        type="button"
        className="tcc-chip"
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
      >
        Önceki
      </button>
      <span className={TCC_MUTED}>
        {page + 1} / {pages}
      </span>
      <button
        type="button"
        className="tcc-chip"
        disabled={page >= pages - 1}
        onClick={() => onPage(page + 1)}
      >
        Sonraki
      </button>
    </div>
  )
}

export default function TruckCargoTable({ cargo = [], vehicle, onOpenItem }) {
  const [page, setPage] = useState(0)
  const grouped = useMemo(() => {
    const map = new Map()
    cargo.forEach((item) => {
      const key = item.customerLabel || item.customer || 'Müşteri yok'
      const cur = map.get(key) || { customer: key, pallets: 0, kg: 0 }
      cur.pallets += Number(item.pallets || 0)
      cur.kg += Number(item.kg || 0)
      map.set(key, cur)
    })
    return [...map.values()]
  }, [cargo])
  const pages = Math.max(1, Math.ceil(cargo.length / PAGE_SIZE))
  const rows = cargo.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const fillPct = vehicle?.fillPct
  const kg = vehicle?.currentKg ?? cargo.reduce((s, i) => s + Number(i.kg || 0), 0)
  const capKg = vehicle?.maxKg
  const m3 = vehicle?.currentM3 ?? cargo.reduce((s, i) => s + Number(i.volumeM3 || 0), 0)
  const capM3 = vehicle?.maxM3

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-4`}>
      <p className={`${TCC_YFB} mb-2 uppercase`}>Tır doluluk</p>
      <p className={`${TCC_YFB} text-[var(--ink)]`}>
        {fillPct != null ? `%${fillPct}` : 'Kapasite verisi yok'}
      </p>
      <div className="tcc-progress my-2">
        <span style={{ width: `${fillPct || 0}%` }} />
      </div>
      <p className={TCC_MUTED}>
        {capKg ? `${Math.round(kg)} / ${Math.round(capKg)} kg` : `${Math.round(kg)} kg`}
        {capM3 ? ` · ${Number(m3).toFixed(1)} / ${capM3} m³` : ''}
      </p>
      {grouped.length ? (
        <div className="mt-4 space-y-2">
          {grouped.map((g) => (
            <div key={g.customer} className="flex justify-between gap-3">
              <span className={TCC_YFB}>{g.customer}</span>
              <span className={TCC_MUTED}>
                {g.pallets} palet · {Math.round(g.kg)} kg
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className={PAGE_TABLE_HEADER_CLASS}>
            <tr>
              {[
                'Ürün',
                'SKU',
                'Miktar',
                'Birim',
                'Koli',
                'Palet',
                'Kg',
                'Hacim',
                'Müşteri',
                'Sipariş',
                'Fatura',
                'Durum',
              ].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-t border-[var(--glass-border)]"
                onClick={() => onOpenItem?.(row)}
              >
                <td className={`${TCC_YF} px-2 py-2 text-[var(--ink)]`}>{row.name}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.sku || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.qty}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.unit}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.boxes || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.pallets || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.kg || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.volumeM3 || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>
                  {row.customerLabel || row.customer || '—'}
                </td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.orderNo || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.invoiceNo || '—'}</td>
                <td className={`${TCC_MUTED} px-2 py-2`}>{row.status || '—'}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={12} className={`${TCC_MUTED} py-6 text-center`}>
                  Bu TIR için yük kalemi yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} />
    </section>
  )
}
