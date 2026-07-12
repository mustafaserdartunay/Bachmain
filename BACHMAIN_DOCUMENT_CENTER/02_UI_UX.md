# 02 — UI / UX

## Navigasyon
Sol menüye **Belge Merkezi** ekle:
- `/belge-merkezi` — Dashboard (son şablonlar, hızlı yazdır)
- `/belge-merkezi/sablonlar` — Şablon listesi
- `/belge-merkezi/tasarimci` — Template designer canvas
- `/belge-merkezi/etiket` — Label designer
- `/belge-merkezi/barkod` — Barcode designer
- `/belge-merkezi/qr` — QR designer
- `/belge-merkezi/yazdir` — Print queue / önizleme
- `/belge-merkezi/marketplace` — Şablon mağazası
- `/belge-merkezi/ayarlar` — Varsayılan kağıt, yazıcı, birimler

## Görsel dil
- Mevcut dark CRM shell (`AppPageShell`, `card`, `btn-success`, `btn-gold` markası).
- Designer canvas: açık grid zemin, snap-to-grid 1 mm / 0.5 mm.
- Sol: araçlar (metin, tablo, görsel, çizgi, barkod, QR, değişken).
- Sağ: özellikler (font, hizalama, kenar boşluğu, binding).
- Üst: Kaydet / Önizle / PDF / Yazdır / Geri al–İleri al.

## Liste ekranı
- Kart veya tablo: ad, tip (teklif/sipariş/etiket), boyut, güncelleme, durum.
- Filtre: tip, arşiv, silinenler paneli (mevcut `DeletedRecordsPanel` deseni).
- Boş durum: “Henüz şablon yok — Yeni şablon oluştur” (demo şablon dayatma).

## Erişilebilirlik / mobil
- Designer desktop öncelikli (min 1280px).
- Mobilde sadece liste + PDF indir + yazdırma kuyruğu.

## Tutarlılık
- Form satırları: `FORM_FIELD_ROW_CLASS` gibi mevcut form dili.
- Kaydet butonu her ekranda aynı yeşil `BTN_SUCCESS`.
