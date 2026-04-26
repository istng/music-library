import type { Album } from '../providers/types'
import { countryName } from '../utils/countries'

interface Props {
  album: Album
  editMode?: boolean
  onEdit?: (album: Album) => void
}

export default function AlbumCard({ album, editMode, onEdit }: Props) {
  const discogGenres = album.genres.filter((g) => g.source === 'discogs' && g.kind === 'genre')
  const discogStyles = album.genres.filter((g) => g.source === 'discogs' && g.kind === 'style')
  const mbTags       = album.genres.filter((g) => g.source === 'musicbrainz').slice(0, 2)

  const genreLabel  = discogGenres.map((g) => g.name).join(', ') || mbTags.map((g) => g.name).join(', ')
  const styleLabel  = discogStyles.map((g) => g.name).join(', ')

  const inner = (
    <>
      {album.imageUrl
        ? <img src={album.imageUrl} alt={album.name} />
        : <div className="album-card__placeholder" />}
      {editMode && <div className="album-card__edit-overlay">✎</div>}
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
    </>
  )

  if (editMode) {
    return (
      <div className="album-card album-card--editable" onClick={() => onEdit?.(album)}>
        {inner}
      </div>
    )
  }

  return (
    <a
      href={album.externalUrl ?? '#'}
      target="_blank"
      rel="noreferrer"
      className="album-card"
    >
      {inner}
    </a>
  )
}
