#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/training-app}"
WHOAMI_FILE="${WHOAMI_FILE:-/usr/lib/cgi-bin/whoami.py}"
DB_FILE="${DB_FILE:-/var/lib/pocketbase/data.db}"
BACKUP_ROOT="${BACKUP_ROOT:-/home_local/admin_yasser/training-hub-backups}"
SKIP_APACHE_RELOAD="${SKIP_APACHE_RELOAD:-false}"

WITH_DB="false"
BACKUP_DIR=""

usage() {
  cat <<'EOF'
Usage:
  rollback_prod.sh --backup-dir /path/to/backup [--with-db]

Options:
  --backup-dir PATH   Required backup directory created by backup_prod.sh
  --with-db           Restore PocketBase data.db in addition to app + whoami.py
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-dir)
      BACKUP_DIR="${2:-}"
      shift 2
      ;;
    --with-db)
      WITH_DB="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${BACKUP_DIR}" ]]; then
  echo "--backup-dir is required." >&2
  usage
  exit 1
fi

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "Backup directory not found: ${BACKUP_DIR}" >&2
  exit 1
fi

if [[ ! -d "${BACKUP_DIR}/training-app" ]]; then
  echo "Missing training-app snapshot in backup." >&2
  exit 1
fi

if [[ ! -f "${BACKUP_DIR}/whoami.py" ]]; then
  echo "Missing whoami.py snapshot in backup." >&2
  exit 1
fi

if [[ "${WITH_DB}" == "true" && ! -f "${BACKUP_DIR}/data.db" ]]; then
  echo "Missing data.db snapshot in backup." >&2
  exit 1
fi

if [[ -d "${APP_DIR}" ]]; then
  rm -rf "${APP_DIR}"
fi
cp -a "${BACKUP_DIR}/training-app" "${APP_DIR}"
cp -a "${BACKUP_DIR}/whoami.py" "${WHOAMI_FILE}"

if [[ "${WITH_DB}" == "true" ]]; then
  cp -a "${BACKUP_DIR}/data.db" "${DB_FILE}"
fi

if [[ "${SKIP_APACHE_RELOAD}" != "true" ]] && command -v apache2ctl >/dev/null 2>&1; then
  apache2ctl -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload apache2
  elif command -v service >/dev/null 2>&1; then
    service apache2 reload
  else
    apache2ctl graceful
  fi
fi

echo "Rollback completed from: ${BACKUP_DIR}"
echo "DB restored: ${WITH_DB}"
