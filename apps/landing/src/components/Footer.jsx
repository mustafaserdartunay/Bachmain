import { Link } from "react-router-dom";
import Logo from "./Logo";
import { footerLinks } from "../data/navigation";

const SOCIAL = [
  {
    id: "instagram",
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="ft-ig" x1="0" y1="24" x2="24" y2="0">
            <stop stopColor="#F58529" />
            <stop offset=".5" stopColor="#DD2A7B" />
            <stop offset="1" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <path fill="url(#ft-ig)" d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9C2.3 4 3.9 2.4 7.1 2.3 8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.2 0-3.5 0-4.8.1-2.2.1-3.3 1.2-3.4 3.4-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 2.2 1.2 3.3 3.4 3.4 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c2.2-.1 3.3-1.2 3.4-3.4.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-2.2-1.2-3.3-3.4-3.4-1.3-.1-1.6-.1-4.8-.1m0 3a5.1 5.1 0 1 1 0 10.2A5.1 5.1 0 0 1 12 7m0 1.8a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6m6.4-2.1a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#25F4EE" d="M16.5 2h-3.1v13.1a2.7 2.7 0 1 1-1.9-2.6V9.3a5.9 5.9 0 1 0 5 5.8V8.4A7.4 7.4 0 0 0 21 9.7V6.5A7.3 7.3 0 0 1 16.5 2z" opacity=".95" />
        <path fill="#FE2C55" d="M15.4 3.1h-2V16a2.7 2.7 0 1 1-1.9-2.6v-3.1a5.9 5.9 0 1 0 5 5.8v-5.7a7.4 7.4 0 0 0 4.5 1.5V8.7a7.3 7.3 0 0 1-5.6-2.7V3.1z" />
        <path fill="#fff" d="M14.6 3.9h-1.2v12.3a2 2 0 1 1-1.4-1.9v-1.4a5.2 5.2 0 1 0 4.3 5.1v-5.9a8.1 8.1 0 0 0 4.7 1.5V11a8 8 0 0 1-5.1-2.9V3.9z" />
      </svg>
    ),
  },
  {
    id: "x",
    label: "X",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <path d="M18.9 2H22l-6.8 7.78L23.2 22h-6.4l-5-6.55L6.1 22H3l7.3-8.34L1 2h6.55l4.52 5.99L18.9 2zm-1.12 18h1.78L6.4 3.9H4.5L17.78 20z" />
      </svg>
    ),
  },
];

const PRODUCT_LINKS = [
  { label: "CRM", href: "/features/crm" },
  { label: "ERP", href: "/features/erp" },
  { label: "Müşteriler", href: "/features/crm" },
  { label: "Tedarikçiler", href: "/features/erp" },
  { label: "Ürün & Hizmet", href: "/features/stock" },
  { label: "Stok", href: "/features/stock" },
  { label: "Depo", href: "/features/stock" },
  { label: "Teklif", href: "/features/erp" },
  { label: "Sipariş", href: "/features/erp" },
  { label: "Üretim", href: "/modules/production" },
  { label: "Saha Satış", href: "/modules/field-sales" },
  { label: "Nakliye", href: "/features/stock" },
  { label: "POS & Kasa", href: "/features/finance" },
  { label: "Finans", href: "/features/finance" },
  { label: "e-Fatura", href: "/e-invoice" },
  { label: "B2B Portal", href: "/features/erp" },
  { label: "Mesaj Merkezi", href: "/features/crm" },
  { label: "İK & Personel", href: "/features/erp" },
  { label: "Raporlama", href: "/features/reports" },
  { label: "Görev & Randevu", href: "/features/crm" },
  { label: "Fiyatlandırma", href: "/pricing" },
];

const SECURITY_LINKS = [
  { label: "Gizlilik Politikası", href: "/gizlilik" },
  { label: "Kullanım Şartları", href: "/contact" },
  { label: "KVKK Aydınlatma Metni", href: "/kvkk" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-1">
          <div className="site-footer-logo">
            <Logo />
          </div>
          <div className="mt-5 flex gap-2.5">
            {SOCIAL.map((s) => (
              <a key={s.id} href={s.href} className="site-footer-social" aria-label={s.label}>
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
                <Link to={l.href} className="site-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong className="site-footer-heading">GİZLİLİK VE GÜVENLİK</strong>
          <ul className="site-footer-list">
            {SECURITY_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.href} className="site-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong className="site-footer-heading">DESTEK</strong>
          <ul className="site-footer-list">
            {footerLinks.support.map((l) => (
              <li key={l.label}>
                <Link to={l.href} className="site-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong className="site-footer-heading">İLETİŞİM</strong>
          <ul className="site-footer-list">
            <li className="site-footer-link">destek@bachmain.com</li>
            <li className="site-footer-link">0212 963 00 20</li>
            <li className="site-footer-link">İstanbul, Türkiye</li>
          </ul>
        </div>
      </div>

      <div className="site-footer-copy">
        © 2026 BACHMAIN. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
