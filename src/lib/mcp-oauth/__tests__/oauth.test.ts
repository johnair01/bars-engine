import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'

vi.mock('server-only', () => ({}))
const session = vi.hoisted(() => ({ player: null as null | Record<string, unknown> }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: async () => session.player }))
vi.mock('@/lib/db', () => ({ db: {} }))

import { GET as authorizeGet, POST as authorizePost } from '@/app/api/mcp/oauth/authorize/route'
import { POST as registerPost } from '@/app/api/mcp/oauth/register/route'
import { POST as tokenPost } from '@/app/api/mcp/oauth/token/route'
import { GET as protectedMeta } from '@/app/.well-known/oauth-protected-resource/api/mcp/route'
import { GET as serverMeta } from '@/app/.well-known/oauth-authorization-server/route'
import { POST as mcpPost } from '@/app/api/mcp/route'
import { resolveClient, registerClient, exchangeCode, createCode } from '@/lib/mcp-oauth'

const ORIGIN = 'https://board.test'
const REDIRECT = 'https://claude.ai/api/mcp/auth_callback'
const VERIFIER = 'a'.repeat(43) + 'b'.repeat(20)
const CHALLENGE = createHash('sha256').update(VERIFIER).digest('base64url')
const admin = { id: 'p-admin', name: 'Wendell', roles: [{ role: { key: 'admin' } }] }
const json = (url: string, body: unknown) =>
  new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const form = (url: string, data: Record<string, string>, headers: Record<string, string> = {}) =>
  new NextRequest(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(data).toString() })

beforeEach(() => {
  process.env.BARS_PUBLIC_URL = ORIGIN
  process.env.COUNCIL_MENU_TOKEN = 'council-key'
  delete process.env.MCP_OAUTH_SECRET
  session.player = admin
})

async function register() {
  const res = await registerPost(json(`${ORIGIN}/api/mcp/oauth/register`, { client_name: 'Claude', redirect_uris: [REDIRECT] }))
  expect(res.status).toBe(201)
  return ((await res.json()) as { client_id: string }).client_id
}

function authorizeUrl(clientId: string, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({
    response_type: 'code', client_id: clientId, redirect_uri: REDIRECT, code_challenge: CHALLENGE,
    code_challenge_method: 'S256', state: 'st1', resource: `${ORIGIN}/api/mcp`, ...extra,
  })
  return `${ORIGIN}/api/mcp/oauth/authorize?${q}`
}

async function fullFlow() {
  const clientId = await register()
  const page = await authorizeGet(new NextRequest(authorizeUrl(clientId)))
  expect(page.status).toBe(200)
  const request = /name="request" value="([^"]+)"/.exec(await page.text())![1]
  const done = await authorizePost(form(`${ORIGIN}/api/mcp/oauth/authorize`, { request, decision: 'approve' }, { origin: ORIGIN }))
  const back = new URL(done.headers.get('location')!)
  expect(back.origin + back.pathname).toBe(REDIRECT)
  expect(back.searchParams.get('state')).toBe('st1')
  const tokenRes = await tokenPost(form(`${ORIGIN}/api/mcp/oauth/token`, {
    grant_type: 'authorization_code', code: back.searchParams.get('code')!, code_verifier: VERIFIER, client_id: clientId, redirect_uri: REDIRECT,
  }))
  return { clientId, tokenRes, request }
}

const mcp = (headers: Record<string, string>, method = 'tools/call') =>
  mcpPost(new NextRequest(`${ORIGIN}/api/mcp`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: { name: 'whoami', arguments: {} } }),
  }))

describe('metadata', () => {
  it('names the resource, the server and PKCE S256', async () => {
    const pr = (await protectedMeta().json()) as Record<string, unknown>
    expect(pr.resource).toBe(`${ORIGIN}/api/mcp`)
    expect(pr.authorization_servers).toEqual([ORIGIN])
    const as = (await serverMeta().json()) as Record<string, unknown>
    expect(as.code_challenge_methods_supported).toEqual(['S256'])
    expect(as.registration_endpoint).toBe(`${ORIGIN}/api/mcp/oauth/register`)
    expect(as.client_id_metadata_document_supported).toBe(true)
  })
})

describe('registration', () => {
  it('refuses a plain-http redirect to a real host', () => {
    expect(registerClient({ redirect_uris: ['http://evil.example/cb'] }).ok).toBe(false)
    expect(registerClient({ redirect_uris: ['http://localhost:3000/cb'] }).ok).toBe(true)
  })
})

