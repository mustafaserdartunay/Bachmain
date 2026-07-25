import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Checkbox from '../components/ui/Checkbox'
import { platformPost, redirectToAppWithToken } from '../utils/platformApi'

/**
 * Register — Bachy + panel only. Flat background, no scene / floor / ground.
 */
export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    password2: '',
    terms: false,
  })
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = key === 'terms' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Ad soyad gerekli'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Geçerli e-posta girin'
    if ((form.password || '').length < 6) e.password = 'Şifre en az 6 karakter olmalı'
    if (form.password !== form.password2) e.password2 = 'Şifreler eşleşmiyor'
    if (!form.terms) e.terms = 'Devam etmek için şartları kabul edin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    setSubmitError('')
    try {
      const fullName = form.fullName.trim()
      const data = await platformPost('auth/register', {
        fullName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        companyName: fullName,
        plan: 'Starter',
        source: 'bachmain_register_page',
      })
      setDone(true)
      setTimeout(() => redirectToAppWithToken(data.token), 900)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Üyelik oluşturulamadı. Lütfen tekrar deneyin.'
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  const renderForm = (idPrefix: string): ReactNode =>
    done ? (
      <div className="py-10 text-center">
        <p className="text-lg font-bold text-[#0F172A]">Üyeliğiniz oluşturuldu</p>
        <p className="mt-2 text-sm text-[#64748B]">Uygulamaya yönlendiriliyorsunuz…</p>
      </div>
    ) : (
      <form onSubmit={submit} className="flex flex-col" noValidate>
        <header className="mb-6">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0F172A] sm:text-[28px]">
            Hesap oluşturun <span aria-hidden>✨</span>
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed font-medium tracking-tight text-[#64748B]">
            BachMain ile tüm süreçler tek platformda.
          </p>
        </header>

        <div className="space-y-3.5">
          <Input
            name={`${idPrefix}-fullName`}
            autoComplete="name"
            placeholder="Ad Soyad"
            value={form.fullName}
            onChange={set('fullName')}
            error={errors.fullName}
            leftIcon={<User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="Ad Soyad"
          />
          <Input
            name={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            placeholder="E-posta"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="E-posta"
          />
          <Input
            name={`${idPrefix}-password`}
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Şifre"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="Şifre"
            rightSlot={
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#94A3B8] transition hover:text-[#64748B]"
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
          <Input
            name={`${idPrefix}-password2`}
            type={showPw2 ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Şifreyi tekrar girin"
            value={form.password2}
            onChange={set('password2')}
            error={errors.password2}
            leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="Şifreyi tekrar girin"
            rightSlot={
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#94A3B8] transition hover:text-[#64748B]"
                onClick={() => setShowPw2((v) => !v)}
                aria-label={showPw2 ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPw2 ? (
                  <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                )}
              </button>
            }
          />

          <Checkbox
            id={`${idPrefix}-terms`}
            checked={form.terms}
            onChange={set('terms')}
            error={errors.terms}
            label={
              <>
                <Link to="/help" className="font-semibold text-[#2563EB] hover:underline">
                  Kullanım şartları
                </Link>{' '}
                ve{' '}
                <Link to="/help" className="font-semibold text-[#2563EB] hover:underline">
                  gizlilik politikasını
                </Link>{' '}
                kabul ediyorum.
              </>
            }
          />

          {submitError ? (
            <p className="rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
              {submitError}
            </p>
          ) : null}

          <div className="pt-1">
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'Üye Ol'}
            </Button>
          </div>

          <p className="pt-1 text-center text-[13px] font-medium tracking-tight text-[#64748B]">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </form>
    )

  return (
    <div className="register-ds relative min-h-screen bg-[#F8FAFC] font-[Sora,Inter,ui-sans-serif,system-ui,sans-serif]">
      <div className="relative z-10 px-5 pt-6 sm:px-8 lg:px-10">
        <Link to="/" className="inline-flex items-center" aria-label="BACHMAIN ana sayfa">
          <img
            src="/assets/bachmain-logo.png"
            alt="BACHMAIN"
            className="h-[1.65rem] w-auto"
            draggable={false}
          />
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-[960px] flex-col items-center justify-center px-4 pb-12 pt-4 sm:px-6 lg:flex-row lg:items-end lg:justify-center lg:gap-0 lg:pb-16">
        {/* Bachy — transparent cutout, no floor/ground */}
        <div className="relative z-[5] mb-[-28px] flex w-full justify-center lg:mb-0 lg:w-auto lg:shrink-0 lg:translate-x-8 lg:self-end xl:translate-x-10">
          <div className="h-[170px] overflow-hidden sm:h-[200px] lg:h-auto lg:overflow-visible">
            <img
              src="/bachy/bachy-register.png"
              alt=""
              width={662}
              height={1137}
              draggable={false}
              className="mx-auto h-[280%] w-auto max-w-none object-contain object-top lg:h-[420px] lg:w-auto xl:h-[460px]"
              aria-hidden
            />
          </div>
        </div>

        {/* Panel */}
        <div className="relative z-10 w-full max-w-[420px] lg:max-w-[440px]">
          <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-9">
            {renderForm('reg')}
          </div>
        </div>
      </div>
    </div>
  )
}
