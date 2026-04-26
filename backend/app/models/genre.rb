class Genre < ApplicationRecord
  has_many :album_genres, dependent: :destroy
  has_many :albums, through: :album_genres

  validates :name, :source, :kind, presence: true
  validates :name, uniqueness: { scope: [ :source, :kind ] }

  SOURCES = %w[discogs musicbrainz spotify].freeze
  KINDS   = %w[genre style tag].freeze
end
