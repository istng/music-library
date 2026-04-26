import { provider } from '../providers'
import { useAlbums } from '../hooks/useAlbums'
import { useFilters } from '../hooks/useFilters'
import { useSyncLibrary } from '../hooks/useSyncLibrary'
import FilterSidebar from '../components/FilterSidebar'
import AlbumCard from '../components/AlbumCard'

export default function LibraryPage() {
  const { albums, loading, error, reload } = useAlbums()
  const {
    filtered, filters, options, toggleFilter, clearAll,
    search, setSearch, sort, cycleSortField,
  } = useFilters(albums)
  const { syncing, synced, total: syncTotal, error: syncError, sync } = useSyncLibrary(reload)

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
        <h1>My Albums</h1>
        <div className="sync-bar">
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
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
          {loading && <p className="status-message">Loading…</p>}
        </section>
      </div>
    </div>
  )
}
