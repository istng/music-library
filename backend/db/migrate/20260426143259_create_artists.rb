class CreateArtists < ActiveRecord::Migration[8.1]
  def change
    create_table :artists do |t|
      t.string :spotify_id, null: false
      t.string :name, null: false
      t.string :musicbrainz_id

      t.timestamps
    end

    add_index :artists, :spotify_id, unique: true
    add_index :artists, :musicbrainz_id
  end
end
