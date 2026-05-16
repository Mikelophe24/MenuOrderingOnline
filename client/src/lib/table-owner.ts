// Track which guest "owns" a table (the original QR scanner)
// via cookie so it survives tab close. Expires after 3 hours.
const COOKIE_NAME = 'nhatnuong_table_owner'
const MAX_AGE_HOURS = 3

export function setTableOwner(tableNumber: number, tableToken: string) {
  if (typeof document === 'undefined') return
  const value = `${tableNumber}:${tableToken}`
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; max-age=${MAX_AGE_HOURS * 3600}; path=/; SameSite=Lax`
}

export function getTableOwner(): { tableNumber: number; tableToken: string } | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  try {
    const [numStr, token] = decodeURIComponent(match[1]).split(':', 2)
    const num = Number(numStr)
    if (!num || !token) return null
    return { tableNumber: num, tableToken: token }
  } catch {
    return null
  }
}

export function clearTableOwner() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`
}
