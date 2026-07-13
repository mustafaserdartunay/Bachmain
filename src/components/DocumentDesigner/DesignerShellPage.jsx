import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../Layout/AppPageLayout'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

/**
 * Reusable shell for Document Center modules that are scaffolding / coming soon.
 */
export default function DesignerShellPage({
  title = 'Modül',
  description = 'Bu modül yakında kullanıma açılacak.',
  bullets = [],
  ctaLabel = 'Şablonlara dön',
  ctaTo = '/belge-merkezi/sablonlar',
  icon: Icon = Sparkles,
}) {
  return (
    <AppPageShell>
      <AppPageHeader title={title} />

      <section className="card relative overflow-hidden px-6 py-8 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(56,189,248,0.12), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.08), transparent 45%)',
          }}
        />

        <div className="relative mx-auto max-w-2xl space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
            <Icon className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
            <p className="text-sm font-semibold leading-relaxed text-gray-400">{description}</p>
          </div>

          {bullets.length > 0 ? (
            <ul className="space-y-2 border-t border-dark-500/40 pt-4">
              {bullets.map((item) => (
                <li key={item} className="flex gap-2 text-sm font-semibold text-gray-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {ctaTo ? (
            <div className="pt-2">
              <Link to={ctaTo} className={`${BTN_PRIMARY} gap-2 px-4 py-2.5 text-sm`}>
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </AppPageShell>
  )
}
