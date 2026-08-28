import type { Job } from '../types'

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

function completedSteps(job: Job): number {
  if (job.status === 'APPLIED') return 5
  let n = 1 // "Found" is always true once a job row exists
  if (job.jd_text) n = 2
  if (job.parsed_jd) n = 3
  if (job.resume_path) n = 4
  return n
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

          let circleClass = 'bg-slate-700 text-slate-400 border-slate-600'
          if (isComplete) circleClass = 'bg-emerald-600 text-white border-emerald-500'
          if (isCurrent && stalled) circleClass = 'bg-amber-600 text-white border-amber-400 animate-pulse'
          if (isCurrent && failed) circleClass = 'bg-red-600 text-white border-red-400'
          if (excluded) circleClass = 'bg-slate-800 text-slate-500 border-slate-700'

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${circleClass}`}
                >
                  {isComplete ? '✓' : stepNum}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${isComplete ? 'bg-emerald-600' : 'bg-slate-700'}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {stalled && (
        <p className="badge bg-amber-900 text-amber-300 inline-flex">⏳ {stalled} — Human Action Required</p>
      )}
      {failed && (
        <p className="badge bg-red-900 text-red-300 inline-flex">✕ Failed{job.error_message ? `: ${job.error_message}` : ''}</p>
      )}
      {excluded && (
        <p className="badge bg-slate-700 text-slate-300 inline-flex">{excluded}</p>
      )}
    </div>
  )
}
