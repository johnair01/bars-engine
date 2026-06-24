/**
 * BASE_POOL — the canonical base technique pool for resolution.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 1)
 *
 * The base deck's techniques (alchemy substrate + operation techniques). It
 * explicitly EXCLUDES superpower expansion-pack cards (ids `sp-*`) — those are
 * composed in per-owner via `poolWithSuperpowers(BASE_POOL, owned)`. This keeps
 * the isolation invariant: base play never surfaces pack content.
 */

import type { Technique } from './types'
import { CANONICAL_TECHNIQUES } from './canonical'

export const BASE_POOL: Technique[] = CANONICAL_TECHNIQUES.filter((t) => !t.id.startsWith('sp-'))
