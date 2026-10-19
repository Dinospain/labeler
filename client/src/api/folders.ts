import type { Folder } from '../types'
import { request } from './client'

export const foldersApi = {
  list: () => request<Folder[]>('/api/folders'),
  create: (name: string) => request<Folder>('/api/folders', { method: 'POST', body: { name } }),
  remove: (id: number) => request<void>(`/api/folders/${id}`, { method: 'DELETE' }),
}
