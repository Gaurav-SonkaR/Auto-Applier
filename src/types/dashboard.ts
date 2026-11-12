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
  /** Smart Job Apply jobs waiting for the user to apply. */
  ready_to_apply: number
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
  /** Applied + ready-to-apply, over everything decided either way. */
  success_rate: number
  source_breakdown: SourceBreakdown
  stuck_jobs_count: number
}

export interface ColdEmailStartRequest {
  excel_path: string
  role?: string
  batch_size?: number
}

export interface ColdEmailStats {
  total: number
  sent: number
  failed: number
  pending: number
  remaining_today: number
}

/** What a contact would actually receive, plus what would hurt deliverability. */
export interface ColdEmailPreview {
  subject: string
  body: string
  /** Profile has everything the email needs. */
  can_send: boolean
  missing: string[]
  warnings: string[]
  /** True when no public resume link is set, so a PDF is attached instead. */
  attaches_resume: boolean
  /** Today's cap, after the warm-up ramp. */
  daily_limit: number
  configured_limit: number
  warmup_days: number
}

export interface ColdEmailImportResponse {
  saved_path: string
  row_count: number
  columns: string[]
}
