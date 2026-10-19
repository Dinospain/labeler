import { create } from 'zustand'
import { errorMessage } from '../api/client'
import type { Template } from '../types'
import { templatesApi } from '../api/templates'

type State = {
  templates: Template[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  create: (name: string, html: string, isCurrent?: boolean) => Promise<Template>
  makeCurrent: (id: number) => Promise<Template>
  update: (id: number, data: Partial<Pick<Template, 'name' | 'html' | 'isCurrent'>>) => Promise<Template>
}

export const useTemplatesStore = create<State>((set) => ({
  templates: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const items = await templatesApi.list()
      set({ templates: items })
    } catch (e) {
      set({ error: errorMessage(e) })
    } finally {
      set({ loading: false })
    }
  },

  create: async (name, html, isCurrent = false) => {
    const created = await templatesApi.create({ name, html, isCurrent })
    set((s) => {
      // если сделали текущим — снимем флаг у остальных на клиенте
      const next = isCurrent ? s.templates.map(t => ({ ...t, isCurrent: false })) : s.templates
      return { templates: [created, ...next] }
    })
    return created
  },

  makeCurrent: async (id) => {
    const updated = await templatesApi.makeCurrent(id)
    set((s) => ({
      templates: s.templates.map(t => ({ ...t, isCurrent: t.id === id }))
    }))
    return updated
  },

  update: async (id, data) => {
    const updated = await templatesApi.update(id, data)
    set((s) => ({
      templates: s.templates.map(t => (t.id === id ? updated : t))
    }))
    return updated
  },
}))
