const brands = [
  "ERENBOX", "MODAPACK", "LUXORA", "PACKART", "GOLDENPACK", "ARTIMAŞ",
  "KORU YAPI", "DELTA", "HEdef GRUP", "TEKNOPACK",
];

export default function LogoMarquee() {
  const row = [...brands, ...brands];
  return (
    <section className="border-y border-white/6 bg-navy-900/50 py-10">
      <p className="mb-7 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
        Bizi Tercih Eden Markalar
      </p>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-navy-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-navy-900 to-transparent" />
        <div className="marquee-track flex w-max gap-14 px-6">
          {row.map((b, i) => (
            <span key={`${b}-${i}`} className="shrink-0 text-lg font-black tracking-tight text-white/25 transition hover:text-white/45">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
