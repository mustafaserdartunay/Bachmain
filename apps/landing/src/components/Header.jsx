import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import Logo from "./Logo";

const nav = [
  { label: "Ana Sayfa", href: "/" },
  {
    label: "Ürün",
    items: [
      { label: "Özellikler", href: "/features" },
      { label: "CRM", href: "/features/crm" },
      { label: "ERP", href: "/features/erp" },
      { label: "E-Fatura", href: "/e-invoice" },
    ],
  },
  {
    label: "Modüller",
    href: "/modules",
    items: [
      { label: "Üretim", href: "/modules/production" },
      { label: "Saha Satış", href: "/modules/field-sales" },
      { label: "E-Ticaret", href: "/modules/ecommerce" },
      { label: "Stok", href: "/features/stock" },
    ],
  },
  { label: "Sektörler", href: "/modules" },
  { label: "Fiyatlandırma", href: "/pricing" },
  { label: "Referanslar", href: "/#referanslar" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/contact" },
];

function Dropdown({ label, items, href }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {href ? (
        <Link to={href} className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600">
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Link>
      ) : (
        <button type="button" className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600">
          {label}
          <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && items && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-2xl border border-slate-100 bg-white/95 p-2 shadow-xl backdrop-blur">
          {items.map((item) => (
            <Link key={item.href} to={item.href} className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`site-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <Logo />

        <nav className="hidden items-center xl:flex">
          {nav.map((item) =>
            item.items ? (
              <Dropdown key={item.label} label={item.label} items={item.items} href={item.href} />
            ) : (
              <Link key={item.label} to={item.href} className="px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600">
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="btn-ghost">Giriş Yap</Link>
          <Link to="/demo" className="btn-primary !px-4 !py-2.5 !text-[13px]">Demo Talep Et</Link>
        </div>

        <button type="button" className="rounded-lg p-2 text-slate-700 xl:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menü">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[68px] border-b border-slate-100 bg-white px-4 py-4 shadow-lg xl:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <div key={item.label}>
                {item.href && !item.items ? (
                  <Link to={item.href} className="block py-2 font-semibold text-slate-800" onClick={() => setMobileOpen(false)}>{item.label}</Link>
                ) : (
                  <>
                    <div className="py-2 text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                    {item.items?.map((sub) => (
                      <Link key={sub.href} to={sub.href} className="block py-1.5 pl-3 text-sm text-slate-600" onClick={() => setMobileOpen(false)}>{sub.label}</Link>
                    ))}
                  </>
                )}
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <Link to="/login" className="btn-ghost flex-1 justify-center border border-slate-200" onClick={() => setMobileOpen(false)}>Giriş</Link>
              <Link to="/demo" className="btn-primary flex-1 !py-2.5" onClick={() => setMobileOpen(false)}>Demo</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
