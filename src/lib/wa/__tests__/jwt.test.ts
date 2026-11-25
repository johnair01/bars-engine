import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { pkceChallenge, rsaPublicJwk, signJwt, signJwtRs256, verifyJwt, verifyPkce } from '../jwt'

const SECRET = 'test-signing-secret'

describe('wa jwt', () => {
  it('round-trips a signed payload', () => {
    const token = signJwt({ sub: 'player-1', iss: 'https://example.test', aud: 'wa' }, SECRET)
    const result = verifyJwt(token, SECRET, {
      issuer: 'https://example.test',
      audience: 'wa',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.payload.sub).toBe('player-1')
  })

  it('refuses a tampered payload', () => {
    const token = signJwt({ sub: 'player-1' }, SECRET)
    const [header, , signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'someone-else' })).toString('base64url')
    const result = verifyJwt(`${header}.${forged}.${signature}`, SECRET)
    expect(result).toEqual({ ok: false, reason: 'signature' })
  })

  it('refuses an expired token', () => {
    const token = signJwt({ sub: 'player-1', exp: 100, iat: 50 }, SECRET)
    const result = verifyJwt(token, SECRET, { now: 200 })
    expect(result).toEqual({ ok: false, reason: 'expired' })
  })

  it('signs an RS256 ID token with the advertised key id', () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()
    const token = signJwtRs256({ sub: 'player-1' }, pem, 'wa-test')
    const [header] = token.split('.')
    const decoded = JSON.parse(Buffer.from(header, 'base64url').toString())
    expect(decoded).toMatchObject({ alg: 'RS256', kid: 'wa-test' })
    const jwk = rsaPublicJwk(pem, 'wa-test')
    expect(jwk).toMatchObject({ kty: 'RSA', kid: 'wa-test', alg: 'RS256', use: 'sig' })
  })

  it('matches the RFC 7636 S256 example', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
    const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    expect(pkceChallenge(verifier)).toBe(challenge)
    expect(verifyPkce(verifier, challenge)).toBe(true)
    expect(verifyPkce(`${verifier}x`, challenge)).toBe(false)
  })
})
