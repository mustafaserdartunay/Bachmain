'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { yonetimPost, redirectToAppWithToken } from '../../utils/platformApi'

export default function LoginPanel() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const onChange = (key: 'email' | 'password') => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Geçerli e-posta girin'
    if (!form.password.trim()) e.password = 'Şifre gerekli'
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    setSubmitError('')
    try {
      const data = await yonetimPost('auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      })
      setDone(true)
      setTimeout(() => redirectToAppWithToken(data.token), 900)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[440px]"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[34px] bg-gradient-to-br from-[#60A5FA]/50 via-[#2563EB]/25 to-[#38BDF8]/40 opacity-70 blur-[1px]"
        aria-hidden
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white/95 p-8 shadow-[0_24px_64px_rgba(37,99,235,0.14)] backdrop-blur-sm sm:p-10">
        <motion.span
          className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          Hesabına gir
        </motion.span>

        {done ? (
          <div className="py-12 text-center">
            <p className="text-[22px] font-extrabold tracking-tight text-[#0F172A]">
              Giriş başarılı
            </p>
            <p className="mt-2 text-[14px] font-medium text-[#64748B]">
              Uygulamaya yönlendiriliyorsunuz… Güvenlik için e-postanıza giriş bildirimi gönderildi.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 pt-4" noValidate>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="E-posta"
              value={form.email}
              onChange={onChange('email')}
              error={errors.email}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="E-posta"
            />
            <Input
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Şifre"
              value={form.password}
              onChange={onChange('password')}
              error={errors.password}
              leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Şifre"
              rightSlot={
                <button
                  type="button"
                  className="rounded-[10px] p-1.5 text-[#94A3B8] hover:text-[#64748B]"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPw ? (
                    <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  )}
                </button>
              }
            />

            <div className="flex justify-center">
              <Link
                to="/sifremi-unuttum"
                className="text-[13px] font-bold text-[#2563EB] hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>

            {submitError ? (
              <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
                {submitError}
              </p>
            ) : null}

            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>

            <p className="pt-1 text-center text-[14px] font-medium text-[#64748B]">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="font-bold text-[#2563EB] hover:underline">
                Üye Ol
              </Link>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  )
}
