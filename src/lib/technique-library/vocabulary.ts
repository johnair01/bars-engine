/**
 * Allyship Technique Vocabulary — canonical shared tag axes.
 * Spec: .specify/specs/allyship-technique-vocabulary/spec.md
 *
 * SINGLE SOURCE OF TRUTH. This module RE-EXPORTS the existing canonical enums
 * and only ADDS the new `Superpower` axis + `Loadout`. Do NOT redefine any
 * re-exported type here — `__tests__/vocabulary-no-drift.test.ts` asserts the
 * re-exports stay identical to their origin.
 *
 * Axis ownership:
 *   - BasicMove / Operation / AllyshipDomain / Channel / Capability / Subject
 *       -> @/lib/allyship-deck/types   (the 120-card grammar)
 *   - MoveAspect / AllyshipTarget
 *       -> @/lib/quest-grammar/types   (inner/outer move grammar)
 *   - Superpower / Loadout
 *       -> here (new)
 */

import { CAPABILITIES, MOVES, OPERATIONS, DOMAINS } from '@/lib/allyship-deck/move-library'
import type { Channel, Capability } from '@/lib/allyship-deck/types'

export type {
  BasicMove,
  Operation,
  AllyshipDomain,
  Channel,
  Capability,
  OutputBar,
  Subject,
} from '@/lib/allyship-deck/types'

export type { MoveAspect, AllyshipTarget } from '@/lib/quest-grammar/types'

/**
 * The seven Superpowers — a player's *method of impact* (MTGOA Part III + Coach).
 * Channel-agnostic by design: any superpower can run any emotional channel.
 *
 * CANONICAL HOME: `@/lib/superpowers/types` (from the quiz branch). This module
 * re-exports it — single source of truth, no drift (see vocabulary-no-drift test).
 * Reconciliation: .specify/specs/superpower-system-reconciliation/reconciliation.md
 */
export type { Superpower } from '@/lib/superpowers/types'
export { SUPERPOWERS } from '@/lib/superpowers/types'

import type { Superpower } from '@/lib/superpowers/types'

/**
 * `alchemist` is the **universal substrate**: per MTGOA every player takes ≥1
 * level in Alchemy. Techniques tagged with it are eligible under any loadout.
 */
export const UNIVERSAL_SUPERPOWER: Superpower = 'alchemist'

/**
 * A player's loadout: at most two superpowers.
 *   - `inner` = how they defend/metabolize themselves (inner allyship)
 *   - `outer` = how they help others (outer allyship)
 * The Alchemy substrate is implicit and universal — not a slot.
 */
export interface Loadout {
  inner: Superpower
  outer: Superpower
}

// ── Channel ⇆ emotion/capability (element is the canonical key) ──
// Derived entirely from the CAPABILITIES Rosetta table; never hardcoded twice.

const CAP_BY_CHANNEL = new Map(CAPABILITIES.map((c) => [c.channel, c]))
const CHANNEL_BY_CAPABILITY = new Map(CAPABILITIES.map((c) => [c.capability, c.channel]))

/** Dissatisfied-pole emotion for a channel, e.g. 'fire' -> 'Anger'. */
export function emotionForChannel(channel: Channel): string {
  return CAP_BY_CHANNEL.get(channel)?.dissatisfied ?? channel
}

/** Satisfied-pole / alchemized form for a channel, e.g. 'fire' -> 'Triumph'. */
export function satisfactionForChannel(channel: Channel): string {
  return CAP_BY_CHANNEL.get(channel)?.satisfaction ?? channel
}

/** The capability a channel restores, e.g. 'fire' -> 'agency'. */
export function capabilityForChannel(channel: Channel): Capability | undefined {
  return CAP_BY_CHANNEL.get(channel)?.capability
}

/** The channel a capability belongs to, e.g. 'agency' -> 'fire'. */
export function channelForCapability(capability: Capability): Channel | undefined {
  return CHANNEL_BY_CAPABILITY.get(capability)
}

/** Map a card's latent capabilities back to their channels (deduped). */
export function channelsForCapabilities(capabilities: readonly Capability[]): Channel[] {
  const out: Channel[] = []
  for (const cap of capabilities) {
    const ch = CHANNEL_BY_CAPABILITY.get(cap)
    if (ch && !out.includes(ch)) out.push(ch)
  }
  return out
}

// ── Runtime value sets (for validation; derived from canonical sources) ──

export const MOVE_VALUES = MOVES.map((m) => m.key)
export const OPERATION_VALUES = OPERATIONS.map((o) => o.key)
export const DOMAIN_VALUES = DOMAINS.map((d) => d.key)
export const CHANNEL_VALUES = CAPABILITIES.map((c) => c.channel)
export const CAPABILITY_VALUES = CAPABILITIES.map((c) => c.capability)
export const SUBJECT_VALUES = ['self', 'other', 'collective'] as const
