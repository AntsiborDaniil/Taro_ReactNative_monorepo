#!/usr/bin/env bash
# Проверка связки Vercel proxy + Render API после деплоя.
# Usage:
#   ./scripts/check-production-health.sh
#   RENDER_URL=https://tarot-api-xxx.onrender.com ./scripts/check-production-health.sh

set -euo pipefail

VERCEL_URL="${VERCEL_URL:-https://taro-react-native-monorepo.vercel.app}"
RENDER_URL="${RENDER_URL:-}"

echo "=== Vercel (via proxy) ==="
VERCEL_HEALTH=$(curl -sS -w "\n%{http_code}" "${VERCEL_URL}/health" 2>/dev/null || true)
VERCEL_BODY=$(echo "$VERCEL_HEALTH" | head -n -1)
VERCEL_CODE=$(echo "$VERCEL_HEALTH" | tail -n 1)
echo "GET ${VERCEL_URL}/health → HTTP ${VERCEL_CODE}"
if echo "$VERCEL_BODY" | head -c 1 | grep -q '{'; then
  echo "$VERCEL_BODY" | head -c 200
  echo ""
  echo "OK: JSON (proxy, скорее всего, работает)"
else
  echo "FAIL: ответ не JSON (часто HTML) — задай TAROT_API_PROXY_URL на Vercel и Redeploy"
  echo "Первые 80 символов: $(echo "$VERCEL_BODY" | head -c 80)"
fi

if [ -n "$RENDER_URL" ]; then
  echo ""
  echo "=== Render (direct) ==="
  RENDER_HEALTH=$(curl -sS -w "\n%{http_code}" "${RENDER_URL}/health" 2>/dev/null || true)
  RENDER_BODY=$(echo "$RENDER_HEALTH" | head -n -1)
  RENDER_CODE=$(echo "$RENDER_HEALTH" | tail -n 1)
  echo "GET ${RENDER_URL}/health → HTTP ${RENDER_CODE}"
  echo "$RENDER_BODY"
fi
