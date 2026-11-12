export type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED'

export type Portal =
  | 'linkedin'
  | 'naukri'
  | 'indeed'
  | 'wellfound'
  | 'cutshort'
  | 'instahyre'
  /** Smart Job Apply — company career pages found via Google. */
  | 'web'

export interface RunLog {
  run_id: number
  run_type: string
  status: RunStatus
  // Config (parsed from the run's config snapshot)
  portal: string | null
  job_title: string | null
  location: string | null
  batch_size: number | null
  // Counters
  jobs_scraped: number
  jobs_applied: number
  /** READY_TO_APPLY — resume built, awaiting the user's own submission. */
  jobs_ready: number
  jobs_failed: number
  jobs_flagged: number
  jobs_skipped: number
  // Timing
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

export interface RunStartRequest {
  portal: Portal
  /** Blank searches from the uploaded master resume instead of a keyword. */
  job_title: string
  location: string
  batch_size?: number
  include_checkpointed?: boolean
  /** Fill each application and screenshot it, but never submit. */
  dry_run?: boolean
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

/** Live pipeline event pushed over the run WebSocket. */
export interface FlowEvent {
  run_id: number | null
  job_id: number | null
  node: string
  status: string
  message: string
  data: Record<string, unknown>
}
