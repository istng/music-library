import type { MusicProvider } from './types'
import { SpotifyProvider } from './spotify'

function createProvider(): MusicProvider {
  const name = import.meta.env.VITE_MUSIC_PROVIDER ?? 'spotify'

  if (name === 'spotify') {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    if (!clientId) throw new Error('VITE_SPOTIFY_CLIENT_ID is not set in .env')
    if (!redirectUri) throw new Error('VITE_SPOTIFY_REDIRECT_URI is not set in .env')
    return new SpotifyProvider(clientId, redirectUri)
  }

  throw new Error(`Unknown provider: "${name}"`)
}

export const provider = createProvider()
