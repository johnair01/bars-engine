/**
 * Admin content overrides.
 *
 * This layer takes stored JSON and renders it on a public page, so the tests care
 * about two things above all: a malformed override must degrade to the authored
 * default rather than crash or blank the page, and clearing a field must restore
 * the default rather than publish emptiness.
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_INVITE_KEY,
  inviteOverrideKey,
  normalizeOverrides,
  parseAllyContentTheme,
  resolveAllyContent,
  resolveInviteWithOverrides,
  resolveMyths,
  resolveUnderstanding,
  resolveWorkstreams,
} from '../content-overrides'
import { ALLIES, ALLY_MYTHS, DEFAULT_INVITE, UNDERSTANDING } from '../allies'
import { WORKSTREAMS } from '../workstreams'

describe('normalizeOverrides — hostile input', () => {
  it('returns an empty object for anything that is not an object', () => {
    for (const junk of [null, undefined, 'string', 42, true, []]) {
      expect(normalizeOverrides(junk)).toEqual({})
    }
  })

  it('drops unknown fields rather than passing them through', () => {
    const out = normalizeOverrides({
      invites: { mom: { opening: 'hello', evil: '<script>', slug: 'hacked' } },
    })
    expect(out.invites?.mom).toEqual({ opening: 'hello' })
  })

  it('drops unknown top-level buckets', () => {
    const out = normalizeOverrides({ nope: { a: 1 }, invites: { mom: { opening: 'x' } } })
    expect(Object.keys(out)).toEqual(['invites'])
  })

  it('ignores non-string values', () => {
    const out = normalizeOverrides({ invites: { mom: { opening: 12, closing: null } } })
    expect(out.invites).toBeUndefined()
  })

  it('treats whitespace-only as absent, so it falls back to the default', () => {
    const out = normalizeOverrides({ invites: { mom: { opening: '   \n  ' } } })
    expect(out.invites).toBeUndefined()
  })

  it('trims stored text', () => {
    const out = normalizeOverrides({ invites: { mom: { opening: '  hi  ' } } })
    expect(out.invites?.mom.opening).toBe('hi')
  })
})

describe('parseAllyContentTheme', () => {
  it('survives malformed JSON', () => {
    expect(parseAllyContentTheme('{not json')).toEqual({})
  })

  it('survives null and empty', () => {
    expect(parseAllyContentTheme(null)).toEqual({})
    expect(parseAllyContentTheme('')).toEqual({})
    expect(parseAllyContentTheme('{}')).toEqual({})
  })

  it('reads only its own namespaced key', () => {
    const theme = JSON.stringify({
      launchPage: { hero: { title: 'not mine' } },
      allyCampaign: { invites: { mom: { opening: 'mine' } } },
    })
    expect(parseAllyContentTheme(theme).invites?.mom.opening).toBe('mine')
  })

  it('ignores a theme whose allyCampaign key is the wrong shape', () => {
    expect(parseAllyContentTheme(JSON.stringify({ allyCampaign: 'oops' }))).toEqual({})
  })
})

describe('resolution — overrides layer over authored defaults', () => {
  it('returns the authored invite when there is no override', () => {
    expect(resolveInviteWithOverrides('mom', {})).toEqual(ALLIES.mom)
  })

  it('replaces only the fields that were edited', () => {
    const out = resolveInviteWithOverrides('mom', {
      invites: { mom: { opening: 'rewritten by Wendell' } },
    })
    expect(out.opening).toBe('rewritten by Wendell')
    // Everything else still comes from the file.
    expect(out.closing).toBe(ALLIES.mom.closing)
    expect(out.eyebrow).toBe(ALLIES.mom.eyebrow)
    expect(out.cohort).toBe(ALLIES.mom.cohort)
  })

  it('is case-insensitive on the slug', () => {
    const out = resolveInviteWithOverrides('MOM', { invites: { mom: { opening: 'x' } } })
    expect(out.opening).toBe('x')
  })

  it('routes an unknown slug to the default bucket, keeping the slug for links', () => {
    expect(inviteOverrideKey('nobody')).toBe(DEFAULT_INVITE_KEY)
    const out = resolveInviteWithOverrides('nobody', {
      invites: { [DEFAULT_INVITE_KEY]: { opening: 'shared' } },
    })
    expect(out.opening).toBe('shared')
    expect(out.slug).toBe('nobody')
  })

  it('does not let a default-bucket edit leak into a named invite', () => {
    const out = resolveInviteWithOverrides('mom', {
      invites: { [DEFAULT_INVITE_KEY]: { opening: 'generic' } },
    })
    expect(out.opening).toBe(ALLIES.mom.opening)
  })

  it('overrides myths by id and leaves the rest alone', () => {
    const out = resolveMyths({ myths: { 'ally-rescue': { truth: 'edited truth' } } })
    const edited = out.find((m) => m.id === 'ally-rescue')
    expect(edited?.truth).toBe('edited truth')
    expect(edited?.myth).toBe(ALLY_MYTHS[0].myth)
    expect(out).toHaveLength(ALLY_MYTHS.length)
  })

  it('ignores an override for a myth id that no longer exists', () => {
    const out = resolveMyths({ myths: { 'deleted-myth': { truth: 'orphan' } } })
    expect(out).toEqual(ALLY_MYTHS.map((m) => ({ ...m })))
  })

  it('overrides understanding panels by index', () => {
    const out = resolveUnderstanding({ understanding: { '1': { heading: 'New heading' } } })
    expect(out[1].heading).toBe('New heading')
    expect(out[0].heading).toBe(UNDERSTANDING[0].heading)
    expect(out[1].body).toBe(UNDERSTANDING[1].body)
  })

  it('overrides workstream prose without touching its needs or domain', () => {
    const out = resolveWorkstreams({ workstreams: { car: { theAsk: 'Lend me the money.' } } })
    const car = out.find((w) => w.key === 'car')
    expect(car?.theAsk).toBe('Lend me the money.')
    expect(car?.domain).toBe('GATHERING_RESOURCES')
    expect(car?.needs).toHaveLength(WORKSTREAMS[0].needs.length)
  })

  it('resolves everything at once for a page render', () => {
    const content = resolveAllyContent('mom', {})
    expect(content.invite.displayName).toBe('Mom')
    expect(content.myths).toHaveLength(ALLY_MYTHS.length)
    expect(content.understanding).toHaveLength(UNDERSTANDING.length)
    expect(content.workstreams).toHaveLength(WORKSTREAMS.length)
  })

  it('never yields an empty letter, even from a hostile override', () => {
    // The failure that would actually matter: a blank page sent to someone's mother.
    const content = resolveAllyContent('mom', normalizeOverrides({
      invites: { mom: { opening: '', closing: '   ', displayName: '' } },
    }))
    expect(content.invite.opening).toBe(ALLIES.mom.opening)
    expect(content.invite.closing).toBe(ALLIES.mom.closing)
    expect(content.invite.displayName).toBe(ALLIES.mom.displayName)
  })

  it('falls back to the default invite when the slug is undefined', () => {
    expect(resolveAllyContent(undefined, {}).invite.displayName).toBe(DEFAULT_INVITE.displayName)
  })
})
