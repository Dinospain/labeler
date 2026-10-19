import { request } from './client'

export type Account = { id: number; name: string; slug: string }

export const authApi = {
  accounts: () => request<Account[]>('/api/auth/accounts'),
  login: (slug: string) => request<{ account: Account }>('/api/auth/login', { method: 'POST', body: { slug } }),
}
