import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Checkbox from '../components/ui/Checkbox'
import { platformPost, redirectToAppWithToken } from '../utils/platformApi'

/**
 * Register — pricing-reference visual language + Bachy.
 * Site header/footer always visible (App shell).
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

  return (
    <div className="register-ds bg-[#F8FAFC] font-[Sora,Inter,ui-sans-serif,system-ui,sans-serif]">
      {/* Hero — pricing reference title language */}
      <section className="px-4 pt-28 pb-6 text-center sm:px-6 lg:pt-32 lg:pb-8">
        <p className="text-[13px] font-medium tracking-tight text-[#64748B] sm:text-[14px]">
          Hesabını oluştur, 7 gün ücretsiz dene
        </p>
        <h1 className="mt-3 text-[2rem] leading-tight font-extrabold tracking-tight text-[#0F172A] sm:text-[2.5rem] lg:text-[2.75rem]">
          BachMain{' '}
          <span className="relative inline-block text-[#2563EB]">
            Üye Ol
            <span
              className="absolute right-0 -bottom-1 left-0 h-[6px] rounded-full bg-[#F59E0B]"
              aria-hidden
            />
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed font-medium text-[#64748B] sm:text-[15px]">
          Her ölçekteki <span className="font-semibold text-[#2563EB]">işletme</span> için en doğru
          çözüm — tek panelde tüm süreçler.
        </p>
      </section>

      {/* Bachy + form panel */}
      <section className="mx-auto flex w-full max-w-[920px] flex-col items-center px-4 pb-16 sm:px-6 lg:flex-row lg:items-end lg:justify-center lg:pb-20">
        <div className="relative z-[5] mb-[-32px] flex justify-center lg:mb-0 lg:translate-x-6 lg:self-end xl:translate-x-8">
          <div className="h-[160px] overflow-hidden sm:h-[190px] lg:h-auto lg:overflow-visible">
            <img
              src="/bachy/bachy-point.png"
              alt=""
              width={572}
              height={772}
              draggable={false}
              className="mx-auto h-[260%] w-auto max-w-none object-contain object-top select-none lg:h-[400px] xl:h-[440px]"
              aria-hidden
            />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="rounded-[32px] border-2 border-[#2563EB] bg-white p-7 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.35)] sm:p-9">
            <div className="mb-5 flex justify-center">
              <span className="rounded-full bg-[#2563EB] px-4 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
                Hemen başla
              </span>
            </div>

            {done ? (
              <div className="py-10 text-center">
                <p className="text-lg font-bold text-[#0F172A]">Üyeliğiniz oluşturuldu</p>
                <p className="mt-2 text-sm text-[#64748B]">Uygulamaya yönlendiriliyorsunuz…</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3.5" noValidate>
                <header className="mb-1">
                  <h2 className="text-[22px] font-extrabold tracking-tight text-[#2563EB] sm:text-[24px]">
                    Hesap oluşturun
                  </h2>
                  <p className="mt-1 text-[13px] font-medium text-[#64748B]">
                    BachMain ile tüm süreçler tek platformda.
                  </p>
                </header>

                <Input
                  name="fullName"
                  autoComplete="name"
                  placeholder="Ad Soyad"
                  value={form.fullName}
                  onChange={set('fullName')}
                  error={errors.fullName}
                  leftIcon={<User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
                  aria-label="Ad Soyad"
                />
                <Input
                  name="email"
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
                  name="password"
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
                  name="password2"
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
                  id="register-terms"
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

                <p className="text-center text-[13px] font-medium text-[#64748B]">
                  Zaten hesabınız var mı?{' '}
                  <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
                    Giriş yap
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
