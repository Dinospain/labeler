import type { Label, LabelPayload } from '../types'
import { request } from './client'

export const labelsApi = {
  list: () => request<Label[]>('/api/labels'),
  get: (id: number) => request<Label>(`/api/labels/${id}`),
  create: (payload: LabelPayload) => request<Label>('/api/labels', { method: 'POST', body: payload }),
  update: (id: number, payload: LabelPayload) => request<Label>(`/api/labels/${id}`, { method: 'PUT', body: payload }),
  remove: (id: number) => request<void>(`/api/labels/${id}`, { method: 'DELETE' }),
}
