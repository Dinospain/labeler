// client/src/App.tsx
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom"
import Header from "./components/Header"
import LabelsFourPanels from "./pages/LabelsFourPanels"
import Login from "./pages/Login"
import { getAccountSlug } from "./utils/account"

function RequireAccount() {
  const slug = getAccountSlug()
  const loc = useLocation()
  if (!slug) {
    return <Navigate to="/login" state={{ from: loc }} replace />
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Страница входа всегда доступна без аккаунта */}
      <Route path="/login" element={<Login />} />

      {/* Все остальные страницы — под RequireAccount */}
      <Route element={<RequireAccount />}>
        <Route path="/" element={<LabelsFourPanels />} />
        {/* при необходимости здесь же добавляйте другие защищённые маршруты */}
      </Route>

      {/* Любое неизвестное — в корень (а там сработает гард) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
