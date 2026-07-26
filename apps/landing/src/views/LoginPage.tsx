'use client'

import { motion, useReducedMotion } from 'framer-motion'
import LoginPanel from '../components/auth/LoginPanel'

export default function LoginPage() {
  const reduce = useReducedMotion()

  return (
    <div className="auth-ds relative min-h-[100dvh] overflow-hidden bg-[#F8FAFC]">
      <h1 className="sr-only">Giriş Yap</h1>

      {/* Ambient field */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_78%,rgba(56,189,248,0.12),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_22%,rgba(59,130,246,0.10),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
          }}
        />
        <motion.div
          className="absolute -left-24 top-[18%] h-72 w-72 rounded-full bg-[#60A5FA]/25 blur-3xl"
          animate={reduce ? undefined : { x: [0, 36, 0], y: [0, 28, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-20 bottom-[12%] h-80 w-80 rounded-full bg-[#3B82F6]/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, -28, 0], y: [0, -24, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-[42%] h-48 w-48 -translate-x-1/2 rounded-full bg-[#38BDF8]/15 blur-3xl"
          animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <section className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-24 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px]">
          <LoginPanel />
        </div>
      </section>
    </div>
  )
}
