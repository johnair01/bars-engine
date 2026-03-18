import type { RealmData } from '../types'
import type { MapImportAdapter, MapImportResult } from './adapter'
import { JsonRealmAdapter } from './json-adapter'

const adapters: MapImportAdapter[] = [JsonRealmAdapter]

/**
 * Import map from raw string. Tries adapters in order.
 * JSON is tried first.
 */
export function importMap(raw: string, format: 'json' | 'auto' = 'auto'): MapImportResult | null {
  const toUse = format === 'json' ? [JsonRealmAdapter] : adapters
  for (const adapter of toUse) {
    if (format === 'auto' && adapter.canParse && !adapter.canParse(raw)) continue
    const result = adapter.parse(raw)
    if (result) return result
  }
  return null
}

export type { MapImportAdapter, MapImportResult }
export { JsonRealmAdapter }
