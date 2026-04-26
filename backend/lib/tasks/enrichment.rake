namespace :enrichment do
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
