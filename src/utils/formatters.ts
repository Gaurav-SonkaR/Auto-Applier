/** Display formatting shared across pages and components.
 *
 * Every one of these tolerates null — the API returns nullable timestamps and
 * counters throughout, and a dash is always better than "Invalid Date".
 */

const DASH = '—'

/** Parse a timestamp from the API.
 *
 * The backend now serialises every timestamp with an explicit UTC offset
 * (`schemas/types.UtcDatetime`), so this normally just parses. It stays as a
 * safety net because the failure it guards against is silent: SQLite drops
 * timezones, and an offset-less string like "2026-09-08T07:52:07" is read by
 * `new Date()` as *local* time — which in IST showed every date 5.5 hours in
 * the past rather than throwing. Strings that carry an offset are left alone.
 */
function parseApiDate(iso: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(hasZone ? iso : `${iso}Z`)
}

/** Absolute local date+time, e.g. "4 Sep 2026, 23:05". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return DASH
  const d = parseApiDate(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Date only, e.g. "4 Sep 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return DASH
  const d = parseApiDate(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const MINUTE = 60
const HOUR = 3600
const DAY = 86400

/** "just now" / "12m ago" / "3h ago" / "2d ago". */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return DASH
  const t = parseApiDate(iso).getTime()
  if (Number.isNaN(t)) return DASH
  const secs = Math.round((Date.now() - t) / 1000)
  if (secs < 0) return 'just now'
  if (secs < 45) return 'just now'
  if (secs < HOUR) return `${Math.round(secs / MINUTE)}m ago`
  if (secs < DAY) return `${Math.round(secs / HOUR)}h ago`
  return `${Math.round(secs / DAY)}d ago`
}

/** Elapsed time between two timestamps; runs to "now" when `end` is null. */
export function formatDuration(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start) return DASH
  const t0 = parseApiDate(start).getTime()
  if (Number.isNaN(t0)) return DASH
  const t1 = end ? parseApiDate(end).getTime() : Date.now()
  const secs = Math.max(0, Math.round((t1 - t0) / 1000))
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / MINUTE)
  if (mins < 60) return `${mins}m ${secs % MINUTE}s`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

/** 0.8734 → "87%". */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return DASH
  return `${(value * 100).toFixed(digits)}%`
}

/** An already-0-100 score, e.g. Job.ats_score. */
export function formatScore(value: number | null | undefined): string {
  return value == null ? DASH : `${value}%`
}

/** "web" is how the backend labels company career pages. */
export function formatPortal(portal: string | null | undefined): string {
  if (!portal) return DASH
  if (portal === 'web') return 'Career Site'
  return portal.charAt(0).toUpperCase() + portal.slice(1)
}

/** "NEED_HUMAN_ACTION" → "Need Human Action". */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return DASH
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

/** Shorten a URL for display: "acme.com/careers/senior-engineer". */
export function formatUrl(url: string | null | undefined, maxLength = 48): string {
  if (!url) return DASH
  let display = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
  if (display.length > maxLength) display = `${display.slice(0, maxLength - 1)}…`
  return display
}

export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}
