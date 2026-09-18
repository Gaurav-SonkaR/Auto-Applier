import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDiscoveryQuota, getRuns, stopRun } from '../api/runs'
import type { RunLog } from '../types'

/** One shared query key so every consumer reads the same cached call rather
 *  than each opening its own request against /api/runs. */
const RUNS_KEY = ['runs', 'list'] as const

// No refetchInterval — see main.tsx for the app-wide "no polling" policy.
// `useRuns`/`useActiveRun` load once; components that show this data pair it
// with a RefreshButton, and every mutation that changes a run's state
// (start/stop) invalidates ['runs'] itself.

function useRunsQuery() {
  return useQuery({ queryKey: RUNS_KEY, queryFn: getRuns })
}

export function useRuns(limit = 10) {
  const query = useRunsQuery()
  return { ...query, data: query.data?.slice(0, limit) ?? [] }
}

export function useActiveRun(): RunLog | null {
  const { data = [] } = useRunsQuery()
  return data.find((r) => r.status === 'RUNNING') ?? null
}

export function useStopRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: stopRun,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDiscoveryQuota() {
  return useQuery({
    queryKey: ['runs', 'discovery-quota'],
    queryFn: getDiscoveryQuota,
  })
}
