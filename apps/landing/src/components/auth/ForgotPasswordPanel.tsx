'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { yonetimPost } from '../../utils/platformApi'

export default function ForgotPasswordPanel() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!email.trim()) {
      setError('E-posta adresi gerekli')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Geçerli e-posta girin')
      return
    }
    setError('')
    setBusy(true)
    setSubmitError('')
    try {
      await yonetimPost('auth/forgot-password', {
        email: email.trim().toLowerCase(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      })
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'İşlem başarısız')
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
      <h2 className="mb-8 text-center text-4xl font-extrabold tracking-[-0.04em] text-[#2563EB] uppercase sm:text-5xl">
        Şifremi Unuttum
      </h2>

      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white/95 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-10">
        {done ? (
          <div className="py-12 text-center" role="status" aria-live="polite">
            <p className="text-[22px] font-extrabold tracking-tight text-[#0F172A]">
              E-posta gönderildi
            </p>
            <p className="mt-2 text-[14px] font-medium text-[#64748B]">
              Eşleşen bir hesap varsa sıfırlama bağlantısı e-posta adresinize iletildi. Gelen kutusu
              ve spam klasörünü kontrol edin. Bağlantı 30 dakika geçerlidir.
            </p>
            <div className="mt-6">
              <Link to="/giris">
                <Button type="button" fullWidth>
                  Girişe dön
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <p className="text-center text-[14px] font-medium text-[#64748B]">
              Kayıtlı e-posta adresinizi yazın; güvenli sıfırlama bağlantısı gönderelim.
            </p>

            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="E-posta"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              error={error}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="E-posta"
              required
            />

            {submitError ? (
              <p
                className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]"
                role="alert"
              >
                {submitError}
              </p>
            ) : null}

            <Button type="submit" fullWidth disabled={busy} aria-busy={busy}>
              {busy ? 'Gönderiliyor…' : 'Gönder'}
            </Button>

            <p className="pt-1 text-center text-[14px] font-medium text-[#64748B]">
              <Link to="/giris" className="font-bold text-[#2563EB] hover:underline">
                Girişe dön
              </Link>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  )
}
