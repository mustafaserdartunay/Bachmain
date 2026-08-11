'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Landmark, ShieldCheck } from 'lucide-react'
import { formatTry, modulePriceSuffix, moduleUnitPrice } from '../../data/moduleStoreFallback'
import {
  checkoutModuleStore,
  isModuleStoreLoggedIn,
  loginRedirectForCheckout,
} from '../../utils/moduleStoreApi'
import { ModuleIcon } from './ModuleIcon'
import { ModuleStoreProvider, useModuleStore } from './ModuleStoreContext'

function CheckoutInner() {
  const { cartModules, period, totals, clearCart } = useModuleStore()
  const [method, setMethod] = useState<'havale' | 'card'>('havale')
  const [accept, setAccept] = useState(false)
  const [companyInvoice, setCompanyInvoice] = useState(false)
  const [billingName, setBillingName] = useState('')
  const [taxNo, setTaxNo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{
    paymentId: string
    message: string
    bank?: { iban?: string; bankName?: string; accountHolder?: string }
    amountTry: number
  } | null>(null)

  const loggedIn = useMemo(() => {
    if (typeof window === 'undefined') return false
    return isModuleStoreLoggedIn()
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!cartModules.length) {
      setError('Sepetiniz boş.')
      return
    }
    if (!accept) {
      setError('Devam etmek için sözleşmeyi onaylayın.')
      return
    }
    if (!loggedIn) {
      window.location.href = loginRedirectForCheckout()
      return
    }

    setBusy(true)
    try {
      const data = await checkoutModuleStore({
        moduleCodes: cartModules.map((m) => m.code),
        period,
        method,
        companyInvoice,
        billingName,
        taxNo,
        acceptTerms: true,
      })
      if (data.url) {
        window.location.href = data.url
        return
      }
      setDone({
        paymentId: data.paymentId,
        message: data.message || 'Ödeme talebiniz alındı.',
        bank: data.bank,
        amountTry: data.amountTry ?? totals.total,
      })
      clearCart()
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status === 401) {
        window.location.href = loginRedirectForCheckout()
        return
      }
      setError(err instanceof Error ? err.message : 'Ödeme başlatılamadı')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="text-[24px] font-extrabold text-slate-900">Ödeme talebi alındı</h1>
          <p className="mt-2 text-[14px] text-slate-500">{done.message}</p>
          <p className="mt-4 text-[18px] font-extrabold text-[#2563EB]">
            {formatTry(done.amountTry)}
          </p>
          {done.bank?.iban ? (
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-[13px] text-slate-600">
              <p>
                <strong>Banka:</strong> {done.bank.bankName || '—'}
              </p>
              <p className="mt-1">
                <strong>IBAN:</strong> {done.bank.iban}
              </p>
              <p className="mt-1">
                <strong>Alıcı:</strong> {done.bank.accountHolder || 'BACHMAIN'}
              </p>
              <p className="mt-1">
                <strong>Referans:</strong> {done.paymentId}
              </p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/paketler/moduller"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-[14px] font-bold text-white"
            >
              Mağazaya Dön
            </Link>
            <a
              href="https://uygulama.bachmain.com/giris"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-[14px] font-bold text-slate-700"
            >
              Uygulamaya Git
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link
          to="/paketler/moduller"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Modül Mağazası
        </Link>
        <h1 className="mt-3 text-[30px] font-extrabold tracking-tight text-slate-900">
          Satın Alma Özeti
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Seçtiğiniz modülleri kontrol edin, ödeme yöntemini seçin ve onaylayın.
        </p>

        {!loggedIn ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
            Devam etmek için giriş yapmanız gerekiyor.{' '}
            <a href={loginRedirectForCheckout()} className="font-bold underline">
              Giriş Yap
            </a>
          </div>
        ) : null}

        {cartModules.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="font-semibold text-slate-700">Sepetiniz boş</p>
            <Link
              to="/paketler/moduller"
              className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#2563EB] px-5 text-[14px] font-bold text-white"
            >
              Modülleri İncele
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-[15px] font-bold text-slate-900">Seçilen modüller</h2>
                <ul className="mt-4 space-y-3">
                  {cartModules.map((m) => (
                    <li
                      key={m.code}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${m.iconColor}18` }}
                      >
                        <ModuleIcon name={m.icon} color={m.iconColor} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-[12px] text-slate-500">{m.description}</p>
                      </div>
                      <p className="shrink-0 text-[14px] font-extrabold text-slate-900">
                        {formatTry(moduleUnitPrice(m, period))}
                        <span className="ml-1 text-[11px] font-medium text-slate-400">
                          {modulePriceSuffix(period)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-[15px] font-bold text-slate-900">Ödeme yöntemi</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMethod('havale')}
                    className={[
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                      method === 'havale'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <Landmark className="h-5 w-5 text-blue-600" />
                    <span>
                      <span className="block text-[14px] font-bold text-slate-800">Havale / EFT</span>
                      <span className="text-[12px] text-slate-500">Onay sonrası aktivasyon</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={[
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                      method === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span>
                      <span className="block text-[14px] font-bold text-slate-800">Kredi Kartı</span>
                      <span className="text-[12px] text-slate-500">Stripe / iyzico</span>
                    </span>
                  </button>
                </div>

                <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={companyInvoice}
                    onChange={(e) => setCompanyInvoice(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Kurumsal fatura istiyorum
                </label>
                {companyInvoice ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="Ünvan / Şirket adı"
                      className="h-11 rounded-xl border border-slate-200 px-3 text-[14px] outline-none focus:border-blue-400"
                    />
                    <input
                      value={taxNo}
                      onChange={(e) => setTaxNo(e.target.value)}
                      placeholder="Vergi no"
                      className="h-11 rounded-xl border border-slate-200 px-3 text-[14px] outline-none focus:border-blue-400"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-[15px] font-bold text-slate-900">Özet</h2>
                <dl className="mt-4 space-y-2 text-[13px]">
                  <div className="flex justify-between text-slate-500">
                    <dt>{totals.count} modül</dt>
                    <dd className="font-semibold text-slate-700">{formatTry(totals.subtotal)}</dd>
                  </div>
                  {totals.yearlyAdvantage > 0 ? (
                    <div className="flex justify-between text-emerald-600">
                      <dt>Yıllık avantaj</dt>
                      <dd className="font-semibold">−{formatTry(totals.yearlyAdvantage)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-500">
                    <dt>KDV (%20)</dt>
                    <dd className="font-semibold text-slate-700">{formatTry(totals.vat)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <dt className="font-bold text-slate-900">Toplam</dt>
                    <dd className="text-[20px] font-extrabold text-[#2563EB]">
                      {formatTry(totals.total)}
                    </dd>
                  </div>
                </dl>

                <label className="mt-4 flex items-start gap-2 text-[12.5px] leading-snug text-slate-600">
                  <input
                    type="checkbox"
                    checked={accept}
                    onChange={(e) => setAccept(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>
                    <Link to="/hizmet-sozlesmesi" className="font-semibold text-blue-600 underline">
                      Hizmet sözleşmesini
                    </Link>{' '}
                    okudum ve kabul ediyorum.
                  </span>
                </label>

                {error ? (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2563EB] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)] transition hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {busy ? 'İşleniyor…' : loggedIn ? 'Ödemeyi Başlat' : 'Giriş Yap ve Devam Et'}
                </button>

                <div className="mt-3 flex items-start gap-2 text-[11.5px] text-slate-500">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                  Ödeme sonrası seçilen modüller hesabınıza tanımlanır ve uygulama menüsünde
                  aktifleşir.
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ModuleStoreCheckoutPage() {
  return (
    <ModuleStoreProvider>
      <CheckoutInner />
    </ModuleStoreProvider>
  )
}
