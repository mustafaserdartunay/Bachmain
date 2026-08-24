#!/bin/bash
# Deploy BachMain Vercel projects from local git tree (fresh build + production).
# `vercel redeploy <url>` only re-publishes an OLD deployment — use `deploy --prod` instead.
# Project root dirs (apps/admin, apps/landing) are configured in Vercel — CLI cwd = repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCOPE="${VERCEL_SCOPE:-bachmain}"
WAIT="${VERCEL_WAIT:-0}"

declare -a PROJECT_SPECS=(
  "crm:bachmain"
  "admin:bachmain-admin"
  "web:bachmain-web"
)

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

EXTRA=(--prod --force)
if [ "$WAIT" = "0" ]; then
  EXTRA+=(--no-wait)
fi

resolve_specs() {
  if [ "$#" -eq 0 ]; then
    printf '%s\n' "${PROJECT_SPECS[@]}"
    return
  fi
  for name in "$@"; do
    for spec in "${PROJECT_SPECS[@]}"; do
      if [ "${spec%%:*}" = "$name" ]; then
        echo "$spec"
      fi
    done
  done
}

FAILED=0
while IFS= read -r spec; do
  [ -z "$spec" ] && continue
  name="${spec%%:*}"
  project="${spec#*:}"

  echo "==> $name deploy --prod → $project"
  if run_vercel deploy --project "$project" --cwd "$ROOT" "${EXTRA[@]}"; then
    echo "==> $name OK"
  else
    echo "!! $name deploy başarısız"
    FAILED=1
  fi
done < <(resolve_specs "$@")

exit "$FAILED"
