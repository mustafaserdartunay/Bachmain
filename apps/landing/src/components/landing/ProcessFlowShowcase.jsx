'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  ShoppingCart,
  Cog,
  PackageCheck,
  Warehouse,
  Truck,
  PackageOpen,
  ArrowRight,
} from 'lucide-react'
import ScrollReveal from '../ScrollReveal'
import { processFlow } from '../../data/premiumLanding'

const ICONS = {
  FileText,
  ShoppingCart,
  Cog,
  PackageCheck,
  Warehouse,
  Truck,
  PackageOpen,
}

const TONE = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    soft: 'bg-blue-50 text-blue-600 ring-blue-100',
    glow: 'rgba(37,99,235,0.35)',
  },
  violet: {
    bg: 'from-violet-500 to-violet-600',
    soft: 'bg-violet-50 text-violet-600 ring-violet-100',
    glow: 'rgba(139,92,246,0.35)',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    soft: 'bg-orange-50 text-orange-600 ring-orange-100',
    glow: 'rgba(249,115,22,0.35)',
  },
  amber: {
    bg: 'from-amber-500 to-amber-600',
    soft: 'bg-amber-50 text-amber-600 ring-amber-100',
    glow: 'rgba(245,158,11,0.35)',
  },
  cyan: {
    bg: 'from-cyan-500 to-cyan-600',
    soft: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
    glow: 'rgba(6,182,212,0.35)',
  },
  sky: {
    bg: 'from-sky-500 to-sky-600',
    soft: 'bg-sky-50 text-sky-600 ring-sky-100',
    glow: 'rgba(14,165,233,0.35)',
  },
  emerald: {
    bg: 'from-emerald-500 to-emerald-600',
    soft: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    glow: 'rgba(16,185,129,0.35)',
  },
}

export default function ProcessFlowShowcase() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % processFlow.length)
    }, 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <section id="ozellikler" className="section-pad process-section">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal className="text-center">
          <span className="pill">Uçtan uca operasyon</span>
          <h2 className="section-title mx-auto mt-4">İş Süreçlerinizi Uçtan Uca Yönetin</h2>
          <p className="section-desc mx-auto">
            Tekliften teslime — canlı, animasyonlu süreç hattı.
          </p>
        </ScrollReveal>

        <div className="process-stage mt-12">
          <div className="process-rail" aria-hidden="true">
            <div className="process-rail-line" />
            <motion.div
              className="process-rail-fill"
              animate={{ width: `${((active + 1) / processFlow.length) * 100}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="process-pulse"
              animate={{ left: `calc(${(active / (processFlow.length - 1)) * 100}% - 8px)` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="process-nodes">
            {processFlow.map((step, i) => {
              const Icon = ICONS[step.icon] || FileText
              const tone = TONE[step.tone] || TONE.blue
              const on = i === active
              const done = i < active
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`process-node ${on ? 'on' : ''} ${done ? 'done' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <motion.div
                    className={`process-node-ico bg-gradient-to-br ${tone.bg}`}
                    animate={on ? { scale: [1, 1.08, 1], y: [0, -4, 0] } : { scale: 1, y: 0 }}
                    transition={{ duration: 1.6, repeat: on ? Infinity : 0, ease: 'easeInOut' }}
                    style={on ? { boxShadow: `0 16px 36px ${tone.glow}` } : undefined}
                  >
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.15} />
                    {on && <span className="process-node-ring" />}
                  </motion.div>
                  <div className="process-node-label">{step.label}</div>
                  <div className="process-node-desc">{step.desc}</div>
                  {i < processFlow.length - 1 && (
                    <span className="process-node-arrow" aria-hidden="true">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={processFlow[active].id}
              className="process-spotlight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <div className={`process-spotlight-badge ${TONE[processFlow[active].tone].soft}`}>
                {(() => {
                  const Icon = ICONS[processFlow[active].icon]
                  return <Icon className="h-4 w-4" strokeWidth={2.2} />
                })()}
                Adım {active + 1} / {processFlow.length}
              </div>
              <h3>{processFlow[active].label}</h3>
              <p>
                {processFlow[active].desc}. Tüm aşamalar tek panelde birbirine bağlı — fotoğraf,
                durum ve zaman çizelgesi canlı ilerler.
              </p>
              <div className="process-progress-dots">
                {processFlow.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={i === active ? 'on' : ''}
                    aria-label={s.label}
                    onClick={() => setActive(i)}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
