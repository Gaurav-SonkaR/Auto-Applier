import type {
  ColdEmailPreview,
  ColdEmailImportResponse,
  ColdEmailStartRequest,
  ColdEmailStats,
  DashboardStats,
  JobListResponse,
  RunStartResponse,
} from '../types'
import { qs, request, upload } from './client'

export const getStats = () => request<DashboardStats>('/dashboard/stats')

export const getHumanQueue = (params?: { limit?: number; offset?: number }) =>
  request<JobListResponse>(`/dashboard/human-queue${qs({ ...params })}`)

// ── Cold email ───────────────────────────────────────────────────────────────

export const uploadColdEmailFile = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return upload<ColdEmailImportResponse>('/cold-email/import', form)
}

export const startColdEmail = (body: ColdEmailStartRequest) =>
  request<RunStartResponse>('/cold-email/start', { method: 'POST', body: JSON.stringify(body) })

export const getColdEmailStats = () => request<ColdEmailStats>('/cold-email/stats')

/** The exact email a contact would receive, plus what would hurt deliverability.
 *  Shown before a campaign can be launched: this is the only feature that
 *  writes to real strangers under the user's own name. */
export const getColdEmailPreview = () =>
  request<ColdEmailPreview>('/cold-email/preview')
