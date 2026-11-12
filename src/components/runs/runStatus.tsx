// Shared run-status display helpers — single source of truth for
// RunControls.tsx (portal runs) and CompanyCareerCard.tsx (discovery runs).
// These two cards previously carried near-identical private copies that had
// already drifted (one was missing the COMPLETED case).
//
// formatDuration lived here too until utils/formatters.ts gained one — a
// second copy of the same clock arithmetic is exactly what this file exists
// to prevent, so callers now import it from there.

const STATUS_DOT: Record<string, string> = {
  RUNNING:   'bg-emerald-500 animate-pulse',
  COMPLETED: 'bg-gray-400',
  FAILED:    'bg-red-500',
  STOPPED:   'bg-amber-500',
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${STATUS_DOT[status] ?? 'bg-gray-300'}`} />
  )
}

export function statusText(status: string): string {
  if (status === 'RUNNING') return 'text-emerald-600'
  if (status === 'COMPLETED') return 'text-gray-600'
  if (status === 'FAILED') return 'text-red-600'
  if (status === 'STOPPED') return 'text-amber-600'
  return 'text-gray-600'
}
