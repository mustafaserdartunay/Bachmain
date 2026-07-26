'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarDays,
  Camera,
  ClipboardList,
  Cog,
  Contact,
  Factory,
  FileText,
  Globe2,
  IdCard,
  Landmark,
  LayoutDashboard,
  ListTodo,
  MapPin,
  Megaphone,
  MessageSquare,
  Moon,
  MoonStar,
  NotebookPen,
  Package,
  Radar,
  Receipt,
  ShoppingCart,
  Store,
  Sun,
  Ticket,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Workflow,
} from 'lucide-react'
import ScrollReveal from '../ScrollReveal'
import {
  moduleSpotlight,
  moduleShowcase,
  moduleChannels,
  moduleMarquee,
} from '../../data/premiumLanding'

const ICONS = {
  Activity,
  BarChart3,
  Boxes,
  CalendarDays,
  Camera,
  ClipboardList,
  Cog,
  Contact,
  Factory,
  FileText,
  Globe2,
  IdCard,
  Landmark,
  LayoutDashboard,
  ListTodo,
  MapPin,
  Megaphone,
  MessageSquare,
  MoonStar,
  NotebookPen,
  Package,
  Radar,
  Receipt,
  ShoppingCart,
  Store,
  Ticket,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Workflow,
}

const TONE = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'ring-blue-200',
    glow: 'from-blue-500/20',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    ring: 'ring-violet-200',
    glow: 'from-violet-500/20',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    ring: 'ring-cyan-200',
    glow: 'from-cyan-500/20',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    ring: 'ring-orange-200',
    glow: 'from-orange-500/20',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-200',
    glow: 'from-slate-500/20',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-200',
    glow: 'from-amber-500/20',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200',
    glow: 'from-emerald-500/20',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    ring: 'ring-rose-200',
    glow: 'from-rose-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    ring: 'ring-indigo-200',
    glow: 'from-indigo-500/20',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    ring: 'ring-teal-200',
    glow: 'from-teal-500/20',
  },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200', glow: 'from-sky-500/20' },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    ring: 'ring-pink-200',
    glow: 'from-pink-500/20',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    ring: 'ring-green-200',
    glow: 'from-green-500/20',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-600',
    ring: 'ring-fuchsia-200',
    glow: 'from-fuchsia-500/20',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    ring: 'ring-purple-200',
    glow: 'from-purple-500/20',
  },
}

function BrandLogo({ id }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (id) {
    case 'whatsapp':
      return (
        <svg {...common} fill="#25D366">
          <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.99.58 3.84 1.6 5.4L2 22l4.92-1.67a9.86 9.86 0 0 0 5.12 1.4h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2zm5.75 13.96c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.4-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36h.57c.18 0 .42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.29.3-.12.58.16.29.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.28.14.45.12.61-.07.17-.2.7-.81.89-1.09.19-.28.38-.23.64-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.7-.17 1.38z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0">
              <stop stopColor="#F58529" />
              <stop offset=".5" stopColor="#DD2A7B" />
              <stop offset="1" stopColor="#515BD4" />
            </linearGradient>
          </defs>
          <path
            fill="url(#ig)"
            d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9C2.3 4 3.9 2.4 7.1 2.3 8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.2 0-3.5 0-4.8.1-2.2.1-3.3 1.2-3.4 3.4-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 2.2 1.2 3.3 3.4 3.4 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c2.2-.1 3.3-1.2 3.4-3.4.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-2.2-1.2-3.3-3.4-3.4-1.3-.1-1.6-.1-4.8-.1m0 3a5.1 5.1 0 1 1 0 10.2A5.1 5.1 0 0 1 12 7m0 1.8a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6m6.4-2.1a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0"
          />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...common} fill="#1877F2">
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common} fill="#0F1419">
          <path d="M18.9 2H22l-6.8 7.78L23.2 22h-6.4l-5-6.55L6.1 22H3l7.3-8.34L1 2h6.55l4.52 5.99L18.9 2zm-1.12 18h1.78L6.4 3.9H4.5L17.78 20z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path
            fill="#25F4EE"
            d="M16.5 2h-3.1v13.1a2.7 2.7 0 1 1-1.9-2.6V9.3a5.9 5.9 0 1 0 5 5.8V8.4A7.4 7.4 0 0 0 21 9.7V6.5A7.3 7.3 0 0 1 16.5 2z"
            opacity=".9"
          />
          <path
            fill="#FE2C55"
            d="M15.4 3.1h-2V16a2.7 2.7 0 1 1-1.9-2.6v-3.1a5.9 5.9 0 1 0 5 5.8v-5.7a7.4 7.4 0 0 0 4.5 1.5V8.7a7.3 7.3 0 0 1-5.6-2.7V3.1z"
          />
          <path
            fill="#111"
            d="M14.6 3.9h-1.2v12.3a2 2 0 1 1-1.4-1.9v-1.4a5.2 5.2 0 1 0 4.3 5.1v-5.9a8.1 8.1 0 0 0 4.7 1.5V11a8 8 0 0 1-5.1-2.9V3.9z"
          />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-11z"
          />
          <path fill="#fff" d="M3.2 6.2 12 12.4l8.8-6.2v1.4L12 14 3.2 7.6V6.2z" />
        </svg>
      )
    case 'b2b':
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="16" rx="3" fill="#2563EB" />
          <path d="M7 9h4M7 12h10M7 15h7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

