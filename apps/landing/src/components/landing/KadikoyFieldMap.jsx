'use client'

import { useEffect, useId, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

const PINS = [
  { t: '32%', l: '46%', c: 'bg-blue-500', label: 'Moda' },
  { t: '44%', l: '38%', c: 'bg-emerald-500', label: 'Caferağa' },
  { t: '56%', l: '54%', c: 'bg-orange-400', label: 'Fenerbahçe' },
  { t: '40%', l: '60%', c: 'bg-violet-500', label: 'Caddebostan' },
]

/**
 * İstanbul Kadıköy — etkileşimli OSM haritası (iframe) + canlı pin animasyonları.
 */
export default function KadikoyFieldMap() {
  const mapId = useId().replace(/:/g, '')
  const shellRef = useRef(null)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const frame = shell.querySelector('iframe')
    if (!frame) return
    const onLoad = () => shell.classList.add('is-ready')
    frame.addEventListener('load', onLoad)
    return () => frame.removeEventListener('load', onLoad)
  }, [])

  return (
    <div
      ref={shellRef}
      className="field-map-shell relative h-[460px] overflow-hidden rounded-[1.5rem] border border-white/15 shadow-2xl"
    >
      <iframe
        id={`kadikoy-map-${mapId}`}
        title="İstanbul Kadıköy canlı harita"
        className="field-map-iframe absolute inset-0 z-[1] h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.openstreetmap.org/export/embed.html?bbox=29.015%2C40.975%2C29.095%2C41.025&layer=mapnik&marker=40.9901%2C29.0584"
      />
      <img
        src="https://staticmap.openstreetmap.de/staticmap.php?center=40.9901,29.0584&zoom=13&size=1000x600&maptype=mapnik&markers=40.9901,29.0584,red-pushpin"
        alt=""
        className="field-map-fallback absolute inset-0 z-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
      <div className="field-map-overlay pointer-events-none absolute inset-0 z-[2]" />
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
      <a
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow"
        href="https://www.openstreetmap.org/?mlat=40.9901&mlon=29.0584#map=13/40.9901/29.0584"
        target="_blank"
        rel="noreferrer"
      >
        Kadıköy · OSM
      </a>
    </div>
  )
}
