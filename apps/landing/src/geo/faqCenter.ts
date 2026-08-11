import type { GeoFaq } from './types'

export type FaqCenterItem = GeoFaq & { category: string }

export const FAQ_CENTER: FaqCenterItem[] = [
  {
    q: 'CRM nedir?',
    a: 'CRM müşteri ilişkilerini yönetme sistemidir; aday, fırsat, görev ve iletişim geçmişini tek yerde tutar.',
    category: 'CRM',
  },
  {
    q: 'ERP nedir?',
    a: 'ERP kurumsal kaynak planlamadır; sipariş, stok, üretim ve finansı ortak omurgada birleştirir.',
    category: 'ERP',
  },
  {
    q: 'CRM ile ERP arasındaki fark nedir?',
    a: 'CRM müşteri ve satış ilişkisine, ERP operasyon ve kaynak planına odaklanır. BachMain’de ikisi aynı platformda çalışır.',
    category: 'Genel',
  },
  {
    q: 'Bulut ERP nedir?',
    a: 'Bulut ERP, kurulum sunucusu olmadan tarayıcı/mobil ile erişilen kurumsal kaynak planlama yazılımıdır.',
    category: 'ERP',
  },
  {
    q: 'Üretim takip sistemi nasıl çalışır?',
    a: 'İş emri aşamaları, süreler ve kalite noktaları canlı izlenir; fotoğraflı süreçle şeffaflık artar.',
    category: 'Üretim Takibi',
  },
  {
    q: 'Depo yönetimi neden önemlidir?',
    a: 'Doğru lokasyon, transfer ve rezervasyon olmadan sipariş karşılama ve üretim planı bozulur.',
    category: 'Depo',
  },
  {
    q: 'Stok takibi neden kritiktir?',
    a: 'Stok; satış sözü, üretim ve nakit bağını korur. Yanlış stok hem kayıp satış hem fazla stoğa yol açar.',
    category: 'Stok',
  },
  {
    q: 'E-Fatura zorunlu mudur?',
    a: 'GİB kurallarına ve ciro/iş modeline göre yükümlülük değişir. Güncel mevzuatı kontrol etmek gerekir.',
    category: 'E-Fatura',
  },
  {
    q: 'WhatsApp CRM nasıl çalışır?',
    a: 'İş yazışmaları müşteri kartına bağlanır; ekip ortak geçmişi görür, kayıp mesaj riski azalır.',
    category: 'WhatsApp',
  },
  {
    q: 'Yapay zeka işletmelere nasıl yardımcı olur?',
    a: 'Özet, taslak, sınıflandırma ve asistan görevlerinde hız kazandırır; karar veriyi insanın doğrulaması gerekir.',
    category: 'Yapay Zeka',
  },
  {
    q: 'Cari hesap takibi nedir?',
    a: 'Müşteri/tedarikçi bakiyeleri, ekstre ve yaşlandırmanın izlenmesidir.',
    category: 'Cari',
  },
  {
    q: 'Ön muhasebe nedir?',
    a: 'Fatura, tahsilat ve temel mali kayıtların operasyonel takibidir.',
    category: 'Muhasebe',
  },
  {
    q: 'MRP nedir?',
    a: 'Malzeme ihtiyaç planlamasıdır; üretim için gereken malzemeyi zamanında hesaplar.',
    category: 'Üretim',
  },
  {
    q: 'SKU nedir?',
    a: 'Stok tutma birimidir; her ürün/varyantın benzersiz kodudur.',
    category: 'Stok',
  },
  {
    q: 'Pipeline nedir?',
    a: 'Satış fırsatlarının aşamalı hunisidir.',
    category: 'CRM',
  },
  {
    q: 'Lead nedir?',
    a: 'Henüz fırsata dönüşmemiş potansiyel müşteri kaydıdır.',
    category: 'CRM',
  },
  {
    q: 'Webhook nedir?',
    a: 'Bir olay olduğunda başka sisteme otomatik HTTP bildirimi gönderen mekanizmadır.',
    category: 'Genel',
  },
  {
    q: 'API nedir?',
    a: 'Sistemlerin birbirleriyle konuşmasını sağlayan programatik arayüzdür.',
    category: 'Genel',
  },
  {
    q: 'BachMain deneme süresi var mı?',
    a: 'Evet, ücretsiz deneme ile platformu kredi kartı zorunluluğu olmadan deneyebilirsiniz.',
    category: 'Genel',
  },
  {
    q: 'BachMain hangi sektörlere uygundur?',
    a: 'Üretim, toptan ticaret, saha satış, bayi ağı ve hizmet odaklı KOBİ’lere uygundur.',
    category: 'Genel',
  },
  {
    q: 'CRM modülüne nasıl başlanır?',
    a: 'CRM için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'CRM',
  },
  {
    q: 'CRM mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'CRM',
  },
  {
    q: 'CRM raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili CRM kayıtlarında izlenir.',
    category: 'CRM',
  },
  {
    q: 'CRM için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları CRM için ek bağlam sağlar.',
    category: 'CRM',
  },
  {
    q: 'CRM diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'CRM',
  },
  {
    q: 'ERP modülüne nasıl başlanır?',
    a: 'ERP için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'ERP',
  },
  {
    q: 'ERP mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'ERP',
  },
  {
    q: 'ERP raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili ERP kayıtlarında izlenir.',
    category: 'ERP',
  },
  {
    q: 'ERP için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları ERP için ek bağlam sağlar.',
    category: 'ERP',
  },
  {
    q: 'ERP diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'ERP',
  },
  {
    q: 'Muhasebe modülüne nasıl başlanır?',
    a: 'Muhasebe için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Muhasebe',
  },
  {
    q: 'Muhasebe mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Muhasebe',
  },
  {
    q: 'Muhasebe raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Muhasebe kayıtlarında izlenir.',
    category: 'Muhasebe',
  },
  {
    q: 'Muhasebe için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Muhasebe için ek bağlam sağlar.',
    category: 'Muhasebe',
  },
  {
    q: 'Muhasebe diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Muhasebe',
  },
  {
    q: 'E-Fatura modülüne nasıl başlanır?',
    a: 'E-Fatura için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'E-Fatura',
  },
  {
    q: 'E-Fatura mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'E-Fatura',
  },
  {
    q: 'E-Fatura raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili E-Fatura kayıtlarında izlenir.',
    category: 'E-Fatura',
  },
  {
    q: 'E-Fatura için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları E-Fatura için ek bağlam sağlar.',
    category: 'E-Fatura',
  },
  {
    q: 'E-Fatura diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'E-Fatura',
  },
  {
    q: 'Teklif modülüne nasıl başlanır?',
    a: 'Teklif için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Teklif',
  },
  {
    q: 'Teklif mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Teklif',
  },
  {
    q: 'Teklif raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Teklif kayıtlarında izlenir.',
    category: 'Teklif',
  },
  {
    q: 'Teklif için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Teklif için ek bağlam sağlar.',
    category: 'Teklif',
  },
  {
    q: 'Teklif diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Teklif',
  },
  {
    q: 'Sipariş modülüne nasıl başlanır?',
    a: 'Sipariş için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Sipariş',
  },
  {
    q: 'Sipariş mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Sipariş',
  },
  {
    q: 'Sipariş raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Sipariş kayıtlarında izlenir.',
    category: 'Sipariş',
  },
  {
    q: 'Sipariş için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Sipariş için ek bağlam sağlar.',
    category: 'Sipariş',
  },
  {
    q: 'Sipariş diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Sipariş',
  },
  {
    q: 'Üretim modülüne nasıl başlanır?',
    a: 'Üretim için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Üretim',
  },
  {
    q: 'Üretim mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Üretim',
  },
  {
    q: 'Üretim raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Üretim kayıtlarında izlenir.',
    category: 'Üretim',
  },
  {
    q: 'Üretim için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Üretim için ek bağlam sağlar.',
    category: 'Üretim',
  },
  {
    q: 'Üretim diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Üretim',
  },
  {
    q: 'Üretim Takibi modülüne nasıl başlanır?',
    a: 'Üretim Takibi için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Üretim Takibi',
  },
  {
    q: 'Üretim Takibi mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Üretim Takibi',
  },
  {
    q: 'Üretim Takibi raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Üretim Takibi kayıtlarında izlenir.',
    category: 'Üretim Takibi',
  },
  {
    q: 'Üretim Takibi için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Üretim Takibi için ek bağlam sağlar.',
    category: 'Üretim Takibi',
  },
  {
    q: 'Üretim Takibi diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Üretim Takibi',
  },
  {
    q: 'Depo modülüne nasıl başlanır?',
    a: 'Depo için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Depo',
  },
  {
    q: 'Depo mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Depo',
  },
  {
    q: 'Depo raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Depo kayıtlarında izlenir.',
    category: 'Depo',
  },
  {
    q: 'Depo için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Depo için ek bağlam sağlar.',
    category: 'Depo',
  },
  {
    q: 'Depo diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Depo',
  },
  {
    q: 'Stok modülüne nasıl başlanır?',
    a: 'Stok için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Stok',
  },
  {
    q: 'Stok mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Stok',
  },
  {
    q: 'Stok raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Stok kayıtlarında izlenir.',
    category: 'Stok',
  },
  {
    q: 'Stok için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Stok için ek bağlam sağlar.',
    category: 'Stok',
  },
  {
    q: 'Stok diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Stok',
  },
  {
    q: 'Cari modülüne nasıl başlanır?',
    a: 'Cari için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Cari',
  },
  {
    q: 'Cari mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Cari',
  },
  {
    q: 'Cari raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Cari kayıtlarında izlenir.',
    category: 'Cari',
  },
  {
    q: 'Cari için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Cari için ek bağlam sağlar.',
    category: 'Cari',
  },
  {
    q: 'Cari diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Cari',
  },
  {
    q: 'Finans modülüne nasıl başlanır?',
    a: 'Finans için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Finans',
  },
  {
    q: 'Finans mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Finans',
  },
  {
    q: 'Finans raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Finans kayıtlarında izlenir.',
    category: 'Finans',
  },
  {
    q: 'Finans için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Finans için ek bağlam sağlar.',
    category: 'Finans',
  },
  {
    q: 'Finans diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Finans',
  },
  {
    q: 'Lojistik modülüne nasıl başlanır?',
    a: 'Lojistik için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Lojistik',
  },
  {
    q: 'Lojistik mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Lojistik',
  },
  {
    q: 'Lojistik raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Lojistik kayıtlarında izlenir.',
    category: 'Lojistik',
  },
  {
    q: 'Lojistik için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Lojistik için ek bağlam sağlar.',
    category: 'Lojistik',
  },
  {
    q: 'Lojistik diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Lojistik',
  },
  {
    q: 'İK modülüne nasıl başlanır?',
    a: 'İK için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'İK',
  },
  {
    q: 'İK mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'İK',
  },
  {
    q: 'İK raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili İK kayıtlarında izlenir.',
    category: 'İK',
  },
  {
    q: 'İK için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları İK için ek bağlam sağlar.',
    category: 'İK',
  },
  {
    q: 'İK diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'İK',
  },
  {
    q: 'WhatsApp modülüne nasıl başlanır?',
    a: 'WhatsApp için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'WhatsApp',
  },
  {
    q: 'WhatsApp mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'WhatsApp',
  },
  {
    q: 'WhatsApp raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili WhatsApp kayıtlarında izlenir.',
    category: 'WhatsApp',
  },
  {
    q: 'WhatsApp için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları WhatsApp için ek bağlam sağlar.',
    category: 'WhatsApp',
  },
  {
    q: 'WhatsApp diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'WhatsApp',
  },
  {
    q: 'Instagram modülüne nasıl başlanır?',
    a: 'Instagram için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Instagram',
  },
  {
    q: 'Instagram mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Instagram',
  },
  {
    q: 'Instagram raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Instagram kayıtlarında izlenir.',
    category: 'Instagram',
  },
  {
    q: 'Instagram için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Instagram için ek bağlam sağlar.',
    category: 'Instagram',
  },
  {
    q: 'Instagram diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Instagram',
  },
  {
    q: 'Yapay Zeka modülüne nasıl başlanır?',
    a: 'Yapay Zeka için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Yapay Zeka',
  },
  {
    q: 'Yapay Zeka mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Yapay Zeka',
  },
  {
    q: 'Yapay Zeka raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Yapay Zeka kayıtlarında izlenir.',
    category: 'Yapay Zeka',
  },
  {
    q: 'Yapay Zeka için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Yapay Zeka için ek bağlam sağlar.',
    category: 'Yapay Zeka',
  },
  {
    q: 'Yapay Zeka diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Yapay Zeka',
  },
  {
    q: 'Raporlama modülüne nasıl başlanır?',
    a: 'Raporlama için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Raporlama',
  },
  {
    q: 'Raporlama mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Raporlama',
  },
  {
    q: 'Raporlama raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Raporlama kayıtlarında izlenir.',
    category: 'Raporlama',
  },
  {
    q: 'Raporlama için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Raporlama için ek bağlam sağlar.',
    category: 'Raporlama',
  },
  {
    q: 'Raporlama diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Raporlama',
  },
  {
    q: 'Dashboard modülüne nasıl başlanır?',
    a: 'Dashboard için önce temel kartları (kullanıcı, yetki, ilgili master data) tanımlayın; ardından günlük 1-2 süreci pilot edin.',
    category: 'Dashboard',
  },
  {
    q: 'Dashboard mobil kullanılabilir mi?',
    a: 'BachMain web tabanlıdır; mobil tarayıcıdan erişim desteklenir. Saha senaryolarında mobil kullanım yaygındır.',
    category: 'Dashboard',
  },
  {
    q: 'Dashboard raporları nerede görülür?',
    a: 'Özet KPI’lar Dashboard ve Raporlama sayfalarında; detaylar ilgili Dashboard kayıtlarında izlenir.',
    category: 'Dashboard',
  },
  {
    q: 'Dashboard için SSS’de başka kaynak var mı?',
    a: 'Evet. /knowledge rehberleri ve /help-center kullanım adımları Dashboard için ek bağlam sağlar.',
    category: 'Dashboard',
  },
  {
    q: 'Dashboard diğer modüllerle entegre mi?',
    a: 'Evet. BachMain’de modüller ayrı adalar değil; ortak veri modelinde çalışır.',
    category: 'Dashboard',
  },
]

export function listFaqCategories(): string[] {
  return [...new Set(FAQ_CENTER.map((f) => f.category))]
}

export function getFaqsByCategory(category?: string): FaqCenterItem[] {
  if (!category || category === 'Tümü') return FAQ_CENTER
  return FAQ_CENTER.filter((f) => f.category === category)
}
