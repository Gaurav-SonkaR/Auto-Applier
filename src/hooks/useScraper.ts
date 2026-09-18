import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startRun } from '../api/runs'
import { useActiveRun } from './useRuns'
import { useWebSocket } from './useWebSocket'
import type { RunStartRequest } from '../types'

/**
 * Starting a scrape and watching it progress.
 *
 * Wraps three things that always travel together: the start mutation, the id
 * of the run to watch, and the live WebSocket feed for it. Watching follows
 * whatever run is active — so a run started in another tab, or one still going
 * from before a page reload, streams here too instead of appearing frozen.
 */
export function useScraper() {
  const qc = useQueryClient()
  const [startedRunId, setStartedRunId] = useState<number | null>(null)
  const activeRun = useActiveRun()

  const watchedRunId = startedRunId ?? activeRun?.run_id ?? null
  const { events, wsState, clearEvents } = useWebSocket(watchedRunId)

  const mutation = useMutation({
    mutationFn: startRun,
    onSuccess: (res) => {
      clearEvents()
      setStartedRunId(res.run_id)
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const start = useCallback(
    (request: RunStartRequest) => mutation.mutate(request),
    [mutation],
  )

  return {
    start,
    isStarting: mutation.isPending,
    error: mutation.error as Error | null,
    runId: watchedRunId,
    activeRun,
    isRunning: activeRun?.status === 'RUNNING',
    events,
    wsState,
    clearEvents,
  }
}
