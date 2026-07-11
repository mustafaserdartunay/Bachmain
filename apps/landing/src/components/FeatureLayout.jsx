import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import LiveCrmDashboard from "./landing/LiveCrmDashboard";
import ScrollReveal from "./ScrollReveal";

export default function FeatureLayout({
  badge,
  title,
  subtitle,
  features,
  bullets,
  ctaTo = "/demo",
  ctaLabel = "Demo Talep Et",
}) {
  return (
    <div className="page-mesh">
      <section className="page-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <ScrollReveal direction="left">
            {badge && <span className="pill">{badge}</span>}
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">{title}</h1>
            <p className="mt-4 text-lg text-slate-500">{subtitle}</p>
            <Link to={ctaTo} className="btn-primary mt-8">{ctaLabel} →</Link>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.1}>
            <LiveCrmDashboard />
          </ScrollReveal>
        </div>
      </section>

      {features && (
        <section className="section-pad">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 0.06}>
                  <div className="saas-card p-6">
                    <h3 className="font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {bullets && (
        <section className="section-pad">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <ScrollReveal>
              <h2 className="section-title">Öne çıkan yetenekler</h2>
              <ul className="mt-8 space-y-4">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-slate-600">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /> {b}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>
      )}
    </div>
  );
}
