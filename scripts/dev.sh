#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-5173}"

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi
  for candidate in \
    "/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node" \
    "/Applications/Cursor 2.app/Contents/Resources/app/resources/helpers/node"; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done
  if [ -d "$HOME/.nvm/versions/node" ]; then
    latest="$(ls "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1)"
    if [ -n "$latest" ] && [ -x "$HOME/.nvm/versions/node/$latest/bin/node" ]; then
      echo "$HOME/.nvm/versions/node/$latest/bin/node"
      return
    fi
  fi
  echo "Node.js bulunamadı. Lütfen Node.js kurun veya Cursor terminalinden tekrar deneyin." >&2
  exit 1
}

detect_lan_ip() {
  ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || true
}

NODE="$(find_node)"

if [ ! -d node_modules ]; then
  echo "node_modules eksik. Önce bağımlılıkları kurun: npm install" >&2
  exit 1
fi

LAN_IP="$(detect_lan_ip)"
LOCAL_URL="http://localhost:${PORT}"
LOCAL_ALT="http://127.0.0.1:${PORT}"
LINKS_URL="${LOCAL_URL}/baglantilar.html"

echo "Node: $NODE"
echo "Proje: $ROOT"
echo
echo "Güncel bağlantılar:"
echo "  Yerel:      ${LOCAL_URL}"
echo "  Yerel (IP): ${LOCAL_ALT}"
if [ -n "$LAN_IP" ]; then
  echo "  Ağ:         http://${LAN_IP}:${PORT}"
fi
echo "  Link sayfası: ${LINKS_URL}"
echo
echo "Durdurmak için: Ctrl+C"
echo

exec "$NODE" node_modules/vite/bin/vite.js --host --port "$PORT"
