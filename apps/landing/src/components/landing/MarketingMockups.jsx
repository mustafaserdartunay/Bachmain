import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function BrowserChrome({ url = '🔒 app.bachmain.com/dashboard' }) {
  return (
    <div className="mock-bbar">
      <div className="mock-dots">
        <span />
        <span />
        <span />
      </div>
      <div className="mock-url">{url}</div>
    </div>
  )
}

export function HeroDashboard() {
  const wrapRef = useRef(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(1200px) rotateX(${2 - y * 8}deg) rotateY(${-8 + x * 12}deg)`
    }
    const onLeave = () => {
      el.style.transform = 'perspective(1200px) rotateX(2deg) rotateY(-8deg)'
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className="mock-db-wrap">
      <div className="mock-browser">
        <BrowserChrome />
        <div className="mock-db-inner">
          <div className="mock-sidebar">
            <img
              src="/assets/bachmain-logo.png"
              alt="BACHMAIN"
              width={140}
              height={32}
              className="brand-logo-img"
              decoding="async"
              loading="lazy"
              draggable={false}
            />
            <div className="mock-nav">
              {[
                ['#3B82F6', 'Dashboard', true],
                ['rgba(255,255,255,.15)', 'CRM'],
                ['rgba(255,255,255,.15)', 'ERP'],
                ['rgba(255,255,255,.15)', 'Muhasebe'],
                ['rgba(255,255,255,.15)', 'Üretim'],
                ['rgba(255,255,255,.15)', 'İnsan Kaynakları'],
                ['rgba(255,255,255,.15)', 'Saha Satış'],
                ['rgba(255,255,255,.15)', 'Raporlar'],
              ].map(([bg, label, on]) => (
                <div key={label} className={`mock-ni ${on ? 'on' : ''}`}>
                  <div className="mock-ni-dot" style={{ background: bg }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="mock-main">
            <div className="mock-topbar">
              <div className="mock-title">Genel Bakış</div>
              <div className="mock-date">9 Tem 2026</div>
            </div>
            <div className="mock-kpis">
              {[
                ['Gelir', '₺284K', '+12%', 'b'],
                ['Siparişler', '1.847', '+8%', 'g'],
                ['Müşteriler', '4.291', '+5%', 'go'],
                ['Üretim', '%93', '▲', 'r'],
              ].map(([l, v, c, cls]) => (
                <div key={l} className={`mock-kpi ${cls}`}>
                  <div className="mock-kl">{l}</div>
                  <div className="mock-kv">{v}</div>
                  <div className="mock-kc">{c}</div>
                </div>
              ))}
            </div>
            <div className="mock-cards">
              <div className="mock-card">
                <div className="mock-ct">Aylık Gelir</div>
                <div className="mock-bars">
                  {[38, 54, 46, 68, 58, 79, 94].map((h, i) => (
                    <div
                      key={i}
                      className={`mock-bar ${i === 6 ? 'hi' : ''}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mock-card">
                <div className="mock-ct">Son Aktiviteler</div>
                <div className="mock-rows">
                  {[
                    ['#3B82F6', 'Sipariş #4521', 'Onaylandı', 'ok'],
                    ['#F59E0B', 'Teklif #892', 'Beklemede', 'wait'],
                    ['#10B981', 'Fatura #2219', 'Ödendi', 'ok'],
                    ['#EF4444', 'İade #44', 'İşlemde', 'err'],
                  ].map(([dot, name, badge, type]) => (
                    <div key={name} className="mock-row">
                      <div className="mock-dr-dot" style={{ background: dot }} />
                      <div className="mock-dr-name">{name}</div>
                      <div className={`mock-dr-badge ${type}`}>{badge}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FullDashboardShowcase() {
  const zoomRef = useRef(null)

  useEffect(() => {
    const el = zoomRef.current
    if (!el) return
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height * 0.5)))
      const scale = 0.86 + p * 0.16
      el.style.transform = `scale(${scale})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={zoomRef} className="mock-zoom-db">
      <div className="mock-full-db">
        <BrowserChrome url="🔒 app.bachmain.com/dashboard" />
        <div className="mock-fdb-inner">
          <div className="mock-fdb-sidebar">
            <img
              src="/assets/bachmain-logo.png"
              alt="BACHMAIN"
              width={140}
              height={32}
              className="brand-logo-img"
              decoding="async"
              loading="lazy"
              draggable={false}
            />
            <div className="mock-fsec">Ana Menü</div>
            {[
              ['📊', 'Dashboard', true],
              ['👥', 'CRM'],
              ['🏢', 'ERP'],
              ['💰', 'Muhasebe'],
            ].map(([ico, label, on]) => (
              <div key={label} className={`mock-fsi ${on ? 'on' : ''}`}>
                <span className="mock-fsi-ico">{ico}</span>
                {label}
              </div>
            ))}
            <div className="mock-fsec">Operasyon</div>
            {['📦 Stok & Depo', '⚙️ Üretim', '🚛 Lojistik', '📍 Saha Satış'].map((item) => (
              <div key={item} className="mock-fsi">
                <span className="mock-fsi-ico">{item.split(' ')[0]}</span>
                {item.slice(2)}
              </div>
            ))}
            <div className="mock-fsec">Satış</div>
            {['🌍 B2B Portal', '📄 E-Fatura', '✨ Yapay Zekâ'].map((item) => (
              <div key={item} className="mock-fsi">
                <span className="mock-fsi-ico">{item.split(' ')[0]}</span>
                {item.slice(2)}
              </div>
            ))}
          </div>
          <div className="mock-fdb-main">
            <div className="mock-fmh">
              <div className="mock-fmh-title">Genel Bakış — Temmuz 2026</div>
              <div className="mock-fmh-right">
                <div className="mock-fb mock-fb-o">Bu Ay</div>
                <div className="mock-fb mock-fb-p">+ Yeni Rapor</div>
              </div>
            </div>
            <div className="mock-kpi-row">
              {[
                ['Toplam Gelir', '₺2.84M', '↑ %12 geçen aya göre', 'kb', 'up'],
                ['Aktif Siparişler', '1.847', '↑ %8 büyüme', 'kg', 'up'],
                ['Müşteri Sayısı', '4.291', '↑ 214 yeni', 'kgo', 'up'],
                ['Üretim Verimi', '%93.4', '↓ %1.2 hedef altı', 'kr', 'dn'],
              ].map(([l, v, c, cls, dir]) => (
                <div key={l} className={`mock-kpi-lg ${cls}`}>
                  <div className="mock-kpi-l">{l}</div>
                  <div className="mock-kpi-v">{v}</div>
                  <div className={`mock-kpi-c ${dir}`}>{c}</div>
                </div>
              ))}
            </div>
            <div className="mock-chart-row">
              <div className="mock-chart-box">
                <div className="mock-chart-title">Aylık Gelir Trendi (₺)</div>
                <svg className="mock-chart-svg" viewBox="0 0 500 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity=".3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,180 C80,160 160,130 240,95 C320,60 400,40 500,18 L500,220 L0,220 Z"
                    fill="url(#cg)"
                  />
                  <path
                    d="M0,180 C80,160 160,130 240,95 C320,60 400,40 500,18"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                  />
                  <circle cx="120" cy="140" r="4" fill="#3B82F6" />
                  <circle cx="240" cy="95" r="4" fill="#3B82F6" />
                  <circle cx="380" cy="38" r="4" fill="#3B82F6" />
                  <circle cx="500" cy="18" r="5" fill="#60A5FA" />
                </svg>
              </div>
              <div className="mock-act-box">
                <div className="mock-act-title">Canlı Aktiviteler</div>
                {[
                  ['#3B82F6', 'Sipariş #4521 onaylandı', 'Zorlu Holding — 2 dk önce'],
                  ['#10B981', 'Fatura #2219 ödendi', '₺48.500 tahsilat — 5 dk önce'],
                  ['#F59E0B', 'Teklif #892 gönderildi', 'Sabancı Grubu — 12 dk önce'],
                  ['#8B5CF6', 'Üretim emri tamamlandı', '1.200 adet — 18 dk önce'],
                ].map(([dot, main, sub]) => (
                  <div key={main} className="mock-act-item">
                    <div className="mock-act-dot" style={{ background: dot }} />
                    <div>
                      <div className="mock-act-main">{main}</div>
                      <div className="mock-act-sub">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MapMock() {
  const pins = [
    { top: '18%', left: '42%', emoji: '📍', cls: 'pb' },
    { top: '36%', left: '24%', emoji: '✅', cls: 'pg' },
    { top: '27%', left: '63%', emoji: '⏳', cls: 'pr' },
    { top: '53%', left: '51%', emoji: '🏪', cls: 'pgo' },
    { top: '63%', left: '30%', emoji: '📋', cls: 'pb' },
  ]

  return (
    <div className="mock-map">
      <div className="mock-map-grid" />
      <div className="mock-map-overlay" />
      <svg className="mock-map-route" viewBox="0 0 400 480">
        <path
          d="M80,390 Q160,290 200,210 Q240,140 290,110 Q330,90 350,130"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeDasharray="8,5"
          opacity=".5"
        />
      </svg>
      {pins.map((p, i) => (
        <motion.div
          key={i}
          className="mock-mpin"
          style={{ top: p.top, left: p.left }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
        >
          {i === 0 && <div className="mock-pin-pulse" />}
          <div className={`mock-pin-head ${p.cls}`}>
            <span className="mock-pin-e">{p.emoji}</span>
          </div>
        </motion.div>
      ))}
      <div className="mock-map-panel">
        <div className="mock-mp-stat">
          <div className="mock-mp-val">12</div>
          <div className="mock-mp-lab">Temsilci Aktif</div>
        </div>
        <div className="mock-mp-div" />
        <div className="mock-mp-stat">
          <div className="mock-mp-val">84</div>
          <div className="mock-mp-lab">Ziyaret Bugün</div>
        </div>
        <div className="mock-mp-div" />
        <div className="mock-mp-stat">
          <div className="mock-mp-val">₺1.2M</div>
          <div className="mock-mp-lab">Günlük Satış</div>
        </div>
      </div>
    </div>
  )
}

export function PhoneChatMock() {
  return (
    <div className="mock-phone">
      <div className="mock-pscreen">
        <div className="mock-pnotch" />
        <div className="mock-ph-header">
          <div className="mock-ph-ico">📸</div>
          <div className="mock-ph-name">
            Instagram DM <span>· bach.main</span>
          </div>
        </div>
        <div className="mock-ph-msgs">
          <div className="mock-pm l">
            <div className="mock-pm-av">👤</div>
            <div className="mock-pm-bub">
              Merhaba, ürünleriniz hakkında bilgi alabilir miyim?{' '}
              <span className="mock-pm-src ig">IG</span>
            </div>
          </div>
          <div className="mock-pm r">
            <div className="mock-pm-bub">
              Merhaba! BACHMAIN platformunu tanıtmaktan memnuniyet duyarım. Hangi modül ilginizi
              çekiyor?
            </div>
            <div className="mock-pm-av navy">B</div>
          </div>
          <div className="mock-pm l">
            <div className="mock-pm-av">👤</div>
            <div className="mock-pm-bub">CRM ve ERP modülleri, 50 kişilik şirketiz</div>
          </div>
          <div className="mock-pm r">
            <div className="mock-pm-bub">
              Size özel demo ayarlayabiliriz! Ücretsiz 30 dk demo için tarih belirleyelim mi? 🚀
            </div>
            <div className="mock-pm-av navy">B</div>
          </div>
        </div>
      </div>
    </div>
  )
}
