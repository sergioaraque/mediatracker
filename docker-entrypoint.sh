#!/bin/sh
set -e

if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ]; then
  echo "ERROR: Las variables APPWRITE_ENDPOINT y APPWRITE_PROJECT_ID son obligatorias." >&2
  exit 1
fi

# Genera /config.js con los valores reales en tiempo de arranque del contenedor
cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  endpoint:  "${APPWRITE_ENDPOINT}",
  projectId: "${APPWRITE_PROJECT_ID}"
};
EOF

echo "[MediaLog] Config generada — endpoint: ${APPWRITE_ENDPOINT} | project: ${APPWRITE_PROJECT_ID}"

exec nginx -g "daemon off;"
