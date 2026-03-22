import type { MaturityPhase, SeedMetabolizationState, SoilKind } from './types'
import { isMaturityPhase, isSoilKind } from './types'

const DEFAULT_MATURITY: MaturityPhase = 'captured'

export function parseSeedMetabolization(raw: string | null | undefined): SeedMetabolizationState {
  if (raw == null || raw === '') return {}
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    if (typeof o !== 'object' || o === null) return {}
    const soilKind = o.soilKind
    const maturity = o.maturity
    const out: SeedMetabolizationState = {
      soilKind: isSoilKind(soilKind) ? soilKind : soilKind === null || soilKind === '' ? null : undefined,
      contextNote:
        typeof o.contextNote === 'string'
          ? o.contextNote.slice(0, 2000)
          : o.contextNote === null
            ? null
            : undefined,
      maturity: isMaturityPhase(maturity) ? maturity : maturity === null || maturity === '' ? null : undefined,
      compostedAt:
        typeof o.compostedAt === 'string' ? o.compostedAt.slice(0, 64) : o.compostedAt === null ? null : undefined,
      releaseNote:
        typeof o.releaseNote === 'string'
          ? o.releaseNote.slice(0, 2000)
          : o.releaseNote === null
            ? null
            : undefined,
    }
    return out
  } catch {
    return {}
  }
}

export function effectiveMaturity(state: SeedMetabolizationState): MaturityPhase {
  return state.maturity ?? DEFAULT_MATURITY
}

/** Persist only defined keys; omit empty object → null storage. */
export function serializeSeedMetabolization(state: SeedMetabolizationState): string | null {
  const payload: Record<string, unknown> = {}
  if (state.soilKind !== undefined && state.soilKind !== null) payload.soilKind = state.soilKind
  if (state.contextNote !== undefined && state.contextNote !== null && state.contextNote.trim() !== '') {
    payload.contextNote = state.contextNote.trim().slice(0, 2000)
  }
  if (state.maturity !== undefined && state.maturity !== null) payload.maturity = state.maturity
  if (state.compostedAt !== undefined && state.compostedAt !== null && state.compostedAt !== '') {
    payload.compostedAt = state.compostedAt
  }
  if (state.releaseNote !== undefined && state.releaseNote !== null && state.releaseNote.trim() !== '') {
    payload.releaseNote = state.releaseNote.trim().slice(0, 2000)
  }
  if (Object.keys(payload).length === 0) return null
  return JSON.stringify(payload)
}

export function mergeSeedMetabolization(
  raw: string | null | undefined,
  patch: Partial<SeedMetabolizationState>
): string | null {
  const current = parseSeedMetabolization(raw)
  const next: SeedMetabolizationState = { ...current, ...patch }
  // Allow explicit null clears for optional fields
  for (const key of ['soilKind', 'contextNote', 'maturity', 'compostedAt', 'releaseNote'] as const) {
    if (key in patch && patch[key] === null) {
      ;(next as Record<string, unknown>)[key] = undefined
    }
  }
  return serializeSeedMetabolization(next)
}
