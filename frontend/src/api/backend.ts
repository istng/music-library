import type { Album, SyncItem, Genre } from '../providers/types'

const BASE = 'http://127.0.0.1:3001/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`Backend ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export function getAlbums(): Promise<Album[]> {
  return request<BackendAlbum[]>('/albums').then((data) => data.map(mapAlbum))
}

export function syncBatch(albums: SyncItem[]): Promise<{ synced: number }> {
  return request('/sync', {
    method: 'POST',
    body: JSON.stringify({ albums }),
  })
}

export function getSyncStatus(): Promise<{ total: number; unenriched: number; last_synced: string | null }> {
  return request('/sync/status')
}

// Maps the Rails snake_case response to our frontend Album shape
interface BackendAlbum {
  spotify_id: string
  name: string
  release_date: string | null
  total_tracks: number | null
  image_url: string | null
  spotify_url: string | null
  label: string | null
  popularity: number | null
  country: string | null
  added_at: string | null
  enriched_at: string | null
  artists: { id: string; name: string }[]
  genres: Genre[]
}

function mapAlbum(d: BackendAlbum): Album {
  return {
    id:          d.spotify_id,
    name:        d.name,
    artists:     d.artists,
    releaseDate: d.release_date,
    totalTracks: d.total_tracks,
    imageUrl:    d.image_url,
    externalUrl: d.spotify_url,
    label:       d.label,
    popularity:  d.popularity,
    country:     d.country,
    genres:      d.genres,
    enrichedAt:  d.enriched_at,
    addedAt:     d.added_at,
  }
}
