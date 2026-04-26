import {
  Accordion, Badge, Checkbox, Group, ScrollArea,
  Stack, Text, Button, TextInput, Divider, SegmentedControl,
} from '@mantine/core'
import type { Filters, FilterOptions, SortField, SortConfig } from '../hooks/useFilters'

interface Props {
  options:       FilterOptions
  filters:       Filters
  onToggle:      (key: keyof Filters, value: string) => void
  onClearAll:    () => void
  search:        string
  onSearch:      (v: string) => void
  sort:          SortConfig
  onCycleSort:   (field: SortField) => void
  totalAlbums:   number
  filteredCount: number
}

interface SectionProps {
  label:     string
  filterKey: keyof Filters
  options:   string[]
  selected:  string[]
  onToggle:  (key: keyof Filters, value: string) => void
}

function FilterSection({ label, filterKey, options, selected, onToggle }: SectionProps) {
  if (options.length === 0) return null
  return (
    <Accordion.Item value={filterKey}>
      <Accordion.Control>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={500}>{label}</Text>
          {selected.length > 0 && (
            <Badge size="xs" circle variant="filled" color="green">{selected.length}</Badge>
          )}
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <ScrollArea.Autosize mah={220} offsetScrollbars>
          <Stack gap={8} py={4}>
            {options.map((option) => (
              <Checkbox
                key={option}
                size="xs"
                label={option}
                checked={selected.includes(option)}
                onChange={() => onToggle(filterKey, option)}
                styles={{ label: { cursor: 'pointer' } }}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Accordion.Panel>
    </Accordion.Item>
  )
}

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'year',   label: 'Year'   },
  { value: 'name',   label: 'Name'   },
  { value: 'artist', label: 'Artist' },
]

export default function FilterSidebar({
  options, filters, onToggle, onClearAll,
  search, onSearch, sort, onCycleSort,
  totalAlbums, filteredCount,
}: Props) {
  const activeFilterCount = Object.values(filters).flat().length
  const hasActive = activeFilterCount > 0 || search.trim().length > 0

  return (
    <div className="filter-sidebar-inner">

      {/* Search */}
      <TextInput
        placeholder="Search albums or artists…"
        value={search}
        onChange={(e) => onSearch(e.currentTarget.value)}
        size="xs"
        mb="md"
        styles={{
          input: { background: 'var(--surface)', borderColor: 'var(--border)' },
        }}
      />

      {/* Sort */}
      <Text size="xs" c="dimmed" mb={6} tt="uppercase" fw={600} lts={0.5}>Sort by</Text>
      <SegmentedControl
        fullWidth
        size="xs"
        mb={6}
        value={sort.field}
        onChange={(v) => onCycleSort(v as SortField)}
        data={SORT_FIELDS.map(({ value, label }) => ({ value, label }))}
      />
      <Group justify="flex-end" mb="md">
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          onClick={() => onCycleSort(sort.field)}
          p={0}
          h="auto"
        >
          {sort.direction === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </Button>
      </Group>

      <Divider mb="md" />

      {/* Filter header */}
      <Group justify="space-between" mb="sm">
        <Text size="xs" c="dimmed">
          {hasActive ? `${filteredCount} of ${totalAlbums}` : `${totalAlbums} albums`}
        </Text>
        {hasActive && (
          <Button variant="subtle" color="gray" size="xs" onClick={onClearAll} p={0} h="auto">
            Clear all
          </Button>
        )}
      </Group>

      {/* Filter sections */}
      <Accordion
        multiple
        defaultValue={['decade', 'genre']}
        variant="contained"
        styles={{
          item:    { border: 'none', background: 'transparent' },
          control: { padding: '8px 12px' },
          panel:   { paddingInline: 12 },
          chevron: { width: 14 },
        }}
      >
        <FilterSection label="Decade"  filterKey="decade"  options={options.decades}   selected={filters.decade}  onToggle={onToggle} />
        <FilterSection label="Country" filterKey="country" options={options.countries} selected={filters.country} onToggle={onToggle} />
        <FilterSection label="Genre"   filterKey="genre"   options={options.genres}    selected={filters.genre}   onToggle={onToggle} />
        <FilterSection label="Style"   filterKey="style"   options={options.styles}    selected={filters.style}   onToggle={onToggle} />
        <FilterSection label="Artist"  filterKey="artist"  options={options.artists}   selected={filters.artist}  onToggle={onToggle} />
      </Accordion>
    </div>
  )
}
