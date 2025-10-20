import { create } from 'zustand'

export type Label = {
  id: number
  productName: string
  weight?: string | null
  manufacturedAt?: string | null
  packagedAt?: string | null
  expiresAt?: string | null
  shelfLife?: string | null
  composition?: string | null
  proteins100g?: number | null
  fats100g?: number | null
  carbs100g?: number | null
  standard?: string | null
  address?: string | null
  mchsInfo?: string | null
  website?: string | null
  barcode?: string | null
  barcodeType?: string | null
  folderId?: number | null
  extra?: any
}

type State = {
  items: Label[]
  fetch: () => Promise<void>
  getOne: (id: number) => Promise<Label>
  create: (payload: Partial<Label>) => Promise<Label>
  update: (id: number, payload: Partial<Label>) => Promise<Label>
  remove: (id: number) => Promise<void>
}

export const useLabels = create<State>((set, get) => ({
  items: [],

  // Получить все этикетки
  fetch: async () => {
    const r = await fetch('/api/labels')
    const data = await r.json()
    set({ items: data.items })
  },

  // Получить одну
  getOne: async (id: number) => {
    const r = await fetch(`/api/labels/${id}`)
    if (!r.ok) throw new Error('Not found')
    return r.json()
  },

  // Создать новую
  create: async (payload: Partial<Label>) => {
    const toSend: any = {
      ...payload,
      proteins100g: payload.proteins100g ?? undefined,
      fats100g: payload.fats100g ?? undefined,
      carbs100g: payload.carbs100g ?? undefined,
      manufacturedAt: payload.manufacturedAt ?? undefined,
      packagedAt: payload.packagedAt ?? undefined,
      expiresAt: payload.expiresAt ?? undefined,
      folderId: payload.folderId ?? undefined,
    }

    const r = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend),
    })
    if (!r.ok) throw new Error('Create failed')
    const created: Label = await r.json()
    get().fetch().catch(() => {})
    return created
  },

  // Обновить существующую
  update: async (id: number, payload: Partial<Label>) => {
    const toSend: any = {
      ...payload,
      proteins100g: payload.proteins100g ?? undefined,
      fats100g: payload.fats100g ?? undefined,
      carbs100g: payload.carbs100g ?? undefined,
      manufacturedAt: payload.manufacturedAt ?? undefined,
      packagedAt: payload.packagedAt ?? undefined,
      expiresAt: payload.expiresAt ?? undefined,
      folderId: payload.folderId ?? undefined,
    }

    const r = await fetch(`/api/labels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend),
    })
    if (!r.ok) throw new Error('Update failed')
    const updated: Label = await r.json()
    get().fetch().catch(() => {})
    return updated
  },

  // Удалить
  remove: async (id: number) => {
    const r = await fetch(`/api/labels/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Delete failed')
    await get().fetch()
  },
}))
