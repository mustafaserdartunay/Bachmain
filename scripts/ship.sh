#!/bin/bash
# ship.sh — build (gerekirse) + commit edilmemişleri uyarı + push + prod deploy
# DevOps: Prefer PR → develop/staging → main. Direct main ship remains for transition/hotfix.
# See docs/62_BRANCHING_STRATEGY.md and docs/63_STAGING_AND_PREVIEW.md
set -euo pipefail
cd "$(dirname "$0")/.."
ORG="team_6Bs45GjLiuQAkKP5eE6fUOsf"
WEB_ID="prj_1IxdJq7c8Kamffare0gLAskdoD9k"
ADMIN_ID="prj_58uYNTn8uZNfSaNF53pg5mHkosf9"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
if [ "$BRANCH" = "main" ]; then
  echo "!! Shipping from main (transition mode). Prefer PR merge after CI green."
elif [ "$BRANCH" = "staging" ] || [ "$BRANCH" = "develop" ]; then
  echo "==> Branch $BRANCH — consider Preview/Staging deploy before production promote."
fi

NEED_WEB=0
NEED_ADMIN=0
NEED_CRM=0

# Detect changed paths vs origin/main (committed + unstaged hint)
CHANGED=$(git diff --name-only origin/main...HEAD 2>/dev/null || true)
CHANGED="$CHANGED"$'\n'$(git diff --name-only 2>/dev/null || true)
CHANGED="$CHANGED"$'\n'$(git diff --cached --name-only 2>/dev/null || true)

echo "$CHANGED" | grep -E '^apps/landing/|^apps/web/' >/dev/null 2>&1 && NEED_WEB=1
echo "$CHANGED" | grep -E '^apps/admin/' >/dev/null 2>&1 && NEED_ADMIN=1
echo "$CHANGED" | grep -E '^(src/|server/|api/|package\.json|vite\.config)' >/dev/null 2>&1 && NEED_CRM=1

# If nothing detected, deploy all (safe default when user asks ship)
if [ "$NEED_WEB$NEED_ADMIN$NEED_CRM" = "000" ]; then
  NEED_WEB=1
  NEED_ADMIN=1
  NEED_CRM=1
fi

if [ "$NEED_WEB" = "1" ] && [ -d apps/landing ]; then
  echo "==> Build landing → apps/web"
  (cd apps/landing && npm run build)
  rsync -a --delete \
    --exclude vercel.json \
    --exclude .vercel \
    --exclude CALISMA.md \
    apps/landing/out/ apps/web/
  if [ -f apps/web/index.html ]; then
    cp apps/web/index.html apps/web/egitim.html 2>/dev/null || true
    cp apps/web/index.html apps/web/egitimler.html 2>/dev/null || true
  fi
fi

echo "==> Push origin main"
git push origin main

# Always deploy from repo root: Vercel project Root Directory is apps/web|apps/admin|/.
deploy() {
  local name="$1" project="$2"
  echo "==> Deploy $name (from repo root)"
  VERCEL_ORG_ID="$ORG" VERCEL_PROJECT_ID="$project" \
    npx --yes vercel@latest --prod --yes
}

[ "$NEED_CRM" = "1" ] && deploy "bachmain (CRM)" "$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])" 2>/dev/null || echo 'prj_JDJO7v2dTvWBac2Gd0N7jX1ZdJjk')"
[ "$NEED_ADMIN" = "1" ] && deploy "bachmain-admin" "$ADMIN_ID"
[ "$NEED_WEB" = "1" ] && deploy "bachmain-web" "$WEB_ID"

echo "Tamam → https://bachmain.com | https://uygulama.bachmain.com | https://yonetim.bachmain.com"
