import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LibraryPage from './pages/LibraryPage'
import CallbackPage from './pages/CallbackPage'

function syncTokenToBackend() {
  const raw = localStorage.getItem('spotify_token')
  if (!raw) return
  fetch('http://127.0.0.1:3001/api/auth/spotify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw,
  }).catch(() => {})
}

export default function App() {
  useEffect(() => { syncTokenToBackend() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/callback" element={<CallbackPage />} />
      </Routes>
    </BrowserRouter>
  )
}
