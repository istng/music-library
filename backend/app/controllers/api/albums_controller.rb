module Api
  class AlbumsController < ApplicationController
    def index
      albums = Album.includes(:artists, :genres).by_added
      render json: albums.map { |a| serialize(a) }
    end

    def show
      album = Album.includes(:artists, :genres).find_by!(spotify_id: params[:id])
      render json: serialize(album)
    end

    private

    def serialize(album)
      {
        id:                   album.id,
        spotify_id:           album.spotify_id,
        name:                 album.name,
        album_type:           album.album_type,
        release_date:         album.release_date,
        release_date_precision: album.release_date_precision,
        total_tracks:         album.total_tracks,
        image_url:            album.image_url,
        spotify_url:          album.spotify_url,
        label:                album.label,
        popularity:           album.popularity,
        country:              album.country,
        added_at:             album.added_at,
        enriched_at:          album.enriched_at,
        artists: album.artists.map { |a| { id: a.spotify_id, name: a.name } },
        genres: album.genres.map { |g| { name: g.name, source: g.source, kind: g.kind } }
      }
    end
  end
end
