import type { Template } from '../types'
import { request } from './client'

export const templatesApi = {
  list: () => request<Template[]>('/api/templates'),
  create: (payload: { name: string; html: string; isCurrent?: boolean }) =>
    request<Template>('/api/templates', { method: 'POST', body: payload }),
  makeCurrent: (id: number) => request<Template>(`/api/templates/${id}/make-current`, { method: 'PUT' }),
  update: (id: number, payload: Partial<Pick<Template, 'name' | 'html' | 'isCurrent'>>) =>
    request<Template>(`/api/templates/${id}`, { method: 'PUT', body: payload }),
}
