export type JobStatus =
  | 'SCRAPED'
  | 'PARSED'
  | 'RESUME_READY'
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

export type JobOutcome =
  | 'REJECTED'
  | 'INTERVIEW_SCHEDULED'
  | 'ASSESSMENT_PENDING'
  | 'OFFER_RECEIVED'
  | 'NO_RESPONSE'

export interface Job {
  job_id: number
  url: string
  portal: string
  title: string
  company: string | null
  status: JobStatus
  jd_text: string | null
  parsed_jd: Record<string, unknown> | null
  resume_path: string | null
  retry_count: number
  ats_score: number | null
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

export interface RunLog {
  run_id: number
  run_type: string
  status: string       // RUNNING | COMPLETED | FAILED | STOPPED
  // Config fields (portal apply runs)
  portal: string | null
  job_title: string | null
  location: string | null
  batch_size: number | null
  // Progress counters
  jobs_scraped: number
  jobs_applied: number
  jobs_failed: number
  jobs_flagged: number
  jobs_skipped: number
  // Timestamps
  started_at: string | null
  completed_at: string | null
  // Error info
  error_message: string | null
}

export interface FunnelStage {
  stage: string
  count: number
}

export interface SourceBreakdown {
  portal_jobs: number
  career_site_jobs: number
  by_portal: Record<string, number>
}

export interface DashboardStats {
  total_jobs: number
  scraped: number
  parsed: number
  resume_ready: number
  applied: number
  failed: number
  flagged: number
  waiting_captcha: number
  waiting_login: number
  waiting_otp: number
  need_human_action: number
  duplicate: number
  skipped: number
  blacklisted: number
  emails_sent: number
  emails_failed: number
  emails_pending: number
  active_runs: number
  funnel: FunnelStage[]
  success_rate: number
  source_breakdown: SourceBreakdown
  stuck_jobs_count: number
}

export interface RunStartRequest {
  portal: 'linkedin' | 'naukri' | 'indeed' | 'wellfound' | 'cutshort' | 'web'
  /** Required for portal scraping. Optional for portal='web' — blank triggers smart search. */
  job_title: string
  location: string
  batch_size?: number
  include_checkpointed?: boolean
}

export interface RunStartResponse {
  run_id: number
  status: string
  message: string
}

export interface DiscoveryQuota {
  remaining_today: number
  daily_limit: number
  serper_configured: boolean
}

export interface ColdEmailStartRequest {
  file_path: string
  role?: string
  batch_size?: number
  subject_template?: string
  resume_per_tech_stack?: boolean
  gmail_address: string
  gmail_app_password: string
}

export interface ColdEmailStats {
  sent_today: number
  sent_total: number
  failed_total: number
  daily_limit: number
}

export interface FlowEvent {
  run_id: number | null
  job_id: number | null
  node: string
  status: string
  message: string
  data: Record<string, unknown>
}

export interface UploadResponse {
  file_path: string
  row_count: number
  columns: string[]
}
