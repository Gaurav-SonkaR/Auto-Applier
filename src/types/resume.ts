/** An uploaded resume in the library.
 *
 * Distinct from a *generated* resume, which belongs to a job and is fetched
 * by job id — see `resumeDownloadUrl` in `api/resumes.ts`.
 */
export interface Resume {
  resume_id: number
  filename: string
  label: string
  /** The resume that drives portal job search when no keyword is typed. */
  is_master: boolean
  skills: string[]
  extracted_title: string | null
  page_count: number | null
  uploaded_at: string
}

export interface ResumeListResponse {
  items: Resume[]
  total: number
  master_resume_id: number | null
}

export interface ResumeUploadResponse {
  resume: Resume
  message: string
}

/** One library resume scored against a job's parsed description. */
export interface ResumeMatch {
  resume: Resume
  /** 0-1: share of the job's terms found in this resume. */
  score: number
  matched_terms: string[]
}

export interface ResumeMatchList {
  job_id: number
  jd_terms: string[]
  matches: ResumeMatch[]
}
