#!/bin/sh
set -e

if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ]; then
  echo "ERROR: Las variables APPWRITE_ENDPOINT y APPWRITE_PROJECT_ID son obligatorias." >&2
  exit 1
fi

SAFE_ENDPOINT=$(printf '%s' "$APPWRITE_ENDPOINT"  | sed 's/\\/\\\\/g; s/"/\\"/g')
SAFE_PROJECT=$(printf  '%s' "$APPWRITE_PROJECT_ID" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  endpoint:  "${SAFE_ENDPOINT}",
  projectId: "${SAFE_PROJECT}"
};
EOF

echo "[MediaLog] Config generada — endpoint: ${APPWRITE_ENDPOINT} | project: ${APPWRITE_PROJECT_ID}"

exec nginx -g "daemon off;"
