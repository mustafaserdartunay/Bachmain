'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

const PINS = [
  { t: '58%', l: '42%', c: 'bg-blue-500', label: 'Moda' },
  { t: '48%', l: '38%', c: 'bg-emerald-500', label: 'Caferağa' },
  { t: '62%', l: '52%', c: 'bg-orange-400', label: 'Fenerbahçe' },
  { t: '55%', l: '58%', c: 'bg-violet-500', label: 'Caddebostan' },
]

/**
 * İstanbul Kadıköy — stilize harita görseli + canlı pin animasyonları.
 */
export default function KadikoyFieldMap() {
  return (
    <div className="field-map-shell relative h-[460px] overflow-hidden rounded-[1.5rem] border border-white/15 shadow-2xl">
      <img
        src="/assets/kadikoy-field-map.jpg"
        alt="İstanbul Kadıköy saha satışı haritası"
        className="field-map-iframe absolute inset-0 z-0 h-full w-full object-cover object-center"
        width={1024}
        height={968}
        loading="lazy"
        decoding="async"
      />
      <div className="field-map-overlay pointer-events-none absolute inset-0 z-[1]" />
      {PINS.map((p, i) => (
        <motion.div
          key={p.label}
          className="pointer-events-none absolute z-10"
          style={{ top: p.t, left: p.l }}
          animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35 }}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${p.c} text-white shadow-xl ring-4 ring-white/25`}
            title={p.label}
          >
            <MapPin className="h-4 w-4" />
          </div>
        </motion.div>
      ))}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-around rounded-2xl border border-white/15 bg-[#0b1b3a]/75 px-4 py-3 backdrop-blur-md">
        {[
          ['12', 'Temsilci'],
          ['84', 'Ziyaret'],
          ['₺1.2M', 'Satış'],
        ].map(([v, l]) => (
          <div key={l} className="text-center">
            <div className="text-lg font-extrabold text-white">{v}</div>
            <div className="text-[10px] uppercase tracking-wide text-white/55">{l}</div>
          </div>
        ))}
      </div>
      <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow">
        Kadıköy · Canlı Saha
      </span>
    </div>
  )
}
