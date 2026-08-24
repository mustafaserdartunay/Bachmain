# WORKSPACE BACHMAIN

Üç aktif web sistemi + paylaşılan platform katmanı. Cursor / VS Code çok köklü workspace (**iOS/Android workspace dışı** — henüz başlanmadı).

## Workspace kökleri (3)

| #   | Alan                      | Klasör         | Yerel geliştirme        |
| --- | ------------------------- | -------------- | ----------------------- |
| 1   | **uygulama.bachmain.com** | Monorepo kökü  | `npm run dev` → `:5173` |
| 2   | **yonetim.bachmain.com**  | `apps/admin`   | `npm run dev:all`       |
| 3   | **bachmain.com**          | `apps/landing` | `npm run dev` → `:5180` |

## Ertelenmiş (workspace’te yok)

| Alan                | Not                                     |
| ------------------- | --------------------------------------- |
| iosapp.bachmain     | Xcode — `npm run ios:open` (preview)    |
| androidapp.bachmain | Android Studio — `npm run android:open` |

## Sistem isimleri (Cursor Simple Browser — yerel `?ide=1`)

| Kanonik isim            | Komut                       |
| ----------------------- | --------------------------- |
| **UYGULAMA - BACHMAIN** | `npm run uygulama:open`     |
| **YÖNETİM - BACHMAIN**  | `npm run yonetim:open`      |
| **WEB - BACHMAIN**      | `npm run web:open`          |
| Hepsi (3 sunucu)        | `npm run bachmain:open-all` |

`open-all` yalnızca UYGULAMA + YÖNETİM + WEB sunucularını başlatır; Simple Browser tek sekme UYGULAMA açar (8GB RAM).

Kaynak: `workspace/system-labels.json`, `workspace/manifest.json`

## Açma

```bash
cursor "workspace/WORKSPACE BACHMAIN.code-workspace"
```

Agent / düşük RAM: `workspace/BACHMAIN-SINGLE.code-workspace` veya `File → Open Folder → Bachmain`

## Doğrulama

```bash
./workspace/scripts/verify-workspace.sh
```

Push / deploy: `scripts/deploy-all.sh`
