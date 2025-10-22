// client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { getAccountSlug } from './utils/account'

// Глобальная обёртка fetch, чтобы добавлять X-Account (оставьте как было)
const origFetch = window.fetch.bind(window)
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const slug = getAccountSlug()
    if (slug) {
      const headers = new Headers(init?.headers || {})
      if (!headers.has('X-Account')) headers.set('X-Account', slug)
      return origFetch(input, { ...init, headers })
    }
    return origFetch(input, init)
  } catch {
    return origFetch(input, init)
  }
}

// 🔒 Страховка: если нет slug и мы не на /login — сразу на /login
try {
  const slug = getAccountSlug()
  if (!slug && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
} catch { }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

