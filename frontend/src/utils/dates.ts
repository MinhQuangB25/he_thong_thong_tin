/** Calendar date in the user's timezone, without a UTC conversion. */
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function monthBounds(date: Date) {
  return {
    from: localDate(new Date(date.getFullYear(), date.getMonth(), 1)),
    to: localDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  }
}

/** Shows an ISO calendar date (YYYY-MM-DD) as DD/MM/YYYY without timezone conversion. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** Inclusive number of calendar days between two ISO dates; 0 when invalid or reversed. */
export function inclusiveDays(from: string, to: string): number {
  if (!from || !to) return 0
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const days = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000) + 1
  return Number.isFinite(days) && days > 0 ? days : 0
}
