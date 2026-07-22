import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Bachy from './Bachy'
import { CONFETTI_COLORS } from './BachyAnimations'

/**
 * Login / Register companion layout — wraps existing form; does not restyle the card.
 */
export default function BachyLogin({
  pose = 'login',
  title,
  subtitle,
  children,
  mood = 'curious',
  celebrate = false,
  message,
  dark = false,
}) {
  const reduce = useReducedMotion()

  return (
    <div
      className={`bachy-auth relative min-h-[85vh] overflow-hidden pt-24 pb-16 ${dark ? 'bachy-auth-dark' : 'page-mesh'}`}
    >
      <div className="relative mx-auto grid max-w-5xl items-end gap-6 px-4 lg:grid-cols-[minmax(200px,0.85fr)_minmax(320px,1fr)] lg:items-center lg:gap-8 lg:px-8">
        <div className="pointer-events-none relative order-2 mx-auto h-[240px] w-full max-w-[260px] sm:h-[300px] lg:order-1 lg:mx-0 lg:h-[360px] lg:max-w-none lg:self-end">
          <Bachy
            pose={celebrate ? 'celebrate' : pose}
            mood={mood}
            celebrating={celebrate}
            className="h-full w-full"
            aria-label="Bachy"
          />
          <AnimatePresence>
            {message ? (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute -top-1 left-1/2 z-10 w-max max-w-[14rem] -translate-x-1/2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-center text-xs font-semibold text-slate-700 shadow-lg backdrop-blur"
              >
                {message}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {celebrate && !reduce ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="bachy-confetti absolute top-0 h-2 w-2 rounded-sm"
                  style={{
                    left: `${(i * 17) % 100}%`,
                    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    animationDelay: `${(i % 7) * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative order-1 z-10 lg:order-2">
          {title ? (
            <h1
              className={`text-center text-3xl font-extrabold tracking-tight lg:text-left ${dark ? 'text-white' : 'text-slate-900'}`}
            >
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p
              className={`mt-2 text-center lg:text-left ${dark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
