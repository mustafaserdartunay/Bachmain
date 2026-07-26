'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import RegisterHero from '../components/register/RegisterHero'
import RegisterPanel, { type RegisterFormState } from '../components/register/RegisterPanel'
import RegisterPlanPicker, {
  type KontorPackageId,
  type PlanId,
} from '../components/register/RegisterPlanPicker'
import PaymentPanel, {
  type PaymentMethod,
  type PaymentResult,
} from '../components/register/PaymentPanel'
import PaymentPending from '../components/register/PaymentPending'
import { passwordIssues } from '../components/register/PasswordStrength'
import {
  referencePricingPlans,
  kontorPackages,
  planCheckoutAmount,
  formatMoneyTry,
  type BillingPeriod,
} from '../components/pricing/pricingTokens'
import { yonetimPost } from '../utils/platformApi'

function resolvePlanId(raw: string | null): PlanId | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  if (
    [
      'full',
      'starter',
      'pro',
      'enterprise',
      'professional',
      'bachmain full',
      'enterprise full paket',
    ].includes(key)
  ) {
    return 'full'
  }
  const match = referencePricingPlans.find((p) => p.id === key || p.name.toLowerCase() === key)
  return match ? match.id : null
}

function mapPlanForApi(_planId: PlanId): string {
  return 'Enterprise'
}

function mapPlanCode(_planId: PlanId): string {
  return 'enterprise'
}

type Step = 'plan' | 'form' | 'payment' | 'pending'

/**
 * Register flow: paket → form → ödeme → onay bekler (yonetim SoT).
 */
