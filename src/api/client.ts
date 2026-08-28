import type {
  DashboardStats,
  DiscoveryQuota,
  Job,
  JobListResponse,
  JobTimeline,
  RunLog,
  RunStartRequest,
  RunStartResponse,
  ColdEmailStartRequest,
  ColdEmailStats,
  UploadResponse,
} from '../types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// Dashboard
export const getStats = () => request<DashboardStats>('/dashboard/stats')

export const getHumanQueue = (params?: { limit?: number; offset?: number }) => {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  return request<JobListResponse>(`/dashboard/human-queue?${qs}`)
}

// Jobs
export const getJobs = (params?: {
  status?: string
  portal?: string
  source?: 'portal' | 'career_site'
  limit?: number
}) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.portal) qs.set('portal', params.portal)
  if (params?.source) qs.set('source', params.source)
  if (params?.limit) qs.set('limit', String(params.limit))
  return request<JobListResponse>(`/jobs/?${qs}`)
}

export const getJob = (id: number) => request<Job>(`/jobs/${id}`)

export const getJobTimeline = (id: number) => request<JobTimeline>(`/jobs/${id}/timeline`)

export const retryJob = (id: number) =>
  request<Job>(`/jobs/${id}/retry`, { method: 'POST' })

export const setJobOutcome = (id: number, outcome: string) =>
  request<Job>(`/jobs/${id}/outcome`, { method: 'PATCH', body: JSON.stringify({ outcome }) })

export const jobScreenshotUrl = (jobId: number) => `${BASE}/jobs/${jobId}/screenshot`

// Runs
export const startRun = (body: RunStartRequest) =>
  request<RunStartResponse>('/runs/start', { method: 'POST', body: JSON.stringify(body) })

export const stopRun = (runId: number) =>
  request<{ message: string }>(`/runs/${runId}/stop`, { method: 'POST' })

export const getRun = (runId: number) => request<RunLog>(`/runs/${runId}`)

export const getRuns = () => request<RunLog[]>('/runs/')

export const getDiscoveryQuota = () => request<DiscoveryQuota>('/runs/discovery-quota')

// Resume download
export const resumeDownloadUrl = (jobId: number) => `${BASE}/resumes/${jobId}`

// Cold email
export const uploadColdEmailFile = async (file: File): Promise<UploadResponse> => {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/cold-email/import`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? res.statusText)
  }
  return res.json()
}

export const startColdEmail = (body: ColdEmailStartRequest) =>
  request<RunStartResponse>('/cold-email/start', { method: 'POST', body: JSON.stringify(body) })

export const getColdEmailStats = () => request<ColdEmailStats>('/cold-email/stats')
