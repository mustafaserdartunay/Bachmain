# 09 — Variable Engine

## Sözdizimi
- Basit: `{{musteri.unvan}}`
- İç içe: `{{belge.toplam.kdvDahil}}`
- Döngü: `{{#each kalemler}} … {{urun.ad}} {{/each}}`
- Koşul: `{{#if odeme.vade}}…{{/if}}`

## Kök bağlamlar (context roots)
| Kök | Kaynak |
|-----|--------|
| `sirket` | `companySettings` |
| `kullanici` | auth / userProfile |
| `musteri` | customerProfiles |
| `belge` | quote / order / production job |
| `kalemler` | belge.items / lineItems |
| `kasa` | treasury hesapları (banka paneli) |
| `portal` | B2B portal URL |

## Resolve API
```js
resolveTemplate(templateJson, context) → { html, errors[] }
```

## Hatalar
- Bilinmeyen alan → `—` + `errors` listesine ekle (UI uyarı).
- Tip uyumsuzluğu (sayı formatı) → `formatTL` / tarih `tr-TR`.

## Güvenlik
- Binding sadece whitelist path; arbitrary JS eval yok.