export default function RegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(() =>
    resolvePlanId(searchParams.get('plan')),
  )
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(() =>
    searchParams.get('period') === 'month' ? 'month' : 'year',
  )
  const [selectedKontorId, setSelectedKontorId] = useState<KontorPackageId | null>(() => {
    const raw = searchParams.get('kontor')
    if (!raw) return null
    return kontorPackages.some((p) => p.id === raw) ? (raw as KontorPackageId) : null
  })
  const [step, setStep] = useState<Step>(() =>
    resolvePlanId(searchParams.get('plan')) ? 'form' : 'plan',
  )
  const [form, setForm] = useState<RegisterFormState>({
    fullName: '',
    companyName: '',
    taxNo: '',
    taxOffice: '',
    address: '',
    city: '',
    district: '',
    phone: '',
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
  const [sessionToken, setSessionToken] = useState('')
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [paidMethod, setPaidMethod] = useState<PaymentMethod>('havale')
  const [amountWarning, setAmountWarning] = useState('')

  const selectedPlan = useMemo(
    () => referencePricingPlans.find((p) => p.id === selectedPlanId) ?? null,
    [selectedPlanId],
  )
  const selectedKontor = useMemo(
    () => kontorPackages.find((p) => p.id === selectedKontorId) ?? null,
    [selectedKontorId],
  )
  const checkoutAmount = useMemo(() => {
    if (!selectedPlan) return 0
    const planAmount = planCheckoutAmount(selectedPlan, billingPeriod)
    return planAmount + (selectedKontor?.price ?? 0)
  }, [selectedPlan, billingPeriod, selectedKontor])
  const checkoutLabel = useMemo(() => {
    if (!selectedPlan) return ''
    const periodLabel = billingPeriod === 'year' ? 'Yıllık' : 'Aylık'
    if (!selectedKontor) return `${selectedPlan.name} · ${periodLabel}`
    return `${selectedPlan.name} · ${periodLabel} + ${selectedKontor.amount.toLocaleString('tr-TR')} kontör`
  }, [selectedPlan, billingPeriod, selectedKontor])

  useEffect(() => {
    const fromUrl = resolvePlanId(searchParams.get('plan'))
    if (fromUrl && fromUrl !== selectedPlanId) {
      setSelectedPlanId(fromUrl)
      if (step === 'plan') setStep('form')
    }
    const periodParam = searchParams.get('period')
    if (periodParam === 'month' || periodParam === 'year') {
      setBillingPeriod(periodParam)
    }
    const kontorParam = searchParams.get('kontor')
    if (kontorParam && kontorPackages.some((p) => p.id === kontorParam)) {
      if (kontorParam !== selectedKontorId) {
        setSelectedKontorId(kontorParam as KontorPackageId)
      }
    } else if (!kontorParam && selectedKontorId && searchParams.get('plan')) {
      // keep in-memory selection if URL has no kontor yet
    }
  }, [searchParams, selectedPlanId, selectedKontorId, step])

  const selectPlan = (planId: PlanId, period: BillingPeriod, kontorId?: KontorPackageId | null) => {
    setSelectedPlanId(planId)
    setBillingPeriod(period)
    setSelectedKontorId(kontorId ?? null)
    const nextParams: Record<string, string> = { plan: planId, period }
    if (kontorId) nextParams.kontor = kontorId
    setSearchParams(nextParams, { replace: true })
    setStep('form')
    setSubmitError('')
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changePlan = () => {
    setSelectedPlanId(null)
    setSelectedKontorId(null)
    setSearchParams({}, { replace: true })
    setStep('plan')
    setSubmitError('')
    setErrors({})
    setSessionToken('')
    setPaymentResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onChange = (key: keyof RegisterFormState) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = key === 'terms' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!selectedPlan) e.plan = 'Lütfen bir paket seçin'
    if (!form.fullName.trim()) e.fullName = 'Ad soyad gerekli'
    if (!form.companyName.trim()) e.companyName = 'Firma ünvanı gerekli'
    const tax = form.taxNo.replace(/\D/g, '')
    if (tax.length < 10 || tax.length > 11) e.taxNo = 'TC veya vergi no 10–11 haneli olmalı'
    if (!form.taxOffice.trim()) e.taxOffice = 'Vergi dairesi gerekli'
    if (!form.address.trim()) e.address = 'Adres gerekli'
    if (!form.city.trim()) e.city = 'İl gerekli'
    if (!form.district.trim()) e.district = 'İlçe gerekli'
    if (!form.phone.trim()) e.phone = 'Telefon gerekli'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Geçerli e-posta girin'
    const pwIssue = passwordIssues(form.password)
    if (pwIssue) e.password = pwIssue
    if (form.password !== form.password2) e.password2 = 'Şifreler eşleşmiyor'
    if (!form.terms) e.terms = 'Devam etmek için şartları kabul edin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmitForm = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validateForm() || !selectedPlan) return
    setBusy(true)
    setSubmitError('')
    try {
      const data = await yonetimPost('auth/register', {
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim(),
        taxNo: form.taxNo.replace(/\D/g, ''),
        taxOffice: form.taxOffice.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        plan: mapPlanForApi(selectedPlan.id),
        requirePayment: true,
        source: 'bachmain_register_page',
      })
      if (!data.token) throw new Error('Kayıt tamamlandı ancak oturum alınamadı')
      setSessionToken(data.token)
      setStep('payment')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Üyelik oluşturulamadı. Lütfen tekrar deneyin.'
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  const onPay = async (method: PaymentMethod) => {
    if (!selectedPlan || !sessionToken) {
      setSubmitError('Oturum bulunamadı. Lütfen formu tekrar gönderin.')
      return
    }
    setBusy(true)
    setSubmitError('')
    setAmountWarning('')
    try {
      const checkout = await yonetimPost(
        'billing/checkout',
        {
          planCode: mapPlanCode(selectedPlan.id),
          plan: mapPlanCode(selectedPlan.id),
          period: billingPeriod,
          method: method === 'card' ? 'iyzico' : 'havale',
          companyInvoice: true,
          billingName: form.companyName.trim(),
          taxNo: form.taxNo.replace(/\D/g, ''),
          source: 'bachmain_register_checkout',
          amountTry: checkoutAmount,
          kontorPackageId: selectedKontor?.id ?? null,
          kontorAmount: selectedKontor?.amount ?? 0,
          kontorPriceTry: selectedKontor?.price ?? 0,
        },
        { token: sessionToken },
      )

      const expected = Number(checkout.expectedAmountTry ?? checkout.amountTry ?? checkoutAmount)
      const paid = Number(checkout.amountTry ?? expected)
      if (paid + 0.01 < expected || paid + 0.01 < checkoutAmount) {
        setAmountWarning(
          `Ödeme tutarı (${formatMoneyTry(paid)}) beklenen tutardan düşük. Eksik ödemede giriş açılmaz.`,
        )
      }

      setPaidMethod(method)
      setPaymentResult(checkout)
      setStep('pending')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ödeme talebi oluşturulamadı. Lütfen tekrar deneyin.'
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="register-ds bg-[#F8FAFC]">
      <section className="relative overflow-x-clip pt-[120px] pb-[120px]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#E2E8F0]/55 via-[#F1F5F9]/35 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
          <RegisterHero step={step} planName={checkoutLabel || selectedPlan?.name} />

          <div className={step === 'form' ? 'mt-0' : 'mt-14 lg:mt-16'}>
            {step === 'plan' ? <RegisterPlanPicker onSelect={selectPlan} /> : null}

            {step === 'form' && selectedPlan ? (
              <RegisterPanel
                form={form}
                errors={errors}
                showPw={showPw}
                showPw2={showPw2}
                busy={busy}
                submitError={submitError}
                planName={checkoutLabel}
                planPrice={checkoutAmount}
                onChange={onChange}
                onTogglePw={() => setShowPw((v) => !v)}
                onTogglePw2={() => setShowPw2((v) => !v)}
                onSubmit={onSubmitForm}
                onChangePlan={changePlan}
              />
            ) : null}

            {step === 'payment' && selectedPlan ? (
              <PaymentPanel
                planName={checkoutLabel}
                planPrice={checkoutAmount}
                busy={busy}
                submitError={submitError}
                amountWarning={amountWarning}
                onPay={onPay}
                onBack={() => {
                  setStep('form')
                  setSubmitError('')
                }}
              />
            ) : null}

            {step === 'pending' && selectedPlan && paymentResult ? (
              <PaymentPending planName={checkoutLabel} result={paymentResult} method={paidMethod} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
