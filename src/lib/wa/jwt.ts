/**
 * Small, dependency-free HS256 JWT used by the OIDC provider.
 *
 * WorkAdventure's OpenID client accepts HS256 ID tokens and verifies them with
 * the client secret it already holds. That keeps the identity provider inside
 * bars-engine without shipping an RSA key in an environment variable.
 */
import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  timingSafeEqual,
} from 'node:crypto'

export type JwtPayload = Record<string, unknown> & {
  iss?: string
  aud?: string
  sub?: string
  exp?: number
  iat?: number
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(padded, 'base64')
}

function signature(secret: string, signingInput: string): string {
  return base64url(createHmac('sha256', secret).update(signingInput).digest())
}

export function signJwt(payload: JwtPayload, secret: string): string {
  if (!secret) throw new Error('wa-jwt: signing secret is empty')
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify(payload))
  const input = `${header}.${body}`
  return `${input}.${signature(secret, input)}`
}

export type VerifyJwtOptions = {
  /** Allowed issuer. */
  issuer?: string
  /** Allowed audience. */
  audience?: string
  /** Clock skew in seconds. */
  clockToleranceSeconds?: number
  /** Current time in seconds, for tests. */
  now?: number
}

export type VerifyJwtResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; reason: 'malformed' | 'signature' | 'issuer' | 'audience' | 'expired' | 'not-yet-valid' }

export function verifyJwt(
  token: string,
  secret: string,
  options: VerifyJwtOptions = {},
): VerifyJwtResult {
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'malformed' }

  const input = `${parts[0]}.${parts[1]}`
  const expected = signature(secret, input)
  const actual = parts[2]
  if (expected.length !== actual.length) return { ok: false, reason: 'signature' }
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return { ok: false, reason: 'signature' }
  }

  let payload: JwtPayload
  try {
    payload = JSON.parse(fromBase64url(parts[1]).toString('utf8')) as JwtPayload
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const now = options.now ?? Math.floor(Date.now() / 1000)
  const tolerance = options.clockToleranceSeconds ?? 30

  if (options.issuer && payload.iss !== options.issuer) return { ok: false, reason: 'issuer' }
  if (options.audience && payload.aud !== options.audience) return { ok: false, reason: 'audience' }
  if (typeof payload.exp === 'number' && payload.exp + tolerance < now) {
    return { ok: false, reason: 'expired' }
  }
  if (typeof payload.iat === 'number' && payload.iat - tolerance > now) {
    return { ok: false, reason: 'not-yet-valid' }
  }

  return { ok: true, payload }
}

/** PKCE S256, per RFC 7636. */
export function pkceChallenge(verifier: string): string {
  return base64url(createHash('sha256').update(verifier).digest())
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  const hashed = pkceChallenge(verifier)
  const left = Buffer.from(hashed)
  const right = Buffer.from(challenge)
  return left.length === right.length && timingSafeEqual(left, right)
}


/** RS256 ID token, with the key id WorkAdventure uses to select from the JWKS. */
export function signJwtRs256(payload: JwtPayload, privateKeyPem: string, kid: string): string {
  if (!privateKeyPem) throw new Error('wa-jwt: RSA private key is empty')
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }))
  const body = base64url(JSON.stringify(payload))
  const input = `${header}.${body}`
  const signatureBytes = cryptoSign('sha256', Buffer.from(input), createPrivateKey(privateKeyPem))
  return `${input}.${base64url(signatureBytes)}`
}

export function rsaPublicJwk(privateKeyPem: string, kid: string) {
  const jwk = createPublicKey(privateKeyPem).export({ format: 'jwk' })
  return { ...jwk, kid, use: 'sig', alg: 'RS256' }
}
