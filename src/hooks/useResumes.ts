import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteResume,
  getResumeLibrary,
  getResumeMatches,
  setMasterResume,
  uploadResume,
} from '../api/resumes'

const LIBRARY_KEY = ['resumes', 'library'] as const

/** The user's uploaded resumes. The master one drives portal job search. */
export function useResumeLibrary() {
  return useQuery({ queryKey: LIBRARY_KEY, queryFn: getResumeLibrary })
}

export function useMasterResume() {
  const { data } = useResumeLibrary()
  return data?.items.find((r) => r.is_master) ?? null
}

function useInvalidateLibrary() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: LIBRARY_KEY })
    // Ranking is derived from library contents.
    qc.invalidateQueries({ queryKey: ['resumes', 'matches'] })
  }
}

export function useUploadResume() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: ({ file, label, isMaster }: { file: File; label?: string; isMaster?: boolean }) =>
      uploadResume(file, label ?? '', isMaster ?? false),
    onSuccess: invalidate,
  })
}

export function useSetMasterResume() {
  const invalidate = useInvalidateLibrary()
  return useMutation({ mutationFn: setMasterResume, onSuccess: invalidate })
}

export function useDeleteResume() {
  const invalidate = useInvalidateLibrary()
  return useMutation({ mutationFn: deleteResume, onSuccess: invalidate })
}

/** Which uploaded resume best fits this job, ranked against its parsed JD. */
export function useResumeMatches(jobId: number | null) {
  return useQuery({
    queryKey: ['resumes', 'matches', jobId],
    queryFn: () => getResumeMatches(jobId as number),
    enabled: jobId != null,
  })
}
