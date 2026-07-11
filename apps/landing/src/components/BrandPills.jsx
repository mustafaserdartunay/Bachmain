const tags = [
  "ERENBOX", "MODAPACK", "LUXORA", "PACKART", "GOLDENPACK", "ARTIMAŞ",
  "KORU YAPI", "DELTA", "HEdef", "TEKNOPACK", "VİZYON", "NOVA",
];

export default function BrandPills() {
  const row = [...tags, ...tags];
  return (
    <section className="overflow-hidden border-y border-zinc-100 bg-white py-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />
        <div className="pill-track flex w-max gap-3 px-4">
          {row.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2 text-sm font-bold text-zinc-500"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
