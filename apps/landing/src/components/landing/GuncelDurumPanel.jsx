'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Banknote,
  Bell,
  CheckCircle2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Moon,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  Workflow,
} from 'lucide-react'

const NAV = [
  { label: 'Güncel Durum', on: true, Icon: LayoutDashboard },
  { label: 'Satışlar', Icon: ShoppingCart, open: true, kids: ['Faturalar', 'Müşteriler'] },
  { label: 'Süreç Yönetimi', Icon: Workflow },
  { label: 'Giderler', Icon: FileText },
  { label: 'E-Belgeler', Icon: FileText },
  { label: 'Nakit', Icon: Banknote },
  { label: 'Stok', Icon: Package },
  { label: 'Projeler', Icon: Workflow },
]

const ACTIONS = [
  { label: 'Kasa', tone: 'from-sky-400 to-blue-600' },
  { label: 'Gelir Ekle', tone: 'from-emerald-400 to-green-600' },
  { label: 'Gider Ekle', tone: 'from-orange-400 to-amber-600' },
  { label: 'Yeni Teklif', tone: 'from-cyan-400 to-teal-600' },
  { label: 'Yeni Müşteri', tone: 'from-blue-500 to-indigo-700' },
  { label: 'Yeni Tedarikçi', tone: 'from-yellow-400 to-amber-500' },
  { label: 'Yeni Fatura', tone: 'from-violet-400 to-purple-600' },
  { label: 'Gelen E-Fatura', tone: 'from-rose-400 to-pink-600' },
]

const FINANCE = [
  ['Bekleyen Tahsilatlar', '0,00₺'],
  ['Toplam Ödenecek', '0,00₺'],
  ['Toplam Stok Değeri', '0,00₺'],
  ['Kasa', '0,00₺'],
  ['Bankalar', '0,00₺'],
  ['Kredi Kartı Pos', '0,00₺'],
  ['Portföydeki Çekler', '0,00₺'],
  ['Portföydeki Senetler', '0,00₺'],
]

/** Dinamik vektörel Güncel Durum paneli — her çözünürlükte net. */
export default function GuncelDurumPanel({ className = '' }) {
  const reduce = useReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduce) return undefined
    const id = window.setInterval(() => setTick((n) => n + 1), 3200)
    return () => window.clearInterval(id)
  }, [reduce])

  const marker = 72 + ((tick % 5) - 2) * 2

  return (
    <div className={`hq-panel hq-panel--guncel ${className}`}>
      <motion.div
        className="hq-panel-shell"
        animate={reduce ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <aside className="hq-side">
          <div className="hq-logo">
            BACHMAIN<span>.</span>
          </div>
          <nav className="hq-nav">
            {NAV.map((item) => (
              <div key={item.label}>
                <div className={`hq-nav-item${item.on ? ' is-on' : ''}`}>
                  <item.Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                  <span>{item.label}</span>
                  {item.open ? <ChevronDown className="ml-auto h-3 w-3 opacity-50" /> : null}
                </div>
                {item.kids ? (
                  <div className="hq-nav-kids">
                    {item.kids.map((k) => (
                      <div key={k} className="hq-nav-kid">
                        {k}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="hq-nav-label">CRM</div>
            <div className="hq-nav-item">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Ajanda</span>
            </div>
            <div className="hq-nav-item">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              <span>Saha Satış</span>
            </div>
          </nav>
          <div className="hq-side-foot">
            <div className="hq-trial">8 gün kaldı</div>
            <button type="button" className="hq-upgrade">
              Yükselt
            </button>
          </div>
        </aside>

        <div className="hq-main">
          <header className="hq-top">
            <div className="hq-search">
              <Search className="h-3.5 w-3.5 opacity-45" />
              <span>Ara...</span>
            </div>
            <div className="hq-top-actions">
              <span className="hq-theme">
                <Sun className="h-3.5 w-3.5" />
                <Moon className="h-3.5 w-3.5 opacity-35" />
              </span>
              <Bell className="h-3.5 w-3.5 opacity-55" />
              <div className="hq-user">
                <strong>Selin Akbal</strong>
                <small>Yonca Güzellik Merkezi</small>
              </div>
              <div className="hq-avatar">S</div>
            </div>
          </header>

          <div className="hq-actions">
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`hq-action bg-gradient-to-br ${a.tone}`}
              >
                <Plus className="h-3.5 w-3.5" />
                {a.label}
              </button>
            ))}
          </div>

          <div className="hq-cash-card">
            <div className="hq-cash-head">
              <h3>Ay Sonu Nakit Dengesi</h3>
              <span>Canlı</span>
            </div>
            <div className="hq-cash-grid">
              {['Mevcut Denge', 'Operasyonel Senaryo'].map((title) => (
                <div key={title} className="hq-cash-col">
                  <div className="hq-cash-title">
                    {title}
                    <em>
                      <CheckCircle2 className="h-3.5 w-3.5" /> GÜÇLÜ
                    </em>
                  </div>
                  <div className="hq-meter">
                    <div className="hq-meter-bar" />
                    <motion.i
                      className="hq-meter-pin"
                      animate={{ left: `${marker}%` }}
                      transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                    />
                  </div>
                  <div className="hq-cash-meta">
                    <span>Net Bakiye</span>
                    <strong>+₺0</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hq-bottom">
            <div className="hq-card">
              <h4>Finans Özeti</h4>
              <ul>
                {FINANCE.map(([label, value]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hq-card">
              <h4>Aktivasyon Zaman Tablosu</h4>
              <div className="hq-empty">Planlı ödeme veya alacak bulunamadı</div>
            </div>
          </div>
        </div>
      </motion.div>
      <p className="hq-panel-caption">
        <span className="hq-live-dot" /> Güncel Durum · dinamik 4K panel
      </p>
    </div>
  )
}
