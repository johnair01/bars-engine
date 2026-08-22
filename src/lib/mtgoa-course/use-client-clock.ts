'use client'

import { useSyncExternalStore } from 'react'

/**
 * The wall clock, read in the browser and never during a server render.
 *
 * Returns null on the server and on the hydrating render, then the moment the
 * page came alive. Release gates treat null as "not yet open", so the board
 * shows less than it might for one frame and never more than it should.
 *
 * The value is cached at module scope because `useSyncExternalStore` compares
 * snapshots by identity: a `getSnapshot` returning a fresh `Date.now()` on every
 * read would never settle. Reading once is also all this needs — a page left
 * open across a release picks it up on the next load.
 */
let readAt: number | null = null

function getClock(): number {
  if (readAt === null) readAt = Date.now()
  return readAt
}

function getServerClock(): null {
  return null
}

function subscribe(): () => void {
  return () => {}
}

export function useClientClock(): number | null {
  return useSyncExternalStore(subscribe, getClock, getServerClock)
}
