class DiscogsService
  BASE = "https://api.discogs.com"

  def initialize
    @token = ENV.fetch("DISCOGS_TOKEN")
  end

  # Returns { discogs_master_id:, country:, genres: [], styles: [] } or nil
  def lookup(album)
    data = search_by_upc(album.upc) if album.upc.present?
    data ||= search_by_title(album.name, album.artists.first&.name)
    return nil unless data

    result = data.dig("results", 0)
    return nil unless result

    {
      discogs_master_id: result["master_id"],
      country:           result["country"],
      genres:            Array(result["genre"]),
      styles:            Array(result["style"])
    }
  rescue => e
    Rails.logger.error "Discogs lookup failed for #{album.name}: #{e.message}"
    nil
  end

  private

  def search_by_upc(upc)
    get("/database/search", barcode: upc, type: "release")
  end

  def search_by_title(title, artist)
    params = { release_title: title, type: "release" }
    params[:artist] = artist if artist.present?
    get("/database/search", **params)
  end

  def get(path, **params)
    uri = URI("#{BASE}#{path}")
    uri.query = URI.encode_www_form(params)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Discogs token=#{@token}"
    request["User-Agent"]    = "MusicLibraryApp/1.0"

    response = http.request(request)
    return nil unless response.code == "200"

    JSON.parse(response.body)
  end
end
