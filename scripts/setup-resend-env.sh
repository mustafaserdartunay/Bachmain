#!/usr/bin/env bash
# setup-resend-env.sh — RESEND_API_KEY + mail URL'lerini Vercel admin'e yazar ve deploy eder
# Kullanım:
#   export RESEND_API_KEY='re_xxxx'
#   ./scripts/setup-resend-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ORG="${VERCEL_ORG_ID:-team_6Bs45GjLiuQAkKP5eE6fUOsf}"
ADMIN_ID="${VERCEL_PROJECT_ID_ADMIN:-prj_58uYNTn8uZNfSaNF53pg5mHkosf9}"

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "RESEND_API_KEY eksik."
  echo "1) https://resend.com/api-keys → Create API Key"
  echo "2) Domain bachmain.com Resend'de Verified olmalı"
  echo "3) export RESEND_API_KEY='re_...'"
  echo "4) ./scripts/setup-resend-env.sh"
  exit 1
fi

if [[ ! "$RESEND_API_KEY" =~ ^re_ ]]; then
  echo "RESEND_API_KEY 're_' ile başlamalı"
  exit 1
fi

EMAIL_FROM="${EMAIL_FROM:-BACHMAIN <noreply@bachmain.com>}"
EMAIL_REPLY_TO="${EMAIL_REPLY_TO:-destek@bachmain.com}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-destek@bachmain.com}"
WEB_URL="${WEB_URL:-https://www.bachmain.com}"
APP_URL="${APP_URL:-https://uygulama.bachmain.com}"
ADMIN_URL="${ADMIN_URL:-https://yonetim.bachmain.com}"

add_env() {
  local name="$1" value="$2" env="$3"
  echo "==> Set $name ($env)"
  VERCEL_ORG_ID="$ORG" VERCEL_PROJECT_ID="$ADMIN_ID" \
    npx --yes vercel@latest env add "$name" "$env" --force --yes --sensitive --value "$value" >/dev/null
}

for ENV_NAME in production preview development; do
  add_env RESEND_API_KEY "$RESEND_API_KEY" "$ENV_NAME"
  add_env EMAIL_FROM "$EMAIL_FROM" "$ENV_NAME"
  add_env EMAIL_REPLY_TO "$EMAIL_REPLY_TO" "$ENV_NAME"
  add_env SUPPORT_EMAIL "$SUPPORT_EMAIL" "$ENV_NAME"
  add_env WEB_URL "$WEB_URL" "$ENV_NAME"
  add_env APP_URL "$APP_URL" "$ENV_NAME"
  add_env ADMIN_URL "$ADMIN_URL" "$ENV_NAME"
done

echo "==> Redeploy bachmain-admin (production)"
VERCEL_ORG_ID="$ORG" VERCEL_PROJECT_ID="$ADMIN_ID" npx --yes vercel@latest --prod --yes

echo ""
echo "Tamam."
echo "• Health: https://yonetim.bachmain.com/api/health  → mail.configured=true olmalı"
echo "• Panel:  https://yonetim.bachmain.com/eposta → API Testi"
echo "• Reset:  $WEB_URL/reset-password?token=..."
