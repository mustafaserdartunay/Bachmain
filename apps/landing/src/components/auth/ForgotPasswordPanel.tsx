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
      className="relative mx-auto w-full max-w-[480px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
    >
      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase">
          Şifre sıfırlama
        </span>

        {done ? (
          <div className="space-y-4 py-8 text-center" role="status" aria-live="polite">
            <h2 className="text-[22px] font-extrabold text-[#0F172A]">E-posta gönderildi</h2>
            <p className="text-[14px] font-medium text-[#64748B]">
              Eşleşen bir hesap varsa sıfırlama bağlantısı e-posta adresinize iletildi. Gelen kutusu
              ve spam klasörünü kontrol edin. Bağlantı 30 dakika geçerlidir.
            </p>
            <Link to="/giris">
              <Button type="button" fullWidth>
                Girişe dön
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <header className="mb-2 pt-1">
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">
                Şifremi Unuttum
              </h2>
              <p className="mt-2 text-[14px] font-medium text-[#64748B]">
                Kayıtlı e-posta adresinizi yazın; güvenli sıfırlama bağlantısı gönderelim.
              </p>
            </header>

            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="E-posta adresi"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              error={error}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="E-posta adresi"
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

            <p className="text-center text-[14px] font-medium text-[#64748B]">
              <Link to="/giris" className="font-bold text-[#2563EB] hover:underline">
                Geri dön
              </Link>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  )
}
