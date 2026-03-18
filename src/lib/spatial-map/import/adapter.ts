import type { RealmData } from '../types'

/**
 * Adapter interface for importing maps from different formats.
 * Implementations: JsonRealmAdapter, (future) TiledAdapter, ImageAdapter.
 */
export interface MapImportAdapter {
  /** Format identifier, e.g. 'json' | 'tiled' */
  format: string
  /** Parse raw input into RealmData. Returns null if invalid. */
  parse(raw: string): MapImportResult | null
  /** Optional: validate without full parse */
  canParse?(raw: string): boolean
}

export interface MapImportResult {
  realmData: RealmData
  warnings: string[]
}
