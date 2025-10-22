import type { Label, Folder, Template } from './types'

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let msg = `HTTP ${r.status}`
    try {
      const b = await r.json()
      if (b?.error) msg = b.error
    } catch { }
    throw new Error(msg)
  }
  return r.json() as Promise<T>
}

export const api = {
  // -------- Folders --------
  getFolders: () => fetch('/api/folders').then(json<Folder[]>),
  createFolder: (name: string) =>
    fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(json<Folder>),
  deleteFolder: (id: number) =>
    fetch(`/api/folders/${id}`, { method: 'DELETE' }).then(async (r) => {
      if (!r.ok && r.status !== 204) {
        let msg = `HTTP ${r.status}`
        try { const b = await r.json(); if (b?.error) msg = b.error } catch { }
        throw new Error(msg)
      }
    }),
  // -------- Labels --------
  getLabels: () => fetch('/api/labels').then(json<Label[]>),
  getLabel: (id: number) => fetch(`/api/labels/${id}`).then(json<Label>),
  createLabel: (payload: Partial<Label>) =>
    fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json<Label>),
  updateLabel: (id: number, payload: Partial<Label>) =>
    fetch(`/api/labels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json<Label>),
  deleteLabel: (id: number) =>
    fetch(`/api/labels/${id}`, { method: 'DELETE' }).then(async (r) => {
      if (!r.ok && r.status !== 204) {
        let msg = `HTTP ${r.status}`
        try { const b = await r.json(); if (b?.error) msg = b.error } catch { }
        throw new Error(msg)
      }
    }),

  // -------- Templates --------
  getTemplates: () => fetch('/api/templates').then(json<Template[]>),
  createTemplate: (payload: { name: string; html: string; isCurrent?: boolean }) =>
    fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json<Template>),
  makeTemplateCurrent: (id: number) =>
    fetch(`/api/templates/${id}/make-current`, { method: 'PUT' }).then(json<Template>),
  updateTemplate: (id: number, payload: Partial<Pick<Template, 'name' | 'html' | 'isCurrent'>>) =>
    fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json<Template>),
}
