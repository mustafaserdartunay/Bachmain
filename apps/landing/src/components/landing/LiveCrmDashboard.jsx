import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, ArrowDownCircle, Banknote, Package,
  Workflow, Contact, Users, MapPin, Bike, FolderPlus, Store, Network,
  MessageSquare, Search, LayoutGrid, Bell, ChevronDown, Sun, Moon,
  ArrowDownToLine, ArrowUpFromLine, Wallet, UserPlus, Shield, FileText,
  FileInput, MessageCircle, ScrollText, Trophy, UserRound,
} from "lucide-react";

const SIDE = [
  { icon: LayoutDashboard, label: "Güncel Durum", on: true },
  { icon: TrendingUp, label: "Satışlar" },
  { icon: ArrowDownCircle, label: "Giderler" },
  { icon: Banknote, label: "Nakit" },
  { icon: Package, label: "Stok" },
  { icon: Workflow, label: "Süreç Yönetimi" },
  { icon: Contact, label: "Crm" },
  { icon: Users, label: "İnsan Kaynakları" },
  { icon: MapPin, label: "Saha Satış" },
  { icon: Bike, label: "Kurye Takip" },
  { icon: FolderPlus, label: "Yeni Proje" },
  { icon: Store, label: "Pos" },
  { icon: Network, label: "Bayi Yönetimi" },
  { icon: MessageSquare, label: "Mesaj Merkezi", badge: 1 },
];

const ACTIONS = [
  { label: "Gelir Ekle", bg: "linear-gradient(135deg,#34d399,#10b981)", Icon: ArrowDownToLine },
  { label: "Gider Ekle", bg: "linear-gradient(135deg,#fb923c,#f97316)", Icon: ArrowUpFromLine },
  { label: "Kasa", bg: "linear-gradient(135deg,#38bdf8,#0ea5e9)", Icon: Wallet },
  { label: "Yeni Müşteri", bg: "linear-gradient(135deg,#a78bfa,#8b5cf6)", Icon: UserPlus },
  { label: "Yeni Tedarikçi", bg: "linear-gradient(135deg,#fbbf24,#f59e0b)", Icon: Shield },
  { label: "Yeni Fatura", bg: "linear-gradient(135deg,#60a5fa,#3b82f6)", Icon: FileText },
  { label: "Yeni Alış Fatur...", bg: "linear-gradient(135deg,#fb7185,#f43f5e)", Icon: FileInput },
];

const FINANCE = [
  { label: "Tahsilat Bekleyen", value: "0,00₺", tone: "" },
  { label: "Ödeme Bekleyen", value: "0,00₺", tone: "" },
  { label: "Stok Toplam Değeri", value: "0,00₺", tone: "" },
  { label: "Portföydeki Senetler", value: "0,00₺", tone: "" },
  { label: "Portföydeki Çekler", value: "0,00₺", tone: "" },
  { label: "Nakit Kasa", value: "50.400,20₺", tone: "green" },
  { label: "Bankalar", value: "0,00₺", tone: "" },
  { label: "Kredi Kartı Pos", value: "0,00₺", tone: "" },
  { label: "Toplam Canlı Varlık", value: "50.400,20₺", tone: "blue" },
];

const TIMELINE = [
  { name: "Ayşe Yılmaz", role: "Satış Temsilcisi", amount: "35.000,00₺", date: "01.06.2026" },
  { name: "Mehmet Kaya", role: "Üretim Müdürü", amount: "48.500,00₺", date: "01.06.2026" },
  { name: "Zeynep Demir", role: "İK Uzmanı", amount: "32.000,00₺", date: "01.06.2026" },
  { name: "Can Öztürk", role: "Saha Satış", amount: "28.750,00₺", date: "02.06.2026" },
  { name: "Elif Aksoy", role: "Muhasebe", amount: "31.200,00₺", date: "03.06.2026" },
];

const KDV = [
  ["Hesaplanan KDV", "0,00₺"],
  ["İndirilecek KDV", "0,00₺"],
  ["Ödenecek KDV", "0,00₺"],
  ["Devreden KDV", "0,00₺"],
];

const AVATARS = ["#60a5fa", "#34d399", "#f472b6"];

