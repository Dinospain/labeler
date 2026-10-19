import { getAccountSlug } from '../utils/account'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Options = { method?: string; body?: unknown }

// Единая точка для fetch: заголовок X-Account, JSON, разбор ошибок сервера, 204
export async function request<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const slug = getAccountSlug()
  if (slug) headers['X-Account'] = slug
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new Error(e instanceof Error && e.message ? e.message : 'Нет связи с сервером')
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const b = await res.json()
      if (typeof b?.error === 'string') message = b.error
    } catch { /* тело не JSON — оставляем HTTP-статус */ }
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function errorMessage(e: unknown, fallback = 'Неизвестная ошибка'): string {
  return e instanceof Error && e.message ? e.message : fallback
}
