import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota padrão redireciona automaticamente para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Páginas do Sistema */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App