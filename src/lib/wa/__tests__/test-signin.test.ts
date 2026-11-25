import { describe, expect, it } from 'vitest'
import { checkSignInToken, makeSignInToken, safeReturnPath, SIGNIN_TTL_MS } from '../test-signin'

const secret = 's3cret'
const email = 'wa-test-aabbccddeeff@test.invalid'
const hashOf = (h: string | null) => () => h

describe('sign-in token', () => {
  it('accepts a fresh token for a test account', () => {
    const t = makeSignInToken(email, 'hash1', secret, 1000)
    expect(checkSignInToken(t, secret, hashOf('hash1'), 2000)).toEqual({ ok: true, email })
  })
  it('refuses a token signed with another secret', () => {
    const t = makeSignInToken(email, 'hash1', 'other', 1000)
    expect(checkSignInToken(t, secret, hashOf('hash1'), 2000)).toEqual({ ok: false, reason: 'bad-signature' })
  })
  it('refuses an expired token', () => {
    const t = makeSignInToken(email, 'hash1', secret, 1000)
    expect(checkSignInToken(t, secret, hashOf('hash1'), 1000 + SIGNIN_TTL_MS + 1)).toEqual({ ok: false, reason: 'expired' })
  })
  it('refuses a second use once the password hash has been rotated', () => {
    const t = makeSignInToken(email, 'hash1', secret, 1000)
    expect(checkSignInToken(t, secret, hashOf('hash2'), 2000)).toEqual({ ok: false, reason: 'already-used' })
  })
  it('refuses a token for a real account even when correctly signed', () => {
    const t = makeSignInToken('wendell@example.com', 'hash1', secret, 1000)
    expect(checkSignInToken(t, secret, hashOf('hash1'), 2000)).toEqual({ ok: false, reason: 'not-a-test-account' })
  })
  it('refuses garbage and a missing account', () => {
    expect(checkSignInToken('nonsense', secret, hashOf('x'))).toEqual({ ok: false, reason: 'malformed' })
    const t = makeSignInToken(email, 'hash1', secret, 1000)
    expect(checkSignInToken(t, secret, hashOf(null), 2000)).toEqual({ ok: false, reason: 'already-used' })
  })
})

describe('safeReturnPath', () => {
  it('keeps site paths and drops everything else', () => {
    expect(safeReturnPath('/login?x=1')).toBe('/login?x=1')
    for (const bad of ['//evil.com', 'https://evil.com', '\\evil', null, '']) expect(safeReturnPath(bad)).toBe('/')
  })
})
