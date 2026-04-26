module Api
  class AlbumsController < ApplicationController
    def index
      albums = Album.includes(:artists, :genres).by_added
      render json: albums.map { |a| serialize(a) }
    end

    def show
      album = Album.includes(:artists, :genres).find_by!(spotify_id: params[:spotify_id])
      render json: serialize(album)
    end

    def update
      album = Album.includes(:artists, :genres).find_by!(spotify_id: params[:spotify_id])
      album.update!(album_params)
      replace_discogs_genres(album, params[:album][:genres]) if params[:album].key?(:genres)
      album.reload
      render json: serialize(album)
    end

    private

    def album_params
      params.require(:album).permit(:name, :release_date, :label, :country, :total_tracks)
    end

    def replace_discogs_genres(album, genre_params)
      album.album_genres.joins(:genre).where(genres: { source: "discogs" }).destroy_all
      Array(genre_params).each do |g|
        kind = g[:kind].to_s
        next unless Genre::KINDS.include?(kind)
        genre = Genre.find_or_create_by!(name: g[:name].to_s.strip, source: "discogs", kind: kind)
        album.album_genres.find_or_create_by!(genre: genre)
      end
    end

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
