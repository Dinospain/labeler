import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import LabelsFourPanels from "./pages/LabelsFourPanels"

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<LabelsFourPanels />} />
        </Routes>
      </main>
    </div>
  )
}
