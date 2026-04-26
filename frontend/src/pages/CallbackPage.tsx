import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { provider } from '../providers'

const BACKEND_AUTH = 'http://127.0.0.1:3001/api/auth/spotify'

async function sendTokenToBackend() {
  const raw = localStorage.getItem('spotify_token')
  if (!raw) return
  try {
    await fetch(BACKEND_AUTH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
  } catch {
    // Non-fatal — backend may not be running
  }
}

export default function CallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.search)
    provider
      .handleCallback(params)
      .then(sendTokenToBackend)
      .then(() => navigate('/', { replace: true }))
      .catch((e) => {
        console.error('Auth callback failed:', e)
        navigate('/', { replace: true })
      })
  }, [navigate])

  return <p className="status-message">Connecting to Spotify...</p>
}
