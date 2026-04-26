namespace :library do
  desc "Fetch all Spotify albums and enrich with MusicBrainz + Discogs"
  task sync_and_enrich: :environment do
    apply_mb = ->(album, data) do
      album.musicbrainz_id = data[:musicbrainz_id] if data[:musicbrainz_id]
      album.country        = data[:country]         if data[:country]
      data[:tags].each do |tag|
        genre = Genre.find_or_create_by!(name: tag, source: "musicbrainz", kind: "tag")
        album.album_genres.find_or_create_by!(genre: genre)
      end
    end

    apply_dg = ->(album, data) do
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

    enrich = ->(album) do
      return if album.enriched_at.present?
      mb_data = MusicbrainzService.new.lookup(album)
      dg_data = DiscogsService.new.lookup(album)
      album.transaction do
        apply_mb.call(album, mb_data) if mb_data
        apply_dg.call(album, dg_data) if dg_data
        album.country   ||= dg_data&.dig(:country)
        album.enriched_at = Time.current
        album.save!
      end
    end

    token = SpotifyCredentialService.access_token

    puts "Starting full library sync + enrichment"
    puts "=" * 60

    total_fetched  = 0
    total_enriched = 0
    total_failed   = 0

    SpotifyImportService.new(token).fetch_all do |albums, offset, total|
      puts "\nFetched #{offset + albums.size} / #{total} — enriching batch…"

      albums.each do |album|
        label = "#{album.name} — #{album.artists.map(&:name).join(', ')}"
        print "  #{label.truncate(52)}... "
        $stdout.flush
        total_fetched += 1

        begin
          enrich.call(album)
          parts = [ album.country, album.genres.where(kind: "style").limit(1).pluck(:name).first ].compact
          puts "✓#{parts.any? ? " #{parts.join(' · ')}" : ''}"
          total_enriched += 1
        rescue => e
          puts "✗ #{e.message}"
          total_failed += 1
        end
      end
    end

    puts
    puts "=" * 60
    puts "Done.  Fetched: #{total_fetched}  Enriched: #{total_enriched}  Failed: #{total_failed}"
  end
end
