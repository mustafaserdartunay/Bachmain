'use client'

import { Link } from 'react-router-dom'
import Logo from './Logo'
import { footerLinks } from '../data/navigation'
import { SITE_CONTACT, SITE_SOCIAL } from '../seo/site'

const SOCIAL = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: SITE_SOCIAL.instagram,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9C2.3 4 3.9 2.4 7.1 2.3 8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.2 0-3.5 0-4.8.1-2.2.1-3.3 1.2-3.4 3.4-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 2.2 1.2 3.3 3.4 3.4 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c2.2-.1 3.3-1.2 3.4-3.4.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-2.2-1.2-3.3-3.4-3.4-1.3-.1-1.6-.1-4.8-.1m0 3a5.1 5.1 0 1 1 0 10.2A5.1 5.1 0 0 1 12 7m0 1.8a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6m6.4-2.1a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: SITE_SOCIAL.facebook,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: SITE_SOCIAL.tiktok,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <path d="M16.5 2h-3.1v13.1a2.7 2.7 0 1 1-1.9-2.6V9.3a5.9 5.9 0 1 0 5 5.8V8.4A7.4 7.4 0 0 0 21 9.7V6.5A7.3 7.3 0 0 1 16.5 2z" />
      </svg>
    ),
  },
  {
    id: 'x',
    label: 'X',
    href: SITE_SOCIAL.x,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <path d="M18.9 2H22l-6.8 7.78L23.2 22h-6.4l-5-6.55L6.1 22H3l7.3-8.34L1 2h6.55l4.52 5.99L18.9 2zm-1.12 18h1.78L6.4 3.9H4.5L17.78 20z" />
      </svg>
    ),
  },
]

const PRODUCT_LINKS = [
  { label: 'CRM', href: '/crm' },
  { label: 'ERP', href: '/erp' },
  { label: 'Muhasebe & Finans', href: '/finans' },
  { label: 'Stok & Depo', href: '/stok' },
  { label: 'Üretim', href: '/uretim' },
  { label: 'Saha Satış', href: '/saha-satis' },
  { label: 'Lojistik & Nakliye', href: '/lojistik' },
  { label: 'İnsan Kaynakları', href: '/insan-kaynaklari' },
  { label: 'WhatsApp & Mesaj', href: '/whatsapp' },
  { label: 'Sosyal Medya Inbox', href: '/sosyal-medya' },
  { label: 'Yapay Zeka', href: '/openai' },
  { label: 'E-Fatura', href: '/e-fatura' },
  { label: 'E-Ticaret', href: '/siparis' },
  { label: 'Raporlama', href: '/raporlar' },
  { label: 'Fiyatlandırma', href: '/fiyatlar' },
]

const SECURITY_LINKS = [
  { label: 'Gizlilik Politikası', href: '/gizlilik' },
  { label: 'Kullanım Şartları', href: '/iletisim' },
  { label: 'KVKK Aydınlatma Metni', href: '/kvkk' },
]

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-1">
          <div className="site-footer-logo">
            <Logo onDark />
          </div>
          <div className="mt-5 flex gap-2.5">
            {SOCIAL.map((s) => (
              <a
                key={s.id}
                href={s.href}
                className="site-footer-social"
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <strong className="site-footer-heading">ÜRÜNLER</strong>
          <ul className="site-footer-list">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.href} className="site-footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong className="site-footer-heading">GİZLİLİK VE GÜVENLİK</strong>
          <ul className="site-footer-list">
            {SECURITY_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.href} className="site-footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong className="site-footer-heading">DESTEK</strong>
          <ul className="site-footer-list">
            {footerLinks.support.map((l) => (
              <li key={l.label}>
                <Link to={l.href} className="site-footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/blog" className="site-footer-link">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/referanslar" className="site-footer-link">
                Referanslar
              </Link>
            </li>
            <li>
              <Link to="/basari-hikayeleri" className="site-footer-link">
                Başarı Hikayeleri
              </Link>
            </li>
            <li>
              <Link to="/sektorler" className="site-footer-link">
                Sektörler
              </Link>
            </li>
            <li>
              <Link to="/iletisim" className="site-footer-link">
                İletişim
              </Link>
            </li>
            <li>
              <Link to="/demo" className="site-footer-link">
                Demo Talep
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <strong className="site-footer-heading">İLETİŞİM</strong>
          <ul className="site-footer-list">
            <li>
              <a href={`mailto:${SITE_CONTACT.email}`} className="site-footer-link">
                {SITE_CONTACT.email}
              </a>
            </li>
            <li>
              <a href={`tel:${SITE_CONTACT.phone}`} className="site-footer-link">
                {SITE_CONTACT.phoneDisplay}
              </a>
            </li>
            <li className="site-footer-link">{SITE_CONTACT.addressLocality}, Türkiye</li>
          </ul>
        </div>
      </div>

      <div className="site-footer-copy">
        © {new Date().getFullYear()} BACHMAIN. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
