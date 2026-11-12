// Shared run-status display helpers — single source of truth for
// RunControls.tsx (portal runs) and CompanyCareerCard.tsx (discovery runs).
// These two cards previously carried near-identical private copies that had
// already drifted (one was missing the COMPLETED case).

const STATUS_DOT: Record<string, string> = {
  RUNNING:   'bg-emerald-400 animate-pulse',
  COMPLETED: 'bg-slate-500',
  FAILED:    'bg-red-500',
  STOPPED:   'bg-amber-500',
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${STATUS_DOT[status] ?? 'bg-slate-500'}`} />
  )
}

export function statusText(status: string): string {
  if (status === 'RUNNING') return 'text-emerald-400'
  if (status === 'COMPLETED') return 'text-slate-400'
  if (status === 'FAILED') return 'text-red-400'
  if (status === 'STOPPED') return 'text-amber-400'
  return 'text-slate-400'
}

export function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const t0 = new Date(start).getTime()
  const t1 = end ? new Date(end).getTime() : Date.now()
  const secs = Math.round((t1 - t0) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return `${mins}m ${rem}s`
}