describe('client-ID metadata documents', () => {
  const doc = (over: Record<string, unknown> = {}) => (async () =>
    new Response(JSON.stringify({ client_id: 'https://app.example/client.json', client_name: 'App', redirect_uris: [REDIRECT], ...over }))) as unknown as typeof fetch
  it('accepts a document that names its own URL', async () => {
    expect((await resolveClient('https://app.example/client.json', doc()))?.name).toBe('App')
  })
  it('refuses a document naming another id, and private hosts', async () => {
    expect(await resolveClient('https://app.example/client.json', doc({ client_id: 'https://x.example/c.json' }))).toBeNull()
    expect(await resolveClient('https://10.0.0.1/client.json', doc())).toBeNull()
    expect(await resolveClient('https://localhost/client.json', doc())).toBeNull()
  })
})

describe('the sign-in flow', () => {
  it('gives claude.ai a token that the MCP route accepts, and whoami names the player', async () => {
    const { tokenRes } = await fullFlow()
    expect(tokenRes.status).toBe(200)
    const t = (await tokenRes.json()) as { access_token: string; refresh_token: string }
    const res = await mcp({ authorization: `Bearer ${t.access_token}` })
    expect(res.status).toBe(200)
    const out = JSON.parse(((await res.json()) as { result: { content: { text: string }[] } }).result.content[0].text)
    expect(out).toMatchObject({ board: 'council', signedInVia: 'oauth', player: 'p-admin' })
  })

  it('refreshes', async () => {
    const { clientId, tokenRes } = await fullFlow()
    const t = (await tokenRes.json()) as { refresh_token: string }
    const again = await tokenPost(form(`${ORIGIN}/api/mcp/oauth/token`, { grant_type: 'refresh_token', refresh_token: t.refresh_token, client_id: clientId }))
    expect(again.status).toBe(200)
  })

  it('refuses a wrong PKCE verifier', async () => {
    const clientId = await register()
    const code = createCode({ clientId, redirectUri: REDIRECT, codeChallenge: CHALLENGE }, 'p-admin')
    expect(exchangeCode(code, 'z'.repeat(50), clientId, REDIRECT).ok).toBe(false)
    expect(exchangeCode(code, VERIFIER, clientId, REDIRECT).ok).toBe(true)
    expect(exchangeCode(code, VERIFIER, clientId, 'https://other.example/cb').ok).toBe(false)
  })

  it('sends a signed-out visitor to /login and refuses a non-admin', async () => {
    const clientId = await register()
    session.player = null
    const out = await authorizeGet(new NextRequest(authorizeUrl(clientId)))
    expect(out.status).toBe(302)
    expect(out.headers.get('location')).toContain('/login?returnTo=')
    session.player = { id: 'p2', name: 'Guest', roles: [] }
    expect((await authorizeGet(new NextRequest(authorizeUrl(clientId)))).status).toBe(403)
  })

  it('refuses an unregistered redirect, a missing PKCE challenge and a stolen consent form', async () => {
    const clientId = await register()
    expect((await authorizeGet(new NextRequest(authorizeUrl(clientId, { redirect_uri: 'https://evil.example/cb' })))).status).toBe(400)
    const noPkce = await authorizeGet(new NextRequest(authorizeUrl(clientId, { code_challenge_method: 'plain' })))
    expect(new URL(noPkce.headers.get('location')!).searchParams.get('error')).toBe('invalid_request')
    const { request } = await fullFlow()
    session.player = { ...admin, id: 'someone-else' }
    expect((await authorizePost(form(`${ORIGIN}/api/mcp/oauth/authorize`, { request, decision: 'approve' }))).status).toBe(400)
  })
})

describe('the MCP route', () => {
  it('still takes the council token and answers a bad one with the sign-in pointer', async () => {
    expect((await mcp({ authorization: 'Bearer council-key' })).status).toBe(200)
    const no = await mcp({ authorization: 'Bearer nope' })
    expect(no.status).toBe(401)
    expect(no.headers.get('www-authenticate')).toBe(`Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/api/mcp"`)
  })

  it('refuses a token aimed at another audience', async () => {
    const { signJwt } = await import('@/lib/wa/jwt')
    const forged = signJwt({ typ: 'at', sub: 'p', iss: ORIGIN, aud: 'https://elsewhere', exp: 9999999999 }, 'council-key')
    expect((await mcp({ authorization: `Bearer ${forged}` })).status).toBe(401)
  })
})
