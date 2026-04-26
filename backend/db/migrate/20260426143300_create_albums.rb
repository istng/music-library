class CreateAlbums < ActiveRecord::Migration[8.1]
  def change
    create_table :albums do |t|
      t.string  :spotify_id,             null: false
      t.string  :name,                   null: false
      t.string  :album_type
      t.string  :release_date
      t.string  :release_date_precision
      t.integer :total_tracks
      t.string  :image_url
      t.string  :spotify_url
      t.string  :label
      t.integer :popularity
      t.string  :upc
      t.datetime :added_at
      t.string  :country
      t.string  :musicbrainz_id
      t.integer :discogs_master_id
      t.datetime :enriched_at
      t.datetime :synced_at

      t.timestamps
    end

    add_index :albums, :spotify_id, unique: true
    add_index :albums, :upc
    add_index :albums, :musicbrainz_id
    add_index :albums, :enriched_at
    add_index :albums, :added_at
  end
end
