class SpotifyImportService
  LIMIT = 50
  BASE  = "https://api.spotify.com/v1"

  def initialize(token)
    @token = token
  end

  # Yields each batch of upserted Album records as they come in
  def fetch_all
    offset = 0
    total  = nil

    loop do
      data = fetch_page(offset)
      total ||= data["total"]

      albums = data["items"].map { |item| upsert(item) }
      yield albums, offset, total

      offset += LIMIT
      break if offset >= total
    end
  end

  private

  def fetch_page(offset)
    uri = URI("#{BASE}/me/albums?offset=#{offset}&limit=#{LIMIT}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Get.new(uri)
    req["Authorization"] = "Bearer #{@token}"

    res = http.request(req)
    raise "Spotify API #{res.code}" unless res.code == "200"

    JSON.parse(res.body)
  end

  def upsert(item)
    a = item["album"]

    album = Album.find_or_initialize_by(spotify_id: a["id"])
    album.assign_attributes(
      name:                   a["name"],
      album_type:             a["album_type"],
      release_date:           a["release_date"],
      release_date_precision: a["release_date_precision"],
      total_tracks:           a["total_tracks"],
      image_url:              a["images"]&.first&.dig("url"),
      spotify_url:            a.dig("external_urls", "spotify"),
      label:                  a["label"],
      popularity:             a["popularity"],
      upc:                    a.dig("external_ids", "upc"),
      added_at:               item["added_at"],
      synced_at:              Time.current
    )
    album.save!

    Array(a["artists"]).each_with_index do |ad, i|
      artist = Artist.find_or_create_by!(spotify_id: ad["id"]) { |ar| ar.name = ad["name"] }
      AlbumArtist.find_or_create_by!(album: album, artist: artist) { |aa| aa.position = i }
    end

    album
  end
end
