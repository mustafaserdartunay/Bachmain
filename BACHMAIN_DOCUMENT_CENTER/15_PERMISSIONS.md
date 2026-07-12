# 15 — Permissions

## Roller (öneri)
| Rol | Şablon | Yazdır | Marketplace | AI | Admin purge |
|-----|--------|--------|-------------|-----|-------------|
| viewer | okuma | kendi belgeleri | görüntüle | yok | yok |
| editor | CRUD kendi | evet | içe aktar | evet | yok |
| manager | tüm tenant | evet | evet | evet | soft restore |
| owner | tüm | evet | evet | evet | hard purge |

## Kurallar
- Arşiv / silinenler: editor+ görebilir ve geri yükleyebilir.
- Hard purge: sadece owner + yönetim paneli.
- Başka tenant verisi asla listelenmez.

## UI
Butonlar yetkiye göre gizlenir; API 403 döner.
