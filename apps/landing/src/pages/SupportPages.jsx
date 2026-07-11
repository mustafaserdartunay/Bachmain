import { Link } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import { landingPricing } from "../data/landing";
import { faqItems } from "../data/navigation";
import { useState } from "react";

export function PricingPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <div className="mx-auto max-w-3xl px-4">
          <span className="pill">Fiyatlandırma</span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Şeffaf paketler</h1>
          <p className="mt-3 text-slate-500">14 gün ücretsiz deneyin. Taahhüt yok.</p>
        </div>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-3 lg:items-stretch lg:px-8">
          {landingPricing.map((p, i) => (
            <ScrollReveal key={p.plan} delay={i * 0.08}>
              <div className={`saas-card relative flex h-full flex-col p-8 ${p.featured ? "border-blue-300 ring-2 ring-blue-500/20" : ""}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">{p.badge}</div>
                )}
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{p.plan}</div>
                <div className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{p.price}</div>
                <div className="mt-1 text-sm text-slate-400">{p.per}</div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-slate-600"><span className="text-emerald-500">✓</span>{f}</li>
                  ))}
                </ul>
                <Link to={p.to} className={`mt-8 ${p.featured ? "btn-primary w-full" : "btn-secondary w-full"}`}>{p.cta}</Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
      <FaqSection />
    </div>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="section-pad bg-white">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="section-title text-center">Sık Sorulan Sorular</h2>
        <div className="mt-10 space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="saas-card overflow-hidden !p-0">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-slate-800"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.q}
                <span className="text-blue-600">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className="border-t border-slate-100 px-6 py-4 text-slate-500">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Sık Sorulan Sorular</h1>
      </section>
      <FaqSection />
    </div>
  );
}

export function HelpPage() {
  const topics = [
    { title: "Başlangıç Rehberi", desc: "İlk kurulum ve kullanıcı ekleme" },
    { title: "Modül Eğitimleri", desc: "CRM, ERP, Stok videoları" },
    { title: "API Dokümantasyonu", desc: "Entegrasyon geliştiricileri için" },
    { title: "Destek Talebi", desc: "Teknik destek formu" },
  ];
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Yardım Merkezi</h1>
        <p className="mt-3 text-slate-500">Rehberler, eğitimler ve destek</p>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-4xl gap-4 px-4 sm:grid-cols-2">
          {topics.map((t) => (
            <Link key={t.title} to="/faq" className="saas-card block p-6">
              <h3 className="font-bold text-slate-900">{t.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
