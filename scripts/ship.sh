#!/bin/bash
# ship.sh — build (gerekirse) + push + Vercel production (GitHub-linked redeploy)
# Canonical workspace: ~/Documents/bachmain/BachMain Tüm Proje
set -euo pipefail
cd "$(dirname "$0")/.."

ORG="team_6Bs45GjLiuQAkKP5eE6fUOsf"
WEB_ID="prj_1IxdJq7c8Kamffare0gLAskdoD9k"
ADMIN_ID="prj_58uYNTn8uZNfSaNF53pg5mHkosf9"
CRM_ID="$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])" 2>/dev/null || echo 'prj_JDJO7v2dTvWBac2Gd0N7jX1ZdJjk')"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
if [ "$BRANCH" = "main" ]; then
  echo "!! Shipping from main (transition mode). Prefer PR merge after CI green."
fi

NEED_WEB=0
NEED_ADMIN=0
NEED_CRM=0

# Only committed range — bare `git diff` hangs on Documents trees
CHANGED=$(git diff --name-only "origin/main...HEAD" 2>/dev/null || true)
for p in apps/landing apps/web apps/admin src server api package.json vite.config.js; do
  if [ -e "$p" ]; then
    CHANGED="$CHANGED"$'\n'$(git diff --name-only -- "$p" 2>/dev/null || true)
    CHANGED="$CHANGED"$'\n'$(git diff --cached --name-only -- "$p" 2>/dev/null || true)
  fi
done

echo "$CHANGED" | grep -E '^apps/landing/|^apps/web/' >/dev/null 2>&1 && NEED_WEB=1
echo "$CHANGED" | grep -E '^apps/admin/' >/dev/null 2>&1 && NEED_ADMIN=1
echo "$CHANGED" | grep -E '^(src/|server/|api/|package\.json|vite\.config)' >/dev/null 2>&1 && NEED_CRM=1

if [ "${SHIP_ALL:-0}" = "1" ] || [ "$NEED_WEB$NEED_ADMIN$NEED_CRM" = "000" ]; then
  NEED_WEB=1; NEED_ADMIN=1; NEED_CRM=1
fi

if [ "$NEED_WEB" = "1" ] && [ -d apps/landing ]; then
  echo "==> Build landing → apps/web"
  (cd apps/landing && npm run build)
  SRC_DIR=""
  if [ -d apps/landing/out ]; then SRC_DIR=apps/landing/out
  elif [ -d apps/landing/dist ]; then SRC_DIR=apps/landing/dist
  fi
  if [ -n "$SRC_DIR" ]; then
    rsync -a --delete --exclude vercel.json --exclude .vercel --exclude CALISMA.md \
      "$SRC_DIR"/ apps/web/
    if [ -f apps/web/index.html ]; then
      cp apps/web/index.html apps/web/egitim.html 2>/dev/null || true
      cp apps/web/index.html apps/web/egitimler.html 2>/dev/null || true
    fi
  else
    echo "!! No apps/landing/out or dist — skipping web sync"
  fi
fi

echo "==> Push origin ${BRANCH}"
git push -u origin "$BRANCH"

# Redeploy via Vercel CLI (OAuth refresh; stale auth.json token causes API 403).
echo "==> Vercel production deploy (CLI — fresh build)"
CLI_PROJECTS=()
[ "$NEED_CRM" = "1" ] && CLI_PROJECTS+=("crm")
[ "$NEED_ADMIN" = "1" ] && CLI_PROJECTS+=("admin")
[ "$NEED_WEB" = "1" ] && CLI_PROJECTS+=("web")
bash scripts/vercel-redeploy-cli.sh "${CLI_PROJECTS[@]}" || true

echo "Tamam → https://bachmain.com | https://uygulama.bachmain.com | https://yonetim.bachmain.com"
