class Artist < ApplicationRecord
  has_many :album_artists, dependent: :destroy
  has_many :albums, through: :album_artists

  validates :spotify_id, presence: true, uniqueness: true
  validates :name, presence: true
end
