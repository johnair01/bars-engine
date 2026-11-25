/**
 * Sign-in for the Council Board's MCP server (/api/mcp), so claude.ai can add it as a custom connector.
 *
 * claude.ai connectors sign in with OAuth 2.1: the client finds the server's metadata from the 401 (RFC 9728), registers
 * itself (a client-ID metadata document, or dynamic registration, RFC 7591), sends the person to an authorize page, and
 * trades a code plus a PKCE verifier (S256) for a token. This module holds the parts that need no database:
 *
 * - a client_id from dynamic registration is a signed token carrying the client's redirect URIs, so nothing is stored;
 * - an authorization code is a signed token that carries the PKCE challenge, the redirect URI and the person, and
 *   lives 60 seconds;
 * - an access token is a signed token that names its audience (the MCP endpoint) and lives one hour; a refresh token
 *   lives 30 days.
 *
 * Commons first. Libraries considered and not added: `jose` and `oauth4webapi` (sound, but a new dependency for one
 * HS256 signature, which `src/lib/wa/jwt.ts` already does and tests), `@modelcontextprotocol/sdk` auth handlers (an
 * Express-shaped server with a stateful provider interface, wrong for serverless), `oidc-provider` and `node-oidc-provider`
 * (a whole provider with its own adapter store), and Auth.js (the app signs in with its own cookie). The signing helper
 * and the PKCE check come from `src/lib/wa/jwt.ts`.
 *
 * The council bearer token still works for agents; see `src/app/api/mcp/route.ts`.
 */
import { createHmac } from 'node:crypto'
import { signJwt, verifyJwt, verifyPkce, type JwtPayload } from '@/lib/wa/jwt'

export const ACCESS_TTL_SECONDS = 60 * 60
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60
export const CODE_TTL_SECONDS = 60
export const REQUEST_TTL_SECONDS = 10 * 60
export const SCOPE = 'council'

/** The public origin. Fixed by environment so the token's audience does not move with the request's Host header. */
export function publicOrigin(): string {
  const raw = process.env.BARS_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bars-engine.vercel.app'
  return raw.replace(/\/+$/, '')
}

/** The MCP endpoint's URL: the audience every access token must name. */
export const resourceUrl = () => `${publicOrigin()}/api/mcp`
export const resourceMetadataUrl = () => `${publicOrigin()}/.well-known/oauth-protected-resource/api/mcp`

/**
 * One signing key for this sign-in, derived from a secret the deployment already holds so no new setting is needed;
 * MCP_OAUTH_SECRET overrides it. The derivation keeps a token from this module from verifying anywhere else.
 */
function signingKey(): string {
  const base = process.env.MCP_OAUTH_SECRET || process.env.COUNCIL_MENU_TOKEN || ''
  if (!base) return ''
  return createHmac('sha256', base).update('bars-engine mcp-oauth v1').digest('base64url')
}

export const oauthConfigured = () => signingKey() !== ''

const now = () => Math.floor(Date.now() / 1000)

function issue(typ: string, claims: JwtPayload, ttl: number, audience: string): string {
  const iat = now()
  return signJwt({ ...claims, typ, iss: publicOrigin(), aud: audience, iat, exp: iat + ttl }, signingKey())
}

function read(token: string, typ: string, audience: string): JwtPayload | null {
  if (!signingKey()) return null
  const result = verifyJwt(token, signingKey(), { issuer: publicOrigin(), audience, clockToleranceSeconds: 0 })
  if (!result.ok || result.payload.typ !== typ) return null
  return result.payload
}

// ---- redirect URIs and clients -------------------------------------------------------------------------------------

/** https, or http to the loopback for a local client such as Claude Code. No fragments. */
export function redirectUriAllowed(uri: string): boolean {
  try {
    const u = new URL(uri)
    if (u.hash) return false
    if (u.protocol === 'https:') return true
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]')
  } catch {
    return false
  }
}

export type Client = { clientId: string; name: string; redirectUris: string[] }

/** Dynamic registration (RFC 7591): the answer's client_id is a signed token that holds what was registered. */
export function registerClient(meta: unknown): { ok: true; body: Record<string, unknown> } | { ok: false; error: string } {
  const m = meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {}
  const uris = Array.isArray(m.redirect_uris) ? m.redirect_uris.filter((u): u is string => typeof u === 'string') : []
  if (uris.length === 0 || uris.length > 10) return { ok: false, error: 'redirect_uris: one to ten URIs' }
  if (!uris.every(redirectUriAllowed)) return { ok: false, error: 'redirect_uris: https, or http to localhost' }
  const name = typeof m.client_name === 'string' && m.client_name.trim() ? m.client_name.trim().slice(0, 80) : 'An MCP client'
  const issuedAt = now()
  const clientId = signJwt(
    { typ: 'client', iss: publicOrigin(), aud: publicOrigin(), name, redirect_uris: uris, iat: issuedAt },
    signingKey(),
  )
  return {
    ok: true,
    body: {
      client_id: clientId,
      client_id_issued_at: issuedAt,
      client_name: name,
      redirect_uris: uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: SCOPE,
    },
  }
}

