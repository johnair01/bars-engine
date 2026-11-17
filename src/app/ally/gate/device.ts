'use client'

/**
 * What stays on the visitor's phone: the browser id that ties their sealed acts together, and the card answers (a
 * friend's name, the visitor's own words). Every read and write is wrapped, because storage can be off or full; without
 * it a seal still works for this visit only. Nothing here is sent anywhere.
 */
import type { Act, Band, IntroKind } from '@/lib/founder-gate/acts'
import { STORE_ALLY, STORE_CARDS } from '@/lib/founder-gate/acts'

let memoryId: string | null = null

export function allyId(): string {
  try {
    const have = window.localStorage.getItem(STORE_ALLY)
    if (have && /^[A-Za-z0-9-]{8,64}$/.test(have)) return have
    const made = window.crypto.randomUUID()
    window.localStorage.setItem(STORE_ALLY, made)
    return made
  } catch {
    if (!memoryId) memoryId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `v-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    return memoryId
  }
}

/** A card the visitor has closed: sealed (the server has it, or only this phone does) or set aside with "Not today". */
export interface DeviceCard {
  state: 'sealed' | 'not-today' | 'withdrawn'
  at: string
  /** the entry's place in the lead's list, when the server kept it */
  index?: number
  kind?: IntroKind
  band?: Band
  /** the visitor's own words and pencilled answers: stay here */
  answers?: string[]
}
export type DeviceCards = Partial<Record<Act, DeviceCard>>

export function readCards(): DeviceCards {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE_CARDS) ?? '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as DeviceCards) : {}
  } catch {
    return {}
  }
}

export function writeCard(act: Act, card: DeviceCard | null): void {
  try {
    const all = readCards()
    if (card) all[act] = card
    else delete all[act]
    window.localStorage.setItem(STORE_CARDS, JSON.stringify(all))
  } catch {
    /* the card lives in this visit's memory only */
  }
}
