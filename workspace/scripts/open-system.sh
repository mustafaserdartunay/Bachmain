#!/usr/bin/env bash
# BachMain sistem açıcı — Cursor Simple Browser (yerel URL + ?ide=1).
# Canlı domainleri (uygulama/yonetim/bachmain.com) Simple Browser’da açma.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LABELS="$ROOT/workspace/system-labels.json"
CANONICAL_ENV="/Users/serdartunay/Documents/Bachmain/BachMain Tüm Proje/apps/admin/.env"
ADMIN="$ROOT/apps/admin"
LOG_DIR="$ROOT/workspace/logs"
mkdir -p "$LOG_DIR"

port_listen() { lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

# npm run *:open process group'u kapanınca sunucu ölmesin diye yeni session.
spawn_detached() {
  local dir="$1"
  local npm_script="$2"
  local log="$3"
  python3 - "$dir" "$npm_script" "$log" <<'PY'
import os, sys
workdir, script, logfile = sys.argv[1], sys.argv[2], sys.argv[3]
if os.fork() > 0:
    sys.exit(0)
os.setsid()
if os.fork() > 0:
    sys.exit(0)
os.chdir(workdir)
devnull = os.open(os.devnull, os.O_RDONLY)
logfd = os.open(logfile, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
os.dup2(devnull, 0)
os.dup2(logfd, 1)
os.dup2(logfd, 2)
try:
    os.closerange(3, 256)
except Exception:
    pass
os.execvp("npm", ["npm", "run", script])
PY
}

url_for() {
  python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d[sys.argv[2]]['localUrl'])" "$LABELS" "$1"
}

with_ide_query() {
  local url="$1"
  case "$url" in
    *\?*) echo "${url}&ide=1" ;;
    *) echo "${url}?ide=1" ;;
  esac
}

ensure_admin_env() {
  if [[ ! -f "$ADMIN/.env" && -f "$CANONICAL_ENV" ]]; then
    cp "$CANONICAL_ENV" "$ADMIN/.env"
  fi
}

uygulama_server_root() {
  local pid
  pid=$(lsof -tiTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1 || true)
  [[ -z "$pid" ]] && return 1
  lsof -p "$pid" 2>/dev/null | awk '$4=="cwd"{print $9; exit}'
}

start_if_needed() {
  local key="$1"
  case "$key" in
    uygulama)
      local running_root
      running_root=$(uygulama_server_root || true)
      if [[ -n "$running_root" && "$running_root" != "$ROOT" ]]; then
        echo "→ Eski UYGULAMA sunucusu kapatılıyor ($running_root)…"
        for pid in $(lsof -tiTCP:5173 -sTCP:LISTEN 2>/dev/null); do kill "$pid" 2>/dev/null || true; done
        sleep 1
      elif port_listen 5173; then
        return 0
      fi
      echo "→ UYGULAMA - BACHMAIN başlatılıyor ($ROOT)…"
      spawn_detached "$ROOT" "dev" "$LOG_DIR/uygulama.log"
      ;;
    yonetim)
      ensure_admin_env
      port_listen 5200 && port_listen 5201 && return 0
      echo "→ YÖNETİM - BACHMAIN başlatılıyor…"
      for p in 5200 5201; do pid=$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true); [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true; done
      sleep 1
      spawn_detached "$ADMIN" "dev:all" "$LOG_DIR/yonetim.log"
      ;;
    web)
      port_listen 5180 && return 0
      echo "→ WEB - BACHMAIN başlatılıyor…"
      spawn_detached "$ROOT/apps/landing" "dev" "$LOG_DIR/web.log"
      ;;
    ios|android)
      port_listen 5173 || start_if_needed uygulama
      ;;
    *)
      echo "Bilinmeyen sistem: $key"; exit 1 ;;
  esac
  for _ in $(seq 1 60); do
    case "$key" in
      uygulama) port_listen 5173 && return 0 ;;
      yonetim) port_listen 5200 && port_listen 5201 && return 0 ;;
      web) port_listen 5180 && return 0 ;;
      ios|android) port_listen 5173 && return 0 ;;
    esac
    sleep 0.5
  done
  echo "Hata: $key sunucusu başlamadı"
  exit 1
}

open_simple_browser() {
  local url="$1"
  local encoded
  encoded=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$url")
  local vscode_url="vscode://vscode.simple-browser/show?url=${encoded}"
  # macOS'ta vscode:// kayıtlı olmayabiliyor; Cursor uygulamasına bağla.
  open -a Cursor "$vscode_url" 2>/dev/null || open "cursor://vscode.simple-browser/show?url=${encoded}"
}

open_one() {
  local key="$1"
  start_if_needed "$key"
  local url
  url=$(with_ide_query "$(url_for "$key")")
  local label
  label=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d[sys.argv[2]]['label'])" "$LABELS" "$key")
  echo "→ Açılıyor (Cursor Simple Browser): $label — $url"
  open_simple_browser "$url"
}

if [[ $# -eq 0 ]]; then
  for key in uygulama yonetim web ios android; do
    start_if_needed "$key"
  done
  echo "→ Sunucular hazır. Simple Browser yalnızca UYGULAMA (8GB RAM — tek sekme)."
  echo "   Yönetim: npm run yonetim:open"
  echo "   Web:     npm run web:open"
  open_one uygulama
  exit 0
fi

for key in "$@"; do
  open_one "$key"
done
