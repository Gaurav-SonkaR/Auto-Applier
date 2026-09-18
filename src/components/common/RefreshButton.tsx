interface Props {
  onRefresh: () => unknown
  isRefreshing?: boolean
  label?: string
  className?: string
}

/**
 * Manual data refresh — the only way data updates outside of you taking an
 * action (starting a run, uploading a resume, marking a job applied, ...).
 *
 * The app deliberately does NOT poll any API on a timer: every `useQuery` here
 * has `staleTime: Infinity` (see main.tsx) so nothing refetches on its own.
 * Every page that shows server data gets one of these instead.
 */
export function RefreshButton({ onRefresh, isRefreshing, label = 'Refresh', className = '' }: Props) {
  return (
    <button
      type="button"
      className={`btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}
      onClick={() => onRefresh()}
      disabled={isRefreshing}
      title="Fetch the latest data"
    >
      <span className={isRefreshing ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
      {isRefreshing ? 'Refreshing…' : label}
    </button>
  )
}
