# Music Library

Personal SPA for browsing a Spotify saved-album collection with richer metadata than Spotify provides. Albums are synced locally into SQLite and enriched with country of origin, genre, and style data from MusicBrainz and Discogs.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React 19 + TypeScript + Mantine v9 (dark theme), port 5173 |
| Backend | Rails 8.1 API-only, SQLite, port 3001 |
| Auth | Spotify PKCE (no backend secret) |
| Enrichment | MusicBrainz (country, tags) · Discogs (genre, style) |

The frontend is a single-page app. All album data lives in the Rails SQLite database — the frontend never queries Spotify directly after the initial sync.

---

## Prerequisites

- Node 20+
- Ruby 3.3+ with Bundler
- A [Spotify Developer app](https://developer.spotify.com/dashboard) (free)
- A [Discogs personal access token](https://www.discogs.com/settings/developers) (free)

---

## Environment variables

### `frontend/.env`

Copy from `frontend/.env.example`:

```
VITE_MUSIC_PROVIDER=spotify
VITE_SPOTIFY_CLIENT_ID=          # your Spotify app's Client ID
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

In your Spotify app dashboard, add `http://127.0.0.1:5173/callback` as a Redirect URI.

### `backend/.env`

Copy from `backend/.env.example`:

```
SPOTIFY_CLIENT_ID=               # same Client ID as above (used for token refresh)
DISCOGS_TOKEN=                   # Discogs personal access token
MUSICBRAINZ_USER_AGENT=MusicLibrary/1.0 (your@email.com)
```

MusicBrainz requires a descriptive User-Agent string with a contact email — no account or key needed.

---

## Setup & run

```bash
# Backend
cd backend
bundle install
bundle exec rails db:prepare
bundle exec rails s -p 3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173**.

---

## First-time Spotify login

1. Open the app and click **Connect Spotify**.
2. Complete the OAuth flow — you'll be redirected back to the app.
3. The frontend automatically sends the token to the backend, which saves it to `backend/storage/spotify_credentials.json`.

This file is the backend's sole credentials store. The backend auto-refreshes the token before it expires. If you ever delete it, just log in via the frontend again.

---

## Syncing and enriching albums

### Full sync + enrich (recommended)

Fetches every saved album from Spotify and immediately enriches each one with MusicBrainz and Discogs data:

```bash
cd backend
bundle exec rails library:sync_and_enrich
```

Requires the Spotify login step above to be completed first. Processes roughly one album every 2 seconds due to MusicBrainz rate limits (1 req/sec). A library of 500 albums takes ~17 minutes.

### UI sync only

The **Sync library** button in the app fetches albums into the database but does not enrich them. Useful for quickly seeing new additions.

### Enrich already-synced albums

If albums are in the database but not yet enriched:

```bash
cd backend
bundle exec rails enrichment:run_all
```

### Re-enrich albums with missing data

Albums that were processed but came back with no genres and no country (API miss, rate limit, or no match) are still marked as enriched and skipped by `run_all`. To retry only those:

```bash
cd backend
bundle exec rails enrichment:retry_empty
```

Safe to run multiple times — only targets albums with `enriched_at` set but zero genres and no country.

---

## Features

- Browse saved Spotify albums in a grid
- Sidebar filters: Decade, Country, Genre, Style, Artist (OR within category, AND between categories)
- Sort by year or album name (asc/desc)
- Search by title or artist
- **Edit mode** — toggle in the header; click any album to edit its metadata (name, release date, label, country, genres, styles) and save back to the database

---

## Data model (brief)

- `albums` — one row per Spotify album; stores Spotify metadata plus enrichment fields (`country`, `label`, `discogs_master_id`, `musicbrainz_id`, `enriched_at`)
- `artists` — deduplicated; joined to albums via `album_artists`
- `genres` — deduplicated by `(name, source, kind)`; joined to albums via `album_genres`
  - `source`: `discogs` | `musicbrainz`
  - `kind`: `genre` | `style` | `tag`

Editing an album via the UI replaces only its Discogs genres/styles; MusicBrainz tags are left intact.
