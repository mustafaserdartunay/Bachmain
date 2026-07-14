/**
 * Document Center — variable catalog for designers & templates.
 * Paths align with buildDocumentContext / resolveTemplateString where possible.
 */

export const DOC_VARIABLE_GROUPS = [
  {
    id: 'company',
    label: 'Şirket',
    variables: [
      { path: 'sirket.unvan', label: 'Ünvan', sample: 'BachMain A.Ş.' },
      { path: 'sirket.adres', label: 'Adres', sample: 'İstanbul, Türkiye' },
      { path: 'sirket.telefon', label: 'Telefon', sample: '0212 000 00 00' },
      { path: 'sirket.email', label: 'E-posta', sample: 'info@bachmain.com' },
      { path: 'sirket.vergiNo', label: 'Vergi No', sample: '1234567890' },
      { path: 'sirket.vergiDairesi', label: 'Vergi Dairesi', sample: 'Kadıköy' },
      { path: 'sirket.logo', label: 'Logo URL', sample: '' },
      { path: 'sirket.web', label: 'Web', sample: 'https://bachmain.com' },
    ],
  },
  {
    id: 'customer',
    label: 'Müşteri',
    variables: [
      { path: 'musteri.unvan', label: 'Ünvan', sample: 'Örnek Müşteri A.Ş.' },
      { path: 'musteri.adres', label: 'Adres', sample: 'Ankara' },
      { path: 'musteri.telefon', label: 'Telefon', sample: '0532 000 00 00' },
      { path: 'musteri.email', label: 'E-posta', sample: 'musteri@ornek.com' },
      { path: 'musteri.vergiNo', label: 'Vergi No', sample: '9876543210' },
      { path: 'musteri.yetkili', label: 'Yetkili', sample: 'Ali Yılmaz' },
    ],
  },
  {
    id: 'supplier',
    label: 'Tedarikçi',
    variables: [
      { path: 'tedarikci.unvan', label: 'Ünvan', sample: 'Tedarikçi Ltd.' },
      { path: 'tedarikci.adres', label: 'Adres', sample: 'Bursa' },
      { path: 'tedarikci.telefon', label: 'Telefon', sample: '0224 000 00 00' },
      { path: 'tedarikci.email', label: 'E-posta', sample: 'siparis@tedarikci.com' },
      { path: 'tedarikci.vergiNo', label: 'Vergi No', sample: '1122334455' },
    ],
  },
  {
    id: 'quote',
    label: 'Teklif',
    variables: [
      { path: 'teklif.no', label: 'Teklif No', sample: 'TKL-2026-001' },
      { path: 'teklif.tarih', label: 'Tarih', sample: '13.07.2026' },
      { path: 'teklif.gecerlilik', label: 'Geçerlilik', sample: '30 gün' },
      { path: 'teklif.toplam', label: 'Toplam', sample: '12.500,00' },
      { path: 'teklif.paraBirimi', label: 'Para Birimi', sample: 'TRY' },
      { path: 'teklif.not', label: 'Not', sample: 'Fiyatlar KDV hariçtir.' },
    ],
  },
  {
    id: 'order',
    label: 'Sipariş',
    variables: [
      { path: 'siparis.no', label: 'Sipariş No', sample: 'SPR-2026-001' },
      { path: 'siparis.tarih', label: 'Tarih', sample: '13.07.2026' },
      { path: 'siparis.teslimat', label: 'Teslimat Tarihi', sample: '20.07.2026' },
      { path: 'siparis.durum', label: 'Durum', sample: 'Onaylandı' },
      { path: 'siparis.toplam', label: 'Toplam', sample: '18.750,00' },
    ],
  },
  {
    id: 'invoice',
    label: 'Fatura',
    variables: [
      { path: 'fatura.no', label: 'Fatura No', sample: 'FTR-2026-001' },
      { path: 'fatura.tarih', label: 'Tarih', sample: '13.07.2026' },
      { path: 'fatura.vade', label: 'Vade', sample: '13.08.2026' },
      { path: 'fatura.araToplam', label: 'Ara Toplam', sample: '10.000,00' },
      { path: 'fatura.kdv', label: 'KDV', sample: '2.000,00' },
      { path: 'fatura.toplam', label: 'Genel Toplam', sample: '12.000,00' },
    ],
  },
  {
    id: 'warehouse',
    label: 'Depo',
    variables: [
      { path: 'depo.ad', label: 'Depo Adı', sample: 'Merkez Depo' },
      { path: 'depo.kod', label: 'Depo Kodu', sample: 'DPO-01' },
      { path: 'depo.adres', label: 'Adres', sample: 'İkitelli OSB' },
      { path: 'depo.sorumlu', label: 'Sorumlu', sample: 'Mehmet Kaya' },
    ],
  },
  {
    id: 'production',
    label: 'Üretim',
    variables: [
      { path: 'uretim.no', label: 'İş Emri No', sample: 'UEM-2026-001' },
      { path: 'uretim.urun', label: 'Ürün', sample: 'Örnek Ürün' },
      { path: 'uretim.miktar', label: 'Miktar', sample: '100' },
      { path: 'uretim.baslangic', label: 'Başlangıç', sample: '13.07.2026' },
      { path: 'uretim.bitis', label: 'Bitiş', sample: '15.07.2026' },
      { path: 'uretim.durum', label: 'Durum', sample: 'Devam ediyor' },
    ],
  },
  {
    id: 'shipment',
    label: 'Sevkiyat',
    variables: [
      { path: 'sevkiyat.no', label: 'Sevkiyat No', sample: 'SVK-2026-001' },
      { path: 'sevkiyat.tarih', label: 'Tarih', sample: '14.07.2026' },
      { path: 'sevkiyat.kargo', label: 'Kargo Firması', sample: 'Yurtiçi' },
      { path: 'sevkiyat.takipNo', label: 'Takip No', sample: 'YT123456789' },
      { path: 'sevkiyat.adres', label: 'Teslimat Adresi', sample: 'İstanbul' },
    ],
  },
  {
    id: 'employee',
    label: 'Personel',
    variables: [
      { path: 'personel.ad', label: 'Ad Soyad', sample: 'Ayşe Demir' },
      { path: 'personel.unvan', label: 'Ünvan', sample: 'Satış Temsilcisi' },
      { path: 'personel.email', label: 'E-posta', sample: 'ayse@bachmain.com' },
      { path: 'personel.telefon', label: 'Telefon', sample: '0533 000 00 00' },
    ],
  },
  {
    id: 'project',
    label: 'Proje',
    variables: [
      { path: 'proje.ad', label: 'Proje Adı', sample: 'Ofis Yenileme' },
      { path: 'proje.kod', label: 'Proje Kodu', sample: 'PRJ-042' },
      { path: 'proje.musteri', label: 'Müşteri', sample: 'Örnek Müşteri A.Ş.' },
      { path: 'proje.durum', label: 'Durum', sample: 'Aktif' },
    ],
  },
  {
    id: 'product',
    label: 'Ürün',
    variables: [
      { path: 'urun.ad', label: 'Ürün Adı', sample: 'Örnek Ürün' },
      { path: 'urun.sku', label: 'SKU', sample: 'SKU-1001' },
      { path: 'urun.barkod', label: 'Barkod', sample: '8690000000001' },
      { path: 'urun.fiyat', label: 'Fiyat', sample: '1.000,00' },
      { path: 'urun.birim', label: 'Birim', sample: 'Adet' },
    ],
  },
  {
    id: 'aliases',
    label: 'Kısa Değişkenler',
    variables: [
      { path: 'firma_unvani', label: 'Firma Ünvanı', sample: 'BachMain A.Ş.' },
      { path: 'firma_adresi', label: 'Firma Adresi', sample: 'İstanbul' },
      { path: 'telefon', label: 'Telefon', sample: '0212 000 00 00' },
      { path: 'vergi_no', label: 'Vergi No', sample: '1234567890' },
      { path: 'cari_adi', label: 'Cari Adı', sample: 'Örnek Müşteri A.Ş.' },
      { path: 'cari_adresi', label: 'Cari Adresi', sample: 'Ankara' },
      { path: 'teklif_no', label: 'Teklif No', sample: 'TKL-2026-001' },
      { path: 'siparis_no', label: 'Sipariş No', sample: 'SPR-2026-001' },
      { path: 'irsaliye_no', label: 'İrsaliye No', sample: 'IRS-2026-001' },
      { path: 'fatura_no', label: 'Fatura No', sample: 'FTR-2026-001' },
      { path: 'urun_adi', label: 'Ürün Adı', sample: 'Örnek Ürün' },
      { path: 'miktar', label: 'Miktar', sample: '10' },
      { path: 'birim', label: 'Birim', sample: 'Adet' },
      { path: 'birim_fiyat', label: 'Birim Fiyat', sample: '1.000,00' },
      { path: 'kdv', label: 'KDV', sample: '2.000,00' },
      { path: 'indirim', label: 'İndirim', sample: '0,00' },
      { path: 'ara_toplam', label: 'Ara Toplam', sample: '10.000,00' },
      { path: 'genel_toplam', label: 'Genel Toplam', sample: '12.000,00' },
      { path: 'belge.saat', label: 'Belge Saati', sample: '14:30' },
      { path: 'belge.not', label: 'Belge Notu', sample: 'Tesekkür ederiz.' },
      { path: 'teslimat.adres', label: 'Teslimat Adresi', sample: 'İstanbul Depo' },
      { path: 'ozel.alan', label: 'Özel Alan', sample: '—' },
      { path: 'kosul.deger', label: 'Koşullu Değer', sample: 'Görünür' },
      { path: 'kosul.gorunur', label: 'Koşul Bayrağı', sample: 'true' },
    ],
  },
]

/** Flatten all variables across groups: [{ groupId, groupLabel, path, label, sample }, ...] */
export function flattenVariableCatalog(groups = DOC_VARIABLE_GROUPS) {
  return groups.flatMap((group) =>
    (group.variables || []).map((variable) => ({
      groupId: group.id,
      groupLabel: group.label,
      path: variable.path,
      label: variable.label,
      sample: variable.sample,
    })),
  )
}

export function findVariableByPath(path) {
  return flattenVariableCatalog().find((item) => item.path === path) || null
}

export function variableToken(path) {
  return `{{${path}}}`
}

/** Sample context for live preview */
export function buildSamplePreviewContext() {
  const flat = flattenVariableCatalog()
  const ctx = {}
  for (const item of flat) {
    const parts = item.path.split('.')
    if (parts.length === 1) {
      ctx[parts[0]] = item.sample ?? ''
    } else {
      let node = ctx
      for (let i = 0; i < parts.length - 1; i += 1) {
        node[parts[i]] = node[parts[i]] || {}
        node = node[parts[i]]
      }
      node[parts[parts.length - 1]] = item.sample ?? ''
    }
  }
  ctx.page = 1
  ctx.pages = 1
  return ctx
}
