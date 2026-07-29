# Sentry release + source maps (CRM)
#
# Required env:
#   SENTRY_AUTH_TOKEN
#   SENTRY_ORG
#   SENTRY_PROJECT
#   VITE_SENTRY_DSN (build-time)
#   SENTRY_RELEASE (e.g. BM-V1.726+<gitsha>)
#
# Usage:
#   export SENTRY_RELEASE="BM-V1.726+$(git rev-parse --short HEAD)"
#   VITE_SENTRY_RELEASE=$SENTRY_RELEASE npm run build
#   npx @sentry/cli releases new "$SENTRY_RELEASE"
#   npx @sentry/cli releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist --url-prefix '~/assets'
#   npx @sentry/cli releases finalize "$SENTRY_RELEASE"

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RELEASE="${SENTRY_RELEASE:-BM-$(git rev-parse --short HEAD)}"
export VITE_SENTRY_RELEASE="$RELEASE"

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "SENTRY_AUTH_TOKEN missing — skipping upload (build still runs with release env)."
  exit 0
fi

npx --yes @sentry/cli releases new "$RELEASE" || true
npx --yes @sentry/cli sourcemaps inject ./dist ./apps/admin/dist ./apps/api/dist || true
npx --yes @sentry/cli sourcemaps upload \
  --release "$RELEASE" \
  ./dist ./apps/admin/dist ./apps/api/dist || true
npx --yes @sentry/cli releases finalize "$RELEASE" || true
echo "Sentry release finalized: $RELEASE"