function IconBubble({ name, tone = 'blue', size = 'md' }) {
  const Icon = ICONS[name] || LayoutDashboard
  const t = TONE[tone] || TONE.blue
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl'
  const ico = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <motion.div
      whileHover={{ rotate: [-4, 4, 0], scale: 1.08 }}
      transition={{ duration: 0.45 }}
      className={`mod-ico ${box} ${t.bg} ${t.text} ring-1 ${t.ring}`}
    >
      <Icon className={ico} strokeWidth={2.1} />
    </motion.div>
  )
}

export default function ModulesShowcase() {
  const [night, setNight] = useState(false)
  const [pulse, setPulse] = useState(0)

  return (
    <section
      id="moduller"
      className={`section-pad mod-section ${night ? 'mod-section-night' : ''}`}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal className="mb-10 text-center">
          <span className="mod-pill">28+ entegre modül · tek platform</span>
          <h2 className="section-title mod-title mx-auto mt-5">Tüm İşiniz, Tek Canlı Panelde</h2>
          <p className="section-desc mx-auto max-w-3xl">
            Tüm Sosyal Ağ Mesajlarınız ve Mailleriniz Tek Panelde.
          </p>
        </ScrollReveal>

        <div className="mod-toolbar mb-6">
          <div className="mod-live-pill">
            <span className="mod-live-dot" />
            Canlı aktivite
          </div>
          <div className="mod-channel-row">
            {moduleChannels.map((c, i) => (
              <motion.span
                key={c.id}
                className="mod-channel"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.2, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="mod-channel-logo">
                  <BrandLogo id={c.id} />
                </span>
                {c.label}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Separate day/night module promo */}
        <ScrollReveal className="mb-8">
          <div className={`mod-theme-card ${night ? 'night' : ''}`}>
            <div className="mod-theme-copy">
              <span className="mod-theme-kicker">Modül tanıtımı</span>
              <h3>Gündüz & Gece Modu</h3>
              <p>
                Panel görünümünü tek tıkla değiştirin. Gündüzde net okuma, gecede göz yormayan koyu
                arayüz — tüm ekranlar aynı deneyimde.
              </p>
            </div>
            <div className="mod-theme-demo">
              <div className={`mod-theme-preview-panel ${night ? 'night' : ''}`}>
                <div className="mod-theme-preview-bar" />
                <div className="mod-theme-preview-rows">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="mod-theme-switch" role="group" aria-label="Tema seçimi">
                <button
                  type="button"
                  className={!night ? 'on' : ''}
                  onClick={() => setNight(false)}
                >
                  <Sun className="h-4 w-4" /> Gündüz
                </button>
                <button type="button" className={night ? 'on' : ''} onClick={() => setNight(true)}>
                  <Moon className="h-4 w-4" /> Gece
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="mb-6 grid gap-4 lg:grid-cols-4">
          {moduleSpotlight.map((s, i) => {
            const t = TONE[s.tone] || TONE.blue
            return (
              <ScrollReveal key={s.id} delay={i * 0.06} direction="scale">
                <Link to={s.href} className={`mod-spot ${night ? 'night' : ''}`}>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${t.glow} to-transparent opacity-80`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <IconBubble name={s.icon} tone={s.tone} size="lg" />
                    <span className="mod-badge">{s.badge}</span>
                  </div>
                  <h3 className="relative mt-4 text-lg font-extrabold tracking-tight">{s.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed opacity-70">{s.desc}</p>
                  <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                    İncele <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>

        <div className="mod-marquee mb-8" aria-hidden="true">
          <div className="mod-marquee-track">
            {[...moduleMarquee, ...moduleMarquee].map((label, i) => (
              <span key={`${label}-${i}`} className="mod-marquee-chip">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {moduleShowcase.map((m, i) => (
            <ScrollReveal key={m.title} delay={(i % 4) * 0.04}>
              <motion.div
                whileHover={{ y: -6 }}
                onHoverStart={() => setPulse(i)}
                className="h-full"
              >
                <Link
                  to={m.href}
                  className={`mod-card ${night ? 'night' : ''} ${pulse === i ? 'pulse' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <IconBubble name={m.icon} tone={m.tone} />
                    <span className="mod-tag">{m.tag}</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-extrabold tracking-tight">{m.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-snug opacity-65">{m.desc}</p>
                  <motion.div
                    className="mod-card-shine"
                    animate={{ x: ['-120%', '160%'] }}
                    transition={{
                      duration: 2.8,
                      delay: (i % 7) * 0.35,
                      repeat: Infinity,
                      repeatDelay: 4,
                    }}
                  />
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-10">
          <div className={`mod-foot ${night ? 'night' : ''}`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] opacity-50">
                Süreç hattı
              </div>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight">
                Teklif · Sipariş · Üretim · Depo · Teslimat
              </h3>
              <p className="mt-2 max-w-xl text-sm opacity-65">
                Fotoğraflı aşamalar, B2B sipariş, kampanya, cari, canlı mesaj — tüm kanallar tek
                platformda.
              </p>
            </div>
            <div className="mod-foot-actions">
              <AnimatePresence mode="wait">
                <motion.div
                  key={night ? 'n' : 'd'}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="mod-theme-preview"
                >
                  {night ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span>{night ? 'Gece paneli aktif' : 'Gündüz paneli aktif'}</span>
                </motion.div>
              </AnimatePresence>
              <Link to="/demo" className="btn-primary">
                Tüm özellikleri gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
