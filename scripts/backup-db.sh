#!/bin/bash
# Database backup script for SQL Server in Docker
# Usage: ./scripts/backup-db.sh
# Cron:  0 3 * * * /root/MenuOrderingOnline/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_NAME="OnlineMenuDB"
RETENTION_DAYS=7
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

cd "$PROJECT_DIR"

# Read DB_PASSWORD only (robust against spaces in other .env values)
DB_PASSWORD="$(grep '^DB_PASSWORD=' .env | cut -d= -f2-)"
if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[ERROR] DB_PASSWORD not found in .env"
  exit 1
fi

# Resolve db container name dynamically (works regardless of compose project name)
DB_CONTAINER="$(docker compose ps -q db)"
if [ -z "$DB_CONTAINER" ]; then
  echo "[ERROR] db container is not running"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Ensure the in-container backup dir is writable by SQL Server (mssql uid 10001).
# Needed because a fresh named volume is owned by root. Idempotent.
docker exec -u 0 "$DB_CONTAINER" chown 10001:0 /var/opt/mssql/backup 2>/dev/null || true

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_${TIMESTAMP}.bak"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# Run backup inside SQL Server container (-C trusts the self-signed cert)
docker exec "$DB_CONTAINER" "$SQLCMD" \
  -S localhost -U sa -P "$DB_PASSWORD" -C \
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
