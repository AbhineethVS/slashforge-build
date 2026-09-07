import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { LandingPage } from './pages/LandingPage'
import { ToolsPage } from './pages/ToolsPage'
import { WorkspacePage } from './pages/WorkspacePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
