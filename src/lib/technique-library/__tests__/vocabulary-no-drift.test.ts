/**
 * Guards the single-source-of-truth invariant: the technique vocabulary must
 * RE-EXPORT canonical enums, never redefine them. If these fail, someone forked
 * an axis and drift has begun.
 */
import { describe, it, expectTypeOf, expect } from 'vitest'

import type {
  BasicMove,
  Operation,
  AllyshipDomain,
  Channel,
  Capability,
  Subject,
  MoveAspect,
  AllyshipTarget,
} from '../vocabulary'

import type {
  BasicMove as DeckBasicMove,
  Operation as DeckOperation,
  AllyshipDomain as DeckDomain,
  Channel as DeckChannel,
  Capability as DeckCapability,
  Subject as DeckSubject,
} from '@/lib/allyship-deck/types'
import type { MoveAspect as QGMoveAspect, AllyshipTarget as QGTarget } from '@/lib/quest-grammar/types'

import { MOVE_VALUES, OPERATION_VALUES, DOMAIN_VALUES, CHANNEL_VALUES, CAPABILITY_VALUES } from '../vocabulary'

describe('vocabulary re-exports are identical to their origin (no drift)', () => {
  it('deck axes', () => {
    expectTypeOf<BasicMove>().toEqualTypeOf<DeckBasicMove>()
    expectTypeOf<Operation>().toEqualTypeOf<DeckOperation>()
    expectTypeOf<AllyshipDomain>().toEqualTypeOf<DeckDomain>()
    expectTypeOf<Channel>().toEqualTypeOf<DeckChannel>()
    expectTypeOf<Capability>().toEqualTypeOf<DeckCapability>()
    expectTypeOf<Subject>().toEqualTypeOf<DeckSubject>()
  })

  it('quest-grammar axes', () => {
    expectTypeOf<MoveAspect>().toEqualTypeOf<QGMoveAspect>()
    expectTypeOf<AllyshipTarget>().toEqualTypeOf<QGTarget>()
  })

  it('runtime value sets are derived from canonical sources', () => {
    expect(MOVE_VALUES).toEqual(['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up'])
    expect(OPERATION_VALUES).toEqual(['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'])
    expect(DOMAIN_VALUES).toEqual([
      'GATHERING_RESOURCES',
      'RAISE_AWARENESS',
      'DIRECT_ACTION',
      'SKILLFUL_ORGANIZING',
    ])
    expect(CHANNEL_VALUES).toEqual(['fire', 'water', 'metal', 'earth', 'wood'])
    expect(CAPABILITY_VALUES).toEqual(['agency', 'connection', 'exploration', 'rest', 'participation'])
  })
})
