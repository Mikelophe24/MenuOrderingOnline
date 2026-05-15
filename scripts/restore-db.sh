#!/bin/bash
# Database restore script for SQL Server in Docker
# Usage: ./scripts/restore-db.sh [backup_file]
# If no file specified, uses the most recent backup

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_CONTAINER="onlinemenuapp-db-1"
DB_NAME="OnlineMenuDB"

# Load .env for DB_PASSWORD
if [ -f "${PROJECT_DIR}/.env" ]; then
  export $(grep -v '^#' "${PROJECT_DIR}/.env" | xargs)
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[ERROR] DB_PASSWORD not set. Check .env file."
  exit 1
fi

# Determine backup file
if [ -n "${1:-}" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/backup_*.bak 2>/dev/null | head -1)
  if [ -z "$BACKUP_FILE" ]; then
    echo "[ERROR] No backup files found in ${BACKUP_DIR}"
    exit 1
  fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[ERROR] Backup file not found: $BACKUP_FILE"
  exit 1
fi

BASENAME=$(basename "$BACKUP_FILE")
echo "[WARNING] This will REPLACE the current database with: ${BASENAME}"
read -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Starting restore..."

# Copy backup to container
docker cp "$BACKUP_FILE" "${DB_CONTAINER}:/var/opt/mssql/backup/${BASENAME}"

# Restore database
docker exec "$DB_CONTAINER" /opt/mssql-tools2/bin/sqlcmd \
  -S localhost -U sa -P "$DB_PASSWORD" \
  -Q "
    ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE [${DB_NAME}] FROM DISK = N'/var/opt/mssql/backup/${BASENAME}' WITH REPLACE;
    ALTER DATABASE [${DB_NAME}] SET MULTI_USER;
  "

# Cleanup
docker exec "$DB_CONTAINER" rm -f "/var/opt/mssql/backup/${BASENAME}"

echo "[$(date)] Restore complete from ${BASENAME}"
