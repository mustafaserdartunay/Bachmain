import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowRight, BarChart3, Boxes, CalendarDays, Camera, ClipboardList,
  Cog, Contact, Factory, FileText, Globe2, IdCard, Landmark, LayoutDashboard,
  ListTodo, MapPin, Megaphone, MessageSquare, Moon, MoonStar, NotebookPen,
  Package, Radar, Receipt, ShoppingCart, Store, Sun, Ticket, Truck, UserCog,
  Users, Wallet, Warehouse, Workflow,
} from "lucide-react";
import ScrollReveal from "../ScrollReveal";
import {
  moduleSpotlight, moduleShowcase, moduleChannels, moduleMarquee,
} from "../../data/premiumLanding";

const ICONS = {
  Activity, BarChart3, Boxes, CalendarDays, Camera, ClipboardList, Cog, Contact,
  Factory, FileText, Globe2, IdCard, Landmark, LayoutDashboard, ListTodo, MapPin,
  Megaphone, MessageSquare, MoonStar, NotebookPen, Package, Radar, Receipt,
  ShoppingCart, Store, Ticket, Truck, UserCog, Users, Wallet, Warehouse, Workflow,
};

const TONE = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200", glow: "from-blue-500/20" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-200", glow: "from-violet-500/20" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-200", glow: "from-cyan-500/20" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200", glow: "from-orange-500/20" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200", glow: "from-slate-500/20" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200", glow: "from-amber-500/20" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200", glow: "from-emerald-500/20" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-200", glow: "from-rose-500/20" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-200", glow: "from-indigo-500/20" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-200", glow: "from-teal-500/20" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-200", glow: "from-sky-500/20" },
  pink: { bg: "bg-pink-50", text: "text-pink-600", ring: "ring-pink-200", glow: "from-pink-500/20" },
  green: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200", glow: "from-green-500/20" },
  fuchsia: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", ring: "ring-fuchsia-200", glow: "from-fuchsia-500/20" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200", glow: "from-purple-500/20" },
};

function IconBubble({ name, tone = "blue", size = "md" }) {
  const Icon = ICONS[name] || LayoutDashboard;
  const t = TONE[tone] || TONE.blue;
  const box = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-11 w-11 rounded-xl";
  const ico = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <motion.div
      whileHover={{ rotate: [-4, 4, 0], scale: 1.08 }}
      transition={{ duration: 0.45 }}
      className={`mod-ico ${box} ${t.bg} ${t.text} ring-1 ${t.ring}`}
    >
      <Icon className={ico} strokeWidth={2.1} />
    </motion.div>
  );
}

export default function ModulesShowcase() {
  const [night, setNight] = useState(false);
  const [pulse, setPulse] = useState(0);

  return (
    <section id="moduller" className={`section-pad mod-section ${night ? "mod-section-night" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal className="mb-10 text-center">
          <span className="pill">28+ entegre modül · tek platform</span>
          <h2 className="section-title mx-auto mt-4">Tüm İşiniz, Tek Canlı Panelde</h2>
          <p className="section-desc mx-auto max-w-3xl">
            Müşteriden tedarikçiye, stoktan nakliyeye, saha satıştan B2B’ye, mesajdan rapora —
            görsel ikonlar, canlı animasyonlar ve gündüz/gece modu ile eğlenceli ama güçlü bir deneyim.
          </p>
        </ScrollReveal>

        {/* Theme + live strip */}
        <div className="mod-toolbar mb-8">
          <div className="mod-live-pill">
            <span className="mod-live-dot" />
            Canlı aktivite
          </div>
          <div className="mod-channel-row">
            {moduleChannels.map((c, i) => (
              <motion.span
                key={c.label}
                className="mod-channel"
                style={{ "--ch": c.color }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.2, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }}
              >
                <i style={{ background: c.color }} />
                {c.label}
              </motion.span>
            ))}
          </div>
          <button
            type="button"
            className="mod-theme-btn"
            onClick={() => setNight((v) => !v)}
            aria-pressed={night}
          >
            {night ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {night ? "Gece Modu" : "Gündüz Modu"}
          </button>
        </div>

        {/* Spotlight cards */}
        <div className="mb-6 grid gap-4 lg:grid-cols-4">
          {moduleSpotlight.map((s, i) => {
            const t = TONE[s.tone] || TONE.blue;
            return (
              <ScrollReveal key={s.id} delay={i * 0.06} direction="scale">
                <Link to={s.href} className={`mod-spot ${night ? "night" : ""}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.glow} to-transparent opacity-80`} />
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
            );
          })}
        </div>

        {/* Marquee */}
        <div className="mod-marquee mb-8" aria-hidden="true">
          <div className="mod-marquee-track">
            {[...moduleMarquee, ...moduleMarquee].map((label, i) => (
              <span key={`${label}-${i}`} className="mod-marquee-chip">{label}</span>
            ))}
          </div>
        </div>

        {/* Dense module grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {moduleShowcase.map((m, i) => (
            <ScrollReveal key={m.title} delay={(i % 4) * 0.04}>
              <motion.div
                whileHover={{ y: -6 }}
                onHoverStart={() => setPulse(i)}
                className="h-full"
              >
                <Link to={m.href} className={`mod-card ${night ? "night" : ""} ${pulse === i ? "pulse" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <IconBubble name={m.icon} tone={m.tone} />
                    <span className="mod-tag">{m.tag}</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-extrabold tracking-tight">{m.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-snug opacity-65">{m.desc}</p>
                  <motion.div
                    className="mod-card-shine"
                    animate={{ x: ["-120%", "160%"] }}
                    transition={{ duration: 2.8, delay: (i % 7) * 0.35, repeat: Infinity, repeatDelay: 4 }}
                  />
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Process + day/night demo footer */}
        <ScrollReveal className="mt-10">
          <div className={`mod-foot ${night ? "night" : ""}`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] opacity-50">Süreç hattı</div>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight">
                Teklif · Sipariş · Üretim · Depo · Teslimat
              </h3>
              <p className="mt-2 max-w-xl text-sm opacity-65">
                Fotoğraflı aşamalar, B2B sipariş, kampanya, cari, canlı mesaj ve ticket —
                müşteri temsilcisi puantaj/prim ile aynı platformda.
              </p>
            </div>
            <div className="mod-foot-actions">
              <AnimatePresence mode="wait">
                <motion.div
                  key={night ? "n" : "d"}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="mod-theme-preview"
                >
                  {night ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span>{night ? "Gece paneli aktif" : "Gündüz paneli aktif"}</span>
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
  );
}
