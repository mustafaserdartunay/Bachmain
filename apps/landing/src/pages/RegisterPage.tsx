import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Checkbox from '../components/ui/Checkbox'
import { platformPost, redirectToAppWithToken } from '../utils/platformApi'

/**
 * Register page — exact reference scene image + interactive form over the card.
 * Scene asset is the design source of truth (no regenerated mascot cutouts).
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
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-bold text-[#0F172A]">Üyeliğiniz oluşturuldu</p>
        <p className="mt-2 text-sm text-[#64748B]">Uygulamaya yönlendiriliyorsunuz…</p>
      </div>
    ) : (
      <form onSubmit={submit} className="flex flex-1 flex-col" noValidate>
        <header className="mb-5 shrink-0 sm:mb-6">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-[#0F172A] sm:text-[26px] lg:text-[28px]">
            Hesap oluşturun <span aria-hidden>✨</span>
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed font-medium tracking-tight text-[#64748B] sm:text-[14px]">
            BachMain ile tüm süreçler tek platformda.
          </p>
        </header>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="space-y-3">
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
          </div>

          <div className="mt-2 space-y-3">
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'Üye Ol'}
            </Button>
            <p className="text-center text-[13px] font-medium tracking-tight text-[#64748B]">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
                Giriş yap
              </Link>
            </p>
          </div>
        </div>
      </form>
    )

  return (
    <div className="register-ds relative min-h-screen overflow-x-clip bg-[#F8FAFC] font-[Sora,Inter,ui-sans-serif,system-ui,sans-serif]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 700px at 35% 25%, rgba(37,99,235,0.06), transparent 55%), #F8FAFC',
        }}
        aria-hidden
      />

      {/* Desktop: exact reference scene — Bachy untouched from the image */}
      <div className="relative z-10 mx-auto hidden min-h-screen w-full max-w-[1120px] items-center px-4 py-6 lg:flex xl:px-6">
        <div className="relative w-full">
          <img
            src="/bachy/register-scene@2x.png"
            alt="BachMain üye ol"
            width={2048}
            height={1536}
            className="pointer-events-none h-auto w-full select-none"
            draggable={false}
          />

          <Link
            to="/"
            className="absolute top-[2.2%] left-[2.8%] z-30 block h-[7%] w-[20%]"
            aria-label="BACHMAIN ana sayfa"
          />

          {/*
            Form covers painted card but leaves left strip open so Bachy’s
            hand on the card corner stays visible from the scene image.
          */}
          <div
            className="absolute z-20 box-border flex flex-col overflow-hidden rounded-[28px] border border-[#E5E7EB]/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
            style={{
              left: '37.2%',
              top: '6.4%',
              width: '50.2%',
              height: '80.2%',
            }}
          >
            <div className="flex h-full flex-col px-[8%] py-[5.5%]">{renderForm('desk')}</div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-5 lg:hidden">
        <Link
          to="/"
          className="mb-3 inline-flex w-fit items-center"
          aria-label="BACHMAIN ana sayfa"
        >
          <img
            src="/assets/bachmain-logo.png"
            alt="BACHMAIN"
            className="h-[1.65rem] w-auto"
            draggable={false}
          />
        </Link>

        <div className="relative mx-auto mb-[-24px] h-[210px] w-full max-w-[340px] overflow-hidden sm:h-[250px]">
          <img
            src="/bachy/register-scene@2x.png"
            alt=""
            className="pointer-events-none absolute top-0 left-1/2 h-[145%] w-auto max-w-none -translate-x-[36%] object-cover object-left select-none"
            draggable={false}
            aria-hidden
          />
        </div>

        <div className="relative z-10 rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
          {renderForm('mob')}
        </div>
      </div>
    </div>
  )
}
