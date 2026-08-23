'use client'

import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Boxes, Factory, Landmark, PencilRuler, Truck, Users, Workflow } from 'lucide-react'

const MODULES = [
  {
    icon: Users,
    title: 'CRM',
    desc: 'Müşteri, fırsat ve satış pipeline’ını tek kartta yönetin.',
    href: '/crm',
    tone: 'violet',
  },
  {
    icon: Workflow,
    title: 'ERP',
    desc: 'Operasyonu tekliften teslimata aynı panelden yürütün.',
    href: '/erp',
    tone: 'blue',
  },
  {
    icon: Factory,
    title: 'Üretim',
    desc: 'İş emri, MRP ve fotoğraflı üretim takibini planlayın.',
    href: '/uretim',
    tone: 'cyan',
  },
  {
    icon: Boxes,
    title: 'Stok & Depo',
    desc: 'Anlık stok, barkod, raf ve transfer tek ekranda.',
    href: '/stok',
    tone: 'orange',
  },
  {
    icon: Truck,
    title: 'Lojistik',
    desc: 'Sevkiyat, palet ve canlı nakliye süreçlerini yönetin.',
    href: '/lojistik',
    tone: 'green',
  },
  {
    icon: Landmark,
    title: 'Finans',
    desc: 'Cari, kasa, banka ve finansal raporları tek ekranda izleyin.',
    href: '/finans',
    tone: 'indigo',
  },
  {
    icon: PencilRuler,
    title: 'Bachmain Studio',
    desc: 'Kod yazmadan markanıza özel web sitesi oluşturun.',
    href: '/studio',
    tone: 'pink',
  },
]

function TiltCard({ href, tone, children }: { href: string; tone: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 18 })
  const sry = useSpring(ry, { stiffness: 180, damping: 18 })

  return (
    <motion.div style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}>
      <Link
        ref={ref}
        to={href}
        className={`cine-mod cine-mod-${tone}`}
        onMouseMove={(e) => {
          const el = ref.current
          if (!el) return
          const r = el.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          ry.set(px * 8)
          rx.set(py * -7)
        }}
        onMouseLeave={() => {
          rx.set(0)
          ry.set(0)
        }}
      >
        {children}
      </Link>
    </motion.div>
  )
}

export default function CinematicModules() {
  return (
    <section className="cine-modules" aria-label="Bachmain modülleri">
      <div className="cine-modules-grid">
        {MODULES.map((m) => (
          <TiltCard key={m.title} href={m.href} tone={m.tone}>
            <span className="cine-mod-icon">
              <m.icon />
            </span>
            <h2>{m.title}</h2>
            <p>{m.desc}</p>
            <span className="cine-mod-link">Keşfet →</span>
          </TiltCard>
        ))}
      </div>
    </section>
  )
}
