import { useState, useMemo } from 'react'
import { provider } from '../providers'
import { useAlbums } from '../hooks/useAlbums'
import { useFilters } from '../hooks/useFilters'
import { useSyncLibrary } from '../hooks/useSyncLibrary'
import FilterSidebar from '../components/FilterSidebar'
import AlbumCard from '../components/AlbumCard'
import AlbumEditModal from '../components/AlbumEditModal'
import type { Album } from '../providers/types'

export default function LibraryPage() {
  const { albums, loading, error, reload } = useAlbums()
  const {
    filtered, filters, options, toggleFilter, clearAll,
    search, setSearch, sort, cycleSortField,
  } = useFilters(albums)
  const { syncing, synced, total: syncTotal, error: syncError, sync } = useSyncLibrary(reload)
  const [editMode, setEditMode]         = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)

  const genreOptions = useMemo(() => {
    const s = new Set<string>()
    albums.forEach((a) => a.genres.filter((g) => g.source === 'discogs' && g.kind === 'genre').forEach((g) => s.add(g.name)))
    return [...s].sort()
  }, [albums])

  const styleOptions = useMemo(() => {
    const s = new Set<string>()
    albums.forEach((a) => a.genres.filter((g) => g.source === 'discogs' && g.kind === 'style').forEach((g) => s.add(g.name)))
    return [...s].sort()
  }, [albums])

  if (!provider.isAuthenticated()) {
    return (
      <main className="auth-screen">
        <h1>Music Library</h1>
        <p>Connect your Spotify account to see your saved albums.</p>
        <button onClick={() => provider.authenticate()}>Connect Spotify</button>
      </main>
    )
  }

  return (
    <div className="library-screen">
      <header className="library-header">
        <h1>My Albums <span className="album-count">{filtered.length}</span></h1>
        <div className="sync-bar">
          <button
            className={`sync-button edit-toggle${editMode ? ' edit-toggle--active' : ''}`}
            onClick={() => setEditMode((m) => !m)}
          >
            {editMode ? 'Salir de edición' : 'Editar'}
          </button>
          {syncing ? (
            <span className="sync-progress">Syncing {synced} / {syncTotal}…</span>
          ) : (
            <button className="sync-button" onClick={sync}>Sync library</button>
          )}
          {syncError && <span className="sync-error">{syncError}</span>}
        </div>
      </header>

      <div className="library-layout">
        <aside className="filter-sidebar">
          <FilterSidebar
            options={options}
            filters={filters}
            onToggle={toggleFilter}
            onClearAll={clearAll}
            search={search}
            onSearch={setSearch}
            sort={sort}
            onCycleSort={cycleSortField}
            totalAlbums={albums.length}
            filteredCount={filtered.length}
          />
        </aside>

        <section className="album-section">
          {error && <p className="status-message error">Error: {error}</p>}
          {!loading && filtered.length === 0 && !error && (
            <p className="status-message">
              {albums.length === 0
                ? 'No albums yet — run the sync task or click Sync library.'
                : 'No albums match.'}
            </p>
          )}
          <div className="album-grid">
            {filtered.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                editMode={editMode}
                onEdit={setEditingAlbum}
              />
            ))}
          </div>
          {loading && <p className="status-message">Loading…</p>}
        </section>
      </div>

      {editingAlbum && (
        <AlbumEditModal
          album={editingAlbum}
          genreOptions={genreOptions}
          styleOptions={styleOptions}
          onClose={() => setEditingAlbum(null)}
          onSaved={() => { setEditingAlbum(null); reload() }}
        />
      )}
    </div>
  )
}
