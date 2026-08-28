import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getHumanQueue, setJobOutcome } from '../api/client'

export function useHumanQueue() {
  return useQuery({
    queryKey: ['jobs', 'human-queue'],
    queryFn: () => getHumanQueue({ limit: 100 }),
    select: (data) => data.items,
    refetchInterval: 10_000,
  })
}

export function useSetOutcome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, outcome }: { jobId: number; outcome: string }) =>
      setJobOutcome(jobId, outcome),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['jobs', 'timeline', variables.jobId] })
    },
  })
}
