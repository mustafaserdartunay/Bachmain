# Workspace location

**Canonical root (2026-08):**

```text
~/Documents/bachmain/BachMain Tüm Proje
```

(“Belgelerim” → `Documents` → `bachmain` → `BachMain Tüm Proje`)

## Do not use

- `~/Library/Mobile Documents/com~apple~CloudDocs/Bachmain/...` (eski iCloud kopyası)
- `~/Developer/Bach Crm` (eski symlink hedefi)

Cursor / terminal / deploy komutları bu Documents kökünden çalıştırılmalı.

## Deploy

```bash
cd ~/Documents/bachmain/BachMain\ Tüm\ Proje
./scripts/ship.sh
```

Vercel CLI oturumu gerekli: `vercel login` (veya `vercel login --future`).
