#!/bin/bash
# Redeploy BachMain Vercel projects via CLI (refreshes OAuth token automatically).
# Faster than REST API + stale auth.json token. GitHub push also triggers auto-deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCOPE="${VERCEL_SCOPE:-bachmain}"
WAIT="${VERCEL_WAIT:-0}"

project_url() {
  case "$1" in
    crm) echo "uygulama.bachmain.com" ;;
    admin) echo "yonetim.bachmain.com" ;;
    web) echo "bachmain.com" ;;
    *) return 1 ;;
  esac
}

vercel_cmd() {
  if [ -x "$ROOT/node_modules/.bin/vercel" ]; then
    "$ROOT/node_modules/.bin/vercel" "$@"
  else
    npx --yes vercel@59.5.0 "$@"
  fi
}

run_vercel() {
  vercel_cmd "$@" --scope "$SCOPE" --non-interactive
}

if ! run_vercel whoami >/dev/null 2>&1; then
  echo "==> Vercel: oturum yok — main push GitHub ile production deploy tetikler."
  echo "    Oturum: npx vercel login"
  exit 0
fi

WHOAMI="$(run_vercel whoami 2>/dev/null | tail -1)"
echo "==> Vercel oturumu: $WHOAMI (scope: $SCOPE)"

EXTRA=()
if [ "$WAIT" = "0" ]; then
  EXTRA+=(--no-wait)
fi

if [ "$#" -eq 0 ]; then
  set -- crm admin web
fi

FAILED=0
for name in "$@"; do
  url="$(project_url "$name" || true)"
  if [ -z "$url" ]; then
    echo "!! bilinmeyen proje: $name"
    FAILED=1
    continue
  fi
  echo "==> $name redeploy → $url"
  if run_vercel redeploy "$url" "${EXTRA[@]}"; then
    echo "==> $name OK"
  else
    echo "!! $name redeploy başarısız (GitHub deploy devam eder)"
    FAILED=1
  fi
done

exit "$FAILED"
