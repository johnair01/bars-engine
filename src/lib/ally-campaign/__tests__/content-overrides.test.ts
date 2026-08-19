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
  RESERVED_INVITE_SLUGS,
  checkInviteSlug,
  inviteExists,
  inviteOverrideKey,
  isTestSlug,
  listInvites,
  normalizeOverrides,
  parseAllyContentTheme,
  resolveAllyContent,
  resolveInviteWithOverrides,
  resolveMyths,
  resolveUnderstanding,
  resolveWorkstreams,
  testSlugTarget,
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

describe('checkInviteSlug', () => {
  it('accepts a normal slug and lowercases it', () => {
    expect(checkInviteSlug('Uncle-Ray')).toEqual({ ok: true, slug: 'uncle-ray' })
  })

  it('rejects empty and whitespace', () => {
    expect(checkInviteSlug('').ok).toBe(false)
    expect(checkInviteSlug('   ').ok).toBe(false)
  })

  it('rejects characters that would break the URL', () => {
    for (const bad of ['has space', 'slash/es', 'dots.', 'under_score', '-leading', 'é']) {
      expect(checkInviteSlug(bad).ok, bad).toBe(false)
    }
  })

  it('refuses slugs that a real route already owns', () => {
    // `/ally/mine/[leadId]` is the return surface — an invite here would sit under
    // a path that means something else.
    for (const reserved of RESERVED_INVITE_SLUGS) {
      expect(checkInviteSlug(reserved).ok, reserved).toBe(false)
    }
  })

  it('refuses to create something that already exists in code', () => {
    const res = checkInviteSlug('mom')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/edit it instead/i)
  })
})

describe('created invites — no deploy required', () => {
  const created = normalizeOverrides({
    invites: {
      'uncle-ray': {
        displayName: 'Uncle Ray',
        opening: 'Ray — here is the honest version.',
        cohort: 'family',
      },
    },
  })

  it('resolves a slug that exists only in the database', () => {
    const invite = resolveInviteWithOverrides('uncle-ray', created)
    expect(invite.slug).toBe('uncle-ray')
    expect(invite.displayName).toBe('Uncle Ray')
    expect(invite.opening).toBe('Ray — here is the honest version.')
  })

  it('falls back to the generic invite for anything left blank', () => {
    const invite = resolveInviteWithOverrides('uncle-ray', created)
    expect(invite.closing).toBe(DEFAULT_INVITE.closing)
    expect(invite.eyebrow).toBe(DEFAULT_INVITE.eyebrow)
  })

  it('edits itself rather than the shared default bucket', () => {
    // The bug this prevents: editing /ally/uncle-ray silently rewriting the copy
    // every unknown slug falls back to.
    expect(inviteOverrideKey('uncle-ray', created)).toBe('uncle-ray')
    expect(inviteOverrideKey('someone-else', created)).toBe(DEFAULT_INVITE_KEY)
  })

  it('validates the cohort instead of trusting stored text', () => {
    const bogus = normalizeOverrides({
      invites: { x: { opening: 'hi', cohort: 'executives' } },
    })
    expect(resolveInviteWithOverrides('x', bogus).cohort).toBe(DEFAULT_INVITE.cohort)
  })

  it('never resolves a reserved slug as an invite', () => {
    const hostile = normalizeOverrides({ invites: { mine: { opening: 'sneaky' } } })
    expect(inviteOverrideKey('mine', hostile)).toBe(DEFAULT_INVITE_KEY)
    expect(resolveInviteWithOverrides('mine', hostile).opening).toBe(DEFAULT_INVITE.opening)
  })

  it('reports existence correctly', () => {
    expect(inviteExists('uncle-ray', created)).toBe(true)
    expect(inviteExists('mom', created)).toBe(true)
    expect(inviteExists('stranger', created)).toBe(false)
  })
})

describe('test slugs — the dry-run prefix', () => {
  it('recognises the prefix', () => {
    expect(isTestSlug('test-mom')).toBe(true)
    expect(isTestSlug('TEST-MOM')).toBe(true)
    expect(isTestSlug('mom')).toBe(false)
    expect(isTestSlug(undefined)).toBe(false)
  })

  it('does not treat a slug merely containing "test" as a dry run', () => {
    // The failure that would matter: a real invite silently persisting nothing.
    expect(isTestSlug('greatest-aunt')).toBe(false)
    expect(isTestSlug('protest-group')).toBe(false)
  })

  it('resolves to the invite being rehearsed', () => {
    expect(testSlugTarget('test-mom')).toBe('mom')
    expect(testSlugTarget('test-uncle-ray')).toBe('uncle-ray')
  })

  it('rehearses the generic invite when nothing follows the prefix', () => {
    expect(testSlugTarget('test-')).toBeUndefined()
  })

  it('passes a normal slug through untouched', () => {
    expect(testSlugTarget('mom')).toBe('mom')
  })

  it('renders the real letter it is testing', () => {
    // A dry run that showed different copy would be testing nothing.
    const real = resolveAllyContent('mom', {})
    const test = resolveAllyContent(testSlugTarget('test-mom'), {})
    expect(test.invite.opening).toBe(real.invite.opening)
    expect(test.invite.displayName).toBe(real.invite.displayName)
  })

  it('picks up an admin edit to the invite it rehearses', () => {
    const edited = { invites: { mom: { opening: 'rewritten by Wendell' } } }
    expect(resolveAllyContent(testSlugTarget('test-mom'), edited).invite.opening).toBe(
      'rewritten by Wendell',
    )
  })

  it('refuses to let a test- slug be created as a real invite', () => {
    const res = checkInviteSlug('test-mom')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/dry-run prefix/i)
  })
})

describe('listInvites', () => {
  it('lists authored invites even with no overrides', () => {
    const list = listInvites({})
    expect(list).toHaveLength(Object.keys(ALLIES).length)
    expect(list.every((i) => i.source === 'code')).toBe(true)
    expect(list.every((i) => !i.edited)).toBe(true)
  })

  it('includes created invites and marks their source', () => {
    const list = listInvites({ invites: { 'uncle-ray': { opening: 'hi' } } })
    const ray = list.find((i) => i.slug === 'uncle-ray')
    expect(ray?.source).toBe('created')
    expect(list.find((i) => i.slug === 'mom')?.source).toBe('code')
  })

  it('flags an authored invite that has been edited', () => {
    const list = listInvites({ invites: { mom: { opening: 'rewritten' } } })
    expect(list.find((i) => i.slug === 'mom')?.edited).toBe(true)
  })

  it('never lists the shared default bucket or a reserved slug as an invite', () => {
    const list = listInvites({
      invites: { [DEFAULT_INVITE_KEY]: { opening: 'x' }, mine: { opening: 'y' } },
    })
    expect(list.map((i) => i.slug)).not.toContain(DEFAULT_INVITE_KEY)
    expect(list.map((i) => i.slug)).not.toContain('mine')
  })

  it('sorts code entries before created ones', () => {
    const list = listInvites({ invites: { 'aaa-created': { opening: 'x' } } })
    const firstCreated = list.findIndex((i) => i.source === 'created')
    const lastCode = list.map((i) => i.source).lastIndexOf('code')
    expect(lastCode).toBeLessThan(firstCreated)
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
