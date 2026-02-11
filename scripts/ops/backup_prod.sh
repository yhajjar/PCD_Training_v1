#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

APP_DIR="${APP_DIR:-/var/www/training-app}"
WHOAMI_FILE="${WHOAMI_FILE:-/usr/lib/cgi-bin/whoami.py}"
DB_FILE="${DB_FILE:-/var/lib/pocketbase/data.db}"
BACKUP_ROOT="${BACKUP_ROOT:-/home_local/admin_yasser/training-hub-backups}"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "App directory not found: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -f "${WHOAMI_FILE}" ]]; then
  echo "whoami.py not found: ${WHOAMI_FILE}" >&2
  exit 1
fi

if [[ ! -f "${DB_FILE}" ]]; then
  echo "PocketBase DB not found: ${DB_FILE}" >&2
  exit 1
fi

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

cp -a "${APP_DIR}" "${BACKUP_DIR}/training-app"
cp -a "${WHOAMI_FILE}" "${BACKUP_DIR}/whoami.py"
cp -a "${DB_FILE}" "${BACKUP_DIR}/data.db"

(
  cd "${BACKUP_DIR}"
  sha256sum \
    "whoami.py" \
    "data.db" \
    "training-app/index.html" \
    > checksums.sha256
)

GIT_COMMIT="unknown"
if git -C "${REPO_ROOT}" rev-parse --short HEAD >/dev/null 2>&1; then
  GIT_COMMIT="$(git -C "${REPO_ROOT}" rev-parse --short HEAD)"
fi

cat > "${BACKUP_DIR}/manifest.json" <<EOF
{
  "timestampUtc": "${TIMESTAMP}",
  "repoRoot": "${REPO_ROOT}",
  "gitCommit": "${GIT_COMMIT}",
  "paths": {
    "appDir": "${APP_DIR}",
    "whoamiFile": "${WHOAMI_FILE}",
    "dbFile": "${DB_FILE}"
  },
  "backup": {
    "directory": "${BACKUP_DIR}",
    "appSnapshot": "${BACKUP_DIR}/training-app",
    "whoamiSnapshot": "${BACKUP_DIR}/whoami.py",
    "dbSnapshot": "${BACKUP_DIR}/data.db",
    "checksumsFile": "${BACKUP_DIR}/checksums.sha256"
  }
}
EOF

echo "Backup completed: ${BACKUP_DIR}"