export default function LiveCrmDashboard({ className = "", full = false }) {
  const [night, setNight] = useState(false);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => {
      if (e.key.toLowerCase() === "n") setNight((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  return (
    <div className={`erp-shell ${full ? "erp-shell-full" : ""} ${className}`}>
      {!full && <div className="erp-glow" aria-hidden="true" />}
      <div className={`erp-dash ${full ? "full" : "compact"} ${night ? "night" : ""}`}>
        <aside className="erp-side">
          <div className="erp-logo">
            <img src="/assets/bachmain-logo.png" alt="BACHMAIN" draggable={false} />
          </div>
          <nav className="erp-nav">
            {SIDE.map((item) => (
              <div key={item.label} className={`erp-nav-item ${item.on ? "on" : ""}`}>
                <item.icon className="erp-nav-ico" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
                {item.badge ? <em className="erp-badge">{item.badge}</em> : null}
              </div>
            ))}
          </nav>
        </aside>

        <div className="erp-main">
          <header className="erp-top">
            <div className="erp-search">
              <Search className="erp-search-ico" />
              <span>Ara...</span>
            </div>
            <div className="erp-top-right">
              <button type="button" className="erp-icon-btn" aria-label="Uygulamalar">
                <LayoutGrid className="erp-ui-ico" />
              </button>
              <button type="button" className="erp-icon-btn" aria-label="Mesaj">
                <MessageSquare className="erp-ui-ico" />
                <em className="erp-badge abs">1</em>
              </button>
              <span className="erp-pos-pill">POS</span>
              <div className="erp-theme">
                <button type="button" className={!night ? "on" : ""} onClick={() => setNight(false)}>
                  <Sun className="erp-ui-ico-sm" /> Gündüz
                </button>
                <button type="button" className={night ? "on" : ""} onClick={() => setNight(true)}>
                  <Moon className="erp-ui-ico-sm" /> Gece
                </button>
              </div>
              <button type="button" className="erp-icon-btn" aria-label="Bildirim">
                <Bell className="erp-ui-ico" />
              </button>
              <div className="erp-user">
                <span className="erp-avatar">Y</span>
                <div>
                  <strong>Yönetici</strong>
                  <small>Erlenbox</small>
                </div>
                <ChevronDown className="erp-ui-ico-sm opacity-50" />
              </div>
            </div>
          </header>

          <div className="erp-actions">
            {ACTIONS.map((a, i) => (
              <motion.button
                key={a.label}
                type="button"
                className="erp-action"
                style={{ background: a.bg }}
                whileHover={{ y: -2, scale: 1.02 }}
                animate={full ? { y: [0, i % 2 === 0 ? -2 : 2, 0] } : undefined}
                transition={{ duration: 3.4, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <a.Icon className="erp-action-ico" strokeWidth={2.4} />
                {a.label}
              </motion.button>
            ))}
          </div>

          <div className="erp-grid">
            <div className="erp-card erp-finance-card">
              <div className="erp-card-title">Finans Özeti</div>
              <ul className="erp-finance">
                {FINANCE.map((row) => (
                  <li key={row.label}>
                    <span className="erp-fin-ico" />
                    <span className="flex-1 truncate">{row.label}</span>
                    <strong className={row.tone}>{row.value}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="erp-card erp-timeline-card">
              <div className="erp-card-title">Aktivasyon Zaman Tablosu</div>
              <ul className="erp-timeline">
                {TIMELINE.map((row, i) => (
                  <li key={row.name}>
                    <span className="erp-tl-av" style={{ background: AVATARS[i % AVATARS.length] }}>
                      {row.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong>{row.name}</strong>
                      <small>{row.role}</small>
                    </div>
                    <div className="text-right">
                      <strong className="amt">{row.amount}</strong>
                      <small>{row.date}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="erp-card erp-kdv">
              <div className="erp-card-title">KDV Durumu</div>
              <ul className="erp-finance compact">
                {KDV.map(([l, v]) => (
                  <li key={l}>
                    <span className="erp-fin-ico" />
                    <span className="flex-1">{l}</span>
                    <strong>{v}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="erp-rail">
          <button type="button" className="erp-rail-btn blue"><MessageCircle className="erp-ui-ico" /></button>
          <button type="button" className="erp-rail-btn green"><ScrollText className="erp-ui-ico" /></button>
          <button type="button" className="erp-rail-btn amber"><Trophy className="erp-ui-ico" /></button>
          <button type="button" className="erp-rail-btn violet"><UserRound className="erp-ui-ico" /></button>
          <div className="erp-rail-avatars">
            {AVATARS.map((c) => (
              <span key={c} style={{ background: c }} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
