import type { Job, JobStatus } from '../../types'

interface Props {
  job: Job
}

const STEPS = ['Found', 'JD Fetched', 'Parsed', 'Resume Ready', 'Applied'] as const

const WAITING_LABELS: Record<string, string> = {
  WAITING_CAPTCHA: 'Waiting for CAPTCHA',
  WAITING_LOGIN: 'Waiting for Login',
  WAITING_OTP: 'Waiting for OTP',
  NEED_HUMAN_ACTION: 'Needs Human Action',
  FLAGGED: 'Flagged — Needs Review',
}

const PRE_EXCLUDED_LABELS: Record<string, string> = {
  DUPLICATE: 'Duplicate — already tracked',
  SKIPPED: 'Skipped',
  BLACKLISTED: 'Blacklisted Company',
}

// How far the pipeline got, derived from status.
//
// This used to test job.jd_text and job.parsed_jd — neither of which the jobs
// API returns (they are large columns deliberately left off JobResponse), so
// both were always undefined and the stepper never advanced past step 1 except
// for APPLIED. Status carries the same information and is always present.
const STEPS_BY_STATUS: Partial<Record<JobStatus, number>> = {
  SCRAPED: 1,
  PARSED: 3,
  RESUME_READY: 4,
  READY_TO_APPLY: 4,
  APPLIED: 5,
}

function completedSteps(job: Job): number {
  const known = STEPS_BY_STATUS[job.status]
  if (known !== undefined) return known
  // Halted states (FAILED / WAITING_* / excluded): show progress reached so far.
  if (job.resume_path) return 4
  return 1
}

export function PipelineStepper({ job }: Props) {
  const stalled = WAITING_LABELS[job.status]
  const excluded = PRE_EXCLUDED_LABELS[job.status]
  const failed = job.status === 'FAILED'
  const done = completedSteps(job)

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isComplete = stepNum <= done && !excluded
          const isCurrent = stepNum === done + 1 && (stalled || failed) && !excluded
          const isLast = i === STEPS.length - 1

          let circleClass = 'bg-gray-100 text-gray-600 border-gray-300'
          if (isComplete) circleClass = 'bg-emerald-600 text-white border-emerald-500'
          if (isCurrent && stalled) circleClass = 'bg-amber-600 text-white border-amber-400 animate-pulse'
          if (isCurrent && failed) circleClass = 'bg-red-600 text-white border-red-400'
          if (excluded) circleClass = 'bg-gray-100 text-gray-400 border-gray-300'

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${circleClass}`}
                >
                  {isComplete ? '✓' : stepNum}
                </div>
                <span className="text-[10px] text-gray-600 whitespace-nowrap">{label}</span>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${isComplete ? 'bg-emerald-600' : 'bg-gray-300'}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {stalled && (
        <p className="badge bg-amber-100 text-amber-800 inline-flex">⏳ {stalled} — Human Action Required</p>
      )}
      {failed && (
        <p className="badge bg-red-100 text-red-800 inline-flex">✕ Failed{job.error_message ? `: ${job.error_message}` : ''}</p>
      )}
      {excluded && (
        <p className="badge bg-gray-100 text-gray-700 inline-flex">{excluded}</p>
      )}
    </div>
  )
}
