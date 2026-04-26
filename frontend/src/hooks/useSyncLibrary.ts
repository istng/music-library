import { useState, useCallback } from 'react'
import { provider } from '../providers'
import { syncBatch } from '../api/backend'

const BATCH_SIZE = 50

export interface SyncState {
  syncing: boolean
  synced: number
  total: number
  error: string | null
}

export function useSyncLibrary(onComplete?: () => void) {
  const [state, setState] = useState<SyncState>({
    syncing: false,
    synced: 0,
    total: 0,
    error: null,
  })

  const sync = useCallback(async () => {
    setState({ syncing: true, synced: 0, total: 0, error: null })

    try {
      let offset = 0
      let total = 0

      do {
        const batch = await provider.getSyncBatch(offset, BATCH_SIZE)
        total = batch.total

        setState((s) => ({ ...s, total }))
        await syncBatch(batch.items)

        offset += BATCH_SIZE
        setState((s) => ({ ...s, synced: Math.min(offset, total) }))

        if (!batch.hasMore) break
      } while (true)

      setState((s) => ({ ...s, syncing: false }))
      onComplete?.()
    } catch (e) {
      setState((s) => ({
        ...s,
        syncing: false,
        error: e instanceof Error ? e.message : 'Sync failed',
      }))
    }
  }, [onComplete])

  return { ...state, sync }
}
