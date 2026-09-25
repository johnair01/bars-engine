/**
 * Wall-clock gates for the one-shot. Pure functions over an injected `now` so
 * every boundary (7:59 vs 8:00, 11:59 vs 12:00, GM slot edges) is testable
 * without mocking the clock. No cron, no background scheduler — unlock state is
 * derived from the clock on every read.
 */

import {
  GM_SLOT_COUNT,
  GM_SLOT_INTERVAL_MINUTES,
  PARTY_START_ISO,
  SPICY_UNLOCK_ISO,
} from './config'

export const PARTY_START_MS = Date.parse(PARTY_START_ISO)
export const SPICY_UNLOCK_MS = Date.parse(SPICY_UNLOCK_ISO)

/** Has the party started? Before this, players browse but hold no hand. */
export function isPartyStarted(now: Date | number = Date.now()): boolean {
  return toMs(now) >= PARTY_START_MS
}

/**
 * Is random Spicy play/draw legal yet? Spicy readings are browsable before
 * midnight — this gates the affordance, not the content.
 */
export function isSpicyPlayUnlocked(now: Date | number = Date.now()): boolean {
  return toMs(now) >= SPICY_UNLOCK_MS
}

/** Absolute unlock time of a 1-indexed GM slot. */
export function gmSlotUnlockMs(slot: number): number {
  return PARTY_START_MS + (slot - 1) * GM_SLOT_INTERVAL_MINUTES * 60_000
}

/**
 * How many GM slots the wall clock has unlocked (0 before the party starts,
 * capped at GM_SLOT_COUNT). Host early-unlocks are layered on top of this by
 * the service; nothing ever re-locks.
 */
export function gmSlotsUnlockedByClock(now: Date | number = Date.now()): number {
  const ms = toMs(now)
  if (ms < PARTY_START_MS) return 0
  const elapsedMinutes = (ms - PARTY_START_MS) / 60_000
  const slots = Math.floor(elapsedMinutes / GM_SLOT_INTERVAL_MINUTES) + 1
  return Math.min(slots, GM_SLOT_COUNT)
}

/** Milliseconds until the party starts (0 once started). For pre-party countdown copy. */
export function msUntilPartyStart(now: Date | number = Date.now()): number {
  return Math.max(0, PARTY_START_MS - toMs(now))
}

/** Milliseconds until Spicy play unlocks (0 once unlocked). */
export function msUntilSpicyUnlock(now: Date | number = Date.now()): number {
  return Math.max(0, SPICY_UNLOCK_MS - toMs(now))
}

function toMs(now: Date | number): number {
  return typeof now === 'number' ? now : now.getTime()
}
