#!/bin/bash
# Database backup script for SQL Server in Docker
# Usage: ./scripts/backup-db.sh
# Cron:  0 3 * * * /path/to/project/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_CONTAINER="onlinemenuapp-db-1"
DB_NAME="OnlineMenuDB"
RETENTION_DAYS=7

# Load .env for DB_PASSWORD
if [ -f "${PROJECT_DIR}/.env" ]; then
  export $(grep -v '^#' "${PROJECT_DIR}/.env" | xargs)
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[ERROR] DB_PASSWORD not set. Check .env file."
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_${TIMESTAMP}.bak"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# Run backup inside SQL Server container
docker exec "$DB_CONTAINER" /opt/mssql-tools2/bin/sqlcmd \
  -S localhost -U sa -P "$DB_PASSWORD" \
  -Q "BACKUP DATABASE [${DB_NAME}] TO DISK = N'/var/opt/mssql/backup/${BACKUP_FILE}' WITH FORMAT, COMPRESSION, NAME = '${DB_NAME}-Full'"

# Copy backup from container to host
docker cp "${DB_CONTAINER}:/var/opt/mssql/backup/${BACKUP_FILE}" "${BACKUP_DIR}/${BACKUP_FILE}"

# Remove backup from container
docker exec "$DB_CONTAINER" rm -f "/var/opt/mssql/backup/${BACKUP_FILE}"

# Verify backup exists
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
  echo "[$(date)] Backup successful: ${BACKUP_FILE} (${SIZE})"
else
  echo "[ERROR] Backup file not found!"
  exit 1
fi

# Clean up old backups (keep last N days)
DELETED=$(find "$BACKUP_DIR" -name "backup_*.bak" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Cleaned up ${DELETED} old backup(s) (older than ${RETENTION_DAYS} days)"
fi

echo "[$(date)] Backup complete."
