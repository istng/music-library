export interface Artist {
  id: string
  name: string
}

export interface Genre {
  name: string
  source: string  // discogs | musicbrainz | spotify
  kind: string    // genre | style | tag
}

export interface Album {
  id: string
  name: string
  artists: Artist[]
  releaseDate: string | null
  totalTracks: number | null
  imageUrl: string | null
  externalUrl: string | null
  label: string | null
  popularity: number | null
  country: string | null
  genres: Genre[]
  enrichedAt: string | null
  addedAt: string | null
}

// Raw shape sent to the backend sync endpoint (mirrors Spotify API snake_case)
export interface SyncItem {
  id: string
  name: string
  album_type: string
  release_date: string
  release_date_precision: string
  total_tracks: number
  images: { url: string }[]
  external_urls: { spotify: string }
  label: string | null
  popularity: number
  external_ids: { upc?: string }
  added_at: string
  artists: { id: string; name: string }[]
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  nextOffset: number | null
}

export interface MusicProvider {
  isAuthenticated(): boolean
  authenticate(): Promise<void>
  handleCallback(params: URLSearchParams): Promise<void>
  getSyncBatch(offset: number, limit: number): Promise<{ items: SyncItem[]; total: number; hasMore: boolean }>
}
