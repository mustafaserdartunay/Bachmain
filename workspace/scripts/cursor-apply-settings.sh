#!/bin/bash
# Bachmain — önerilen Cursor kullanıcı ayarlarını yedekleyip uygular (macOS)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$HOME/Library/Application Support/Cursor/User/settings.json"
SRC="$ROOT/workspace/cursor-recommended-user-settings.json"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [[ ! -f "$SRC" ]]; then
  echo "Kaynak bulunamadı: $SRC" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
if [[ -f "$DEST" ]]; then
  cp "$DEST" "$DEST.bachmain-backup-$STAMP"
  echo "Yedek: $DEST.bachmain-backup-$STAMP"
fi

python3 - <<PY
import json
from pathlib import Path

dest = Path("$DEST")
src = Path("$SRC")
base = {}
if dest.exists():
    base = json.loads(dest.read_text())
merged = {**base, **json.loads(src.read_text())}
dest.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n")
print(f"Uygulandı: {dest}")
PY

echo "Cursor'u tamamen kapatıp yeniden açın veya Reload Window yapın."
