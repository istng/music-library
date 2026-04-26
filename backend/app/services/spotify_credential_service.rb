class SpotifyCredentialService
  CREDENTIALS_FILE = Rails.root.join("storage", "spotify_credentials.json")
  TOKEN_URL        = "https://accounts.spotify.com/api/token"

  def self.store(access_token:, refresh_token:, expires_at:)
    File.write(CREDENTIALS_FILE, {
      access_token:  access_token,
      refresh_token: refresh_token,
      expires_at:    expires_at
    }.to_json)
  end

  def self.access_token
    new.access_token
  end

  def access_token
    creds = load!
    # expires_at is milliseconds from the frontend — refresh 60s before expiry
    if Time.at(creds[:expires_at] / 1000.0) < 60.seconds.from_now
      creds = refresh!(creds[:refresh_token])
    end
    creds[:access_token]
  end

  private

  def load!
    unless File.exist?(CREDENTIALS_FILE)
      abort <<~MSG
        No Spotify credentials found.
        Log in via the frontend (http://127.0.0.1:5173) first — it stores credentials automatically.
      MSG
    end
    JSON.parse(File.read(CREDENTIALS_FILE), symbolize_names: true)
  end

  def refresh!(refresh_token)
    client_id = ENV.fetch("SPOTIFY_CLIENT_ID") { abort "SPOTIFY_CLIENT_ID not set in backend .env" }

    uri  = URI(TOKEN_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Post.new(uri)
    req["Content-Type"] = "application/x-www-form-urlencoded"
    req.body = URI.encode_www_form(
      grant_type:    "refresh_token",
      refresh_token: refresh_token,
      client_id:     client_id
    )

    res = http.request(req)
    raise "Token refresh failed: #{res.code}" unless res.code == "200"

    json = JSON.parse(res.body)
    creds = {
      access_token:  json["access_token"],
      refresh_token: json["refresh_token"] || refresh_token,
      expires_at:    (Time.now.to_f + json["expires_in"]) * 1000
    }
    File.write(CREDENTIALS_FILE, creds.to_json)
    creds
  end
end
