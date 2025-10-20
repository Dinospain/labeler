import { create } from 'zustand'

export type Folder = { id: number; name: string; _count?: { labels: number } }

type State = {
  items: Folder[]
  fetch: () => Promise<void>
  create: (name: string) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useFolders = create<State>((set, get) => ({
  items: [],
  fetch: async () => {
    const r = await fetch('/api/folders')
    const data = await r.json()
    set({ items: data })
  },
  create: async (name: string) => {
    const r = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!r.ok) throw new Error('Create folder failed')
    await get().fetch()
  },
  remove: async (id: number) => {
    const r = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Delete folder failed')
    await get().fetch()
  },
}))
