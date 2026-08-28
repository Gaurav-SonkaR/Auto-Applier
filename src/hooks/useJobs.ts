import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJobs, getJobTimeline, retryJob } from '../api/client'

export function useJobs(filters?: {
  status?: string
  portal?: string
  source?: 'portal' | 'career_site'
  limit?: number
}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobs(filters),
    select: (data) => data.items,
    refetchInterval: 10_000,
  })
}

export function useJobTimeline(jobId: number | null) {
  return useQuery({
    queryKey: ['jobs', 'timeline', jobId],
    queryFn: () => getJobTimeline(jobId as number),
    enabled: jobId != null,
  })
}

export function useRetryJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: retryJob,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
