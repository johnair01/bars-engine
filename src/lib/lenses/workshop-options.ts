import type { LensWorkshopOption } from './types'

export function createClientOptionKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function optionText(option: LensWorkshopOption | string): string {
  return typeof option === 'string' ? option : option.text
}

export function normalizeLensWorkshopOptions(value: unknown): LensWorkshopOption[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      const text = item.trim()
      return text ? [{ text }] : []
    }

    if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
      const text = item.text.trim()
      if (!text) return []
      return [{
        stableKey: typeof item.stableKey === 'string' && item.stableKey ? item.stableKey : undefined,
        tempKey: typeof item.tempKey === 'string' && item.tempKey ? item.tempKey : undefined,
        text,
      }]
    }

    return []
  })
}

export function cleanWorkshopOptions(value: unknown, limit = 10): LensWorkshopOption[] {
  return normalizeLensWorkshopOptions(value).slice(0, limit)
}

export function cleanWorkshopKeptIndexes(keptIndexes: number[], options: LensWorkshopOption[], limit = 5): number[] {
  const unique = Array.from(new Set(keptIndexes))
  return unique
    .filter((index) => Number.isInteger(index) && index >= 0 && index < options.length && options[index]?.text.trim())
    .slice(0, limit)
}

