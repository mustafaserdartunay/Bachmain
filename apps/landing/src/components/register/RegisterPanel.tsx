'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Eye, EyeOff, Hash, Lock, Mail, MapPin, Phone, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Checkbox from '../ui/Checkbox'
import PasswordStrength from './PasswordStrength'
import { formatMoneyTry } from '../pricing/pricingTokens'

export type RegisterFormState = {
  fullName: string
  companyName: string
  taxNo: string
  taxOffice: string
  address: string
  city: string
  district: string
  phone: string
  email: string
  password: string
  password2: string
  terms: boolean
}

type RegisterPanelProps = {
  form: RegisterFormState
  errors: Record<string, string>
  showPw: boolean
  showPw2: boolean
  busy: boolean
  submitError: string
  planName: string
  planPrice: number
  onChange: (key: keyof RegisterFormState) => (e: ChangeEvent<HTMLInputElement>) => void
  onTogglePw: () => void
  onTogglePw2: () => void
  onSubmit: (ev: FormEvent) => void
  onChangePlan: () => void
}

/** Demo / giriş paneli ile aynı görsel dil. */
export default function RegisterPanel({
  form,
  errors,
  showPw,
  showPw2,
  busy,
  submitError,
  planName,
  planPrice,
  onChange,
  onTogglePw,
  onTogglePw2,
  onSubmit,
  onChangePlan,
}: RegisterPanelProps) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[640px]"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-center text-4xl font-extrabold tracking-[-0.04em] text-[#2563EB] uppercase sm:text-5xl">
        Üye Ol
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-[14px] leading-relaxed font-medium text-[#64748B]">
        Bilgileriniz fatura ve lisans için kullanılır. Sonraki adımda ödeme yaparsınız. Tüm alanlar
        zorunludur.
      </p>

      <motion.div
        className="pointer-events-none absolute top-[7.5rem] -inset-x-px bottom-0 rounded-[34px] bg-gradient-to-br from-[#60A5FA]/50 via-[#2563EB]/25 to-[#38BDF8]/40 opacity-70 blur-[1px]"
        aria-hidden
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mt-10 rounded-[32px] border-[3px] border-[#2563EB] bg-white/95 p-8 shadow-[0_24px_64px_rgba(37,99,235,0.14)] backdrop-blur-sm sm:mt-12 sm:p-10">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[12px] font-medium tracking-wide text-[#64748B] uppercase">
                Seçilen paket
              </p>
              <p className="truncate text-[16px] font-bold text-[#0F172A]">
                {planName}{' '}
                <span className="font-semibold text-[#2563EB] tabular-nums">
                  {formatMoneyTry(planPrice)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onChangePlan}
              className="shrink-0 text-[13px] font-bold text-[#2563EB] hover:underline"
            >
              Değiştir
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="fullName"
              required
              autoComplete="name"
              placeholder="Ad Soyad *"
              value={form.fullName}
              onChange={onChange('fullName')}
              error={errors.fullName}
              leftIcon={<User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Ad Soyad"
            />
            <Input
              name="companyName"
              required
              autoComplete="organization"
              placeholder="Firma ünvanı *"
              value={form.companyName}
              onChange={onChange('companyName')}
              error={errors.companyName}
              leftIcon={<Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Firma ünvanı"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="taxNo"
              required
              inputMode="numeric"
              placeholder="TC veya Vergi No *"
              value={form.taxNo}
              onChange={onChange('taxNo')}
              error={errors.taxNo}
              leftIcon={<Hash className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="TC veya Vergi numarası"
            />
            <Input
              name="taxOffice"
              required
              placeholder="Vergi dairesi *"
              value={form.taxOffice}
              onChange={onChange('taxOffice')}
              error={errors.taxOffice}
              leftIcon={<Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Vergi dairesi"
            />
          </div>

          <Input
            name="address"
            required
            autoComplete="street-address"
            placeholder="Adres *"
            value={form.address}
            onChange={onChange('address')}
            error={errors.address}
            leftIcon={<MapPin className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="Adres"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="city"
              required
              autoComplete="address-level1"
              placeholder="İl *"
              value={form.city}
              onChange={onChange('city')}
              error={errors.city}
              aria-label="İl"
            />
            <Input
              name="district"
              required
              autoComplete="address-level2"
              placeholder="İlçe *"
              value={form.district}
              onChange={onChange('district')}
              error={errors.district}
              aria-label="İlçe"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="phone"
              required
              type="tel"
              autoComplete="tel"
              placeholder="Telefon *"
              value={form.phone}
              onChange={onChange('phone')}
              error={errors.phone}
              leftIcon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Telefon"
            />
            <Input
              name="email"
              required
              type="email"
              autoComplete="email"
              placeholder="E-posta *"
              value={form.email}
              onChange={onChange('email')}
              error={errors.email}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="E-posta"
            />
          </div>

          <Input
            name="password"
            required
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Şifre *"
            value={form.password}
            onChange={onChange('password')}
            error={errors.password}
            leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="Şifre"
            rightSlot={
              <PwToggle
                show={showPw}
                onToggle={onTogglePw}
                hideLabel="Şifreyi gizle"
                showLabel="Şifreyi göster"
              />
            }
          />
          <PasswordStrength password={form.password} />
          <Input
            name="password2"
            required
            type={showPw2 ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Şifreyi tekrar girin *"
            value={form.password2}
            onChange={onChange('password2')}
            error={errors.password2}
            leftIcon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
            aria-label="Şifreyi tekrar girin"
            rightSlot={
              <PwToggle
                show={showPw2}
                onToggle={onTogglePw2}
                hideLabel="Şifreyi gizle"
                showLabel="Şifreyi göster"
              />
            }
          />

          <Checkbox
            id="register-terms"
            checked={form.terms}
            onChange={onChange('terms')}
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
            <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={busy}>
            {busy ? 'Kaydediliyor…' : 'Ödemeye geç'}
          </Button>

          <p className="pt-1 text-center text-[14px] font-medium text-[#64748B]">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
              Giriş Yap
            </Link>
          </p>
        </form>
      </div>
    </motion.div>
  )
}

function PwToggle({
  show,
  onToggle,
  hideLabel,
  showLabel,
}: {
  show: boolean
  onToggle: () => void
  hideLabel: string
  showLabel: string
}) {
  return (
    <button
      type="button"
      className="rounded-[10px] p-1.5 text-[#94A3B8] transition duration-300 hover:text-[#64748B]"
      onClick={onToggle}
      aria-label={show ? hideLabel : showLabel}
    >
      {show ? (
        <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
      ) : (
        <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
      )}
    </button>
  )
}
