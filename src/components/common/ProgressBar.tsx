import type { FlowEvent } from '../../types'

interface Props {
  events: FlowEvent[]
  wsState: 'connecting' | 'open' | 'closed' | 'error'
  runId: number | null
}

const NODE_LABELS: Record<string, string> = {
  scrape:    'Scraping',
  fetch_jd:  'Fetching JD',
  parse:     'Parsing JD',
  resume:    'Building Resume',
  apply:     'Applying',
  classify:  'Classifying',
  email:     'Sending Email',
}

function statusColor(status: string) {
  if (status === 'ok' || status === 'done') return 'text-emerald-600'
  if (status === 'error' || status === 'failed') return 'text-red-600'
  if (status === 'flagged') return 'text-amber-600'
  if (status === 'start' || status === 'running') return 'text-sky-600'
  return 'text-gray-600'
}

function wsIndicator(state: Props['wsState']) {
  if (state === 'open') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
  if (state === 'connecting') return <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2" />
  return <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-2" />
}

export function ProgressBar({ events, wsState, runId }: Props) {
  if (runId === null) {
    return (
      <div className="card h-full flex items-center justify-center text-gray-500 text-sm">
        No active run — start a pipeline above
      </div>
    )
  }

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          {wsIndicator(wsState)}
          Live Events — Run #{runId}
        </h3>
        <span className="text-xs text-gray-500 capitalize">{wsState}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-72">
        {events.length === 0 ? (
          <p className="text-xs text-gray-500">Waiting for events…</p>
        ) : (
          [...events].reverse().map((ev, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-gray-500 shrink-0 w-20">
                {NODE_LABELS[ev.node] ?? ev.node}
              </span>
              <span className={`font-medium shrink-0 w-16 ${statusColor(ev.status)}`}>
                {ev.status}
              </span>
              <span className="text-gray-600 truncate">{ev.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
