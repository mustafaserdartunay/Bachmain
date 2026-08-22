#!/usr/bin/env bash
# BachMain sistem açıcı — Cursor Simple Browser sekmeleri kanonik isimlerle
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LABELS="$ROOT/workspace/system-labels.json"
CANONICAL_ENV="/Users/serdartunay/Documents/Bachmain/BachMain Tüm Proje/apps/admin/.env"
ADMIN="$ROOT/apps/admin"
LOG_DIR="$ROOT/workspace/logs"
mkdir -p "$LOG_DIR"

port_listen() { lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

url_for() {
  python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d[sys.argv[2]]['localUrl'])" "$LABELS" "$1"
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
      (cd "$ROOT" && nohup npm run dev >>"$LOG_DIR/uygulama.log" 2>&1 &)
      ;;
    yonetim)
      ensure_admin_env
      port_listen 5200 && port_listen 5201 && return 0
      echo "→ YÖNETİM - BACHMAIN başlatılıyor…"
      for p in 5200 5201; do pid=$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true); [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true; done
      sleep 1
      (cd "$ADMIN" && nohup npm run dev:all >>"$LOG_DIR/yonetim.log" 2>&1 &)
      ;;
    web)
      port_listen 5180 && return 0
      echo "→ WEB - BACHMAIN başlatılıyor…"
      (cd "$ROOT/apps/landing" && nohup npm run dev >>"$LOG_DIR/web.log" 2>&1 &)
      ;;
    ios|android)
      port_listen 5173 || start_if_needed uygulama
      ;;
    *)
      echo "Bilinmeyen sistem: $key"; exit 1 ;;
  esac
  for _ in $(seq 1 40); do
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

open_cursor_url() {
  local url="$1"
  local encoded
  encoded=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$url")
  if command -v cursor >/dev/null 2>&1; then
    cursor --open-url "vscode://vscode.simple-browser/show?url=${encoded}" 2>/dev/null || open "$url"
  else
    open "$url"
  fi
  sleep 0.35
}

open_one() {
  local key="$1"
  start_if_needed "$key"
  local url
  url=$(url_for "$key")
  local label
  label=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d[sys.argv[2]]['label'])" "$LABELS" "$key")
  echo "→ Açılıyor: $label — $url"
  open_cursor_url "$url"
}

if [[ $# -eq 0 ]]; then
  for key in uygulama yonetim web ios android; do
    open_one "$key"
  done
  exit 0
fi

for key in "$@"; do
  open_one "$key"
done
