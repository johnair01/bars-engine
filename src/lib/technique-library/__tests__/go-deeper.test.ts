import { describe, it, expect } from 'vitest'

import type { MoveCard } from '@/lib/allyship-deck/types'
import type { Loadout } from '../vocabulary'
import { buildGoDeeper } from '../superpowers'

const LOADOUT: Loadout = { inner: 'escape_artist', outer: 'connector' }

// A base card at a published Connector-outer hero coordinate (The Warm Ask).
const WARM: Pick<MoveCard, 'move' | 'operation'> = { move: 'open_up', operation: 'diplomat' }
// A base card at an Escape-Artist-inner hero coordinate (Wise Retreat or Just Scared?).
const RETREAT: Pick<MoveCard, 'move' | 'operation'> = { move: 'clean_up', operation: 'shaman' }
// A coordinate with no published hero cell for either slot superpower.
const DRAFT: Pick<MoveCard, 'move' | 'operation'> = { move: 'wake_up', operation: 'regent' }

describe('buildGoDeeper — aspect selection', () => {
  it('self → inner slot, other → outer slot', () => {
    expect(buildGoDeeper(WARM, LOADOUT, 'self', []).superpower).toBe('escape_artist')
    expect(buildGoDeeper(WARM, LOADOUT, 'other', []).superpower).toBe('connector')
  })
})

describe('buildGoDeeper — owned vs locked vs unavailable', () => {
  it('owned + published coordinate → ok with the full technique', () => {
    const r = buildGoDeeper(WARM, LOADOUT, 'other', ['connector'])
    expect(r.state).toBe('ok')
    expect(r.available).toBe(true)
    expect(r.owned).toBe(true)
    expect(r.technique?.id).toBe('sp-connector-OPEN-DIPLOMAT-OUTER')
    expect(r.upsellSuperpower).toBeNull()
  })

  it('not owned + published coordinate → locked with upsell, no content', () => {
    const r = buildGoDeeper(WARM, LOADOUT, 'other', [])
    expect(r.state).toBe('locked')
    expect(r.available).toBe(true)
    expect(r.owned).toBe(false)
    expect(r.technique).toBeNull()
    expect(r.upsellSuperpower).toBe('connector')
    expect(r.citation.cardId).toBe('sp-connector-OPEN-DIPLOMAT-OUTER')
  })

  it('inner slot works too (escape_artist hero coordinate, self reading)', () => {
    const owned = buildGoDeeper(RETREAT, LOADOUT, 'self', ['escape_artist'])
    expect(owned.state).toBe('ok')
    expect(owned.technique?.id).toBe('sp-escape_artist-CLEAN-SHAMAN-INNER')
    expect(buildGoDeeper(RETREAT, LOADOUT, 'self', []).state).toBe('locked')
  })

  it('coordinate with only L2 (draft) content → unavailable (hide affordance)', () => {
    const r = buildGoDeeper(DRAFT, LOADOUT, 'other', ['connector'])
    expect(r.state).toBe('unavailable')
    expect(r.available).toBe(false)
    expect(r.technique).toBeNull()
  })
})
