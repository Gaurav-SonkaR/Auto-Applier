import type {
  AnswerMode,
  MasterProfile,
  ProfileResponse,
  QuestionBankResponse,
} from '../types'
import { request } from './client'

export const getProfile = () => request<ProfileResponse>('/profile')

/** A whole-document PUT, matching the API: the editor holds the entire profile
 *  in state, and merging partial updates into a nested document is where
 *  silent data loss lives. */
export const saveProfile = (profile: MasterProfile) =>
  request<ProfileResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify({ profile }),
  })

export const getQuestionBank = () => request<QuestionBankResponse>('/profile/questions')

/** Write, correct or clear one answer. An empty answer clears it. */
export const saveQuestionAnswer = (body: {
  question: string
  answer: string
  mode?: AnswerMode
  category?: string
}) =>
  request<QuestionBankResponse>('/profile/questions', {
    method: 'PUT',
    body: JSON.stringify(body),
  })

export const deleteQuestion = (qaId: number) =>
  request<QuestionBankResponse>(`/profile/questions/${qaId}`, { method: 'DELETE' })
