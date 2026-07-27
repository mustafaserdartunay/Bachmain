'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { yonetimGet, yonetimPost } from '../../utils/platformApi'

export default function EmailChangePanel() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token') || '', [params])
  const [oldEmail, setOldEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newEmail2, setNewEmail2] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [tokenError, setTokenError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token) {
        setTokenError('Geçersiz veya eksik bağlantı')
        setLoading(false)
        return
      }
      try {
        const data = await yonetimGet(`auth/email-change?token=${encodeURIComponent(token)}`)
        if (!cancelled) setOldEmail(data.oldEmail || '')
      } catch (err) {
        if (!cancelled) {
          setTokenError(err instanceof Error ? err.message : 'Bağlantı doğrulanamadı')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => navigate('/giris', { replace: true }), 2800)
    return () => window.clearTimeout(t)
  }, [done, navigate])

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!token) e.token = 'Geçersiz bağlantı'
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) e.newEmail = 'Geçerli e-posta girin'
    if (newEmail.trim().toLowerCase() === oldEmail.trim().toLowerCase()) {
      e.newEmail = 'Yeni e-posta mevcut adresle aynı olamaz'
    }
    if (newEmail !== newEmail2) e.newEmail2 = 'E-postalar eşleşmiyor'
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    setSubmitError('')
    try {
      await yonetimPost('auth/email-change', {
        token,
        newEmail: newEmail.trim().toLowerCase(),
      })
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'E-posta güncellenemedi')
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
          E-posta değiştir
        </span>

        {loading ? (
          <p className="py-10 text-center text-sm font-medium text-[#64748B]">Kontrol ediliyor…</p>
        ) : tokenError ? (
          <div className="space-y-4 py-8 text-center">
            <h2 className="text-[22px] font-extrabold text-[#0F172A]">Bağlantı geçersiz</h2>
            <p className="text-[14px] font-medium text-[#64748B]">{tokenError}</p>
            <Link to="/giris">
              <Button type="button" fullWidth>
                Giriş Yap
              </Button>
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-4 py-8 text-center" role="status" aria-live="polite">
            <h2 className="text-[22px] font-extrabold text-[#0F172A]">Onaylandı</h2>
            <p className="text-[14px] font-medium text-[#64748B]">
              E-posta adresiniz güncellendi. Yeni adresinizle giriş yapabilirsiniz.
            </p>
            <Link to="/giris">
              <Button type="button" fullWidth>
                Giriş Yap
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 pt-4" noValidate>
            <p className="text-center text-[14px] font-medium leading-relaxed text-[#64748B]">
              Yeni e-posta adresinizi yazın. Değişiklik otomatik onaylanır.
            </p>
            {oldEmail ? (
              <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm">
                <span className="text-[#64748B]">Mevcut:</span>{' '}
                <span className="font-semibold text-[#0F172A]">{oldEmail}</span>
              </div>
            ) : null}
            <Input
              name="newEmail"
              type="email"
              required
              autoComplete="email"
              placeholder="Yeni e-posta *"
              value={newEmail}
              onChange={(ev) => setNewEmail(ev.target.value)}
              error={errors.newEmail}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Yeni e-posta"
            />
            <Input
              name="newEmail2"
              type="email"
              required
              autoComplete="email"
              placeholder="Yeni e-posta tekrar *"
              value={newEmail2}
              onChange={(ev) => setNewEmail2(ev.target.value)}
              error={errors.newEmail2}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Yeni e-posta tekrar"
            />
            {submitError ? (
              <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
                {submitError}
              </p>
            ) : null}
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'E-postayı güncelle'}
            </Button>
          </form>
        )}
      </div>
    </motion.div>
  )
}
