#!/usr/bin/env bash
# WORKSPACE BACHMAIN — path & health checks (no deploy)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MONOREPO="${BACHMAIN_MONOREPO:-/Users/serdartunay/Documents/Bachmain/BachMain Tüm Proje}"
IOS="${BACHMAIN_IOS:-/Users/serdartunay/Documents/Bachmain/bachmain.ios}"
SSD="/Volumes/DevDisk/WORKSPACE BACHMAIN"
FAIL=0

pass() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1"; FAIL=1; }

echo "==> WORKSPACE BACHMAIN doğrulama"
echo "    Monorepo: $MONOREPO"
echo ""

check_dir() {
  local label="$1" path="$2"
  if [[ -d "$path" ]]; then pass "$label → $path"
  else fail "$label eksik → $path"; fi
}

check_file() {
  local label="$1" path="$2"
  if [[ -f "$path" ]]; then pass "$label"
  else fail "$label eksik → $path"; fi
}

echo "-- Sistem klasörleri"
check_dir "uygulama.bachmain.com (CRM)" "$MONOREPO"
check_dir "yonetim.bachmain.com (Admin)" "$MONOREPO/apps/admin"
check_dir "bachmain.com (Landing)" "$MONOREPO/apps/landing"

echo ""
echo "-- Ertelenmiş mobil (workspace dışı)"
if [[ -d "$IOS" ]]; then pass "iosapp.bachmain (opsiyonel) → $IOS"
else echo "  ○ iosapp.bachmain henüz yok (workspace dışı)"; fi
if [[ -d "$MONOREPO/apps/android" ]]; then pass "androidapp.bachmain (opsiyonel) → $MONOREPO/apps/android"
else echo "  ○ androidapp.bachmain henüz yok (workspace dışı)"; fi

echo ""
echo "-- Workspace dosyaları (repo)"
check_file "Cursor workspace" "$ROOT/workspace/WORKSPACE BACHMAIN.code-workspace"
check_file "Manifest" "$ROOT/workspace/manifest.json"

echo ""
echo "-- SSD workspace"
if [[ -d "$SSD" ]]; then
  pass "SSD klasörü: $SSD"
  for name in uygulama.bachmain.com yonetim.bachmain.com bachmain.com; do
    target="$SSD/systems/$name"
    if [[ -L "$target" ]] && [[ -e "$target" ]]; then
      pass "SSD symlink $name"
    else
      fail "SSD symlink $name → $target"
    fi
  done
  check_file "SSD workspace dosyası" "$SSD/WORKSPACE BACHMAIN.code-workspace"
else
  fail "SSD klasörü yok: $SSD"
fi

echo ""
echo "-- Kritik kod kontrolü (Sidebar crash)"
if rg -q 'courierMenuItem' "$MONOREPO/src/components/Layout/Sidebar.jsx" 2>/dev/null; then
  fail "Sidebar.jsx içinde courierMenuItem referansı var (sayfa açılmaz)"
else
  pass "Sidebar.jsx courierMenuItem temiz"
fi

echo ""
echo "-- JSON doğrulama"
python3 -m json.tool "$ROOT/workspace/manifest.json" >/dev/null && pass "manifest.json geçerli"
python3 -m json.tool "$ROOT/workspace/WORKSPACE BACHMAIN.code-workspace" >/dev/null && pass "code-workspace geçerli"

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "Sonuç: Tüm kontroller geçti."
  exit 0
else
  echo "Sonuç: Bazı kontroller başarısız."
  exit 1
fi
