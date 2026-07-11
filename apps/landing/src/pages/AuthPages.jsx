import { useState } from "react";
import { CheckCircle } from "lucide-react";
import Button from "../components/Button";
import DemoForm from "../components/DemoForm";
import ScrollReveal from "../components/ScrollReveal";
import { platformPost, redirectToAppWithToken } from "../utils/platformApi";

function AuthForm({ mode }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!form.email?.trim()) e2.email = "E-posta gerekli";
    if (!form.password?.trim()) e2.password = "Şifre gerekli";
    if (mode === "register") {
      if (!form.name?.trim()) e2.name = "Ad soyad gerekli";
      if (!form.company?.trim()) e2.company = "Firma adı gerekli";
      if ((form.password || "").length < 6) e2.password = "Şifre en az 6 karakter olmalı";
    }
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setBusy(true);
    setSubmitError("");
    try {
      if (mode === "register") {
        const data = await platformPost("auth/register", {
          fullName: form.name.trim(),
          companyName: form.company.trim(),
          phone: (form.phone || "").trim(),
          email: form.email.trim(),
          password: form.password,
          plan: "Starter",
        });
        setDone(true);
        setTimeout(() => redirectToAppWithToken(data.token), 900);
      } else {
        const data = await platformPost("auth/login", {
          email: form.email.trim(),
          password: form.password,
        });
        setDone(true);
        setTimeout(() => redirectToAppWithToken(data.token), 600);
      }
    } catch (err) {
      setSubmitError(err.message || "İşlem başarısız. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="saas-card p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">{mode === "login" ? "Giriş başarılı!" : "Kayıt tamamlandı!"}</h3>
        <p className="mt-2 text-slate-500">
          {mode === "login"
            ? "Müşteri kaydınız yönetimde güncellendi. Uygulamaya yönlendiriliyorsunuz…"
            : "7 gün ücretsiz denemeniz başladı. Uygulamaya yönlendiriliyorsunuz…"}
        </p>
      </div>
    );
  }

  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15";

  return (
    <form onSubmit={submit} className="saas-card p-8">
      {mode === "register" && (
        <>
          <label className="block text-sm font-semibold text-slate-700">Ad Soyad</label>
          <input className={`mb-4 ${inputCls}`} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="mb-2 text-xs text-rose-500">{errors.name}</p>}
          <label className="block text-sm font-semibold text-slate-700">Şirket</label>
          <input className={`mb-4 ${inputCls}`} value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          {errors.company && <p className="mb-2 text-xs text-rose-500">{errors.company}</p>}
          <label className="block text-sm font-semibold text-slate-700">Telefon</label>
          <input className={`mb-4 ${inputCls}`} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </>
      )}
      <label className="block text-sm font-semibold text-slate-700">E-posta</label>
      <input type="email" className={`mb-4 ${inputCls}`} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      {errors.email && <p className="mb-2 text-xs text-rose-500">{errors.email}</p>}
      <label className="block text-sm font-semibold text-slate-700">Şifre</label>
      <input type="password" className={`mb-4 ${inputCls}`} value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {errors.password && <p className="mb-2 text-xs text-rose-500">{errors.password}</p>}
      {submitError ? <p className="mb-3 text-sm text-rose-500">{submitError}</p> : null}
      <Button type="submit" disabled={busy} className="w-full justify-center">
        {busy ? "Lütfen bekleyin…" : mode === "login" ? "Giriş Yap" : "7 Gün Ücretsiz Başla"}
      </Button>
    </form>
  );
}

export function LoginPage() {
  return (
    <div className="page-mesh min-h-[85vh] pt-28 pb-20">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-center text-3xl font-extrabold text-slate-900">Giriş Yap</h1>
        <p className="mt-2 text-center text-slate-500">Girişiniz yönetimde müşteri kaydı olarak görünür</p>
        <div className="mt-10"><AuthForm mode="login" /></div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  return (
    <div className="page-mesh min-h-[85vh] pt-28 pb-20">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-center text-3xl font-extrabold text-slate-900">Üye Ol</h1>
        <p className="mt-2 text-center text-slate-500">7 gün ücretsiz, kredi kartı gerekmez</p>
        <div className="mt-10"><AuthForm mode="register" /></div>
      </div>
    </div>
  );
}

export function DemoPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Demo Talep Edin</h1>
        <p className="mt-3 text-slate-500">Size özel bir demo sunalım — talebiniz yönetim panelinde kaydedilir</p>
      </section>
      <section className="pb-20">
        <div className="mx-auto max-w-2xl px-4">
          <ScrollReveal>
            <div className="cta-band p-2">
              <DemoForm />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

export function ContactPage() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSubmitError("");
    try {
      await platformPost("leads/demo", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        company: form.name.trim(),
        source: "bachmain_contact",
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Mesaj gönderilemedi.");
    } finally {
      setBusy(false);
    }
  };
  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none";

  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">İletişim</h1>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bize Ulaşın</h2>
            <ul className="mt-6 space-y-4 text-slate-500">
              <li>info@bachmain.com.tr</li>
              <li>0212 963 00 20</li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
          {done ? (
            <div className="saas-card p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-blue-600" />
              <p className="mt-4 font-bold text-slate-900">Mesajınız iletildi!</p>
            </div>
          ) : (
            <form onSubmit={submit} className="saas-card space-y-4 p-8">
              <div>
                <label className="text-sm font-semibold text-slate-700">Ad Soyad</label>
                <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">E-posta</label>
                <input type="email" required className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Telefon</label>
                <input required className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Mesaj</label>
                <textarea rows={4} className={inputCls} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
              <Button type="submit" disabled={busy} className="w-full justify-center">{busy ? "Gönderiliyor…" : "Gönder"}</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
