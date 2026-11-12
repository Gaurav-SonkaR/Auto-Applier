import type {
  Job,
  JobFilters,
  JobListResponse,
  JobTimeline,
  ManualJobStatus,
} from '../types'
import { BASE, qs, request, withToken } from './client'

export const getJobs = (filters?: JobFilters) =>
  request<JobListResponse>(`/jobs/${qs({ ...filters })}`)

export const getJob = (jobId: number) => request<Job>(`/jobs/${jobId}`)

export const getJobTimeline = (jobId: number) =>
  request<JobTimeline>(`/jobs/${jobId}/timeline`)

export const retryJob = (jobId: number) =>
  request<Job>(`/jobs/${jobId}/retry`, { method: 'POST' })

/** FR-006 manual tracking — used after applying by hand to a Smart Job Apply job. */
export const setJobStatus = (jobId: number, status: ManualJobStatus) =>
  request<Job>(`/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const setJobOutcome = (jobId: number, outcome: string) =>
  request<Job>(`/jobs/${jobId}/outcome`, {
    method: 'PATCH',
    body: JSON.stringify({ outcome }),
  })

/** Rendered in an <img src>, so the token rides in the URL. */
export const jobScreenshotUrl = (jobId: number) =>
  withToken(`${BASE}/jobs/${jobId}/screenshot`)
