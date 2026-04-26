namespace :enrichment do
  desc "Re-enrich albums that were marked enriched but have no genres and no country"
  task retry_empty: :environment do
    empty = Album
      .left_joins(:genres)
      .where(genres: { id: nil })
      .where(country: nil)
      .where.not(enriched_at: nil)
      .includes(:artists)
      .order(:name)

    total = empty.count

    if total.zero?
      puts "No albums with empty enrichment found."
      next
    end

    puts "Re-enriching #{total} albums with no genres/country (~#{(total * 2.0 / 60).ceil} min estimated)"
    puts "-" * 60

    mb   = MusicbrainzService.new
    dg   = DiscogsService.new
    done = 0
    still_empty = 0

    empty.each_with_index do |album, i|
      label_str = "#{album.name} — #{album.artists.map(&:name).join(', ')}"
      print "[#{i + 1}/#{total}] #{label_str.truncate(55)}... "
      $stdout.flush

      mb_data = mb.lookup(album)
      dg_data = dg.lookup(album)

      album.transaction do
        if mb_data
          album.musicbrainz_id = mb_data[:musicbrainz_id] if mb_data[:musicbrainz_id]
          album.country        = mb_data[:country]         if mb_data[:country]
          mb_data[:tags].each do |tag|
            genre = Genre.find_or_create_by!(name: tag, source: "musicbrainz", kind: "tag")
            album.album_genres.find_or_create_by!(genre: genre)
          end
        end

        if dg_data
          album.discogs_master_id = dg_data[:discogs_master_id] if dg_data[:discogs_master_id]
          album.country         ||= dg_data[:country]
          dg_data[:genres].each do |name|
            genre = Genre.find_or_create_by!(name: name, source: "discogs", kind: "genre")
            album.album_genres.find_or_create_by!(genre: genre)
          end
          dg_data[:styles].each do |name|
            genre = Genre.find_or_create_by!(name: name, source: "discogs", kind: "style")
            album.album_genres.find_or_create_by!(genre: genre)
          end
        end

        album.enriched_at = Time.current
        album.save!
      end

      if mb_data || dg_data
        parts = [ album.country, album.genres.where(kind: "style").limit(1).pluck(:name).first ].compact
        puts "✓#{parts.any? ? " #{parts.join(' · ')}" : ' (found but no country/style)'}"
        done += 1
      else
        puts "– still no match"
        still_empty += 1
      end
    rescue => e
      puts "✗ #{e.message}"
    end

    puts "-" * 60
    puts "Done.  Recovered: #{done}  Still empty: #{still_empty}"
  end

  desc "Enrich all unenriched albums with MusicBrainz and Discogs data"
  task run_all: :environment do
    apply_mb = lambda do |album, data|
      album.musicbrainz_id = data[:musicbrainz_id] if data[:musicbrainz_id]
      album.country        = data[:country]         if data[:country]
      data[:tags].each do |tag|
        genre = Genre.find_or_create_by!(name: tag, source: "musicbrainz", kind: "tag")
        album.album_genres.find_or_create_by!(genre: genre)
      end
    end

    apply_dg = lambda do |album, data|
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

    albums = Album.unenriched.includes(:artists).order(:name)
    total  = albums.count

    if total.zero?
      if Album.count.zero?
        abort "No albums in the database yet.\nRun: bundle exec rails library:sync_and_enrich SPOTIFY_TOKEN=xxx"
      else
        puts "All #{Album.count} albums are already enriched."
      end
      next
    end

    eta_min = (total * 2.0 / 60).ceil
    puts "Enriching #{total} albums (~#{eta_min} min estimated)"
    puts "-" * 60

    mb   = MusicbrainzService.new
    dg   = DiscogsService.new
    done = 0
    failed = 0

    albums.each_with_index do |album, i|
      label = "#{album.name} — #{album.artists.map(&:name).join(', ')}"
      print "[#{i + 1}/#{total}] #{label.truncate(55)}... "
      $stdout.flush

      begin
        mb_data = mb.lookup(album)
        dg_data = dg.lookup(album)

        album.transaction do
          apply_mb.call(album, mb_data) if mb_data
          apply_dg.call(album, dg_data) if dg_data
          album.country   ||= dg_data&.dig(:country)
          album.enriched_at = Time.current
          album.save!
        end

        parts = [ album.country, album.genres.where(kind: "style").limit(1).pluck(:name).first ].compact
        puts "✓#{parts.any? ? " #{parts.join(' · ')}" : ''}"
        done += 1
      rescue => e
        puts "✗ #{e.message}"
        failed += 1
      end
    end

    puts "-" * 60
    puts "Done.  Enriched: #{done}  Failed: #{failed}  Still pending: #{Album.unenriched.count}"
  end
end
