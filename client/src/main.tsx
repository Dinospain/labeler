import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import TemplateEditor from './pages/TemplateEditor.tsx'


const router = createBrowserRouter([
  {
    path: '/', element: <App />, children: [
      { path: 'templates', element: <TemplateEditor /> }
    ]
  }
], { basename: '/' })

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