/** A hostname that is not a public name: loopback, a private range, or a bare label. */
function privateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (!h.includes('.') && !h.includes(':')) return true
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) return true
  if (h.includes(':')) return true
  const p = h.split('.').map(Number)
  if (p.length === 4 && p.every((n) => Number.isInteger(n) && n >= 0 && n < 256)) {
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168)
  }
  return false
}

/**
 * Find a client from its client_id: either a client-ID metadata document (the id is an https URL whose JSON names that
 * same URL and its redirect URIs) or an id this server issued by registration.
 */
export async function resolveClient(clientId: string, fetcher: typeof fetch = fetch): Promise<Client | null> {
  if (!clientId) return null
  if (clientId.startsWith('https://')) {
    let url: URL
    try { url = new URL(clientId) } catch { return null }
    if (url.hash || url.username || url.password || url.port || url.pathname === '/' || privateHost(url.hostname)) return null
    try {
      const res = await fetcher(clientId, {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) return null
      const text = await res.text()
      if (text.length > 20_000) return null
      const doc = JSON.parse(text) as Record<string, unknown>
      const uris = Array.isArray(doc.redirect_uris) ? doc.redirect_uris.filter((u): u is string => typeof u === 'string') : []
      if (doc.client_id !== clientId || uris.length === 0 || !uris.every(redirectUriAllowed)) return null
      if (doc.token_endpoint_auth_method && doc.token_endpoint_auth_method !== 'none') return null
      const name = typeof doc.client_name === 'string' && doc.client_name.trim() ? doc.client_name.trim().slice(0, 80) : url.hostname
      return { clientId, name, redirectUris: uris }
    } catch {
      return null
    }
  }
  const p = read(clientId, 'client', publicOrigin())
  if (!p || !Array.isArray(p.redirect_uris)) return null
  return { clientId, name: String(p.name ?? 'An MCP client'), redirectUris: p.redirect_uris as string[] }
}

// ---- the authorize request, the code, the tokens -------------------------------------------------------------------

export type AuthRequest = {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state?: string
  resource?: string
}

/** A request the consent form carries from page to POST. Bound to the person looking at it, so a stolen form is useless. */
export function signRequest(req: AuthRequest, playerId: string): string {
  return issue('req', { ...req, sub: playerId }, REQUEST_TTL_SECONDS, publicOrigin())
}

export function readRequest(token: string, playerId: string): AuthRequest | null {
  const p = read(token, 'req', publicOrigin())
  if (!p || p.sub !== playerId) return null
  return {
    clientId: String(p.clientId), redirectUri: String(p.redirectUri), codeChallenge: String(p.codeChallenge),
    state: typeof p.state === 'string' ? p.state : undefined,
    resource: typeof p.resource === 'string' ? p.resource : undefined,
  }
}

export function createCode(req: AuthRequest, playerId: string): string {
  return issue('code', { sub: playerId, cid: req.clientId, ru: req.redirectUri, cc: req.codeChallenge }, CODE_TTL_SECONDS, publicOrigin())
}

export type TokenSet = { access_token: string; token_type: 'Bearer'; expires_in: number; refresh_token: string; scope: string }

function tokens(playerId: string, clientId: string): TokenSet {
  return {
    access_token: issue('at', { sub: playerId, cid: clientId, scope: SCOPE }, ACCESS_TTL_SECONDS, resourceUrl()),
    token_type: 'Bearer',
    expires_in: ACCESS_TTL_SECONDS,
    refresh_token: issue('rt', { sub: playerId, cid: clientId, scope: SCOPE }, REFRESH_TTL_SECONDS, publicOrigin()),
    scope: SCOPE,
  }
}

export type Exchange = { ok: true; tokens: TokenSet } | { ok: false; error: string; description: string }

export function exchangeCode(code: string, verifier: string, clientId: string, redirectUri: string): Exchange {
  const p = read(code, 'code', publicOrigin())
  if (!p) return { ok: false, error: 'invalid_grant', description: 'the code is wrong or has expired' }
  if (p.cid !== clientId || p.ru !== redirectUri) return { ok: false, error: 'invalid_grant', description: 'client_id or redirect_uri differs from the request' }
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier) || !verifyPkce(verifier, String(p.cc)))
    return { ok: false, error: 'invalid_grant', description: 'code_verifier does not match the code_challenge' }
  return { ok: true, tokens: tokens(String(p.sub), clientId) }
}

export function exchangeRefresh(refresh: string, clientId: string): Exchange {
  const p = read(refresh, 'rt', publicOrigin())
  if (!p || p.cid !== clientId) return { ok: false, error: 'invalid_grant', description: 'the refresh token is wrong or has expired' }
  return { ok: true, tokens: tokens(String(p.sub), clientId) }
}

/** The person an access token names, or null. The audience must be this MCP endpoint (RFC 8707). */
export function verifyAccessToken(token: string): { playerId: string; clientId: string } | null {
  const p = read(token, 'at', resourceUrl())
  return p && typeof p.sub === 'string' ? { playerId: p.sub, clientId: String(p.cid ?? '') } : null
}

export function pkceChallengeValid(challenge: string): boolean {
  return /^[A-Za-z0-9\-_]{43}$/.test(challenge)
}
