import { useState } from "react";
import { CheckCircle } from "lucide-react";
import Button from "../components/Button";
import DemoForm from "../components/DemoForm";
import ScrollReveal from "../components/ScrollReveal";

function AuthForm({ mode }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!form.email?.trim()) e2.email = "E-posta gerekli";
    if (!form.password?.trim()) e2.password = "Şifre gerekli";
    if (mode === "register" && !form.name?.trim()) e2.name = "Ad soyad gerekli";
    setErrors(e2);
    if (Object.keys(e2).length === 0) setDone(true);
  };

  if (done) {
    return (
      <div className="saas-card p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">{mode === "login" ? "Giriş başarılı!" : "Kayıt tamamlandı!"}</h3>
        <p className="mt-2 text-slate-500">14 gün ücretsiz denemeniz başladı.</p>
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
      <Button type="submit" className="w-full justify-center">
        {mode === "login" ? "Giriş Yap" : "14 Gün Ücretsiz Başla"}
      </Button>
    </form>
  );
}

export function LoginPage() {
  return (
    <div className="page-mesh min-h-[85vh] pt-28 pb-20">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-center text-3xl font-extrabold text-slate-900">Giriş Yap</h1>
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
        <p className="mt-2 text-center text-slate-500">14 gün ücretsiz, kredi kartı gerekmez</p>
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
        <p className="mt-3 text-slate-500">Size özel bir demo sunalım</p>
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
  const submit = (e) => { e.preventDefault(); setDone(true); };
  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none";

  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">İletişim</h1>
      </section>
      <section className="section-pad bg-white">
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
              {["Ad Soyad", "E-posta", "Telefon", "Mesaj"].map((label, i) => (
                <div key={label}>
                  <label className="text-sm font-semibold text-slate-700">{label}</label>
                  {i === 3 ? <textarea rows={4} required className={inputCls} /> : <input required className={inputCls} />}
                </div>
              ))}
              <Button type="submit" className="w-full justify-center">Gönder</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
