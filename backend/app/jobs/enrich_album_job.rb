class EnrichAlbumJob < ApplicationJob
  queue_as :default

  def perform(album_id)
    album = Album.find(album_id)
    return if album.enriched_at.present?

    mb = MusicbrainzService.new.lookup(album)
    dg = DiscogsService.new.lookup(album)

    album.transaction do
      apply_musicbrainz(album, mb) if mb
      apply_discogs(album, dg) if dg
      # MusicBrainz wins on country if both found it; Discogs fills in if MB had none
      album.country ||= dg&.dig(:country)
      album.enriched_at = Time.current
      album.save!
    end
  end

  private

  def apply_musicbrainz(album, data)
    album.musicbrainz_id = data[:musicbrainz_id] if data[:musicbrainz_id]
    album.country        = data[:country]         if data[:country]

    data[:tags].each do |tag|
      genre = Genre.find_or_create_by!(name: tag, source: "musicbrainz", kind: "tag")
      album.album_genres.find_or_create_by!(genre: genre)
    end
  end

  def apply_discogs(album, data)
    album.discogs_master_id = data[:discogs_master_id] if data[:discogs_master_id]

    data[:genres].each do |name|
      genre = Genre.find_or_create_by!(name: name, source: "discogs", kind: "genre")
      album.album_genres.find_or_create_by!(genre: genre)
    end

    data[:styles].each do |name|
      genre = Genre.find_or_create_by!(name: name, source: "discogs", kind: "style")
      album.album_genres.find_or_create_by!(genre: genre)
    end
  end
end
