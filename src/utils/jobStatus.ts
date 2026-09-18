import type { JobStatus } from '../types'

/**
 * Badge colours for every job status, in one place.
 *
 * Lived inside `JobsTable` until `JobDetail` needed the same badge — the detail
 * page had no status indicator at all, which meant the one screen dedicated to
 * a single job was the only one that didn't say what state it was in.
 */
export const STATUS_COLORS: Record<JobStatus, string> = {
  SCRAPED:           'bg-gray-200 text-gray-700',
  PARSED:            'bg-blue-100 text-blue-800',
  RESUME_READY:      'bg-brand-100 text-brand-800',
  READY_TO_APPLY:    'bg-violet-100 text-violet-800',
  APPLIED:           'bg-emerald-100 text-emerald-800',
  FAILED:            'bg-red-100 text-red-800',
  FLAGGED:           'bg-amber-100 text-amber-800',
  WAITING_CAPTCHA:   'bg-amber-100 text-amber-800',
  WAITING_LOGIN:     'bg-sky-100 text-sky-800',
  WAITING_OTP:       'bg-purple-100 text-purple-800',
  NEED_HUMAN_ACTION: 'bg-rose-100 text-rose-800',
  DUPLICATE:         'bg-gray-100 text-gray-600',
  SKIPPED:           'bg-gray-100 text-gray-600',
  BLACKLISTED:       'bg-gray-200 text-gray-500 line-through',
}

/** Filter-dropdown order — roughly the order a job moves through them. */
export const STATUSES: JobStatus[] = [
  'SCRAPED', 'PARSED', 'RESUME_READY', 'READY_TO_APPLY', 'APPLIED', 'FAILED', 'FLAGGED',
  'WAITING_CAPTCHA', 'WAITING_LOGIN', 'WAITING_OTP', 'NEED_HUMAN_ACTION',
  'DUPLICATE', 'SKIPPED', 'BLACKLISTED',
]

/** Statuses a stuck job can be retried or resumed from. */
export const RETRYABLE_STATUSES = new Set<string>([
  'FAILED', 'FLAGGED', 'WAITING_CAPTCHA', 'WAITING_LOGIN', 'WAITING_OTP', 'NEED_HUMAN_ACTION',
])

export function statusBadgeClass(status: JobStatus | string): string {
  return STATUS_COLORS[status as JobStatus] ?? 'bg-gray-100 text-gray-600'
}
