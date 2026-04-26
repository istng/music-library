import { useState, useMemo } from 'react'
import {
  Modal, Stack, TextInput, NumberInput, TagsInput, Select,
  Group, Button, Text, Image, Box, SimpleGrid,
} from '@mantine/core'
import type { Album } from '../providers/types'
import { updateAlbum } from '../api/backend'
import { COUNTRIES } from '../utils/countries'

interface Props {
  album: Album
  genreOptions: string[]
  styleOptions: string[]
  onClose: () => void
  onSaved: () => void
}

export default function AlbumEditModal({ album, genreOptions, styleOptions, onClose, onSaved }: Props) {
  const [name, setName]               = useState(album.name)
  const [releaseDate, setReleaseDate] = useState(album.releaseDate ?? '')
  const [label, setLabel]             = useState(album.label ?? '')
  const [country, setCountry]         = useState(album.country ?? '')
  const [totalTracks, setTotalTracks] = useState<number | string>(album.totalTracks ?? '')
  const [genres, setGenres]           = useState<string[]>(
    album.genres.filter((g) => g.source === 'discogs' && g.kind === 'genre').map((g) => g.name)
  )
  const [styles, setStyles]           = useState<string[]>(
    album.genres.filter((g) => g.source === 'discogs' && g.kind === 'style').map((g) => g.name)
  )
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const countryOptions = useMemo(
    () => Object.entries(COUNTRIES)
      .map(([value, label]) => ({ value, label: `${label} (${value})` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    []
  )

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateAlbum(album.id, {
        name,
        release_date: releaseDate || null,
        label: label || null,
        country: country || null,
        total_tracks: typeof totalTracks === 'number' ? totalTracks : null,
        genres: [
          ...genres.map((n) => ({ name: n, kind: 'genre' })),
          ...styles.map((n) => ({ name: n, kind: 'style' })),
        ],
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
      setSaving(false)
    }
  }

  return (
    <Modal opened onClose={onClose} title="Editar álbum" size="1000px" centered>
      <Group align="flex-start" wrap="nowrap" gap="xl">

        {/* Left: cover */}
        <Box w={260} style={{ flexShrink: 0 }}>
          {album.imageUrl
            ? <Image src={album.imageUrl} alt={album.name} radius="sm" />
            : <Box h={260} style={{ background: 'var(--border)', borderRadius: 8 }} />}
        </Box>

        {/* Right: fields */}
        <Stack style={{ flex: 1 }} gap="sm">
          <TextInput
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextInput
            label="Artistas"
            value={album.artists.map((a) => a.name).join(', ')}
            disabled
          />

          <SimpleGrid cols={2}>
            <TextInput
              label="Fecha de lanzamiento"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
            <NumberInput
              label="Pistas"
              value={totalTracks}
              onChange={setTotalTracks}
              min={1}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Sello"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Select
              label="País"
              data={countryOptions}
              value={country || null}
              onChange={(v) => setCountry(v ?? '')}
              searchable
              clearable
              placeholder="Buscar país…"
            />
          </SimpleGrid>

          <TagsInput
            label="Géneros (Discogs)"
            data={genreOptions}
            value={genres}
            onChange={setGenres}
            placeholder="Agregar género…"
            clearable
          />

          <TagsInput
            label="Estilos (Discogs)"
            data={styleOptions}
            value={styles}
            onChange={setStyles}
            placeholder="Agregar estilo…"
            clearable
          />

          {error && <Text size="sm" c="red">{error}</Text>}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
          </Group>
        </Stack>

      </Group>
    </Modal>
  )
}
