export type JobStatus =
  | 'SCRAPED'
  | 'PARSED'
  | 'RESUME_READY'
  /** Smart Job Apply terminal state — resume built, user applies manually. */
  | 'READY_TO_APPLY'
  | 'APPLIED'
  | 'FAILED'
  | 'FLAGGED'
  | 'WAITING_CAPTCHA'
  | 'WAITING_LOGIN'
  | 'WAITING_OTP'
  | 'NEED_HUMAN_ACTION'
  | 'DUPLICATE'
  | 'SKIPPED'
  | 'BLACKLISTED'

/** Post-apply recruiting outcome — a separate dimension from JobStatus. */
export type JobOutcome =
  | 'REJECTED'
  | 'INTERVIEW_SCHEDULED'
  | 'ASSESSMENT_PENDING'
  | 'OFFER_RECEIVED'
  | 'NO_RESPONSE'

/** The statuses a human may set directly; everything else is pipeline-owned. */
export type ManualJobStatus = 'APPLIED' | 'READY_TO_APPLY' | 'SKIPPED'

export interface Job {
  job_id: number
  run_id: number | null
  /** The apply link — for READY_TO_APPLY jobs this is where the user applies. */
  url: string
  portal: string
  title: string
  company: string | null
  status: JobStatus
  resume_path: string | null
  retry_count: number
  ats_score: number | null
  fail_reason: string | null
  error_message: string | null
  redirect_url: string | null
  screenshot_path: string | null
  outcome: JobOutcome | null
  outcome_updated_at: string | null
  created_at: string
  updated_at: string
}

export interface JobListResponse {
  items: Job[]
  total: number
}

export interface JobStageEvent {
  event_id: number
  job_id: number
  run_id: number | null
  stage: string
  status: string
  message: string | null
  created_at: string
}

export interface JobTimeline {
  job: Job
  events: JobStageEvent[]
}

export interface JobFilters {
  status?: string
  portal?: string
  source?: 'portal' | 'career_site'
  limit?: number
  offset?: number
}
