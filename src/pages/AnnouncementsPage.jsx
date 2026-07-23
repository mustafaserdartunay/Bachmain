import { Megaphone, Sparkles } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'

const announcements = [
  {
    id: 'ann-1',
    title: 'Müşteri Ekstre PDF Yenilendi',
    date: '05.06.2026',
    badge: 'Yeni',
    badgeClass: 'bg-emerald-500/15 text-emerald-300',
    detail:
      'Cari hareketler sayfasından gönderilen ekstre PDF artık firma logonuz, IBAN bilgileriniz ve modern renk tonlarıyla oluşturuluyor.',
  },
  {
    id: 'ann-2',
    title: 'Tahsilat ve Ödeme Modülü',
    date: '04.06.2026',
    badge: 'Güncelleme',
    badgeClass: 'bg-cyan-500/15 text-cyan-300',
    detail:
      'Müşteri detayında tahsilat ve ödeme işlemleri kasa/banka seçimiyle cari hareketlere işleniyor. İşlem yeri kolonu eklendi.',
  },
  {
    id: 'ann-3',
    title: 'Profil ve Müşteri Numarası',
    date: '03.06.2026',
    badge: 'Duyuru',
    badgeClass: 'bg-blue-500/15 text-blue-300',
    detail:
      'Her firma için benzersiz müşteri numarası otomatik oluşturuluyor. Yönetici kontrol panelinden destek ekibi erişebilir.',
  },
  {
    id: 'ann-4',
    title: 'Düzenlenebilir Açılır Menüler',
    date: '02.06.2026',
    badge: 'Özellik',
    badgeClass: 'bg-purple-500/15 text-purple-300',
    detail:
      'Tip, temsilci, puantaj, kategori ve kasa/banka listelerine yeni seçenek ekleyebilir, düzenleyebilir ve silebilirsiniz.',
  },
]

export default function AnnouncementsPage() {
  return (
    <AppPageShell>
      <AppPageHeader
        title="Yeni Özellikler ve Duyurular"
        subtitle="Sistem güncellemeleri ve yeni modüller burada listelenir."
        backTo="/"
        backLabel="Güncel Durum"
      />

      <div className="space-y-3">
        {announcements.map((item) => (
          <article key={item.id} className="card">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-amber-300">
                {item.badge === 'Yeni' ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <Megaphone className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-[var(--ink)]">{item.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">{item.date}</span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                  {item.detail}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppPageShell>
  )
}
