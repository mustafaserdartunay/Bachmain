import { useState, type ChangeEvent, type FormEvent } from 'react'
import RegisterHero from '../components/register/RegisterHero'
import RegisterPanel from '../components/register/RegisterPanel'
import { platformPost, redirectToAppWithToken } from '../utils/platformApi'

/**
 * Register — same visual system as Pricing (no mascot).
 * Header/Footer from App shell.
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

  const onChange = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
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

  const onSubmit = async (ev: FormEvent) => {
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
    <div className="register-ds bg-[#F8FAFC] font-[Sora,ui-sans-serif,system-ui,sans-serif]">
      <section className="relative overflow-x-clip pt-[120px] pb-[120px]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#E2E8F0]/55 via-[#F1F5F9]/35 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
          <RegisterHero />
          <div className="mt-14 lg:mt-16">
            <RegisterPanel
              form={form}
              errors={errors}
              showPw={showPw}
              showPw2={showPw2}
              busy={busy}
              done={done}
              submitError={submitError}
              onChange={onChange}
              onTogglePw={() => setShowPw((v) => !v)}
              onTogglePw2={() => setShowPw2((v) => !v)}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
