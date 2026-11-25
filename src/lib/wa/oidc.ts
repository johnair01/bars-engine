/**
 * The bars-engine half of WorkAdventure's OpenID Connect login.
 *
 * WorkAdventure asks an identity provider who a player is, then mints its own
 * room token from the answer. `sub` becomes `WA.player.uuid` and the identifier
 * the pusher sends to the Admin API. Keeping `sub = Player.id` is what makes a
 * character choice, a name, and a tag follow the same person across rooms.
 *
 * This provider deliberately implements only the profile an open-source
 * WorkAdventure client uses: authorization code + PKCE, a userinfo endpoint, and
 * an HS256 ID token. There is no dynamic client registration, no refresh token,
 * and no consent screen beyond bars-engine's existing login page.
 */
import { randomUUID } from 'node:crypto'
import {
  WA_OIDC_CLIENT_ID,
  WA_OIDC_CLIENT_SECRET,
  WA_OIDC_KEY_ID,
  WA_OIDC_PRIVATE_KEY,
  WA_OIDC_ISSUER,
  WA_OIDC_REDIRECT_URIS,
  WA_OIDC_SIGNING_SECRET,
} from './config'
import { rsaPublicJwk, signJwt, signJwtRs256, verifyJwt } from './jwt'

const CODE_TTL_SECONDS = 120
const TOKEN_TTL_SECONDS = 60 * 60

export type OidcPlayer = {
  id: string
  name: string
  email?: string | null
  tags: string[]
}

export type OidcClaims = {
  sub: string
  email: string
  email_verified: boolean
  name: string
  username: string
  preferred_username: string
  tags: string[]
  locale: string
}

export type AuthorizeParams = {
  clientId: string
  redirectUri: string
  responseType: string
  scope: string
  state?: string
  nonce?: string
  codeChallenge?: string
  codeChallengeMethod?: string
}

export type AuthorizeValidation =
  | { ok: true; params: AuthorizeParams }
  | { ok: false; error: string; redirectUri?: string; state?: string }

export function readAuthorizeParams(search: URLSearchParams): AuthorizeValidation {
  const clientId = search.get('client_id') ?? ''
  const redirectUri = search.get('redirect_uri') ?? ''
  const responseType = search.get('response_type') ?? ''
  const scope = search.get('scope') ?? 'openid email profile'
  const state = search.get('state') ?? undefined
  const nonce = search.get('nonce') ?? undefined
  const codeChallenge = search.get('code_challenge') ?? undefined
  const codeChallengeMethod = search.get('code_challenge_method') ?? undefined

  if (clientId !== WA_OIDC_CLIENT_ID) {
    return { ok: false, error: 'unknown client_id', redirectUri, state }
  }
  if (responseType !== 'code') {
    return { ok: false, error: 'only response_type=code is supported', redirectUri, state }
  }
  if (!WA_OIDC_REDIRECT_URIS.includes(redirectUri)) {
    return { ok: false, error: `redirect_uri is not registered: ${redirectUri}`, redirectUri, state }
  }
  if (!scope.split(/\s+/).includes('openid')) {
    return { ok: false, error: 'scope must include openid', redirectUri, state }
  }
  if (codeChallenge && codeChallengeMethod !== 'S256') {
    return { ok: false, error: 'only code_challenge_method=S256 is supported', redirectUri, state }
  }

  return {
    ok: true,
    params: {
      clientId,
      redirectUri,
      responseType,
      scope,
      state,
      nonce,
      codeChallenge,
      codeChallengeMethod,
    },
  }
}

export function claimsFor(player: OidcPlayer): OidcClaims {
  const username = player.name.trim() || player.email?.split('@')[0] || 'traveler'
  return {
    sub: player.id,
    email: player.email ?? '',
    email_verified: Boolean(player.email),
    name: player.name,
    username,
    preferred_username: username,
    tags: player.tags,
    locale: 'en',
  }
}

type AuthCodePayload = {
  typ: 'wa-oidc-code'
  iss: string
  aud: string
  clientId: string
  sub: string
  email: string
  name: string
  tags: string[]
  redirectUri: string
  codeChallenge?: string
  scope: string
  nonce?: string
  iat: number
  exp: number
  jti: string
}

export function createAuthCode(
  player: OidcPlayer,
  params: AuthorizeParams,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const payload: AuthCodePayload = {
    typ: 'wa-oidc-code',
    iss: WA_OIDC_ISSUER,
    aud: WA_OIDC_CLIENT_ID,
    clientId: WA_OIDC_CLIENT_ID,
    sub: player.id,
    email: player.email ?? '',
    name: player.name,
    tags: player.tags,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    scope: params.scope,
    nonce: params.nonce,
    iat: nowSeconds,
    exp: nowSeconds + CODE_TTL_SECONDS,
    jti: randomUUID(),
  }
  return signJwt(payload, WA_OIDC_SIGNING_SECRET)
}

export type AuthCodeResult =
  | { ok: true; payload: AuthCodePayload }
  | { ok: false; error: string }

