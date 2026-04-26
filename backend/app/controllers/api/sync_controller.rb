module Api
  class SyncController < ApplicationController
    # POST /api/sync
    # Body: { albums: [...spotify album objects] }
    def create
      albums_data = params.require(:albums)
      upserted = 0

      ActiveRecord::Base.transaction do
        albums_data.each do |data|
          album = upsert_album(data)
          upserted += 1
          EnrichAlbumJob.perform_later(album.id) if album.enriched_at.nil?
        end
      end

      render json: { synced: upserted }, status: :ok
    end

    # GET /api/sync/status
    def status
      render json: {
        total:        Album.count,
        unenriched:   Album.unenriched.count,
        last_synced:  Album.maximum(:synced_at)
      }
    end

    private

    def upsert_album(data)
      album = Album.find_or_initialize_by(spotify_id: data[:id])
      album.assign_attributes(
        name:                   data[:name],
        album_type:             data[:album_type],
        release_date:           data[:release_date],
        release_date_precision: data[:release_date_precision],
        total_tracks:           data[:total_tracks],
        image_url:              data.dig(:images, 0, :url),
        spotify_url:            data.dig(:external_urls, :spotify),
        label:                  data[:label],
        popularity:             data[:popularity],
        upc:                    data.dig(:external_ids, :upc),
        added_at:               data[:added_at],
        synced_at:              Time.current
      )
      album.save!

      sync_artists(album, Array(data[:artists]))
      album
    end

    def sync_artists(album, artists_data)
      artists_data.each_with_index do |a_data, i|
        artist = Artist.find_or_create_by!(spotify_id: a_data[:id]) do |a|
          a.name = a_data[:name]
        end
        AlbumArtist.find_or_create_by!(album: album, artist: artist) do |aa|
          aa.position = i
        end
      end
    end
  end
end
