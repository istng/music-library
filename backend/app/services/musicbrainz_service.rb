class MusicbrainzService
  BASE = "https://musicbrainz.org/ws/2"

  def initialize
    @user_agent = ENV.fetch("MUSICBRAINZ_USER_AGENT")
  end

  # Returns { country:, musicbrainz_id:, tags: [] } or nil
  def lookup(album)
    data = search_by_upc(album.upc) if album.upc.present?
    data ||= search_by_title(album.name, album.artists.first&.name)
    return nil unless data

    release = data.dig("releases", 0)
    return nil unless release

    tags = Array(release.dig("release-group", "tags")).sort_by { |t| -t["count"] }.map { |t| t["name"] }

    {
      musicbrainz_id: release["id"],
      country:        release["country"],
      tags:           tags
    }
  rescue => e
    Rails.logger.error "MusicBrainz lookup failed for #{album.name}: #{e.message}"
    nil
  end

  private

  def search_by_upc(upc)
    get("release", query: "barcode:#{upc}", inc: "release-group+tags")
  end

  def search_by_title(title, artist)
    query = +%Q(release:"#{escape(title)}")
    query << %Q( AND artist:"#{escape(artist)}") if artist.present?
    get("release", query: query, inc: "release-group+tags")
  end

  def get(resource, query:, inc: nil)
    params = { query: query, fmt: "json", limit: 1 }
    params[:inc] = inc if inc

    uri = URI("#{BASE}/#{resource}")
    uri.query = URI.encode_www_form(params)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = @user_agent
    request["Accept"]     = "application/json"

    response = http.request(request)
    return nil unless response.code == "200"

    sleep 1  # MusicBrainz rate limit: 1 req/sec
    JSON.parse(response.body)
  end

  def escape(str)
    str.to_s.gsub('"', '\"')
  end
end
