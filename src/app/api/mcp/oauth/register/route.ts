/** RFC 7591 dynamic client registration for the MCP sign-in. Stateless: the client_id is a signed token. */
import { oauthConfigured, registerClient } from '@/lib/mcp-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } })
}

export async function POST(req: Request) {
  if (!oauthConfigured()) return Response.json({ error: 'server_error', error_description: 'sign-in is not configured' }, { status: 503, headers: CORS })
  let body: unknown
  try { body = await req.json() } catch { body = null }
  const made = registerClient(body)
  if (!made.ok) return Response.json({ error: 'invalid_redirect_uri', error_description: made.error }, { status: 400, headers: CORS })
  return Response.json(made.body, { status: 201, headers: CORS })
}
