/**
 * Authorize endpoint of the MCP sign-in. GET checks the request, sends a signed-out visitor to /login (which returns
 * here), and shows one consent page to a signed-in bars-engine admin. POST carries the admin's answer: the consent
 * form holds a signed copy of the request bound to that admin, so only the page they were shown can approve it.
 * Anyone who is not an admin is refused, because the MCP server writes to the Council Board.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import {
  createCode, oauthConfigured, pkceChallengeValid, publicOrigin, readRequest, resolveClient, resourceUrl, signRequest,
  type AuthRequest,
} from '@/lib/mcp-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function page(status: number, title: string, body: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>${esc(title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;background:#0b0b0d;color:#eee;margin:0;padding:24px;`
    + `display:grid;place-items:center;min-height:100vh}main{max-width:30rem}h1{font-size:1.3rem}code{background:#222;padding:0 .3em;border-radius:3px}`
    + `button{font:inherit;padding:.6em 1.2em;border-radius:6px;border:1px solid #888;background:#eee;color:#111;margin-right:.6em;cursor:pointer}`
    + `button.no{background:none;color:#eee}</style></head><body><main>${body}</main></body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' } })
}

type Player = NonNullable<Awaited<ReturnType<typeof getCurrentPlayer>>>
const isAdmin = (p: Player) => p.roles?.some((r) => r.role.key === 'admin') ?? false

function bounce(redirectUri: string, params: Record<string, string | undefined>): NextResponse {
  const target = new URL(redirectUri)
  for (const [k, v] of Object.entries(params)) if (v) target.searchParams.set(k, v)
  return NextResponse.redirect(target, 302)
}

export async function GET(req: NextRequest) {
  if (!oauthConfigured()) return page(503, 'Sign-in off', '<h1>Sign-in is not configured</h1>')
  const q = req.nextUrl.searchParams
  const client = await resolveClient(q.get('client_id') ?? '')
  const redirectUri = q.get('redirect_uri') ?? ''
  // Until the client and its redirect URI check out, nothing redirects: an unverified address gets no error.
  if (!client) return page(400, 'Unknown client', '<h1>This client is not known</h1><p>Its client_id did not resolve.</p>')
  if (!client.redirectUris.includes(redirectUri)) return page(400, 'Wrong redirect', '<h1>The redirect address is not one this client registered</h1>')
  const state = q.get('state') ?? undefined
  if (q.get('response_type') !== 'code') return bounce(redirectUri, { error: 'unsupported_response_type', state })
  const challenge = q.get('code_challenge') ?? ''
  if (q.get('code_challenge_method') !== 'S256' || !pkceChallengeValid(challenge))
    return bounce(redirectUri, { error: 'invalid_request', error_description: 'PKCE with S256 is required', state })
  const resource = q.get('resource') ?? undefined
  if (resource && resource.replace(/\/+$/, '') !== resourceUrl()) return bounce(redirectUri, { error: 'invalid_target', state })

  const player = await getCurrentPlayer()
  if (!player) {
    const login = new URL('/login', publicOrigin())
    login.searchParams.set('returnTo', `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(login, 302)
  }
  if (!isAdmin(player))
    return page(403, 'Admins only', `<h1>This account is not a bars-engine admin</h1><p>Signed in as <code>${esc(player.name)}</code>. The Council Board's MCP server writes to the board, so only an admin may connect to it.</p>`)

  const request: AuthRequest = { clientId: client.clientId, redirectUri, codeChallenge: challenge, state, resource }
  return page(200, 'Connect to the Council Board',
    `<h1>Let <code>${esc(client.name)}</code> use the Council Board?</h1>`
    + `<p>It will read and write board rows, pictures, tickets and live game files as <code>${esc(player.name)}</code>. It returns to <code>${esc(new URL(redirectUri).host)}</code>.</p>`
    + `<form method="post" action="/api/mcp/oauth/authorize"><input type="hidden" name="request" value="${esc(signRequest(request, player.id))}">`
    + `<button name="decision" value="approve">Connect</button><button class="no" name="decision" value="deny">Cancel</button></form>`)
}

export async function POST(req: NextRequest) {
  if (!oauthConfigured()) return page(503, 'Sign-in off', '<h1>Sign-in is not configured</h1>')
  const origin = req.headers.get('origin')
  if (origin && origin !== publicOrigin() && origin !== req.nextUrl.origin) return page(403, 'Refused', '<h1>This form came from another site</h1>')
  const player = await getCurrentPlayer()
  if (!player || !isAdmin(player)) return page(403, 'Admins only', '<h1>Sign in as a bars-engine admin first</h1>')
  const form = await req.formData()
  const request = readRequest(String(form.get('request') ?? ''), player.id)
  if (!request) return page(400, 'Expired', '<h1>This page expired</h1><p>Start the connection again from Claude.</p>')
  if (form.get('decision') !== 'approve') return bounce(request.redirectUri, { error: 'access_denied', state: request.state })
  return bounce(request.redirectUri, { code: createCode(request, player.id), state: request.state })
}
