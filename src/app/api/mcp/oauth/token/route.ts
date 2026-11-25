/** Token endpoint of the MCP sign-in: authorization_code with PKCE S256, and refresh_token. Public clients only. */
import { exchangeCode, exchangeRefresh, oauthConfigured, resolveClient } from '@/lib/mcp-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store', Pragma: 'no-cache' }
const fail = (error: string, error_description: string, status = 400) =>
  Response.json({ error, error_description }, { status, headers: CORS })

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } })
}

export async function POST(req: Request) {
  if (!oauthConfigured()) return fail('server_error', 'sign-in is not configured', 503)
  const type = req.headers.get('content-type') ?? ''
  let form: URLSearchParams
  try {
    form = type.includes('application/json')
      ? new URLSearchParams(Object.entries((await req.json()) as Record<string, string>).map(([k, v]) => [k, String(v)]))
      : new URLSearchParams(await req.text())
  } catch {
    return fail('invalid_request', 'the body is not form-encoded')
  }
  const clientId = form.get('client_id') ?? ''
  // The client must still resolve: a metadata-document client that changed its mind, or a forged id, stops here.
  if (!(await resolveClient(clientId))) return fail('invalid_client', 'unknown client_id', 401)

  const grant = form.get('grant_type')
  const result = grant === 'authorization_code'
    ? exchangeCode(form.get('code') ?? '', form.get('code_verifier') ?? '', clientId, form.get('redirect_uri') ?? '')
    : grant === 'refresh_token'
      ? exchangeRefresh(form.get('refresh_token') ?? '', clientId)
      : null
  if (!result) return fail('unsupported_grant_type', 'use authorization_code or refresh_token')
  if (!result.ok) return fail(result.error, result.description)
  return Response.json(result.tokens, { headers: CORS })
}
