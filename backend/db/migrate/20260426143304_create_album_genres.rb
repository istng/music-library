class CreateAlbumGenres < ActiveRecord::Migration[8.1]
  def change
    create_table :album_genres do |t|
      t.references :album, null: false, foreign_key: true
      t.references :genre, null: false, foreign_key: true
    end

    add_index :album_genres, [ :album_id, :genre_id ], unique: true
  end
end
