class CreateGenres < ActiveRecord::Migration[8.1]
  def change
    create_table :genres do |t|
      t.string :name,   null: false
      t.string :source, null: false  # discogs, musicbrainz, spotify
      t.string :kind,   null: false  # genre, style, tag

      t.timestamps
    end

    add_index :genres, [ :name, :source, :kind ], unique: true
  end
end
