'use client'

/**
 * Slice hooks for the WorldStateProvider.
 *
 * Prefer slice hooks (`useSelectedFace`, `useCarryingBarId`) over `useWorldState()`
 * when a component only needs a single field — they keep re-renders narrow.
 *
 * See: src/lib/world-state/WorldStateProvider.tsx
 */

import {
  useWorldStateContextOrThrow,
  useWorldStateActionsContextOrThrow,
} from './WorldStateProvider'

/** Read the full WorldState. Use a slice hook below if you only need one field. */
export function useWorldState() {
  return useWorldStateContextOrThrow()
}

/** Get the action callbacks for mutating WorldState. */
export function useWorldStateActions() {
  return useWorldStateActionsContextOrThrow()
}

/** Slice: currently selected GM face NPC the player is walking with. */
export function useSelectedFace() {
  return useWorldStateContextOrThrow().selectedFace
}

/** Slice: id of the BAR the player is currently carrying (slot 0 of the future hand). */
export function useCarryingBarId() {
  return useWorldStateContextOrThrow().carryingBarId
}
