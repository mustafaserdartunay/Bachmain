import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import RegisterHero from '../components/register/RegisterHero'
import RegisterPanel from '../components/register/RegisterPanel'
import RegisterPlanPicker, { type PlanId } from '../components/register/RegisterPlanPicker'
import { referencePricingPlans } from '../components/pricing/pricingTokens'
import { platformPost, redirectToAppWithToken } from '../utils/platformApi'

function resolvePlanId(raw: string | null): PlanId | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  const match = referencePricingPlans.find((p) => p.id === key || p.name.toLowerCase() === key)
  return match ? match.id : null
}

/**
 * Register — pick package first, then create account (no mascot).
 */
export default function RegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(() =>
    resolvePlanId(searchParams.get('plan')),
  )
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

  const selectedPlan = useMemo(
    () => referencePricingPlans.find((p) => p.id === selectedPlanId) ?? null,
    [selectedPlanId],
  )
  const step = selectedPlan ? 'form' : 'plan'

  useEffect(() => {
    const fromUrl = resolvePlanId(searchParams.get('plan'))
    if (fromUrl && fromUrl !== selectedPlanId) setSelectedPlanId(fromUrl)
  }, [searchParams, selectedPlanId])

  const selectPlan = (planId: PlanId) => {
    setSelectedPlanId(planId)
    setSearchParams({ plan: planId }, { replace: true })
    setSubmitError('')
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changePlan = () => {
    setSelectedPlanId(null)
    setSearchParams({}, { replace: true })
    setSubmitError('')
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onChange = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = key === 'terms' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedPlan) e.plan = 'Lütfen bir paket seçin'
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
    if (!validate() || !selectedPlan) return
    setBusy(true)
    setSubmitError('')
    try {
      const fullName = form.fullName.trim()
      const data = await platformPost('auth/register', {
        fullName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        companyName: fullName,
        plan: selectedPlan.name,
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
          <RegisterHero step={step} planName={selectedPlan?.name} />

          <div className="mt-14 lg:mt-16">
            {step === 'plan' ? (
              <RegisterPlanPicker onSelect={selectPlan} />
            ) : selectedPlan ? (
              <RegisterPanel
                form={form}
                errors={errors}
                showPw={showPw}
                showPw2={showPw2}
                busy={busy}
                done={done}
                submitError={submitError}
                planName={selectedPlan.name}
                planPrice={selectedPlan.price}
                onChange={onChange}
                onTogglePw={() => setShowPw((v) => !v)}
                onTogglePw2={() => setShowPw2((v) => !v)}
                onSubmit={onSubmit}
                onChangePlan={changePlan}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
