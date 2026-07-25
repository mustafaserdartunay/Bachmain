import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import Input from '../ui/Input'
import PasswordStrength, { passwordIssues } from '../register/PasswordStrength'
import { yonetimPost } from '../../utils/platformApi'

export default function ResetPasswordPanel() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!token) e.token = 'Geçersiz bağlantı'
    const pwIssue = passwordIssues(password)
    if (pwIssue) e.password = pwIssue
    if (password !== password2) e.password2 = 'Şifreler eşleşmiyor'
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    setSubmitError('')
    try {
      await yonetimPost('auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Şifre güncellenemedi')
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
          Yeni şifre
        </span>

        {done ? (
          <div className="space-y-4 py-8 text-center">
            <h2 className="text-[22px] font-extrabold text-[#0F172A]">Şifre güncellendi</h2>
            <p className="text-[14px] font-medium text-[#64748B]">
              Artık yeni şifrenizle giriş yapabilirsiniz. Onay e-postası da gönderildi.
            </p>
            <Link to="/login">
              <Button type="button" fullWidth>
                Giriş Yap
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <header className="mb-2 pt-1">
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">
                Şifre Sıfırla
              </h2>
              <p className="mt-2 text-[14px] font-medium text-[#64748B]">
                Güçlü bir şifre belirleyin (en az 8 karakter, büyük/küçük harf, rakam, özel
                karakter).
              </p>
              {errors.token ? (
                <p className="mt-2 text-sm font-medium text-[#EF4444]">{errors.token}</p>
              ) : null}
            </header>

            <Input
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Yeni şifre"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Yeni şifre"
              rightSlot={
                <button
                  type="button"
                  className="rounded-[10px] p-1.5 text-[#94A3B8]"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Gizle' : 'Göster'}
                >
                  {showPw ? (
                    <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  )}
                </button>
              }
            />
            <PasswordStrength password={password} />
            <Input
              name="password2"
              type={showPw2 ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Şifreyi tekrar girin"
              value={password2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword2(e.target.value)}
              error={errors.password2}
              leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Şifreyi tekrar"
              rightSlot={
                <button
                  type="button"
                  className="rounded-[10px] p-1.5 text-[#94A3B8]"
                  onClick={() => setShowPw2((v) => !v)}
                  aria-label={showPw2 ? 'Gizle' : 'Göster'}
                >
                  {showPw2 ? (
                    <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  )}
                </button>
              }
            />

            {submitError ? (
              <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
                {submitError}
              </p>
            ) : null}

            <Button type="submit" fullWidth disabled={busy || !token}>
              {busy ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
            </Button>
          </form>
        )}
      </div>
    </motion.div>
  )
}
