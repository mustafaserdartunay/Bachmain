import { useState } from "react";
import { CheckCircle } from "lucide-react";
import Button from "./Button";
import { platformPost } from "../utils/platformApi";

const inputCls =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20";

export default function DemoForm() {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", size: "", message: "" });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Ad soyad gerekli";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Geçerli e-posta girin";
    if (!form.phone.trim()) e.phone = "Telefon gerekli";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setSubmitError("");
    try {
      await platformPost("leads/demo", {
        name: form.name.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        size: form.size,
        message: form.message.trim(),
        source: "bachmain_demo",
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-300" />
        <h3 className="mt-4 text-xl font-bold text-white">Talebiniz alındı!</h3>
        <p className="mt-2 text-white/70">Ekibimiz 24 saat içinde sizinle iletişime geçecek.</p>
      </div>
    );
  }

  const fields = [
    { key: "name", label: "Ad Soyad", type: "text", half: true },
    { key: "company", label: "Şirket Adı", type: "text", half: true },
    { key: "phone", label: "Telefon", type: "tel", half: true },
    { key: "email", label: "E-posta", type: "email", half: true },
    { key: "size", label: "Çalışan Sayısı", type: "select", half: true, options: ["1-10", "11-50", "51-200", "200+"] },
    { key: "message", label: "Mesaj", type: "textarea", half: false },
  ];

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type, half, options }) => (
          <div key={key} className={half ? "" : "sm:col-span-2"}>
            <label className="mb-1 block text-sm font-semibold text-white/85">{label}</label>
            {type === "textarea" ? (
              <textarea rows={3} className={inputCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ) : type === "select" ? (
              <select className={inputCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                <option value="" className="bg-slate-900">Seçin</option>
                {options.map((o) => (
                  <option key={o} value={o} className="bg-slate-900">{o}</option>
                ))}
              </select>
            ) : (
              <input type={type} className={inputCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            )}
            {errors[key] && <p className="mt-1 text-xs text-rose-200">{errors[key]}</p>}
          </div>
        ))}
      </div>
      {submitError ? <p className="mt-4 text-sm text-rose-200">{submitError}</p> : null}
      <Button type="submit" variant="secondary" disabled={busy} className="mt-6 w-full justify-center sm:w-auto">
        {busy ? "Gönderiliyor…" : "Demo Talep Et →"}
      </Button>
    </form>
  );
}
