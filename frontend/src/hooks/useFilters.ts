import { useState, useMemo } from 'react'
import type { Album } from '../providers/types'
import { countryName } from '../utils/countries'

export interface Filters {
  decade:  string[]
  country: string[]
  genre:   string[]
  style:   string[]
  artist:  string[]
}

export interface FilterOptions {
  decades:   string[]
  countries: string[]
  genres:    string[]
  styles:    string[]
  artists:   string[]
}

export type SortField     = 'year' | 'name' | 'artist'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field:     SortField
  direction: SortDirection
}

function toDecade(releaseDate: string | null): string | null {
  if (!releaseDate) return null
  const year = parseInt(releaseDate.slice(0, 4))
  if (isNaN(year)) return null
  return `${Math.floor(year / 10) * 10}s`
}

function compareAlbums(a: Album, b: Album, sort: SortConfig): number {
  let cmp = 0
  if (sort.field === 'year') {
    cmp = (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '')
  } else if (sort.field === 'name') {
    cmp = a.name.localeCompare(b.name)
  } else {
    cmp = (a.artists[0]?.name ?? '').localeCompare(b.artists[0]?.name ?? '')
  }
  return sort.direction === 'asc' ? cmp : -cmp
}

const EMPTY_FILTERS: Filters = { decade: [], country: [], genre: [], style: [], artist: [] }

export function useFilters(albums: Album[]) {
  const [filters,   setFilters]   = useState<Filters>(EMPTY_FILTERS)
  const [search,    setSearch]    = useState('')
  const [sort,      setSort]      = useState<SortConfig>({ field: 'year', direction: 'desc' })

  const options = useMemo<FilterOptions>(() => {
    const decades   = new Set<string>()
    const countries = new Set<string>()
    const genres    = new Set<string>()
    const styles    = new Set<string>()
    const artists   = new Set<string>()

    for (const a of albums) {
      const d = toDecade(a.releaseDate)
      if (d) decades.add(d)
      if (a.country) countries.add(countryName(a.country) || a.country)
      for (const g of a.genres) {
        if (g.kind === 'genre') genres.add(g.name)
        if (g.kind === 'style') styles.add(g.name)
      }
      for (const ar of a.artists) artists.add(ar.name)
    }

    return {
      decades:   Array.from(decades).sort().reverse(),
      countries: Array.from(countries).sort(),
      genres:    Array.from(genres).sort(),
      styles:    Array.from(styles).sort(),
      artists:   Array.from(artists).sort(),
    }
  }, [albums])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return albums
      .filter((a) => {
        // Search across name and artists
        if (q) {
          const inName    = a.name.toLowerCase().includes(q)
          const inArtists = a.artists.some((ar) => ar.name.toLowerCase().includes(q))
          if (!inName && !inArtists) return false
        }
        // Filters — within category: OR, between categories: AND
        if (filters.decade.length  > 0 && !filters.decade.includes(toDecade(a.releaseDate) ?? '')) return false
        if (filters.country.length > 0 && !filters.country.includes(countryName(a.country) || (a.country ?? ''))) return false
        if (filters.genre.length   > 0 && !a.genres.some((g) => g.kind === 'genre' && filters.genre.includes(g.name))) return false
        if (filters.style.length   > 0 && !a.genres.some((g) => g.kind === 'style' && filters.style.includes(g.name))) return false
        if (filters.artist.length  > 0 && !a.artists.some((ar) => filters.artist.includes(ar.name))) return false
        return true
      })
      .sort((a, b) => compareAlbums(a, b, sort))
  }, [albums, filters, search, sort])

  const toggleFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))

  // Clicking the active field toggles direction; clicking a new field resets to asc
  const cycleSortField = (field: SortField) =>
    setSort((s) =>
      s.field === field
        ? { field, direction: s.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    )

  const clearAll = () => { setFilters(EMPTY_FILTERS); setSearch('') }

  const activeCount = Object.values(filters).flat().length + (search ? 1 : 0)

  return { filtered, filters, options, toggleFilter, clearAll, activeCount, search, setSearch, sort, cycleSortField }
}
