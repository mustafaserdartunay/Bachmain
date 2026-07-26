import type { FaqItem } from './types'

/** Module-specific FAQs for Rich Results + AI Search (unique per page). */
export const MODULE_FAQS: Record<string, FaqItem[]> = {
  '/crm': [
    {
      q: 'CRM nedir?',
      a: 'CRM (Customer Relationship Management), müşteri ilişkileri yönetimidir. BACHMAIN CRM; müşteri kartları, fırsatlar, görevler, randevular ve WhatsApp yazışmalarını tek panelde toplar.',
    },
    {
      q: 'BACHMAIN CRM hangi süreçlerle entegredir?',
      a: 'Teklif, sipariş, saha satış ve mesaj merkezi ile aynı veri modelinde çalışır. Tüm Süreçler Tek Platformda yaklaşımıyla satış hunisinden üretime köprü kurar.',
    },
    {
      q: 'WhatsApp CRM olarak kullanılabilir mi?',
      a: 'Evet. WhatsApp ve sosyal kanallar müşteri kartına bağlanır; konuşmalar kayıp olmaz, ekip ortak görünür.',
    },
  ],
  '/erp': [
    {
      q: 'ERP nedir?',
      a: 'ERP (Enterprise Resource Planning), kurumsal kaynak planlamadır. BACHMAIN ERP; teklif, sipariş, stok, üretim ve finans süreçlerini tek omurgada birleştirir.',
    },
    {
      q: 'CRM ile ERP aynı platformda mı?',
      a: 'Evet. BACHMAIN’de CRM ve ERP ayrı ürünler değil; müşteri, sipariş ve operasyon aynı kayıt zincirini kullanır.',
    },
    {
      q: 'B2B ve bayi yönetimi ERP’ye dahil mi?',
      a: 'Bayi siparişi, fiyat listesi ve portal görünürlüğü ERP/satış akışına bağlanabilir; dağıtım kanalı merkeze entegre edilir.',
    },
  ],
  '/muhasebe': [
    {
      q: 'Ön muhasebe nedir?',
      a: 'Ön muhasebe; cari, fatura, tahsilat ve temel mali kayıtların operasyonel takibidir. BACHMAIN muhasebe, e-fatura ve finans ile aynı panelde çalışır.',
    },
    {
      q: 'Cari hesap takibi nasıl yapılır?',
      a: 'Müşteri ve tedarikçi bakiyeleri, ekstre ve yaşlandırma cari modülünde izlenir; fatura ve tahsilat hareketleri otomatik yansır.',
    },
    {
      q: 'Muhasebe e-fatura ile entegre mi?',
      a: 'Evet. e-Fatura/e-Arşiv belgeleri cari ve mali kayıtlarla ilişkilendirilerek süreç kopukluğu azaltılır.',
    },
  ],
  '/e-fatura': [
    {
      q: 'E-Fatura nedir?',
      a: 'E-Fatura, GİB standartlarına uygun elektronik fatura belgesidir. BACHMAIN e-fatura sistemi; e-Fatura ve e-Arşiv süreçlerini satış ve muhasebe kayıtlarıyla birlikte yönetmeyi hedefler.',
    },
    {
      q: 'E-belge siparişten sonra nasıl oluşur?',
      a: 'Onaylı sipariş ve cari bilgileri belge akışına bağlanır; operasyon ile mali belge aynı zincirde ilerler.',
    },
    {
      q: 'E-Arşiv destekleniyor mu?',
      a: 'E-Fatura ve e-Arşiv süreçleri paket kapsamına göre yönetilir; durum ve arşiv izlenebilirliği panel üzerinden takip edilir.',
    },
  ],
}

export function getModuleFaqs(path: string): FaqItem[] {
  return MODULE_FAQS[path] || []
}
