import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteQuestion,
  getProfile,
  getQuestionBank,
  saveProfile,
  saveQuestionAnswer,
} from '../api/profile'

const PROFILE_KEY = ['profile'] as const

/** This account's master data. */
export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: getProfile })
}

export function useSaveProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveProfile,
    // Seed the cache from the response rather than refetching — the API
    // returns the normalised document it just stored, which is exactly what a
    // refetch would fetch.
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_KEY, data)
      // The cold email body is composed from this profile, so a saved edit
      // makes any shown preview stale. Invalidation, not polling.
      qc.invalidateQueries({ queryKey: ['cold-email-preview'] })
    },
  })
}

const BANK_KEY = ['profile', 'questions'] as const

/** Every question portals ask, with this account's answers. */
export function useQuestionBank() {
  return useQuery({ queryKey: BANK_KEY, queryFn: getQuestionBank })
}

/** Both mutations return the whole bank, so the cache is seeded from the
 *  response instead of refetched — and nothing polls. */
export function useSaveQuestionAnswer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveQuestionAnswer,
    onSuccess: (data) => qc.setQueryData(BANK_KEY, data),
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: (data) => qc.setQueryData(BANK_KEY, data),
  })
}
