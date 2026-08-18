import { describe, expect, it } from 'vitest'

import {
  ALLY_PARAM,
  GUMROAD_ALLY_KEYS,
  allyFromGumroadPing,
  isPlausibleLeadId,
  mergeReferralMetadata,
  metadataMatchFor,
  readAllyParam,
  readReferralMetadata,
  withAllyParam,
} from '../referral'
import { allyReferralPath } from '../warm-selling'

const LEAD = 'clx9k2m4p0001qz8vh3n7bt2a'
const OTHER = 'clx9k2m4p0002qz8vh3n7bt2b'

describe('isPlausibleLeadId', () => {
  it('accepts a cuid-shaped id', () => {
    expect(isPlausibleLeadId(LEAD)).toBe(true)
  })

  it('rejects the shapes a hostile query string actually sends', () => {
    for (const bad of [
      null,
      undefined,
      '',
      '   ',
      'short',
      "' OR 1=1--",
      '<script>alert(1)</script>',
      '../../etc/passwd',
      'a'.repeat(200),
    ]) {
      expect(isPlausibleLeadId(bad as string | null)).toBe(false)
    }
  })
})

describe('readAllyParam', () => {
  it('finds a valid id in a query string', () => {
    expect(readAllyParam(`?${ALLY_PARAM}=${LEAD}`)).toBe(LEAD)
  })

  it('returns null rather than passing a malformed id downstream', () => {
    expect(readAllyParam(`?${ALLY_PARAM}=nope`)).toBeNull()
    expect(readAllyParam('?other=1')).toBeNull()
  })

  it('accepts a URLSearchParams as readily as a string', () => {
    expect(readAllyParam(new URLSearchParams({ [ALLY_PARAM]: LEAD }))).toBe(LEAD)
  })
})

describe('withAllyParam', () => {
  it('adds the parameter to an absolute checkout url', () => {
    const out = withAllyParam('https://gumroad.com/l/abc', LEAD)
    expect(new URL(out).searchParams.get(ALLY_PARAM)).toBe(LEAD)
  })

  it('preserves existing query parameters', () => {
    const out = withAllyParam('https://gumroad.com/l/abc?wanted=1', LEAD)
    const url = new URL(out)
    expect(url.searchParams.get('wanted')).toBe('1')
    expect(url.searchParams.get(ALLY_PARAM)).toBe(LEAD)
  })

  it('keeps relative urls relative, with the fragment intact', () => {
    expect(withAllyParam('/launch#book-digital', LEAD)).toBe(
      `/launch?${ALLY_PARAM}=${LEAD}#book-digital`,
    )
  })

  it('returns the url untouched when there is nothing to attribute', () => {
    expect(withAllyParam('/launch', null)).toBe('/launch')
    expect(withAllyParam('/launch', 'garbage')).toBe('/launch')
  })

  it('never breaks a link it cannot parse — a dead CTA is worse than a lost credit', () => {
    expect(withAllyParam('', LEAD)).toBe('')
  })

  it('replaces rather than duplicates an existing ally param', () => {
    const out = withAllyParam(`https://x.test/?${ALLY_PARAM}=${OTHER}`, LEAD)
    expect(new URL(out).searchParams.getAll(ALLY_PARAM)).toEqual([LEAD])
  })

  it('round-trips the link an ally is actually given', () => {
    expect(readAllyParam(allyReferralPath(LEAD).split('#')[0].split('?')[1])).toBe(LEAD)
  })
})

describe('allyFromGumroadPing', () => {
  const pingWith = (key: string, value: string) => (k: string) => (k === key ? value : null)

  it.each(GUMROAD_ALLY_KEYS)('recovers the id from the %s key', (key) => {
    expect(allyFromGumroadPing(pingWith(key, LEAD))).toBe(LEAD)
  })

  it('returns null when the ping carries no attribution', () => {
    expect(allyFromGumroadPing(() => null)).toBeNull()
  })

  it('ignores a malformed value instead of crediting it', () => {
    expect(allyFromGumroadPing(pingWith(`url_params[${ALLY_PARAM}]`, 'nope'))).toBeNull()
  })
})

describe('referral metadata on the sale', () => {
  const referral = { allyLeadId: LEAD, attributedAt: '2026-08-18T00:00:00.000Z' }

  it('writes attribution that reads back', () => {
    const stored = mergeReferralMetadata(null, referral)
    expect(readReferralMetadata(stored)).toEqual(referral)
  })

  it('preserves other keys already in the column', () => {
    const stored = mergeReferralMetadata(JSON.stringify({ campaign: 'launch' }), referral)
    expect(JSON.parse(stored).campaign).toBe('launch')
    expect(readReferralMetadata(stored)?.allyLeadId).toBe(LEAD)
  })

  it('keeps an unparseable prior value rather than destroying it', () => {
    const stored = mergeReferralMetadata('not json at all', referral)
    expect(JSON.parse(stored).previous).toBe('not json at all')
    expect(readReferralMetadata(stored)?.allyLeadId).toBe(LEAD)
  })

  it('reads nothing out of empty, malformed, or unattributed metadata', () => {
    expect(readReferralMetadata(null)).toBeNull()
    expect(readReferralMetadata('')).toBeNull()
    expect(readReferralMetadata('{{{')).toBeNull()
    expect(readReferralMetadata(JSON.stringify({ other: true }))).toBeNull()
  })

  it('rejects a stored referral whose id is malformed', () => {
    const forged = JSON.stringify({ referral: { allyLeadId: 'x', attributedAt: 'now' } })
    expect(readReferralMetadata(forged)).toBeNull()
  })

  it('the LIKE fragment matches what the writer produced', () => {
    expect(mergeReferralMetadata(null, referral)).toContain(metadataMatchFor(LEAD))
  })

  it('the LIKE fragment does not match a different ally', () => {
    expect(mergeReferralMetadata(null, referral)).not.toContain(metadataMatchFor(OTHER))
  })
})
