const BASE = 'https://api.spotify.com/v1'

async function get(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${path}`)
  return res.json()
}

// Returns raw Spotify items merged with added_at for backend sync
export async function fetchSavedAlbumsRaw(token: string, offset: number, limit: number) {
  const data = await get(`/me/albums?offset=${offset}&limit=${limit}`, token)
  return {
    total: data.total as number,
    hasMore: data.next !== null,
    items: (data.items as SpotifyItem[]).map((item) => ({
      ...item.album,
      added_at: item.added_at,
    })),
  }
}

interface SpotifyItem {
  added_at: string
  album: Record<string, unknown>
}
