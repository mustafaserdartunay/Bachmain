import { motion } from "framer-motion";
import { TrendingUp, Package, Users, DollarSign } from "lucide-react";

export default function DashboardMockup({ className = "", variant = "hero" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -inset-10 rounded-full bg-brand-blue/15 blur-3xl animate-pulse-glow" />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative animate-float"
      >
        {/* Laptop frame */}
        <div className="rounded-2xl border border-white/10 bg-navy-950/95 p-2.5 shadow-[0_32px_64px_rgba(0,0,0,0.5)] sm:p-3">
          <div className="mb-2 flex gap-1.5 px-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="rounded-xl bg-[#f4f6f9] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[11px] font-bold text-navy-800">BACHMAIN Kontrol Paneli</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">● Canlı</span>
            </div>
            <div className="mb-3 grid grid-cols-4 gap-1.5 sm:gap-2">
              {[
                { icon: DollarSign, label: "Gelir", val: "₺548K", c: "text-emerald-600" },
                { icon: TrendingUp, label: "Sipariş", val: "384", c: "text-blue-600" },
                { icon: Package, label: "Stok", val: "3.8K", c: "text-amber-600" },
                { icon: Users, label: "Müşteri", val: "1.2K", c: "text-violet-600" },
              ].map(({ icon: Icon, label, val, c }) => (
                <div key={label} className="rounded-lg bg-white p-1.5 shadow-sm sm:p-2">
                  <Icon className={`mb-0.5 h-3 w-3 ${c}`} />
                  <div className="text-[8px] text-slate-500 sm:text-[9px]">{label}</div>
                  <div className={`text-[10px] font-bold sm:text-xs ${c}`}>{val}</div>
                </div>
              ))}
            </div>
            <div className="mb-2 flex h-14 items-end gap-0.5 sm:h-16 sm:gap-1">
              {[38, 62, 44, 78, 52, 88, 65, 82, 58, 92, 70, 85].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-navy-700 to-gold/70"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.2 + i * 0.04, duration: 0.5 }}
                />
              ))}
            </div>
            <div className="space-y-1">
              {["Delta Lojistik — ₺42.800", "Koru Yapı — Bekliyor", "Hedef Grup — Teklif"].map((row) => (
                <div key={row} className="flex justify-between rounded-md bg-white px-2 py-1 text-[9px] text-slate-600 sm:text-[10px]">
                  <span>{row.split(" — ")[0]}</span>
                  <span className="font-semibold text-navy-700">{row.split(" — ")[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phone */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute -bottom-4 -right-4 w-24 rounded-2xl border-[4px] border-navy-800 bg-navy-900 p-1 shadow-2xl sm:-right-6 sm:w-28"
        >
          <div className="rounded-xl bg-[#f4f6f9] p-2">
            <div className="mb-1 text-[8px] font-bold text-navy-800">Mobil CRM</div>
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-emerald-300" />
              <div className="h-1.5 w-4/5 rounded-full bg-blue-300" />
              <div className="h-1.5 w-3/5 rounded-full bg-amber-300" />
            </div>
          </div>
        </motion.div>

        {variant === "b2b" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="absolute -left-2 top-1/3 flex h-20 w-20 items-center justify-center rounded-full bg-brand-blue text-center text-[10px] font-extrabold leading-tight text-white shadow-xl ring-4 ring-white/10 sm:-left-6 sm:h-24 sm:w-24 sm:text-xs"
          >
            B2B
            <br />
            Paneli
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
