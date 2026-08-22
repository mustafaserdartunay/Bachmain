# WORKSPACE BACHMAIN

Beş ana sistem + paylaşılan platform katmanı. Cursor / VS Code çok köklü workspace.

## Sistemler

| #   | Alan                      | Klasör                              | Yerel geliştirme                    |
| --- | ------------------------- | ----------------------------------- | ----------------------------------- |
| 1   | **uygulama.bachmain.com** | Monorepo kökü (`.`)                 | `npm run dev` → `:5173`             |
| 2   | **yonetim.bachmain.com**  | `apps/admin`                        | `npm run dev:all`                   |
| 3   | **bachmain.com**          | `apps/landing`                      | `npm run dev` → `:5180`             |
| 4   | **iosapp.bachmain**       | `~/Documents/Bachmain/bachmain.ios` | Xcode                               |
| 5   | **androidapp.bachmain**   | `apps/android`                      | Android Studio (kurulum aşamasında) |

## Sistem isimleri (Cursor / Simple Browser)

| Kanonik isim            | Komut                       |
| ----------------------- | --------------------------- |
| **UYGULAMA - BACHMAIN** | `npm run uygulama:open`     |
| **YÖNETİM - BACHMAIN**  | `npm run yonetim:open`      |
| **WEB - BACHMAIN**      | `npm run web:open`          |
| **IOS - BACHMAIN**      | `npm run ios:open`          |
| **ANDROID - BACHMAIN**  | `npm run android:open`      |
| Hepsi                   | `npm run bachmain:open-all` |

Kaynak: `workspace/system-labels.json`

## yonetim.bachmain.com (varsayılan yerel)

Production Postgres + üye/ticket detay API ile açılış:

```bash
npm run yonetim:open
```

- Web: `http://127.0.0.1:5200`
- API: `http://127.0.0.1:5201`
- Kayıt: `workspace/yonetim.local.json`

`.env` yoksa script kanonik repodan kopyalar.

```bash
cursor "workspace/WORKSPACE BACHMAIN.code-workspace"
```

**SSD (DevDisk):**

```bash
cursor "/Volumes/DevDisk/WORKSPACE BACHMAIN/WORKSPACE BACHMAIN.code-workspace"
```

## Doğrulama

```bash
./workspace/scripts/verify-workspace.sh
```

Push / deploy: `scripts/deploy-all.sh` — onay sonrası.

## Kanonik yerel repo

Mac’te birincil kopya: `~/Documents/Bachmain/BachMain Tüm Proje`  
Aktif geliştirme (Recovery): `~/Bachmain-Recovery-2026-08-22`  
SSD workspace symlink’leri aktif Recovery kopyasını kullanır; push öncesi kanonik repo ile eşitle.
