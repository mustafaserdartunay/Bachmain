import { Link } from "react-router-dom";
import Logo from "./Logo";
import { footerLinks } from "../data/navigation";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-1">
          <div className="inline-flex rounded-xl bg-white px-3 py-2">
            <Logo />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/40">
            Tekliften tahsilata, CRM&apos;den lojistiğe — tüm süreçler tek premium platformda.
          </p>
          <div className="mt-5 flex gap-2">
            {["Li", "X", "Ig", "Yt"].map((s) => (
              <a key={s} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/8 text-[10px] font-bold text-white/50 hover:!text-white">
                {s}
              </a>
            ))}
          </div>
        </div>
        {[
          { title: "ÜRÜNLER", links: footerLinks.products },
          { title: "MODÜLLER", links: footerLinks.products.slice(0, 5).concat([{ label: "Saha Satış", href: "/modules/field-sales" }]) },
          { title: "DESTEK", links: footerLinks.support },
        ].map(({ title, links }) => (
          <div key={title}>
            <strong className="text-[11px] font-bold tracking-[1.6px] text-white/35">{title}</strong>
            <ul className="mt-4 space-y-2.5">
              {links.map((l) => (
                <li key={title + l.label}>
                  <Link to={l.href} className="text-[13.5px]">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <strong className="text-[11px] font-bold tracking-[1.6px] text-white/35">İLETİŞİM</strong>
          <ul className="mt-4 space-y-2.5 text-[13.5px] text-white/40">
            <li>info@bachmain.com.tr</li>
            <li>0212 963 00 20</li>
            <li>İstanbul, Türkiye</li>
          </ul>
          <div className="mt-6 space-y-2 text-[12px] text-white/30">
            <Link to="/contact">Gizlilik Politikası</Link>
            <br />
            <Link to="/contact">Kullanım Şartları</Link>
            <br />
            <Link to="/contact">KVKK</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/6 py-6 text-center text-[13px] text-white/25">
        © 2026 BACHMAIN. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
