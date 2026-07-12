# BACHMAIN Document Center — Master Prompt

## Ürün vizyonu
BACHMAIN Document Center, ERP/CRM içindeki **teklif, sipariş, üretim, irsaliye, etiket, barkod, QR ve PDF** çıktılarını tek merkezden tasarlayan, basan ve dağıtan modüldür. Her kayıt **kiracı (tenant / üye hesabı)** bazında saklanır; örnek/demo şablon zorunlu değildir — kullanıcı kendi şablonunu oluşturur veya marketplace’ten alır.

## Bağlam (mevcut sistem)
- Uygulama: `uygulama.bachmain.com` (`src/`)
- Mevcut belge UI: `src/components/DocumentEditor/*`
- Belge tipleri: teklif (`erlenbox-quotes`), sipariş (`erlenbox-orders`), üretim (`erlenbox-production`)
- Workspace senkronu: `src/utils/workspaceStorage.js` → `tenant_data.workspace`
- Silinenler / arşiv: soft-delete + activity archive

## Temel ilkeler
1. **Kaydet her zaman çalışır** — localStorage + tenant DB flush.
2. **Silinenler geri alınabilir** — hard delete yok (yönetici purge hariç).
3. **Arşiv kullanıcıya görünür** — geri yükleme UI’da.
4. **Yetki / tenant izolasyonu** — bir üye başka üyenin şablonunu göremez.
5. **Değişken motoru** — `{{musteri.unvan}}`, `{{belge.no}}` vb. runtime resolve.
6. **Yazdırma / PDF** tarayıcı + sunucu (PDF engine) uyumlu.

## Modül haritası
| # | Dosya | Konu |
|---|--------|------|
| 02 | UI/UX | Ekranlar, navigasyon, tasarım dili |
| 03 | Print Engine | Yazdırma kuyruğu, sürücü, önizleme |
| 04 | Template Designer | Sayfa şablonları (A4, continuous) |
| 05 | Barcode Designer | 1D barkod |
| 06 | Label Designer | Etiket boyutları |
| 07 | QR Designer | QR içerik ve stil |
| 08 | PDF Engine | PDF üretimi ve saklama |
| 09 | Variable Engine | Alanlar ve binding |
| 10 | Workflow Engine | Onay / baskı aşamaları |
| 11 | Marketplace | Şablon mağazası |
| 12 | AI Designer | AI ile şablon önerisi |
| 13 | Database | Şema |
| 14 | API | Endpoint’ler |
| 15 | Permissions | Roller |
| 16 | Tests | Test planı |
| 17 | Roadmap | Fazlar |

## Agent uygulama kuralı
Bu klasördeki dosyalar **kaynak doğruluk** kabul edilir. Uygulama kodu yazarken:
- Mevcut DocumentEditor’ı bozmadan genişlet.
- Yeni storage anahtarları `erlenbox-doc-*` veya `bach-doc-*` olsun ve workspace sync’e eklensin.
- Her “Kaydet” sonrası `flushWorkspaceNow()` çağrılsın (veya auto-sync’e güvenilsin).
- Push + production deploy kullanıcı kuralına göre yapılsın.

## Başarı kriteri (MVP)
- Kullanıcı A4 teklif şablonu tasarlar, değişken bağlar, PDF indirir, yazdırır.
- Barkod/QR etiket 50×30 mm önizleme + yazdırma.
- Şablonlar tenant DB’de; silinen şablon Silinenler’den geri gelir.
