import { useEffect, useState } from "react";
import { Building2, CheckCircle, Lock, UserRound, X } from "lucide-react";
import Button from "./Button";
import { platformPost, redirectToAppWithToken } from "../utils/platformApi";

const empty = {
  fullName: "",
  email: "",
  password: "",
  password2: "",
  companyName: "",
  taxNo: "",
  taxOffice: "",
  address: "",
  city: "",
  district: "",
  phone: "",
  gsm: "",
  companySize: "",
};

const inputCls =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15";

function Field({ label, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-[12px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function SignupModal({ open, onClose }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose?.();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) {
      setForm(empty);
      setErrors({});
      setSubmitError("");
      setDone(false);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Yetkili ad soyad gerekli";
    if (!form.companyName.trim()) e.companyName = "Firma ünvanı gerekli";
    const tax = onlyDigits(form.taxNo);
    if (tax.length < 10 || tax.length > 11) e.taxNo = "Vergi / T.C. kimlik no 10 veya 11 haneli olmalı";
    if (!form.address.trim()) e.address = "Adres gerekli";
    if (!form.city.trim()) e.city = "Şehir gerekli";
    if (!form.gsm.trim()) e.gsm = "GSM gerekli";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Geçerli e-posta girin";
    if ((form.password || "").length < 6) e.password = "Şifre en az 6 karakter olmalı";
    if (form.password !== form.password2) e.password2 = "Şifreler eşleşmiyor";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setSubmitError("");
    try {
      const payload = {
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        gsm: form.gsm.trim(),
        taxNo: onlyDigits(form.taxNo),
        taxOffice: form.taxOffice.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        companySize: form.companySize,
        plan: "Starter",
        source: "bachmain_signup_modal",
      };
      const data = await platformPost("auth/register", payload);
      setDone(true);
      setTimeout(() => {
        if (data.token) redirectToAppWithToken(data.token);
        else onClose?.();
      }, 1200);
    } catch (err) {
      setSubmitError(err.message || "Üyelik oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm sm:items-center sm:py-10">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Kapat" onClick={() => !busy && onClose?.()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_100px_-20px_rgba(15,23,42,0.45)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-blue-800 px-6 py-6 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200/90">BACHMAIN</p>
              <h2 id="signup-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Üye Ol
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-blue-100/80">
                Firma ve yetkili bilgilerinizi girin. Kayıt yönetimde güvenli şekilde saklanır; 7 gün ücretsiz deneme başlar.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => onClose?.()}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {done ? (
          <div className="px-6 py-16 text-center sm:px-8">
            <CheckCircle className="mx-auto h-14 w-14 text-blue-600" />
            <h3 className="mt-4 text-xl font-bold text-slate-900">Üyeliğiniz oluşturuldu</h3>
            <p className="mt-2 text-slate-500">Kaydınız yönetim paneline iletildi. Uygulamaya yönlendiriliyorsunuz…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="max-h-[min(78vh,720px)] space-y-7 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
            <section>
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <UserRound className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide">Yetkili Bilgileri</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Yetkili Ad Soyad *" error={errors.fullName} className="sm:col-span-2">
                  <input className={inputCls} autoComplete="name" value={form.fullName} onChange={set("fullName")} placeholder="Ad Soyad" />
                </Field>
                <Field label="E-posta *" error={errors.email}>
                  <input type="email" className={inputCls} autoComplete="email" value={form.email} onChange={set("email")} placeholder="firma@ornek.com" />
                </Field>
                <Field label="GSM *" error={errors.gsm}>
                  <input type="tel" className={inputCls} autoComplete="tel" value={form.gsm} onChange={set("gsm")} placeholder="05xx xxx xx xx" />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Building2 className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide">Firma Bilgileri</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Firma Ünvanı *" error={errors.companyName} className="sm:col-span-2">
                  <input className={inputCls} value={form.companyName} onChange={set("companyName")} placeholder="Örn. ABC Ticaret A.Ş." />
                </Field>
                <Field label="Vergi / T.C. Kimlik No *" error={errors.taxNo}>
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    maxLength={11}
                    value={form.taxNo}
                    onChange={(e) => setForm((p) => ({ ...p, taxNo: onlyDigits(e.target.value).slice(0, 11) }))}
                    placeholder="10 veya 11 hane"
                  />
                </Field>
                <Field label="Vergi Dairesi" error={errors.taxOffice}>
                  <input className={inputCls} value={form.taxOffice} onChange={set("taxOffice")} placeholder="Örn. Kadıköy" />
                </Field>
                <Field label="Telefon (Sabit)" error={errors.phone}>
                  <input type="tel" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="0xxx xxx xx xx" />
                </Field>
                <Field label="Çalışan Sayısı">
                  <select className={inputCls} value={form.companySize} onChange={set("companySize")}>
                    <option value="">Seçin</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="200+">200+</option>
                  </select>
                </Field>
                <Field label="Adres *" error={errors.address} className="sm:col-span-2">
                  <textarea rows={2} className={inputCls} value={form.address} onChange={set("address")} placeholder="Mahalle, cadde, no, ilçe…" />
                </Field>
                <Field label="İlçe">
                  <input className={inputCls} value={form.district} onChange={set("district")} />
                </Field>
                <Field label="Şehir *" error={errors.city}>
                  <input className={inputCls} value={form.city} onChange={set("city")} placeholder="İstanbul" />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Lock className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide">Üyelik Güvenliği</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Şifre *" error={errors.password}>
                  <input type="password" className={inputCls} autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="En az 6 karakter" />
                </Field>
                <Field label="Şifre Tekrar *" error={errors.password2}>
                  <input type="password" className={inputCls} autoComplete="new-password" value={form.password2} onChange={set("password2")} />
                </Field>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
                Verileriniz HTTPS ile iletilir; şifreniz yönetim sisteminde hash’lenerek saklanır. Kayıt sonrası yonetim.bachmain.com müşteri / üye listelerine düşer.
              </p>
            </section>

            {submitError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{submitError}</p> : null}

            <div className="sticky bottom-0 -mx-6 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button type="button" disabled={busy} onClick={() => onClose?.()} className="btn-ghost justify-center">
                Vazgeç
              </button>
              <Button type="submit" disabled={busy} className="justify-center sm:min-w-[220px]">
                {busy ? "Kaydediliyor…" : "Üyeliği Oluştur"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
