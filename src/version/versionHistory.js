import { APP_VERSION, APP_VERSION_META } from './appVersion'

/**
 * Resmi yayın geçmişi. Her yeni deploy’da buraya giriş eklenir.
 * modules: bir önceki sürüme göre eklenen / değişen modüller.
 */
export const VERSION_HISTORY = [
  {
    version: APP_VERSION,
    previousVersion: null,
    releasedAt: APP_VERSION_META.releasedAt,
    title: 'İlk sürüm etiketi',
    modules: [
      {
        name: 'Sürüm paneli',
        detail:
          'Sol menü altında BM sürüm numarası; tıklanınca sürüm geçmişi ve cihaz geçiş kayıtları.',
      },
      {
        name: 'Otomatik uygulama yenileme',
        detail:
          'Yeni deploy sonrası üyelerin uygulaması arka planda yenilenir; yerel CRM verileri korunur.',
      },
      {
        name: 'Yönetim — üye silme',
        detail: 'Üye iç sayfasından Evet/Hayır onay diyaloğu ile hesap silme.',
      },
      {
        name: 'Yönetim — e-posta değiştirme',
        detail:
          'Eski adrese link, yeni mail girişi, otomatik onay, yönetim bildirimi ve süreç takibi.',
      },
      {
        name: 'Çıkış mailleri',
        detail: 'BACHMAIN logo ekleri ve güncel mail şablonları.',
      },
    ],
  },
]

export function getVersionHistory() {
  return VERSION_HISTORY
}
