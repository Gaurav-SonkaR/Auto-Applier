import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRuns, stopRun } from '../api/client'
import type { RunLog } from '../types'

export function useRuns(limit = 10) {
  return useQuery({
    queryKey: ['runs', limit],
    queryFn: getRuns,
    refetchInterval: 8_000,
    select: (data: RunLog[]) => data.slice(0, limit),
  })
}

export function useActiveRun(): RunLog | null {
  const { data: runs = [] } = useQuery({
    queryKey: ['runs', 10],
    queryFn: getRuns,
    refetchInterval: 5_000,
  })
  return (runs as RunLog[]).find((r) => r.status === 'RUNNING') ?? null
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
