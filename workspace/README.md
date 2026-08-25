# WORKSPACE BACHMAIN — 8GB RAM (tek sistem seç)

Cursor’da **aynı anda yalnızca bir** workspace açın. Üç köklü dosya (`WORKSPACE BACHMAIN.3-KOK-KULLANMA`) RAM’i 3 kat tüketir.

## Belgeler’de (önerilen)

`~/Documents/Bachmain/` içinde üç ayrı dosya:

| Dosya                                  | Ne açar                | Yerel   |
| -------------------------------------- | ---------------------- | ------- |
| **UYGULAMA - BACHMAIN.code-workspace** | CRM (`src/`)           | `:5173` |
| **YÖNETİM - BACHMAIN.code-workspace**  | Admin panel            | `:5200` |
| **WEB - BACHMAIN.code-workspace**      | Landing / bachmain.com | `:5180` |

Kurulum / güncelleme:

```bash
npm run cursor:workspaces
```

Cursor: **File → Open Workspace from File…** → istediğiniz dosya.

## Repo içi (geliştirici)

| Dosya                                          | Kök            |
| ---------------------------------------------- | -------------- |
| `workspace/UYGULAMA - BACHMAIN.code-workspace` | monorepo kökü  |
| `workspace/YÖNETİM - BACHMAIN.code-workspace`  | `apps/admin`   |
| `workspace/WEB - BACHMAIN.code-workspace`      | `apps/landing` |

## Açma komutları (workspace içinden Task)

| Sistem   | Komut                   |
| -------- | ----------------------- |
| UYGULAMA | `npm run uygulama:open` |
| YÖNETİM  | `npm run yonetim:open`  |
| WEB      | `npm run web:open`      |

`npm run bachmain:open-all` üç sunucuyu birden başlatır — **8GB Mac’te kullanmayın.**

## RAM ayarları

- `.vscode/settings.json` — proje geneli
- `workspace/cursor-recommended-user-settings.json` — global Cursor (`npm run cursor:apply-settings`)
- `npm run cursor:clean` — `.next` / `out` temizliği

## Kullanmayın

- `workspace/WORKSPACE BACHMAIN.3-KOK-KULLANMA.code-workspace` — eski 3 kök (OOM)

Kaynak: `workspace/system-labels.json`
