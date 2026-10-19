// client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { getAccountSlug } from './utils/account'

// 🔒 Страховка: если нет slug и мы не на /login — сразу на /login
try {
  const slug = getAccountSlug()
  if (!slug && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
} catch { /* localStorage недоступен */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

