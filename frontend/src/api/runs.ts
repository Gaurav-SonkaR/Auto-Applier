import type { DiscoveryQuota, RunLog, RunStartRequest, RunStartResponse } from '../types'
import { request } from './client'

export const startRun = (body: RunStartRequest) =>
  request<RunStartResponse>('/runs/start', { method: 'POST', body: JSON.stringify(body) })

export const stopRun = (runId: number) =>
  request<RunLog>(`/runs/${runId}/stop`, { method: 'POST' })

export const getRun = (runId: number) => request<RunLog>(`/runs/${runId}`)

export const getRuns = () => request<RunLog[]>('/runs/')

export const getDiscoveryQuota = () => request<DiscoveryQuota>('/runs/discovery-quota')
