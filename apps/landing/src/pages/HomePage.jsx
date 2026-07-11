import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, MapPin, Play } from "lucide-react";
import ScrollReveal, { Counter } from "../components/ScrollReveal";
import DemoForm from "../components/DemoForm";
import LiveCrmDashboard from "../components/landing/LiveCrmDashboard";
import ModulesShowcase from "../components/landing/ModulesShowcase";
import {
  processFlow, b2bFeatures, fieldFeatures,
  integrations, bandStats, testimonials, heroChecks,
} from "../data/premiumLanding";
import { faqItems } from "../data/navigation";

export default function HomePage() {
  return (
    <div className="page-mesh">
      {/* HERO + FULL WIDTH DASHBOARD */}
      <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10">
        <div className="float-orb left-[-10%] top-[6%] h-[420px] w-[420px] bg-blue-400/25" />
        <div className="float-orb right-[-5%] top-[18%] h-[360px] w-[360px] bg-violet-400/20" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <span className="pill">Yeni Nesil CRM & ERP Platformu</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.045em] text-blue-700 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.1]">
            Tüm Süreçler Tek Platform Olsun.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 lg:text-lg">
            Tekliften siparişe, üretimden depoya, nakliyeden muhasebeye — gerçek BACHMAIN paneliyle aynı deneyim.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/demo" className="btn-primary">Ücretsiz Demo Talep Et <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/features" className="btn-secondary">Hemen Keşfet</Link>
          </div>
          <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {heroChecks.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="erp-full-bleed mt-10 px-2 sm:px-4 lg:px-6 xl:px-8">
          <LiveCrmDashboard full />
        </div>
      </section>

      {/* PROCESS */}
      <section id="ozellikler" className="section-pad bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="section-title mx-auto">İş Süreçlerinizi Uçtan Uca Yönetin</h2>
            <p className="section-desc mx-auto">Tekliften muhasebeye kesintisiz, animasyonlu süreç hattı.</p>
          </ScrollReveal>
          <div className="process-track mt-4">
            {processFlow.map((s, i) => (
              <div key={s.label} className={`process-step ${s.hi ? "hi" : ""}`}>
                <div className="process-ico">{s.emoji}</div>
                <div className="text-xs font-bold text-slate-700">{s.label}</div>
                {i < processFlow.length - 1 && <div className="process-line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <ModulesShowcase />

      {/* DATA SHOWCASE — same full panel, no crop */}
      <section id="panel" className="section-pad overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <ScrollReveal className="mb-10">
            <h2 className="section-title mx-auto">Tüm Verileriniz Tek Ekranda</h2>
            <p className="section-desc mx-auto">Gerçek BACHMAIN paneli — finans, aktivite, KDV ve hızlı aksiyonlar.</p>
          </ScrollReveal>
        </div>
        <div className="erp-full-bleed px-2 sm:px-4 lg:px-6 xl:px-8">
          <LiveCrmDashboard full />
        </div>
      </section>

      {/* B2B */}
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <ScrollReveal direction="left">
            <span className="pill">B2B Portal</span>
            <h2 className="section-title mt-4">Müşteriniz de Aynı Panelden Yönetsin</h2>
            <p className="section-desc">Laptop, tablet ve telefonda çalışan müşteri portalı — ERP ile aynı dil.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {b2bFeatures.map((f) => (
                <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  {f}
                </span>
              ))}
            </div>
            <Link to="/features/erp" className="btn-primary mt-8">B2B Özelliklerini İncele</Link>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="relative">
              <LiveCrmDashboard />
              <div className="absolute -bottom-4 -left-2 w-28 overflow-hidden rounded-[1.4rem] border-4 border-slate-800 bg-slate-900 shadow-2xl sm:w-32">
                <div className="bg-white p-2">
                  <div className="mb-1 text-[8px] font-bold text-slate-800">B2B Mobil</div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-blue-300" />
                    <div className="h-1.5 w-4/5 rounded-full bg-emerald-300" />
                    <div className="h-1.5 w-3/5 rounded-full bg-orange-300" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FIELD SALES */}
      <section className="section-pad bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <ScrollReveal direction="left">
            <div className="relative h-[420px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#1a2744] shadow-xl">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
              {[
                { t: "18%", l: "42%", c: "bg-blue-500" },
                { t: "36%", l: "24%", c: "bg-emerald-500" },
                { t: "50%", l: "58%", c: "bg-orange-400" },
                { t: "62%", l: "34%", c: "bg-violet-500" },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ top: p.t, left: p.l }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35 }}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${p.c} text-white shadow-lg`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
              <div className="absolute bottom-4 left-4 right-4 flex justify-around rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
                {[["12", "Temsilci"], ["84", "Ziyaret"], ["₺1.2M", "Satış"]].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <div className="text-lg font-extrabold text-white">{v}</div>
                    <div className="text-[10px] text-white/50">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <span className="pill">Saha Satış</span>
            <h2 className="section-title mt-4">Sahayı Haritadan Yönetin</h2>
            <p className="section-desc">Canlı konum, rota, ziyaret, sipariş ve tahsilat — mobil CRM.</p>
            <div className="mt-6 space-y-3">
              {fieldFeatures.map((f) => (
                <div key={f.title} className="saas-card flex gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">📍</div>
                  <div>
                    <div className="font-bold text-slate-900">{f.title}</div>
                    <div className="text-sm text-slate-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/modules/field-sales" className="btn-primary mt-6">Saha Satış Modülü</Link>
          </ScrollReveal>
        </div>
      </section>

      {/* LOGISTICS + CRM + REPORTS strip */}
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { title: "Nakliye & Lojistik", desc: "Tır, koli, palet, konteyner ve canlı sevkiyat durumları.", to: "/features/stock", emoji: "🚛" },
              { title: "CRM Pipeline", desc: "Fırsatlar, kanban, görevler, toplantılar ve müşteri kartları.", to: "/features/crm", emoji: "🎯" },
              { title: "Raporlama", desc: "Canlı KPI, satış, tahsilat, kasa ve banka grafikleri.", to: "/features/reports", emoji: "📊" },
            ].map((c, i) => (
              <ScrollReveal key={c.title} delay={i * 0.08}>
                <Link to={c.to} className="saas-card block p-7">
                  <div className="text-3xl">{c.emoji}</div>
                  <h3 className="mt-4 text-xl font-extrabold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600">İncele <ArrowRight className="h-4 w-4" /></span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Entegrasyonlar</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {integrations.map((name) => (
              <span key={name} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="stats-band py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
          {bandStats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.05} className="text-center">
              <div className="text-2xl font-extrabold tracking-tight lg:text-3xl">
                {s.value.includes("+") || s.value.includes("%") ? s.value : <Counter end={parseInt(s.value, 10) || 0} suffix={s.value.replace(/[0-9.]/g, "")} />}
              </div>
              <div className="mt-1 text-xs font-medium text-white/70">{s.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="referanslar" className="section-pad bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <ScrollReveal className="mb-12 text-center">
            <h2 className="section-title mx-auto">Kullanıcılarımız Ne Diyor?</h2>
          </ScrollReveal>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.08}>
                <div className="saas-card relative p-6">
                  <button type="button" className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600" aria-label="Video">
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                  <p className="text-[15px] italic leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <ScrollReveal className="mb-10 text-center">
            <h2 className="section-title">Sık Sorulan Sorular</h2>
          </ScrollReveal>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <ScrollReveal key={item.q} delay={i * 0.04}>
                <details className="saas-card group p-0">
                  <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-slate-800 marker:content-none">
                    {item.q}
                  </summary>
                  <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-500">{item.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link to="/faq" className="font-semibold text-blue-600 hover:underline">Tüm sorular →</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section id="iletisim" className="section-pad pt-0">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <ScrollReveal>
            <div className="cta-band px-8 py-14 text-center text-white lg:px-16">
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">BACHMAIN ile İşinizi Geleceğe Taşıyın</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/75">14 gün ücretsiz deneyin. Kredi kartı gerekmez.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/demo" className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg">Demo Talep Et</Link>
                <Link to="/register" className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white">Ücretsiz Dene</Link>
              </div>
              <div className="mx-auto mt-10 max-w-2xl text-left">
                <DemoForm />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
