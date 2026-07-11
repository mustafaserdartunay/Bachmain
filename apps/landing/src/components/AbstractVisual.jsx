import { motion } from "framer-motion";

function FloatingCard({ className, children, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className={`rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function AbstractVisual({ variant = "hero" }) {
  if (variant === "b2b") {
    return (
      <div className="relative mx-auto aspect-square max-w-md lg:max-w-none">
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-orange-100 via-rose-50 to-violet-100" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border border-dashed border-violet-300/50"
        />
        <FloatingCard className="absolute left-4 top-8 w-44" delay={0}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Sipariş</div>
          <div className="mt-1 text-2xl font-black text-zinc-900">₺128K</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          </div>
        </FloatingCard>
        <FloatingCard className="absolute bottom-12 right-0 w-48" delay={0.6}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500" />
            <div>
              <div className="text-xs font-bold text-zinc-800">Müşteri Portalı</div>
              <div className="text-[10px] text-zinc-500">Canlı üretim görünümü</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {[65, 80, 45].map((h, i) => (
              <div key={i} className="flex items-end justify-center rounded bg-violet-50 p-1">
                <div className="w-full rounded-sm bg-violet-400" style={{ height: `${h}%`, minHeight: 12 }} />
              </div>
            ))}
          </div>
        </FloatingCard>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-center text-sm font-black leading-tight text-white shadow-2xl shadow-violet-500/40"
        >
          B2B
          <br />
          Hub
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-lg lg:h-[480px] lg:max-w-none">
      {/* Mesh blobs */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute -left-8 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/20 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute -right-4 bottom-10 h-56 w-56 rounded-full bg-gradient-to-br from-orange-300/25 to-rose-400/20 blur-3xl"
      />

      {/* Central ring */}
      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-200/60 bg-gradient-to-br from-white/90 to-violet-50/50 shadow-2xl shadow-violet-500/10" />

      {/* Orbit dots */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <motion.div
          key={deg}
          animate={{ rotate: 360 }}
          transition={{ duration: 20 + i * 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2"
          style={{ transformOrigin: "center" }}
        >
          <div
            className="absolute h-3 w-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg"
            style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
          />
        </motion.div>
      ))}

      <FloatingCard className="absolute left-0 top-12 z-10 w-40" delay={0}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-sm">📈</div>
          <div className="text-xs font-bold text-zinc-800">Satış +34%</div>
        </div>
        <svg viewBox="0 0 120 40" className="mt-2 w-full">
          <polyline
            fill="none"
            stroke="url(#g1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            points="0,35 20,28 40,32 60,15 80,20 100,8 120,12"
          />
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="120" y2="0">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
      </FloatingCard>

      <FloatingCard className="absolute bottom-16 right-0 z-10 w-44" delay={0.5}>
        <div className="text-[10px] font-semibold text-zinc-500">Aktif siparişler</div>
        <div className="mt-1 text-3xl font-black text-zinc-900">847</div>
        <div className="mt-2 flex -space-x-2">
          {["bg-violet-400", "bg-fuchsia-400", "bg-orange-400", "bg-emerald-400"].map((c) => (
            <div key={c} className={`h-6 w-6 rounded-full border-2 border-white ${c}`} />
          ))}
        </div>
      </FloatingCard>

      <FloatingCard className="absolute right-8 top-4 z-10 w-36 p-3" delay={1}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-violet-600">STOK</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">OK</span>
        </div>
        <div className="mt-2 space-y-1">
          {[90, 70, 55].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-violet-400" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </FloatingCard>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-zinc-900 px-5 py-3 text-center shadow-2xl"
      >
        <div className="text-[10px] font-medium text-zinc-400">Anlık gelir</div>
        <div className="text-xl font-black text-white">₺2.4M</div>
      </motion.div>
    </div>
  );
}
