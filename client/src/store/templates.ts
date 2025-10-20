import { create } from 'zustand'
import { api } from '../api'

export type Template = { id: number; name: string; html: string; isCurrent: boolean }

type State = {
  list: Template[]
  loading: boolean
  fetch: () => Promise<void>
  create: (name: string, html: string, isCurrent?: boolean) => Promise<void>
  makeCurrent: (id: number) => Promise<void>
  update: (id: number, data: Partial<Template>) => Promise<void>
}

export const useTemplates = create<State>((set, get) => ({
  list: [],
  loading: false,
  fetch: async () => {
    set({ loading: true })
    const { data } = await api.get('/templates')
    set({ list: data, loading: false })
  },
  create: async (name, html, isCurrent) => {
    await api.post('/templates', { name, html, isCurrent })
    await get().fetch()
  },
  makeCurrent: async (id) => {
    await api.put(`/templates/${id}/make-current`)
    await get().fetch()
  },
  update: async (id, data) => {
    await api.put(`/templates/${id}`, data)
    await get().fetch()
  }
}))
