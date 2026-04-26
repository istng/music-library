# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_26_143304) do
  create_table "album_artists", force: :cascade do |t|
    t.integer "album_id", null: false
    t.integer "artist_id", null: false
    t.integer "position", default: 0, null: false
    t.index ["album_id", "artist_id"], name: "index_album_artists_on_album_id_and_artist_id", unique: true
    t.index ["album_id"], name: "index_album_artists_on_album_id"
    t.index ["artist_id"], name: "index_album_artists_on_artist_id"
  end

  create_table "album_genres", force: :cascade do |t|
    t.integer "album_id", null: false
    t.integer "genre_id", null: false
    t.index ["album_id", "genre_id"], name: "index_album_genres_on_album_id_and_genre_id", unique: true
    t.index ["album_id"], name: "index_album_genres_on_album_id"
    t.index ["genre_id"], name: "index_album_genres_on_genre_id"
  end

  create_table "albums", force: :cascade do |t|
    t.datetime "added_at"
    t.string "album_type"
    t.string "country"
    t.datetime "created_at", null: false
    t.integer "discogs_master_id"
    t.datetime "enriched_at"
    t.string "image_url"
    t.string "label"
    t.string "musicbrainz_id"
    t.string "name", null: false
    t.integer "popularity"
    t.string "release_date"
    t.string "release_date_precision"
    t.string "spotify_id", null: false
    t.string "spotify_url"
    t.datetime "synced_at"
    t.integer "total_tracks"
    t.string "upc"
    t.datetime "updated_at", null: false
    t.index ["added_at"], name: "index_albums_on_added_at"
    t.index ["enriched_at"], name: "index_albums_on_enriched_at"
    t.index ["musicbrainz_id"], name: "index_albums_on_musicbrainz_id"
    t.index ["spotify_id"], name: "index_albums_on_spotify_id", unique: true
    t.index ["upc"], name: "index_albums_on_upc"
  end

  create_table "artists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "musicbrainz_id"
    t.string "name", null: false
    t.string "spotify_id", null: false
    t.datetime "updated_at", null: false
    t.index ["musicbrainz_id"], name: "index_artists_on_musicbrainz_id"
    t.index ["spotify_id"], name: "index_artists_on_spotify_id", unique: true
  end

  create_table "genres", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "kind", null: false
    t.string "name", null: false
    t.string "source", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "source", "kind"], name: "index_genres_on_name_and_source_and_kind", unique: true
  end

  add_foreign_key "album_artists", "albums"
  add_foreign_key "album_artists", "artists"
  add_foreign_key "album_genres", "albums"
  add_foreign_key "album_genres", "genres"
end
