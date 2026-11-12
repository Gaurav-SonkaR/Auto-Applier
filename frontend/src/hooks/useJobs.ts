import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getJob,
  getJobTimeline,
  getJobs,
  retryJob,
  setJobOutcome,
  setJobStatus,
} from '../api/jobs'
import { getHumanQueue } from '../api/dashboard'
import type { JobFilters, ManualJobStatus } from '../types'

/** Invalidate every job-derived query. Status changes move a job between lists
 *  and shift the dashboard counters, so all of them go stale together. */
function useInvalidateJobs() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
  }
}

// No refetchInterval anywhere in this file: data loads once and only updates
// when a mutation invalidates it or the caller uses the returned `refetch`
// (wired to a RefreshButton). See main.tsx for the app-wide policy.

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', 'list', filters],
    queryFn: () => getJobs(filters),
    select: (data) => data.items,
  })
}

/** Smart Job Apply results: resume built, waiting for the user to apply. */
export function useReadyToApplyJobs() {
  return useJobs({ status: 'READY_TO_APPLY', limit: 200 })
}

export function useJob(jobId: number | null) {
  return useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => getJob(jobId as number),
    enabled: jobId != null,
  })
}

export function useJobTimeline(jobId: number | null) {
  return useQuery({
    queryKey: ['jobs', 'timeline', jobId],
    queryFn: () => getJobTimeline(jobId as number),
    enabled: jobId != null,
  })
}

export function useHumanQueue() {
  return useQuery({
    queryKey: ['jobs', 'human-queue'],
    queryFn: () => getHumanQueue({ limit: 100 }),
    select: (data) => data.items,
  })
}

export function useRetryJob() {
  const invalidate = useInvalidateJobs()
  return useMutation({ mutationFn: retryJob, onSuccess: invalidate })
}

/** FR-006: mark a job Applied/Skipped by hand after applying yourself. */
export function useSetJobStatus() {
  const invalidate = useInvalidateJobs()
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: number; status: ManualJobStatus }) =>
      setJobStatus(jobId, status),
    onSuccess: invalidate,
  })
}

export function useSetOutcome() {
  const invalidate = useInvalidateJobs()
  return useMutation({
    mutationFn: ({ jobId, outcome }: { jobId: number; outcome: string }) =>
      setJobOutcome(jobId, outcome),
    onSuccess: invalidate,
  })
}
