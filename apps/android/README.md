# BachMain Android — androidapp.bachmain

Native Android uygulaması (Kotlin / Jetpack Compose). WebView yok; CRM ile aynı tenant API ve workspace senkronu hedeflenir.

## Domain

| Ortam        | URL                                |
| ------------ | ---------------------------------- |
| Production   | `https://androidapp.bachmain.com`  |
| Platform API | `https://yonetim.bachmain.com/api` |
| App API      | `https://uygulama.bachmain.com`    |

## Durum

Proje iskeleti — Gradle modülü ve CI henüz bağlanmadı. iOS (`~/Documents/Bachmain/bachmain.ios`) ile aynı auth ve workspace sözleşmesi kullanılacak.

## Yerel geliştirme (plan)

```bash
# Android Studio ile apps/android açılacak
# ./gradlew assembleDebug
```

## İlgili dokümanlar

- iOS referans: `~/Documents/Bachmain/bachmain.ios/README.md`
- Platform: `docs/PRODUCTION.md`
- Workspace: `workspace/README.md`
