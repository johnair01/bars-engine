'use client'

/**
 * WorldStateProvider — Layer-2 player session state.
 *
 * Mounted once per `/world/[instanceSlug]` via the world layout file.
 * Holds the player session state that must survive route navigation between
 * `[roomSlug]` pages without dying with each per-room page mount.
 *
 * Slice 1 scope (per spec .specify/specs/world-state-provider/spec.md):
 *  - selectedFace
 *  - carryingBarId
 *  - localStorage backing (no server sync yet)
 *  - URL param fallback (backwards compat)
 *
 * Future slices add: HandSlot mirror (1.37), WorldSaveState mirror (1.38),
 * server-backed sync, debounced position auto-save.
 *
 * Hydration uses `useSyncExternalStore` so SSR returns empty state and the
 * client snapshot reads localStorage on first read — no setState-in-effect,
 * no cascading renders, React handles the swap.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

const STORAGE_PREFIX = 'world-state:'

type Persisted = {
  selectedFace: GameMasterFace | null
  carryingBarId: string | null
}

const EMPTY_PERSISTED: Persisted = {
  selectedFace: null,
  carryingBarId: null,
}

type WorldStateValue = {
  instanceSlug: string
  selectedFace: GameMasterFace | null
  carryingBarId: string | null
}

type WorldStateActionsValue = {
  setSelectedFace: (face: GameMasterFace | null) => void
  setCarrying: (barId: string | null) => void
}

const WorldStateContext = createContext<WorldStateValue | null>(null)
const WorldStateActionsContext = createContext<WorldStateActionsValue | null>(null)

// ─── Local store: a tiny per-instance external store backed by localStorage ──

type Store = {
  subscribe: (cb: () => void) => () => void
  getSnapshot: () => Persisted
  getServerSnapshot: () => Persisted
  set: (next: Persisted) => void
}

function readFromStorage(key: string): Persisted {
  if (typeof window === 'undefined') return EMPTY_PERSISTED
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return EMPTY_PERSISTED
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      selectedFace: (parsed.selectedFace as GameMasterFace | null) ?? null,
      carryingBarId: parsed.carryingBarId ?? null,
    }
  } catch {
    return EMPTY_PERSISTED
  }
}

function readUrlFallback(): Partial<Persisted> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Partial<Persisted> = {}
  const f = params.get('face')
  if (f) out.selectedFace = f as GameMasterFace
  const c = params.get('carrying')
  if (c) out.carryingBarId = c
  return out
}

function writeUrlMirror(face: GameMasterFace | null, carryingBarId: string | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (face) url.searchParams.set('face', face)
  else url.searchParams.delete('face')
  if (carryingBarId) url.searchParams.set('carrying', carryingBarId)
  else url.searchParams.delete('carrying')
  window.history.replaceState({}, '', url.toString())
}

function makeStore(instanceSlug: string): Store {
  const key = `${STORAGE_PREFIX}${instanceSlug}`
  const subscribers = new Set<() => void>()

  // Lazily initialized on first client read. SSR uses EMPTY_PERSISTED via
  // getServerSnapshot. The first client `getSnapshot` reads localStorage AND
  // also merges in any URL fallback (backwards compat with pre-WSP convention).
  let cached: Persisted | null = null

  function ensureCached(): Persisted {
    if (cached !== null) return cached
    if (typeof window === 'undefined') return EMPTY_PERSISTED
    const fromStorage = readFromStorage(key)
    const fromUrl = readUrlFallback()
    cached = {
      selectedFace: fromStorage.selectedFace ?? fromUrl.selectedFace ?? null,
      carryingBarId: fromStorage.carryingBarId ?? fromUrl.carryingBarId ?? null,
    }
    return cached
  }

  return {
    subscribe(cb) {
      subscribers.add(cb)
      return () => {
        subscribers.delete(cb)
      }
    },
    getSnapshot() {
      return ensureCached()
    },
    getServerSnapshot() {
      return EMPTY_PERSISTED
    },
    set(next) {
      cached = next
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Quota or denied — ignore. In-memory cache stays correct.
        }
      }
      subscribers.forEach((cb) => cb())
    },
  }
}

export function WorldStateProvider({
  instanceSlug,
  children,
}: {
  instanceSlug: string
  children: ReactNode
}) {
  // One store per instanceSlug. Re-mounts when navigating between instances.
  const store = useMemo(() => makeStore(instanceSlug), [instanceSlug])

  const persisted = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )

  const setSelectedFace = useCallback(
    (face: GameMasterFace | null) => {
      const next: Persisted = { ...store.getSnapshot(), selectedFace: face }
      store.set(next)
      writeUrlMirror(next.selectedFace, next.carryingBarId)
    },
    [store],
  )

  const setCarrying = useCallback(
    (barId: string | null) => {
      const next: Persisted = { ...store.getSnapshot(), carryingBarId: barId }
      store.set(next)
      writeUrlMirror(next.selectedFace, next.carryingBarId)
    },
    [store],
  )

  const stateValue = useMemo<WorldStateValue>(
    () => ({
      instanceSlug,
      selectedFace: persisted.selectedFace,
      carryingBarId: persisted.carryingBarId,
    }),
    [instanceSlug, persisted.selectedFace, persisted.carryingBarId],
  )

  const actionsValue = useMemo<WorldStateActionsValue>(
    () => ({ setSelectedFace, setCarrying }),
    [setSelectedFace, setCarrying],
  )

  return (
    <WorldStateContext.Provider value={stateValue}>
      <WorldStateActionsContext.Provider value={actionsValue}>
        {children}
      </WorldStateActionsContext.Provider>
    </WorldStateContext.Provider>
  )
}

// ─── Internal context accessors (used by hooks.ts) ────────────────────────

export function useWorldStateContextOrThrow(): WorldStateValue {
  const ctx = useContext(WorldStateContext)
  if (!ctx) {
    throw new Error(
      'useWorldState must be used within <WorldStateProvider>. ' +
        'Make sure your component renders inside /world/[instanceSlug]/...',
    )
  }
  return ctx
}

export function useWorldStateActionsContextOrThrow(): WorldStateActionsValue {
  const ctx = useContext(WorldStateActionsContext)
  if (!ctx) {
    throw new Error(
      'useWorldStateActions must be used within <WorldStateProvider>.',
    )
  }
  return ctx
}

// Exported for tests / non-hook callers.
export const __internal = {
  readFromStorage,
  readUrlFallback,
  writeUrlMirror,
  STORAGE_PREFIX,
  EMPTY_PERSISTED,
}
