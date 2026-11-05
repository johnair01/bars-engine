/**
 * The coaching walk (public/coaching/walk, Six-faces-council .specify/specs/coaching-walk FR-007) copies the six
 * questions' words into a plain module for the static page. This test fails when the copy drifts from the source.
 */
import { describe, expect, it } from 'vitest'

import { FEELINGS } from '../coaching-map'
import { withSourceTags, readSourceTags } from '../source-tags'
import * as U from '../unpacking-walk'
// @ts-expect-error plain ES module in public/, no types
import * as W from '../../../../public/coaching/walk/data.js'

describe('coaching walk data', () => {
  it('matches unpacking-walk.ts word for word', () => {
    expect(W.EXPERIENCES).toEqual(U.EXPERIENCES)
    expect(W.SATISFACTIONS).toEqual(U.SATISFACTIONS)
    expect(W.DISSATISFACTIONS).toEqual(U.DISSATISFACTIONS)
    expect(W.BODY_REGIONS).toEqual(U.BODY_REGIONS)
    expect(W.BELIEFS).toEqual(U.BELIEFS)
    expect(W.CHANNEL_LIGHT).toEqual(U.CHANNEL_LIGHT)
    expect(Object.keys(W.EMPTY).sort()).toEqual(Object.keys(U.EMPTY_WALK).sort())
  })

  it('carries each feeling’s job from coaching-map.ts', () => {
    for (const [ch, name] of Object.entries(U.CHANNEL_NAME)) {
      expect(W.JOBS[ch]).toBe(FEELINGS.find((f) => f.name === name)!.job)
    }
  })

  it('writes the same record as composeWalk', () => {
    const walk = { ...U.EMPTY_WALK, experience: 'build' as const, toward: ['joy' as const], now: 'Stuck.', feels: ['restless'], where: ['chest' as const], truth: 'x', reservations: ['I’m not ready'] }
    expect(W.composeWalk(walk)).toBe(U.composeWalk(walk))
    expect(W.composeWalk(U.EMPTY_WALK)).toBe(U.composeWalk(U.EMPTY_WALK))
  })

  it('passes the source tags as source-tags.ts does', () => {
    const search = '?utm_source=letter&utm_campaign=backers&name=secret'
    const href = 'https://calendly.com/wendell-britt/coaching-75'
    expect(W.withTags(href, search)).toBe(withSourceTags(href, readSourceTags(search)))
  })
})
