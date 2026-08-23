'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  Moon,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Users,
} from 'lucide-react'

const ROWS = [
  {
    name: 'Moda Toptancı',
    tip: 'Bayi',
    tipTone: 'violet',
    rep: 'Ahmet Kara',
    score: 'Çok İyi',
    scoreTone: 'emerald',
  },
  {
    name: 'Forza Ajans',
    tip: 'Müşteri',
    tipTone: 'sky',
    rep: 'Mustafa Mavili',
    score: 'İyi',
    scoreTone: 'blue',
  },
  {
    name: 'Aşkın Stüdyo',
    tip: 'Müşteri',
    tipTone: 'sky',
    rep: 'Tamer Akınbey',
    score: 'Normal',
    scoreTone: 'slate',
  },
]

const METRICS = [
  { label: 'Toplam Müşteri', value: '3' },
  { label: 'Aktif Cari', value: '3' },
  { label: 'Toplam Ödenecek', value: '0,00₺' },
  { label: 'Toplam Tahsil Edilecek', value: '0,00₺' },
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

/** Dinamik vektörel Müşteriler paneli — her çözünürlükte net. */
export default function MusterilerPanel({ className = '', compact = false }) {
  const reduce = useReducedMotion()

  return (
    <div
      className={`hq-panel hq-panel--musteriler ${compact ? 'hq-panel--compact' : ''} ${className}`}
    >
      <motion.div
        className="hq-panel-shell"
        animate={reduce ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <aside className="hq-side">
          <div className="hq-logo">
            BACHMAIN<span>.</span>
          </div>
          <nav className="hq-nav">
            <div className="hq-nav-item">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Güncel Durum</span>
            </div>
            <div className="hq-nav-item is-open">
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span>Satışlar</span>
              <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
            </div>
            <div className="hq-nav-kids">
              <div className="hq-nav-kid">Faturalar</div>
              <div className="hq-nav-kid is-on">Müşteriler</div>
              <div className="hq-nav-kid">Satışlar Raporu</div>
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

          <div className="hq-crumb">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>GÜNCEL DURUM</span>
            <span>/</span>
            <strong>MÜŞTERİLER</strong>
            <button type="button" className="hq-create">
              <Plus className="h-3.5 w-3.5" /> Yeni Müşteri Oluştur
            </button>
          </div>

          <div className="hq-actions hq-actions--sm">
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`hq-action bg-gradient-to-br ${a.tone}`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="hq-metrics">
            {METRICS.map((m) => (
              <div key={m.label} className="hq-metric">
                <span>{m.label}</span>
                <strong>{m.value}</strong>
              </div>
            ))}
          </div>

          <div className="hq-filters">
            {['Tipi', 'Temsilci', 'Puantaj', 'Bakiye'].map((f) => (
              <button key={f} type="button" className="hq-filter">
                {f} <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            ))}
            <div className="hq-table-search">
              <Search className="h-3 w-3 opacity-40" />
              Marka veya ünvan ara...
            </div>
            <span className="hq-count">3 Kayıt</span>
          </div>

          <div className="hq-table">
            <div className="hq-table-head">
              <span>MÜŞTERİLER</span>
              <span>TİPİ</span>
              <span>TEMSİLCİ</span>
              <span>PUANTAJ</span>
              <span>GÜNCEL BAKİYE</span>
            </div>
            {ROWS.map((r, i) => (
              <motion.div
                key={r.name}
                className="hq-table-row"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <strong>{r.name}</strong>
                <span className={`hq-chip hq-chip--${r.tipTone}`}>{r.tip}</span>
                <span>{r.rep}</span>
                <span className={`hq-chip hq-chip--${r.scoreTone}`}>{r.score}</span>
                <em>0,00₺</em>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      <p className="hq-panel-caption">
        <span className="hq-live-dot" /> Müşteriler · dinamik 4K panel
      </p>
    </div>
  )
}
