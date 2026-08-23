'use client'

import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { ArrowRight, Boxes, Clock3, Play, ShieldCheck, Users } from 'lucide-react'
import { trackCta } from '../../../analytics/track'
import { useRef, type ReactNode } from 'react'

const ease = [0.22, 1, 0.36, 1] as const

const stats = [
  { icon: Users, value: '+10K', label: 'Aktif Kullanıcı', tone: 'orange' },
  { icon: Boxes, value: '+50', label: 'Hazır Modül', tone: 'gold' },
  { icon: ShieldCheck, value: '%99.9', label: 'Sistem Uptime', tone: 'cyan' },
  { icon: Clock3, value: '7/24', label: 'Destek', tone: 'blue' },
]

function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 16 })
  const sy = useSpring(y, { stiffness: 180, damping: 16 })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        if (reduce) return
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * 0.18)
        y.set((e.clientY - (r.top + r.height / 2)) * 0.18)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

export default function HeroCopy() {
  const reduce = useReducedMotion()
  const enter = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 22, filter: 'blur(8px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.7, delay, ease },
        }

  return (
    <div className="cine-copy">
      <motion.p className="cine-kicker" {...enter(0.08)}>
        BACHMAIN PLATFORM
      </motion.p>
      <motion.h1 id="home-hero-heading" className="cine-title" {...enter(0.18)}>
        Tüm süreçler tek platform.
      </motion.h1>
      <motion.p className="cine-lead" {...enter(0.3)}>
        CRM, ERP, Üretim, Stok, Lojistik, Finans ve daha fazlası tek ekosistemde. İşinizi büyütmek
        artık çok daha kolay.
      </motion.p>
      <motion.div className="cine-actions" {...enter(0.42)}>
        <Magnetic>
          <Link
            to="/demo"
            className="cine-btn cine-btn-primary"
            onClick={() => trackCta('cta_demo', { source: 'cinematic_hero' })}
          >
            Demo Oluştur
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Magnetic>
        <a href="#nasil-calisir" className="cine-btn cine-btn-ghost">
          <span className="cine-play">
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          Nasıl Çalışır?
        </a>
      </motion.div>
      <motion.ul className="cine-stats" aria-label="Platform özeti" {...enter(0.54)}>
        {stats.map((s) => (
          <li key={s.label} className={`cine-stat cine-stat-${s.tone}`}>
            <s.icon className="cine-stat-icon" aria-hidden />
            <span>
              <strong>{s.value}</strong> {s.label}
            </span>
          </li>
        ))}
      </motion.ul>
    </div>
  )
}
