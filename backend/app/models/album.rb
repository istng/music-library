class Album < ApplicationRecord
  has_many :album_artists, dependent: :destroy
  has_many :artists, through: :album_artists
  has_many :album_genres, dependent: :destroy
  has_many :genres, through: :album_genres

  validates :spotify_id, presence: true, uniqueness: true
  validates :name, presence: true

  scope :unenriched, -> { where(enriched_at: nil) }
  scope :by_added, -> { order(added_at: :desc) }
end