export function readAuthCode(code: string, nowSeconds = Math.floor(Date.now() / 1000)): AuthCodeResult {
  const verified = verifyJwt(code, WA_OIDC_SIGNING_SECRET, {
    issuer: WA_OIDC_ISSUER,
    audience: WA_OIDC_CLIENT_ID,
    now: nowSeconds,
  })
  if (!verified.ok) return { ok: false, error: `authorization code ${verified.reason}` }
  const payload = verified.payload as Partial<AuthCodePayload>
  if (payload.typ !== 'wa-oidc-code' || !payload.sub) {
    return { ok: false, error: 'authorization code has the wrong type' }
  }
  return { ok: true, payload: payload as AuthCodePayload }
}

export type IssuedTokens = {
  access_token: string
  id_token: string
  token_type: 'Bearer'
  expires_in: number
  scope: string
}

export function issueTokens(input: {
  sub: string
  email: string
  name: string
  tags: string[]
  scope: string
  nonce?: string
  nowSeconds?: number
}): IssuedTokens {
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000)
  const claims = claimsFor({ id: input.sub, name: input.name, email: input.email, tags: input.tags })
  const base = {
    iss: WA_OIDC_ISSUER,
    aud: WA_OIDC_CLIENT_ID,
    sub: input.sub,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }

  const accessToken = signJwt(
    {
      ...base,
      typ: 'wa-oidc-access',
      scope: input.scope,
      email: claims.email,
      name: claims.name,
      preferred_username: claims.preferred_username,
      username: claims.username,
      tags: claims.tags,
    },
    WA_OIDC_SIGNING_SECRET,
  )

  const idPayload = {
    ...base,
    typ: 'wa-oidc-id',
    nonce: input.nonce,
    email: claims.email,
    email_verified: claims.email_verified,
    name: claims.name,
    username: claims.username,
    preferred_username: claims.preferred_username,
    tags: claims.tags,
    locale: claims.locale,
  }
  const idToken = WA_OIDC_PRIVATE_KEY
    ? signJwtRs256(idPayload, WA_OIDC_PRIVATE_KEY, WA_OIDC_KEY_ID)
    : signJwt(idPayload, WA_OIDC_SIGNING_SECRET)

  return {
    access_token: accessToken,
    id_token: idToken,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
    scope: input.scope,
  }
}

export type AccessTokenResult =
  | { ok: true; claims: OidcClaims }
  | { ok: false; error: string }

export function readAccessToken(token: string, nowSeconds = Math.floor(Date.now() / 1000)): AccessTokenResult {
  const verified = verifyJwt(token, WA_OIDC_SIGNING_SECRET, {
    issuer: WA_OIDC_ISSUER,
    audience: WA_OIDC_CLIENT_ID,
    now: nowSeconds,
  })
  if (!verified.ok) return { ok: false, error: `access token ${verified.reason}` }
  const payload = verified.payload
  if (payload.typ !== 'wa-oidc-access' || typeof payload.sub !== 'string') {
    return { ok: false, error: 'access token has the wrong type' }
  }
  return {
    ok: true,
    claims: {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      email_verified: Boolean(payload.email),
      name: typeof payload.name === 'string' ? payload.name : '',
      username: typeof payload.username === 'string' ? payload.username : '',
      preferred_username:
        typeof payload.preferred_username === 'string' ? payload.preferred_username : '',
      tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
      locale: 'en',
    },
  }
}

/** Basic or POST client authentication, as openid-client may send either. */
export function verifyClientAuthentication(input: {
  authorizationHeader: string | null
  bodyClientId?: string | null
  bodyClientSecret?: string | null
}): boolean {
  if (!WA_OIDC_CLIENT_SECRET) return false

  const header = input.authorizationHeader
  if (header?.startsWith('Basic ')) {
    let decoded = ''
    try {
      decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    } catch {
      return false
    }
    const separator = decoded.indexOf(':')
    if (separator < 0) return false
    const id = decodeURIComponent(decoded.slice(0, separator))
    const secret = decodeURIComponent(decoded.slice(separator + 1))
    return id === WA_OIDC_CLIENT_ID && secret === WA_OIDC_CLIENT_SECRET
  }

  return (
    input.bodyClientId === WA_OIDC_CLIENT_ID &&
    input.bodyClientSecret === WA_OIDC_CLIENT_SECRET
  )
}

export function oidcDiscovery() {
  return {
    issuer: WA_OIDC_ISSUER,
    authorization_endpoint: `${WA_OIDC_ISSUER}/api/oidc/authorize`,
    token_endpoint: `${WA_OIDC_ISSUER}/api/oidc/token`,
    userinfo_endpoint: `${WA_OIDC_ISSUER}/api/oidc/userinfo`,
    jwks_uri: `${WA_OIDC_ISSUER}/api/oidc/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: WA_OIDC_PRIVATE_KEY ? ['RS256'] : ['HS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    scopes_supported: ['openid', 'email', 'profile'],
    claims_supported: [
      'sub',
      'email',
      'email_verified',
      'name',
      'username',
      'preferred_username',
      'tags',
      'locale',
    ],
    code_challenge_methods_supported: ['S256'],
  }
}


export function oidcJwks() {
  if (!WA_OIDC_PRIVATE_KEY) return { keys: [] as unknown[] }
  return { keys: [rsaPublicJwk(WA_OIDC_PRIVATE_KEY, WA_OIDC_KEY_ID)] }
}
