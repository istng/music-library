import type { Album } from '../providers/types'
import { countryName } from '../utils/countries'

export default function AlbumCard({ album }: { album: Album }) {
  const discogGenres = album.genres.filter((g) => g.source === 'discogs' && g.kind === 'genre')
  const discogStyles = album.genres.filter((g) => g.source === 'discogs' && g.kind === 'style')
  const mbTags       = album.genres.filter((g) => g.source === 'musicbrainz').slice(0, 2)

  const genreLabel  = discogGenres.map((g) => g.name).join(', ') || mbTags.map((g) => g.name).join(', ')
  const styleLabel  = discogStyles.map((g) => g.name).join(', ')

  return (
    <a
      href={album.externalUrl ?? '#'}
      target="_blank"
      rel="noreferrer"
      className="album-card"
    >
      {album.imageUrl
        ? <img src={album.imageUrl} alt={album.name} />
        : <div className="album-card__placeholder" />}
      <div className="album-card__info">
        <span className="album-card__title">{album.name}</span>
        <span className="album-card__artist">
          {album.artists.map((a) => a.name).join(', ')}
        </span>
        <span className="album-card__year">
          {album.releaseDate?.slice(0, 4)}
          {album.country ? ` · ${countryName(album.country)}` : ''}
        </span>
        {genreLabel && <span className="album-card__genre">{genreLabel}</span>}
        {styleLabel && <span className="album-card__style">{styleLabel}</span>}
      </div>
    </a>
  )
}
