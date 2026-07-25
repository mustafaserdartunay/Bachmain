import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Checkbox from '../ui/Checkbox'

type RegisterFormState = {
  fullName: string
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
  done: boolean
  submitError: string
  onChange: (key: keyof RegisterFormState) => (e: ChangeEvent<HTMLInputElement>) => void
  onTogglePw: () => void
  onTogglePw2: () => void
  onSubmit: (ev: FormEvent) => void
}

export default function RegisterPanel({
  form,
  errors,
  showPw,
  showPw2,
  busy,
  done,
  submitError,
  onChange,
  onTogglePw,
  onTogglePw2,
  onSubmit,
}: RegisterPanelProps) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[480px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
    >
      {/* Pro-card language: white + 3px primary border + soft shadow */}
      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_35px_90px_rgba(37,99,235,0.18)] sm:p-10">
        <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
          Hemen başla
        </span>

        {done ? (
          <div className="py-12 text-center">
            <p className="text-[22px] font-extrabold tracking-tight text-[#0F172A]">
              Üyeliğiniz oluşturuldu
            </p>
            <p className="mt-2 text-[14px] font-medium text-[#64748B]">
              Uygulamaya yönlendiriliyorsunuz…
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <header className="mb-2 pt-1">
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">
                Hesap oluşturun
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed font-medium text-[#64748B]">
                BachMain ile tüm süreçler tek platformda.
              </p>
            </header>

            <Input
              name="fullName"
              autoComplete="name"
              placeholder="Ad Soyad"
              value={form.fullName}
              onChange={onChange('fullName')}
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
              onChange={onChange('email')}
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
            <Input
              name="password2"
              type={showPw2 ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Şifreyi tekrar girin"
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

            <div className="pt-1">
              <Button type="submit" fullWidth disabled={busy}>
                {busy ? 'Kaydediliyor…' : 'Üye Ol'}
              </Button>
            </div>

            <p className="pt-1 text-center text-[14px] font-medium text-[#64748B]">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
                Giriş yap
              </Link>
            </p>
          </form>
        )}
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
