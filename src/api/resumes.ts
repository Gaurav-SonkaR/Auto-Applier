import type {
  Resume,
  ResumeListResponse,
  ResumeMatchList,
  ResumeUploadResponse,
} from '../types'
import { BASE, request, upload, withToken } from './client'

/** The resume tailored to a specific job.
 *  Token goes in the URL: this is fetched by the browser via <a href>, which
 *  cannot carry an Authorization header. */
export const resumeDownloadUrl = (jobId: number) => withToken(`${BASE}/resumes/${jobId}`)

// ── Library (the user's own uploaded resumes) ────────────────────────────────

export const getResumeLibrary = () => request<ResumeListResponse>('/resumes/library')

export const uploadResume = (file: File, label = '', isMaster = false) => {
  const form = new FormData()
  form.append('file', file)
  form.append('label', label)
  form.append('is_master', String(isMaster))
  return upload<ResumeUploadResponse>('/resumes/library', form)
}

export const setMasterResume = (resumeId: number) =>
  request<Resume>(`/resumes/library/${resumeId}/master`, { method: 'PATCH' })

export const deleteResume = (resumeId: number) =>
  request<void>(`/resumes/library/${resumeId}`, { method: 'DELETE' })

export const libraryDownloadUrl = (resumeId: number) =>
  withToken(`${BASE}/resumes/library/${resumeId}/download`)

/** Rank the library against a job — which uploaded resume fits best. */
export const getResumeMatches = (jobId: number) =>
  request<ResumeMatchList>(`/resumes/match/${jobId}`)
